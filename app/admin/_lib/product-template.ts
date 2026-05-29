import * as XLSX from "xlsx-js-style";

export type CurrentRow = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  nameFr: string;
  descEn: string;
  descAr: string;
  descFr: string;
  price: number;
  compareAt: number | null;
  stock: number;
  category: string;
  subcategory: string;
  sizes: string;
  tags: string;
  images: string;
};

export type CategoryRef = {
  key: string;
  en: string;
  ar?: string;
  subcategories: { key: string; en: string }[];
};

type Column = {
  key: keyof CurrentRow;
  label: string;
  width: number;
  required?: boolean;
  numFmt?: string;
  description: string;
  example: string;
};

const COLUMNS: Column[] = [
  { key: "id", label: "id", width: 18, required: true, description: "Unique product ID. Lowercase letters/digits/hyphens. Use to match an existing product (updates) or to create a new one.", example: "c-tunic-04" },
  { key: "slug", label: "slug", width: 22, description: "URL slug. Defaults to the id when empty.", example: "silk-tunic" },
  { key: "nameEn", label: "nameEn", width: 26, required: true, description: "Product name in English. Required for new rows.", example: "Silk Tunic" },
  { key: "nameAr", label: "nameAr", width: 26, required: true, description: "Product name in Arabic. Required for new rows.", example: "تونيك حريري" },
  { key: "nameFr", label: "nameFr", width: 26, description: "Product name in French (optional).", example: "Tunique en soie" },
  { key: "descEn", label: "descEn", width: 34, description: "Description in English (defaults to nameEn).", example: "Lightweight silk tunic, hand-stitched." },
  { key: "descAr", label: "descAr", width: 34, description: "Description in Arabic.", example: "تونيك من الحرير الخفيف، خياطة يدوية." },
  { key: "descFr", label: "descFr", width: 34, description: "Description in French (optional).", example: "Tunique en soie légère, cousue à la main." },
  { key: "price", label: "price", width: 12, required: true, numFmt: "#,##0", description: "Selling price in MAD. Integer.", example: "490" },
  { key: "compareAt", label: "compareAt", width: 14, numFmt: "#,##0", description: "Original price (struck-through). Leave empty if not on sale.", example: "620" },
  { key: "stock", label: "stock", width: 10, required: true, description: "Available stock. Integer.", example: "12" },
  { key: "category", label: "category", width: 16, required: true, description: "Category key from the Categories sheet (e.g. clothing, shoes).", example: "clothing" },
  { key: "subcategory", label: "subcategory", width: 16, required: true, description: "Subcategory key from the Categories sheet (e.g. tunics, abayas).", example: "tunics" },
  { key: "sizes", label: "sizes", width: 16, description: "Sizes, comma-separated.", example: "S, M, L" },
  { key: "tags", label: "tags", width: 24, description: "Tags, comma-separated. Pick from Tags sheet.", example: "new, bestseller" },
  { key: "images", label: "images", width: 60, description: "Image URLs, pipe-separated (|).", example: "https://… | https://…" },
];

const REQUIRED_BG = "FFE4D7DC"; // soft burgundy tint
const REQUIRED_FG = "FF9F1239";
const OPTIONAL_BG = "FFEEF2F7"; // soft blue tint
const OPTIONAL_FG = "FF1E3A8A";
const ACCENT_BG = "FF9F1239";
const ACCENT_FG = "FFFFFFFF";
const SUBTLE_BG = "FFF6F4F0";
const BORDER = "FFCBD5E1";
const BORDER_THICK = "FF94A3B8";
const TEXT = "FF111111";
const MUTED = "FF555555";

const borderAll = {
  top: { style: "thin", color: { rgb: BORDER } },
  bottom: { style: "thin", color: { rgb: BORDER } },
  left: { style: "thin", color: { rgb: BORDER } },
  right: { style: "thin", color: { rgb: BORDER } },
};

const borderThickBottom = {
  ...borderAll,
  bottom: { style: "medium", color: { rgb: BORDER_THICK } },
};

