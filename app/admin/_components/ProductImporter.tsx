"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import * as XLSX from "xlsx";
import {
  bulkImportProductsAction,
  type ImportProductRow,
  type ImportRowResult,
} from "@/app/_lib/db/actions";
import { useAdminLocale } from "../_lib/i18n-admin";
import { useAdminToast } from "./AdminToast";
import { DemoBanner, PageHeader } from "./PageHeader";
import { downloadProTemplate, type CategoryRef, type CurrentRow } from "../_lib/product-template";

const COLUMNS = [
  "id",
  "slug",
  "nameEn",
  "nameAr",
  "nameFr",
  "descEn",
  "descAr",
  "descFr",
  "price",
  "compareAt",
  "stock",
  "category",
  "subcategory",
  "sizes",
  "tags",
  "images",
] as const;

function splitList(v: unknown): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map((s) => String(s).trim()).filter(Boolean);
  const s = String(v).trim();
  if (!s) return [];
  const splitter = s.includes("|") ? "|" : ",";
  return s
    .split(splitter)
    .map((p) => p.trim())
    .filter(Boolean);
}

function toRow(raw: Record<string, unknown>, columnMap: Record<string, string>): ImportProductRow {
  const get = (key: string): unknown => {
    const k = columnMap[key];
    return k ? raw[k] : undefined;
  };
  const asNum = (v: unknown): number | undefined => {
    if (v === undefined || v === null || v === "") return undefined;
    const n = Number(String(v).replace(/[, ]/g, ""));
    return Number.isFinite(n) ? n : undefined;
  };
  const asNumOrNull = (v: unknown): number | null | undefined => {
    if (v === null || v === "" || v === "—") return null;
    return asNum(v);
  };
  const asStr = (v: unknown): string | undefined => {
    if (v === undefined || v === null) return undefined;
    const s = String(v).trim();
    return s || undefined;
  };
  return {
    id: String(get("id") ?? "").trim().toLowerCase(),
    slug: asStr(get("slug")),
    nameEn: asStr(get("nameEn")),
    nameAr: asStr(get("nameAr")),
    nameFr: asStr(get("nameFr")) ?? null,
    descEn: asStr(get("descEn")),
    descAr: asStr(get("descAr")),
    descFr: asStr(get("descFr")) ?? null,
    price: asNum(get("price")),
    compareAt: asNumOrNull(get("compareAt")),
    stock: asNum(get("stock")),
    category: asStr(get("category")),
    subcategory: asStr(get("subcategory")),
    sizes: splitList(get("sizes")),
    tags: splitList(get("tags")),
    images: splitList(get("images")),
  };
}

function buildColumnMap(headers: string[]): Record<string, string> {
  // case-insensitive, ignore spaces and underscores
  const norm = (s: string) => s.toLowerCase().replace(/[\s_-]/g, "");
  const map: Record<string, string> = {};
  for (const target of COLUMNS) {
    const targetN = norm(target);
    const hit = headers.find((h) => norm(h) === targetN);
    if (hit) map[target] = hit;
  }
  return map;
}