const cellHeaderRequired = {
  fill: { fgColor: { rgb: REQUIRED_BG } },
  font: { bold: true, color: { rgb: REQUIRED_FG }, sz: 11 },
  alignment: { vertical: "center", horizontal: "left" },
  border: borderThickBottom,
};
const cellHeaderOptional = {
  fill: { fgColor: { rgb: OPTIONAL_BG } },
  font: { bold: true, color: { rgb: OPTIONAL_FG }, sz: 11 },
  alignment: { vertical: "center", horizontal: "left" },
  border: borderThickBottom,
};
const cellExample = {
  fill: { fgColor: { rgb: SUBTLE_BG } },
  font: { italic: true, color: { rgb: MUTED }, sz: 10 },
  alignment: { vertical: "center", horizontal: "left", wrapText: true },
  border: borderAll,
};
const cellData = {
  font: { color: { rgb: TEXT }, sz: 11 },
  alignment: { vertical: "center", horizontal: "left", wrapText: true },
  border: borderAll,
};
const cellDataNum = {
  ...cellData,
  alignment: { vertical: "center", horizontal: "right" },
};
const cellSectionTitle = {
  font: { bold: true, sz: 18, color: { rgb: ACCENT_FG } },
  fill: { fgColor: { rgb: ACCENT_BG } },
  alignment: { vertical: "center", horizontal: "left" },
};
const cellSubTitle = {
  font: { bold: true, sz: 12, color: { rgb: TEXT } },
  alignment: { vertical: "center", horizontal: "left" },
};
const cellInstruction = {
  font: { sz: 11, color: { rgb: TEXT } },
  alignment: { vertical: "center", horizontal: "left", wrapText: true },
};
const cellInstructionMuted = {
  font: { sz: 10, color: { rgb: MUTED } },
  alignment: { vertical: "center", horizontal: "left", wrapText: true },
};
const cellRefHeader = {
  fill: { fgColor: { rgb: ACCENT_BG } },
  font: { bold: true, color: { rgb: ACCENT_FG }, sz: 11 },
  alignment: { vertical: "center", horizontal: "left" },
  border: borderThickBottom,
};
const cellRefData = {
  font: { color: { rgb: TEXT }, sz: 11 },
  alignment: { vertical: "center", horizontal: "left" },
  border: borderAll,
};

function colLetter(idx: number): string {
  let s = "";
  let n = idx;
  while (n >= 0) {
    s = String.fromCharCode((n % 26) + 65) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
}

function setCell(ws: XLSX.WorkSheet, addr: string, value: unknown, style?: Record<string, unknown>, opts?: { numFmt?: string }): void {
  // Use _.set style via XLSX.utils
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cell: any = { v: value, t: typeof value === "number" ? "n" : "s" };
  if (value === null || value === undefined || value === "") {
    cell.v = "";
    cell.t = "s";
  }
  if (style) cell.s = style;
  if (opts?.numFmt) cell.z = opts.numFmt;
  ws[addr] = cell;
}

export function buildProTemplate(currentRows: CurrentRow[], categories: CategoryRef[]): ArrayBuffer {
  const wb = XLSX.utils.book_new();

  // ───────────────────────── Instructions sheet ─────────────────────────
  const instr: XLSX.WorkSheet = {};
  const instLines: { kind: "title" | "sub" | "body" | "muted" | "blank"; text: string }[] = [
    { kind: "title", text: "RACHÉL · Products import template" },
    { kind: "blank", text: "" },
    { kind: "sub", text: "Three steps" },
    { kind: "body", text: "1. Edit the Products sheet (next tab). Each row is one product." },
    { kind: "body", text: "2. Save the file (.xlsx)." },
    { kind: "body", text: "3. Open the portal → Products → Import → drop this file in." },
    { kind: "blank", text: "" },
    { kind: "sub", text: "Reading the headers in the Products sheet" },
    { kind: "body", text: "🟥 Burgundy headers = REQUIRED when creating a new product (id, nameEn, nameAr, price, stock, category, subcategory)." },
    { kind: "body", text: "🟦 Blue headers = optional. Empty cells leave the value alone when updating." },
    { kind: "body", text: "Row 2 is a styled example so you can see the shape — overwrite it or delete it." },
    { kind: "blank", text: "" },
    { kind: "sub", text: "Update vs. Create" },
    { kind: "body", text: "• If the value in column id matches a product already in your catalog, it updates that product." },
    { kind: "body", text: "• If the id is new, the row creates a new product." },
    { kind: "body", text: "• When updating, only the cells you fill in are changed. Empty cells = no change." },
    { kind: "blank", text: "" },
    { kind: "sub", text: "Reference sheets" },
    { kind: "body", text: "• Categories → valid category & subcategory keys to paste into your Products rows." },
    { kind: "body", text: "• Tags → valid tag keys (new, sale, bestseller, limited). Use commas to combine." },
    { kind: "body", text: "• Sizes → suggested size strings (free-text — use what fits)." },
    { kind: "blank", text: "" },
    { kind: "sub", text: "Working in Google Drive" },
    { kind: "body", text: "Save this file to a Drive folder, open with Google Sheets to edit with your team, then File → Download → Microsoft Excel (.xlsx) and re-upload to the portal." },
    { kind: "blank", text: "" },
    { kind: "muted", text: "Generated by RACHÉL admin · " + new Date().toISOString().slice(0, 10) },
  ];

  instr["!cols"] = [{ wch: 110 }];
  instr["!rows"] = [{ hpt: 32 }];

  instLines.forEach((l, i) => {
    const addr = `A${i + 1}`;
    if (l.kind === "title") {
      setCell(instr, addr, l.text, cellSectionTitle);
      if (!instr["!rows"]) instr["!rows"] = [];
      instr["!rows"][i] = { hpt: 36 };
    } else if (l.kind === "sub") {
      setCell(instr, addr, l.text, cellSubTitle);
    } else if (l.kind === "muted") {
      setCell(instr, addr, l.text, cellInstructionMuted);
    } else if (l.kind === "blank") {
      // skip — leaves empty
    } else {
      setCell(instr, addr, l.text, cellInstruction);
    }
  });
  instr["!ref"] = `A1:A${instLines.length + 5}`;
  XLSX.utils.book_append_sheet(wb, instr, "Instructions");

  // ───────────────────────── Products sheet ─────────────────────────
  const products: XLSX.WorkSheet = {};
  products["!cols"] = COLUMNS.map((c) => ({ wch: c.width }));

  // Header row
  COLUMNS.forEach((col, i) => {
    const addr = `${colLetter(i)}1`;
    setCell(products, addr, col.label, col.required ? cellHeaderRequired : cellHeaderOptional);
  });

  // Example row (always present so users see the shape — they can clear it)
  COLUMNS.forEach((col, i) => {
    const addr = `${colLetter(i)}2`;
    const v = col.example;
    if (col.numFmt) {
      const n = Number(v);
      setCell(products, addr, Number.isFinite(n) ? n : v, cellExample, { numFmt: col.numFmt });
    } else {
      setCell(products, addr, v, cellExample);
    }
  });

  // Current data rows (if any)
  let totalRows = 2;
  currentRows.forEach((row, ri) => {
    const r = ri + 3; // rows 1=header, 2=example
    COLUMNS.forEach((col, ci) => {
      const addr = `${colLetter(ci)}${r}`;
      const raw = row[col.key] as string | number | null;
      const style = col.numFmt ? cellDataNum : cellData;
      if (col.numFmt) {
        const n = typeof raw === "number" ? raw : raw === null || raw === "" ? null : Number(raw);
        setCell(products, addr, n, style, { numFmt: col.numFmt });
      } else {
        setCell(products, addr, raw ?? "", style);
      }
    });
    totalRows = r;
  });

  const lastCol = colLetter(COLUMNS.length - 1);
  products["!ref"] = `A1:${lastCol}${Math.max(totalRows, 50)}`;
  products["!autofilter"] = { ref: `A1:${lastCol}1` };
  products["!freeze"] = { xSplit: 0, ySplit: 1 };
  XLSX.utils.book_append_sheet(wb, products, "Products");

  // ───────────────────────── Categories reference ─────────────────────────
  const cats: XLSX.WorkSheet = {};
  cats["!cols"] = [
    { wch: 18 },
    { wch: 18 },
    { wch: 28 },
    { wch: 28 },
  ];
  const catHeader = ["category", "subcategory", "Category (EN)", "Subcategory (EN)"];
  catHeader.forEach((h, i) => setCell(cats, `${colLetter(i)}1`, h, cellRefHeader));
  let catRow = 2;
  categories.forEach((c) => {
    if (c.subcategories.length === 0) {
      setCell(cats, `A${catRow}`, c.key, cellRefData);
      setCell(cats, `B${catRow}`, "", cellRefData);
      setCell(cats, `C${catRow}`, c.en, cellRefData);
      setCell(cats, `D${catRow}`, "", cellRefData);
      catRow += 1;
    }
    c.subcategories.forEach((s) => {
      setCell(cats, `A${catRow}`, c.key, cellRefData);
      setCell(cats, `B${catRow}`, s.key, cellRefData);
      setCell(cats, `C${catRow}`, c.en, cellRefData);
      setCell(cats, `D${catRow}`, s.en, cellRefData);
      catRow += 1;
    });
  });
  cats["!ref"] = `A1:D${Math.max(catRow - 1, 2)}`;
  cats["!autofilter"] = { ref: `A1:D1` };
  cats["!freeze"] = { xSplit: 0, ySplit: 1 };
  XLSX.utils.book_append_sheet(wb, cats, "Categories");

  // ───────────────────────── Tags reference ─────────────────────────
  const tags: XLSX.WorkSheet = {};
  tags["!cols"] = [{ wch: 16 }, { wch: 60 }];
  setCell(tags, "A1", "tag", cellRefHeader);
  setCell(tags, "B1", "Description", cellRefHeader);
  const tagRows: Array<[string, string]> = [
    ["new", "Shown with the 'New' badge on the storefront."],
    ["sale", "Shown with the 'Sale' badge. Pair with compareAt for the strike-through price."],
    ["bestseller", "Shown with the 'Bestseller' badge and surfaced on the dashboard."],
    ["limited", "Shown with the 'Limited' badge."],
  ];
  tagRows.forEach(([k, desc], i) => {
    setCell(tags, `A${i + 2}`, k, cellRefData);
    setCell(tags, `B${i + 2}`, desc, cellRefData);
  });
  tags["!ref"] = `A1:B${tagRows.length + 1}`;
  tags["!freeze"] = { xSplit: 0, ySplit: 1 };
  XLSX.utils.book_append_sheet(wb, tags, "Tags");

  // ───────────────────────── Sizes reference ─────────────────────────
  const sizes: XLSX.WorkSheet = {};
  sizes["!cols"] = [{ wch: 14 }, { wch: 60 }];
  setCell(sizes, "A1", "size_string", cellRefHeader);
  setCell(sizes, "B1", "Use for", cellRefHeader);
  const sizeRows: Array<[string, string]> = [
    ["S, M, L", "Standard apparel."],
    ["XS, S, M, L, XL", "Wide-range apparel."],
    ["36, 38, 40, 42, 44", "EU shoe sizing."],
    ["50ml, 100ml", "Perfumes / fragrances."],
    ["One size", "Accessories / one-size items."],
  ];
  sizeRows.forEach(([k, desc], i) => {
    setCell(sizes, `A${i + 2}`, k, cellRefData);
    setCell(sizes, `B${i + 2}`, desc, cellRefData);
  });
  sizes["!ref"] = `A1:B${sizeRows.length + 1}`;
  sizes["!freeze"] = { xSplit: 0, ySplit: 1 };
  XLSX.utils.book_append_sheet(wb, sizes, "Sizes");

  // ───────────────────────── Column reference ─────────────────────────
  const ref: XLSX.WorkSheet = {};
  ref["!cols"] = [{ wch: 16 }, { wch: 14 }, { wch: 90 }, { wch: 36 }];
  ["column", "required", "description", "example"].forEach((h, i) =>
    setCell(ref, `${colLetter(i)}1`, h, cellRefHeader),
  );
  COLUMNS.forEach((col, i) => {
    setCell(ref, `A${i + 2}`, col.label, cellRefData);
    setCell(ref, `B${i + 2}`, col.required ? "yes" : "no", cellRefData);
    setCell(ref, `C${i + 2}`, col.description, cellRefData);
    setCell(ref, `D${i + 2}`, col.example, cellRefData);
  });
  ref["!ref"] = `A1:D${COLUMNS.length + 1}`;
  ref["!freeze"] = { xSplit: 0, ySplit: 1 };
  XLSX.utils.book_append_sheet(wb, ref, "Columns reference");

  // ───────────────────────── Write workbook ─────────────────────────
  // Default to Instructions tab on open
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (wb as any).Workbook = { Views: [{ activeTab: 0 }] };

  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  return out;
}

export function downloadProTemplate(
  currentRows: CurrentRow[],
  categories: CategoryRef[],
  filename: string,
): void {
  const buf = buildProTemplate(currentRows, categories);
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