export function ProductImporter({
  current,
  categories,
  dbReady = false,
}: {
  current: CurrentRow[];
  categories: CategoryRef[];
  dbReady?: boolean;
}) {
  const { d } = useAdminLocale();
  const { push } = useAdminToast();
  const [pending, start] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ImportProductRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [results, setResults] = useState<{
    created: number;
    updated: number;
    errors: number;
    rows: ImportRowResult[];
  } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const downloadTemplate = (mode: "current" | "blank") => {
    const rows = mode === "current" ? current : [];
    const filename =
      mode === "current"
        ? `rachel-products-${new Date().toISOString().slice(0, 10)}.xlsx`
        : "rachel-products-template.xlsx";
    try {
      downloadProTemplate(rows, categories, filename);
    } catch (err) {
      push(err instanceof Error ? err.message : "Template download failed", "error");
    }
  };

  const parseFile = async (file: File) => {
    setParseError(null);
    setResults(null);
    setFileName(file.name);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheetName = wb.SheetNames[0];
      if (!sheetName) throw new Error("No sheet found");
      const sheet = wb.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: null,
        raw: true,
      });
      if (json.length === 0) {
        setRows([]);
        setParseError("File has no data rows.");
        return;
      }
      const headers = Object.keys(json[0]);
      const columnMap = buildColumnMap(headers);
      if (!columnMap.id) {
        setParseError(`Missing required column "id". Found columns: ${headers.join(", ")}`);
        setRows([]);
        return;
      }
      const parsed = json.map((r) => toRow(r, columnMap)).filter((r) => r.id);
      setRows(parsed);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Could not parse file");
      setRows([]);
    }
  };

  const doImport = () => {
    if (!dbReady || rows.length === 0) return;
    start(async () => {
      try {
        const res = await bulkImportProductsAction(rows);
        setResults({ ...res, rows: res.results });
        push(`Imported: ${res.created} new, ${res.updated} updated, ${res.errors} errors`, res.errors > 0 ? "error" : "success");
      } catch (err) {
        push(err instanceof Error ? err.message : "Import failed", "error");
      }
    });
  };

  const reset = () => {
    setRows([]);
    setFileName("");
    setParseError(null);
    setResults(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const newCount = rows.filter((r) => !current.find((c) => c.id === r.id)).length;
  const updateCount = rows.length - newCount;

  return (
    <>
      <PageHeader
        title="Import products"
        subtitle="Upload a spreadsheet to create or update many products at once. Keep it in Google Drive / OneDrive and re-upload whenever you change it."
        actions={
          <Link
            href="/admin/products"
            className="px-4 py-2 text-sm font-medium text-[var(--a-ink-muted)] hover:text-[var(--a-ink)]"
          >
            ← Back to list
          </Link>
        }
      />
      <div className="px-8 py-6 space-y-6">
        {!dbReady && <DemoBanner>{d.common.demo_banner}</DemoBanner>}

        {/* Templates */}
        <section className="bg-[var(--a-surface)] border border-[var(--a-line)] p-5 space-y-3">
          <h2 className="text-sm font-semibold tracking-wide">1 · Get the spreadsheet</h2>
          <p className="text-sm text-[var(--a-ink-soft)]">
            The download is a styled, multi-sheet workbook (Excel / Google Sheets): <b>Instructions</b>, <b>Products</b>, <b>Categories</b>, <b>Tags</b>, <b>Sizes</b>, <b>Columns reference</b>. Frozen headers, auto-filter, colour-coded required vs optional columns, and a styled example row at the top so you can see the shape.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => downloadTemplate("current")}
              className="px-4 py-2 text-sm font-medium bg-[var(--a-accent)] text-[var(--a-accent-fg)] rounded-sm hover:opacity-90 flex items-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="m7 10 5 5 5-5" strokeLinejoin="round" />
                <path d="M12 15V3" />
              </svg>
              Download workbook with current catalog
            </button>
            <button
              type="button"
              onClick={() => downloadTemplate("blank")}
              className="px-4 py-2 text-sm font-medium border border-[var(--a-line)] text-[var(--a-ink-soft)] hover:bg-[var(--a-line-soft)] rounded-sm"
            >
              Download empty pro template
            </button>
          </div>
          <details className="text-xs text-[var(--a-ink-muted)] mt-2">
            <summary className="cursor-pointer select-none hover:text-[var(--a-ink)]">Columns reference ▾</summary>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 leading-relaxed">
              <div><b>id</b> · required. Lowercase letters/digits/hyphens. Matches an existing product to update, or creates one if new.</div>
              <div><b>slug</b> · URL path. Lowercase letters/digits/hyphens.</div>
              <div><b>nameEn / nameAr / nameFr</b> · product name in each language. EN+AR required for new rows.</div>
              <div><b>descEn / descAr / descFr</b> · product description.</div>
              <div><b>price</b> · integer in MAD.</div>
              <div><b>compareAt</b> · original price (struck-through) — leave empty if not on sale.</div>
              <div><b>stock</b> · integer.</div>
              <div><b>category / subcategory</b> · keys from your catalog (e.g. <code>clothing</code> / <code>tunics</code>).</div>
              <div><b>sizes</b> · comma-separated (e.g. <code>S, M, L</code>).</div>
              <div><b>tags</b> · comma-separated. Valid: <code>new</code>, <code>sale</code>, <code>bestseller</code>, <code>limited</code>.</div>
              <div><b>images</b> · pipe-separated URLs (e.g. <code>https://… | https://…</code>).</div>
              <div className="text-[var(--a-ink-faint)]">Empty cells leave the field unchanged on existing products. Editable categories: {categories.map((c) => c.key).join(", ")}.</div>
            </div>
          </details>
        </section>

        {/* Upload */}
        <section className="bg-[var(--a-surface)] border border-[var(--a-line)] p-5 space-y-3">
          <h2 className="text-sm font-semibold tracking-wide">2 · Upload your edited file</h2>
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) void parseFile(f);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            className={`cursor-pointer border-2 border-dashed rounded-md px-4 py-8 text-center transition-colors ${
              dragOver
                ? "border-[var(--a-accent)] bg-[var(--a-line-soft)]"
                : "border-[var(--a-line)] hover:border-[var(--a-ink-faint)]"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void parseFile(f);
              }}
            />
            <div className="text-sm font-medium text-[var(--a-ink)]">
              {fileName ? fileName : "Drop your Excel / CSV file here or click to choose"}
            </div>
            <div className="text-xs text-[var(--a-ink-muted)] mt-1">
              Supported: .xlsx, .xls, .csv · First row must be the column headers
            </div>
          </div>
          {parseError && (
            <div className="text-xs text-[var(--a-danger)] bg-[var(--a-danger-bg)] border border-[var(--a-danger-line)] px-3 py-2 rounded-sm">
              {parseError}
            </div>
          )}
        </section>

        {/* Preview + confirm */}
        {rows.length > 0 && (
          <section className="bg-[var(--a-surface)] border border-[var(--a-line)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--a-line)] flex flex-wrap items-center gap-3">
              <h2 className="text-sm font-semibold tracking-wide me-auto">
                3 · Preview
              </h2>
              <span className="text-xs text-[var(--a-success)] font-medium">{newCount} new</span>
              <span className="text-xs text-[var(--a-accent)] font-medium">{updateCount} updates</span>
              <button
                type="button"
                onClick={reset}
                className="px-3 py-1.5 text-xs border border-[var(--a-line)] text-[var(--a-ink-soft)] hover:bg-[var(--a-line-soft)] rounded-sm"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={doImport}
                disabled={!dbReady || pending}
                className="bg-[var(--a-accent)] text-[var(--a-accent-fg)] px-4 py-1.5 text-sm font-semibold rounded-sm hover:opacity-90 disabled:opacity-40"
              >
                {pending ? "Importing…" : `Import ${rows.length} rows`}
              </button>
            </div>
            <div className="overflow-x-auto max-h-[420px]">
              <table className="w-full text-sm min-w-[900px]">
                <thead className="bg-[var(--a-line-soft)] text-[10px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] font-medium sticky top-0">
                  <tr>
                    <th className="text-start px-3 py-2 w-20">Action</th>
                    <th className="text-start px-3 py-2">ID</th>
                    <th className="text-start px-3 py-2">Name (EN)</th>
                    <th className="text-start px-3 py-2">Category</th>
                    <th className="text-end px-3 py-2 w-20">Price</th>
                    <th className="text-end px-3 py-2 w-16">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--a-line-soft)]">
                  {rows.map((r, i) => {
                    const isNew = !current.find((c) => c.id === r.id);
                    return (
                      <tr key={i}>
                        <td className="px-3 py-2">
                          <span
                            className={`text-[10px] tracking-[0.15em] uppercase px-1.5 py-0.5 rounded-sm font-medium ${
                              isNew
                                ? "bg-[var(--a-success-bg)] text-[var(--a-success)]"
                                : "bg-[var(--a-info-bg)] text-[var(--a-ink)]"
                            }`}
                          >
                            {isNew ? "New" : "Update"}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-mono text-xs">{r.id}</td>
                        <td className="px-3 py-2">{r.nameEn ?? <span className="text-[var(--a-ink-faint)] italic">—</span>}</td>
                        <td className="px-3 py-2 text-[var(--a-ink-soft)]">
                          {r.category ?? <span className="text-[var(--a-ink-faint)] italic">—</span>}
                        </td>
                        <td className="px-3 py-2 text-end num">
                          {typeof r.price === "number" ? r.price.toLocaleString("en-US") : <span className="text-[var(--a-ink-faint)] italic">—</span>}
                        </td>
                        <td className="px-3 py-2 text-end num">
                          {typeof r.stock === "number" ? r.stock : <span className="text-[var(--a-ink-faint)] italic">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Results */}
        {results && (
          <section className="bg-[var(--a-surface)] border border-[var(--a-line)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--a-line)] flex flex-wrap items-center gap-3">
              <h2 className="text-sm font-semibold tracking-wide me-auto">Results</h2>
              <span className="text-xs px-2 py-1 bg-[var(--a-success-bg)] text-[var(--a-success)] rounded-sm font-medium">
                {results.created} created
              </span>
              <span className="text-xs px-2 py-1 bg-[var(--a-info-bg)] text-[var(--a-ink)] rounded-sm font-medium">
                {results.updated} updated
              </span>
              <span className="text-xs px-2 py-1 bg-[var(--a-danger-bg)] text-[var(--a-danger)] rounded-sm font-medium">
                {results.errors} errors
              </span>
            </div>
            <div className="overflow-y-auto max-h-[360px]">
              <table className="w-full text-sm">
                <thead className="bg-[var(--a-line-soft)] text-[10px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] font-medium sticky top-0">
                  <tr>
                    <th className="text-start px-3 py-2 w-16">Row</th>
                    <th className="text-start px-3 py-2">ID</th>
                    <th className="text-start px-3 py-2 w-24">Result</th>
                    <th className="text-start px-3 py-2">Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--a-line-soft)]">
                  {results.rows.map((r) => (
                    <tr key={`${r.rowNumber}-${r.id}`}>
                      <td className="px-3 py-2 font-mono text-xs text-[var(--a-ink-muted)]">{r.rowNumber}</td>
                      <td className="px-3 py-2 font-mono text-xs">{r.id || <span className="italic">—</span>}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`text-[10px] tracking-[0.15em] uppercase px-1.5 py-0.5 rounded-sm font-medium ${
                            r.status === "created"
                              ? "bg-[var(--a-success-bg)] text-[var(--a-success)]"
                              : r.status === "updated"
                                ? "bg-[var(--a-info-bg)] text-[var(--a-ink)]"
                                : r.status === "skipped"
                                  ? "bg-[var(--a-line-soft)] text-[var(--a-ink-muted)]"
                                  : "bg-[var(--a-danger-bg)] text-[var(--a-danger)]"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-[var(--a-danger)]">
                        {r.error}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Google Drive note */}
        <section className="bg-[var(--a-info-bg)] border border-[var(--a-line)] px-4 py-3 text-sm text-[var(--a-ink-soft)] rounded-md">
          <div className="font-medium text-[var(--a-ink)] mb-1">Working with Google Drive</div>
          Save the downloaded <code className="bg-white/40 px-1 py-0.5 rounded text-xs">.xlsx</code> in a Drive folder. Open with Google Sheets to edit collaboratively with your team. When you want to publish changes, click <b>File → Download → Microsoft Excel (.xlsx)</b> and drop the file back here. The portal will diff against your live catalog and show you exactly what will create/update before you confirm.
        </section>
      </div>
    </>
  );
}
