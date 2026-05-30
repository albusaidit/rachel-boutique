// Build the full pro multi-sheet template directly in a Google Sheet.
// Mirrors the xlsx pro template: Cover / Instructions (EN/AR/FR) /
// Products (grouped column bands + conditional stock + zebra) /
// Categories / Tags / Sizes / Columns reference.

import { readFileSync } from "node:fs";
import { google } from "googleapis";
import { config as dotenvConfig } from "dotenv";
import { neon } from "@neondatabase/serverless";

dotenvConfig({ path: ".env.local" });
dotenvConfig({ path: ".env" });

const JSON_PATH = "C:/Users/taloo/Downloads/rachel-catalog-b9ffb80e3948.json";
const SHEET_ID = "1omNlYtukPXJvpLHnOowrMdWbhEOpLLG6wHGlAPJ1Vo8";

// ─── Colour palette (matches xlsx template) ───
const rgb = (hex) => {
  const m = hex.replace("#", "");
  return {
    red: parseInt(m.slice(0, 2), 16) / 255,
    green: parseInt(m.slice(2, 4), 16) / 255,
    blue: parseInt(m.slice(4, 6), 16) / 255,
  };
};
const C = {
  burgundy: rgb("#7A1632"),
  burgundyLight: rgb("#F4E2E7"),
  navy: rgb("#1F3258"),
  navySoft: rgb("#EDF1F8"),
  taupe: rgb("#B89870"),
  taupeSoft: rgb("#F3EBDA"),
  groupIdentity: rgb("#E8E4DC"),
  groupContent: rgb("#E6E7EE"),
  groupPrice: rgb("#F2E6DC"),
  groupTaxonomy: rgb("#E2EBE0"),
  groupMedia: rgb("#DFE7F0"),
  bg: rgb("#FAFAF7"),
  zebra: rgb("#F4F2EC"),
  border: rgb("#D3D3CB"),
  ink: rgb("#1A1A1A"),
  inkSoft: rgb("#555550"),
  mute: rgb("#7B7B70"),
  white: rgb("#FFFFFF"),
  ok: rgb("#1E7A3A"),
  okBg: rgb("#E6F4EA"),
  warn: rgb("#B86B2C"),
  warnBg: rgb("#FCF1E2"),
  danger: rgb("#A52A2A"),
  dangerBg: rgb("#F7E1E1"),
};

const borderAll = {
  top: { style: "SOLID", color: C.border },
  bottom: { style: "SOLID", color: C.border },
  left: { style: "SOLID", color: C.border },
  right: { style: "SOLID", color: C.border },
};

// ─── Column definitions ───
const COLUMNS = [
  { key: "id", label: "id", width: 110, required: true, group: "identity", hintEn: "lowercase a-z, 0-9, hyphens", hintAr: "أحرف صغيرة، أرقام، شَرطات", hintFr: "lettres minuscules, chiffres, tirets", example: "c-tunic-04", numeric: false },
  { key: "slug", label: "slug", width: 140, group: "identity", hintEn: "URL slug — defaults to id", hintAr: "رابط — يأخذ قيمة id افتراضياً", hintFr: "slug URL — par défaut = id", example: "silk-tunic", numeric: false },
  { key: "nameEn", label: "nameEn", width: 180, required: true, group: "content", hintEn: "Product name in English", hintAr: "اسم المنتج بالإنجليزية", hintFr: "Nom du produit en anglais", example: "Silk Tunic", numeric: false },
  { key: "nameAr", label: "nameAr", width: 180, required: true, group: "content", hintEn: "Product name in Arabic", hintAr: "اسم المنتج بالعربية", hintFr: "Nom du produit en arabe", example: "تونيك حريري", numeric: false },
  { key: "nameFr", label: "nameFr", width: 180, group: "content", hintEn: "Optional — French name", hintAr: "اختياري — الاسم بالفرنسية", hintFr: "Facultatif — nom en français", example: "Tunique en soie", numeric: false },
  { key: "descEn", label: "descEn", width: 240, group: "content", hintEn: "Description in English", hintAr: "الوصف بالإنجليزية", hintFr: "Description en anglais", example: "Lightweight silk tunic, hand-stitched.", numeric: false },
  { key: "descAr", label: "descAr", width: 240, group: "content", hintEn: "Description in Arabic", hintAr: "الوصف بالعربية", hintFr: "Description en arabe", example: "تونيك من الحرير الخفيف، خياطة يدوية.", numeric: false },
  { key: "descFr", label: "descFr", width: 240, group: "content", hintEn: "Description in French", hintAr: "الوصف بالفرنسية", hintFr: "Description en français", example: "Tunique en soie légère, cousue à la main.", numeric: false },
  { key: "price", label: "price", width: 90, required: true, group: "price", hintEn: "Selling price in MAD", hintAr: "سعر البيع بالدرهم", hintFr: "Prix de vente en MAD", example: "490", numeric: true },
  { key: "compareAt", label: "compareAt", width: 100, group: "price", hintEn: "Original price — leave empty if not on sale", hintAr: "السعر قبل التخفيض", hintFr: "Prix d'origine", example: "620", numeric: true },
  { key: "stock", label: "stock", width: 70, required: true, group: "price", hintEn: "Available units", hintAr: "الكمية المتاحة", hintFr: "Unités disponibles", example: "12", numeric: true },
  { key: "category", label: "category", width: 110, required: true, group: "taxonomy", hintEn: "Pick from Categories sheet", hintAr: "اختر من ورقة الفئات", hintFr: "Choisir depuis Categories", example: "clothing", numeric: false },
  { key: "subcategory", label: "subcategory", width: 120, required: true, group: "taxonomy", hintEn: "Pick from Categories sheet", hintAr: "اختر من ورقة الفئات", hintFr: "Choisir depuis Categories", example: "tunics", numeric: false },
  { key: "sizes", label: "sizes", width: 130, group: "taxonomy", hintEn: "Comma-separated (S, M, L)", hintAr: "مفصولة بفواصل", hintFr: "Séparées par virgules", example: "S, M, L", numeric: false },
  { key: "tags", label: "tags", width: 170, group: "taxonomy", hintEn: "Comma-separated — see Tags sheet", hintAr: "مفصولة بفواصل", hintFr: "Séparées par virgules", example: "new, bestseller", numeric: false },
  { key: "images", label: "images", width: 400, group: "media", hintEn: "Pipe-separated URLs", hintAr: "روابط مفصولة بـ |", hintFr: "URLs séparées par |", example: "https://example.com/img.jpg", numeric: false },
];
const GROUP_BG = { identity: C.groupIdentity, content: C.groupContent, price: C.groupPrice, taxonomy: C.groupTaxonomy, media: C.groupMedia };
const GROUP_LABEL = { identity: "IDENTITY", content: "CONTENT", price: "PRICING & STOCK", taxonomy: "TAXONOMY", media: "MEDIA" };

const CATEGORIES = [
  { key: "clothing", en: "Clothing", ar: "ملابس", subs: [
    ["tunics", "Tunics", "تونيكات"], ["blouses", "Blouses", "بلوزات"], ["shirts", "Shirts", "قمصان"],
    ["abayas", "Abayas", "عبايات"], ["pants", "Pants", "بناطيل"], ["skirts", "Skirts", "تنانير"],
    ["trench", "Trench Coats", "ترانشات"], ["coats", "Coats", "معاطف"], ["mukhawar", "Mukhawar", "مخاوير"],
    ["swimwear", "Swimwear", "ملابس السباحة"],
  ]},
  { key: "shoes", en: "Shoes", ar: "أحذية", subs: [
    ["shoes-women", "Women's Shoes", "أحذية نسائية"], ["sneakers", "Sneakers", "أحذية رياضية"],
    ["heels", "Heels", "كعب عالي"], ["boots", "Boots", "بوت"], ["sandals", "Sandals", "صنادل"],
    ["slippers", "Slippers", "شباشب"],
  ]},
  { key: "hair-tools", en: "Hair Tools", ar: "أدوات الشعر", subs: [
    ["straighteners", "Straighteners", "مكواة فرد"], ["curlers", "Curlers", "مكواة تجعيد"],
    ["hair-dryer", "Hair Dryers", "مجففات شعر"],
  ]},
  { key: "beauty", en: "Beauty", ar: "جمال", subs: [
    ["oils", "Oils", "زيوت"], ["hair-care", "Hair Care", "العناية بالشعر"],
    ["shea-butter", "Shea Butter", "زبدة الشيا"], ["indian-beauty", "Indian Beauty", "جمال هندي"],
    ["natural-oils", "Natural Oils", "زيوت طبيعية"],
  ]},
  { key: "perfumes", en: "Musk & Perfumes", ar: "المسك والعطور", subs: [
    ["arabic-attar", "Arabic Attar", "عطر عربي"], ["musk", "Musk", "مسك"],
    ["oud", "Oud", "عود"], ["floral", "Floral", "زهري"], ["attar", "Attar", "عطر"],
  ]},
];

async function loadCatalog() {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  const sql = neon(url);
  const rows = await sql`SELECT * FROM products WHERE archived_at IS NULL ORDER BY display_order, name_en`;
  return rows.map((p) => ({
    id: p.id, slug: p.slug,
    nameEn: p.name_en, nameAr: p.name_ar, nameFr: p.name_fr ?? "",
    descEn: p.desc_en, descAr: p.desc_ar, descFr: p.desc_fr ?? "",
    price: p.price, compareAt: p.compare_at, stock: p.stock,
    category: p.category, subcategory: p.subcategory,
    sizes: Array.isArray(p.sizes) ? p.sizes.join(", ") : "",
    tags: Array.isArray(p.tags) ? p.tags.join(", ") : "",
    images: Array.isArray(p.images) ? p.images.join(" | ") : "",
  }));
}

// ─── Helpers ───
function userVal(v) {
  if (v === null || v === undefined || v === "") return { userEnteredValue: { stringValue: "" } };
  if (typeof v === "number") return { userEnteredValue: { numberValue: v } };
  return { userEnteredValue: { stringValue: String(v) } };
}
function styledCell(v, fmt) {
  return { ...userVal(v), userEnteredFormat: fmt };
}
function fmt(opts) {
  const f = {};
  if (opts.bg) f.backgroundColor = opts.bg;
  if (opts.fg || opts.bold !== undefined || opts.italic !== undefined || opts.fontSize !== undefined || opts.fontFamily !== undefined) {
    f.textFormat = {};
    if (opts.fg) f.textFormat.foregroundColor = opts.fg;
    if (opts.bold !== undefined) f.textFormat.bold = opts.bold;
    if (opts.italic !== undefined) f.textFormat.italic = opts.italic;
    if (opts.fontSize !== undefined) f.textFormat.fontSize = opts.fontSize;
    if (opts.fontFamily !== undefined) f.textFormat.fontFamily = opts.fontFamily;
  }
  if (opts.halign) f.horizontalAlignment = opts.halign;
  if (opts.valign) f.verticalAlignment = opts.valign;
  if (opts.wrap) f.wrapStrategy = "WRAP";
  if (opts.borders) f.borders = borderAll;
  if (opts.numFmt) f.numberFormat = { type: "NUMBER", pattern: opts.numFmt };
  return f;
}

async function main() {
  console.log("→ Authenticating…");
  const json = JSON.parse(readFileSync(JSON_PATH, "utf-8"));
  const auth = new google.auth.JWT({
    email: json.client_email, key: json.private_key,
    scopes: ["https://www.googleapis.com/auth/drive", "https://www.googleapis.com/auth/spreadsheets"],
  });
  await auth.authorize();
  const sheets = google.sheets({ version: "v4", auth });

  console.log("→ Loading catalog from Neon…");
  const products = await loadCatalog();
  console.log(`  ${products.length} products`);

  console.log("→ Reading existing sheet structure…");
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const existingSheets = meta.data.sheets ?? [];

  // We'll wipe all existing tabs and recreate clean. To do that:
  // 1. Add a temp tab (Sheets API can't have 0 sheets)
  // 2. Delete all original tabs
  // 3. Add our 7 named tabs
  // 4. Delete the temp tab
  console.log("→ Resetting tabs…");
  const TEMP_TITLE = "__rachel_temp__";
  const requests = [];
  requests.push({ addSheet: { properties: { title: TEMP_TITLE } } });
  const addRes = await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID, requestBody: { requests },
  });
  const tempSheetId = addRes.data.replies[0].addSheet.properties.sheetId;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: existingSheets.map((s) => ({ deleteSheet: { sheetId: s.properties.sheetId } })),
    },
  });

  // Add our 7 named tabs
  const TABS = [
    { title: "Cover", tabColor: C.burgundy },
    { title: "Instructions", tabColor: C.taupe },
    { title: "Products", tabColor: C.burgundy },
    { title: "Categories", tabColor: C.navy },
    { title: "Tags", tabColor: C.navy },
    { title: "Sizes", tabColor: C.navy },
    { title: "Columns reference", tabColor: C.taupe },
  ];

  const addAll = await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: TABS.map((t, i) => ({
        addSheet: {
          properties: {
            title: t.title,
            index: i,
            tabColorStyle: { rgbColor: t.tabColor },
            gridProperties: { rowCount: 200, columnCount: 16 },
          },
        },
      })),
    },
  });
  const sheetIdByTitle = {};
  addAll.data.replies.forEach((r) => {
    const p = r.addSheet.properties;
    sheetIdByTitle[p.title] = p.sheetId;
  });

  // Now delete the temp
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: { requests: [{ deleteSheet: { sheetId: tempSheetId } }] },
  });

  const allRequests = [];
  console.log("→ Building Cover…");
  allRequests.push(...buildCover(sheetIdByTitle["Cover"], products.length));
  console.log("→ Building Instructions…");
  allRequests.push(...buildInstructions(sheetIdByTitle["Instructions"]));
  console.log("→ Building Products…");
  allRequests.push(...buildProducts(sheetIdByTitle["Products"], products));
  console.log("→ Building Categories…");
  allRequests.push(...buildCategories(sheetIdByTitle["Categories"]));
  console.log("→ Building Tags…");
  allRequests.push(...buildTags(sheetIdByTitle["Tags"]));
  console.log("→ Building Sizes…");
  allRequests.push(...buildSizes(sheetIdByTitle["Sizes"]));
  console.log("→ Building Columns reference…");
  allRequests.push(...buildColumnsRef(sheetIdByTitle["Columns reference"]));

  console.log(`→ Flushing ${allRequests.length} batched requests…`);
  await flushChunk(sheets, allRequests);

  console.log("\n✓ Done.");
  console.log("  https://docs.google.com/spreadsheets/d/" + SHEET_ID + "/edit");
}

// Each build function pushes requests into a per-sheet queue and we flush once.
function rowsReq(sheetId, startRow, startCol, rows) {
  return {
    updateCells: {
      range: {
        sheetId, startRowIndex: startRow, endRowIndex: startRow + rows.length,
        startColumnIndex: startCol, endColumnIndex: startCol + (rows[0]?.length ?? 0),
      },
      rows: rows.map((row) => ({ values: row })),
      fields: "userEnteredValue,userEnteredFormat",
    },
  };
}
function colWidthsReq(sheetId, widths) {
  return widths.map((w, i) => ({
    updateDimensionProperties: {
      range: { sheetId, dimension: "COLUMNS", startIndex: i, endIndex: i + 1 },
      properties: { pixelSize: w },
      fields: "pixelSize",
    },
  }));
}
function rowHeightReq(sheetId, row, height) {
  return {
    updateDimensionProperties: {
      range: { sheetId, dimension: "ROWS", startIndex: row, endIndex: row + 1 },
      properties: { pixelSize: height },
      fields: "pixelSize",
    },
  };
}

async function flushChunk(sheets, requests) {
  if (requests.length === 0) return;
  // Send in chunks of 40 to stay well under 60/min.
  for (let i = 0; i < requests.length; i += 40) {
    const chunk = requests.slice(i, i + 40);
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: { requests: chunk },
    });
    if (i + 40 < requests.length) {
      // Light pause between chunks
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
}

function buildCover(sheetId, productCount) {
  const reqs = [];
  reqs.push(...colWidthsReq(sheetId, [30, 220, 220, 220, 30]));

  const titleFmt = fmt({ bg: C.burgundy, fg: C.white, bold: true, fontSize: 24, fontFamily: "Cambria", halign: "LEFT", valign: "MIDDLE" });
  const subtitleFmt = fmt({ bg: C.burgundy, fg: C.white, italic: true, fontSize: 12, fontFamily: "Cambria", halign: "LEFT", valign: "MIDDLE" });
  const dateFmt = fmt({ bg: C.burgundy, fg: rgb("#F3EBDA"), fontSize: 10, halign: "RIGHT", valign: "MIDDLE" });
  const eyebrow = fmt({ fg: C.taupe, bold: true, fontSize: 9, halign: "LEFT", valign: "MIDDLE" });
  const bigNum = fmt({ fg: C.burgundy, bold: true, fontSize: 32, fontFamily: "Cambria", halign: "LEFT", valign: "MIDDLE" });
  const body = fmt({ fg: C.inkSoft, fontSize: 10, halign: "LEFT", valign: "MIDDLE", wrap: true });
  const sectionTitle = fmt({ fg: C.ink, bold: true, fontSize: 13, halign: "LEFT", valign: "MIDDLE" });
  const tocLabel = fmt({ fg: C.burgundy, bold: true, fontSize: 11, halign: "LEFT", valign: "MIDDLE" });
  const tocDesc = fmt({ fg: C.inkSoft, fontSize: 10, halign: "LEFT", valign: "MIDDLE" });
  const stepNum = fmt({ fg: C.taupe, bold: true, fontSize: 16, fontFamily: "Cambria", halign: "CENTER", valign: "MIDDLE" });
  const blank = fmt({});

  reqs.push(rowHeightReq(sheetId, 1, 56), rowHeightReq(sheetId, 6, 52));

  const cells = [];
  for (let r = 0; r < 3; r += 1) {
    const row = [];
    for (let c = 0; c < 5; c += 1) {
      if (r === 1 && c === 1) row.push(styledCell("RACHÉL", titleFmt));
      else if (r === 1 && c === 2) row.push(styledCell("Products workbook", subtitleFmt));
      else if (r === 1 && c === 3) row.push(styledCell(new Date().toISOString().slice(0, 10), dateFmt));
      else row.push(styledCell("", fmt({ bg: C.burgundy })));
    }
    cells.push(row);
  }
  reqs.push(rowsReq(sheetId, 0, 0, cells));

  reqs.push(rowsReq(sheetId, 5, 1, [
    [styledCell("AT A GLANCE", eyebrow), styledCell("", blank), styledCell("", blank)],
    [styledCell(productCount, bigNum), styledCell("products in your catalog\nproduit(s) au catalogue\nمنتج في الكتالوج", body), styledCell("", blank)],
  ]));

  reqs.push(rowsReq(sheetId, 9, 1, [[styledCell("What's in this workbook", sectionTitle), styledCell("", blank), styledCell("", blank)]]));
  const toc = [
    ["📘 Instructions", "How to use, in EN / AR / FR"],
    ["📦 Products", "The editable catalog — every row is one product"],
    ["🗂  Categories", "Valid category + subcategory keys"],
    ["🏷  Tags", "Tag keys (new / sale / bestseller / limited)"],
    ["📏 Sizes", "Common size patterns"],
    ["📑 Columns reference", "Every column described in 3 languages"],
  ];
  reqs.push(rowsReq(sheetId, 10, 1, toc.map(([k, v]) => [styledCell(k, tocLabel), styledCell(v, tocDesc), styledCell("", blank)])));

  reqs.push(rowsReq(sheetId, 18, 1, [[styledCell("Three steps", sectionTitle), styledCell("", blank), styledCell("", blank)]]));
  const steps = [["1", "Edit the Products sheet"], ["2", "Save"], ["3", "Sync from the admin portal"]];
  reqs.push(rowsReq(sheetId, 19, 1, steps.map(([n, t]) => [styledCell(n, stepNum), styledCell(t, body), styledCell("", blank)])));
  return reqs;
}

function buildInstructions(sheetId) {
  const reqs = [];
  reqs.push(...colWidthsReq(sheetId, [30, 420, 420, 420]));

  const titleFmt = fmt({ bg: C.burgundy, fg: C.white, bold: true, fontSize: 16, fontFamily: "Cambria", halign: "LEFT", valign: "MIDDLE" });
  const titleAr = fmt({ bg: C.burgundy, fg: C.white, bold: true, fontSize: 16, fontFamily: "Cambria", halign: "RIGHT", valign: "MIDDLE" });
  const colHeader = fmt({ bg: C.taupeSoft, fg: C.taupe, bold: true, fontSize: 11, halign: "LEFT", valign: "MIDDLE", borders: true });
  const colHeaderAr = fmt({ bg: C.taupeSoft, fg: C.taupe, bold: true, fontSize: 11, halign: "RIGHT", valign: "MIDDLE", borders: true });
  const section = fmt({ bg: C.burgundyLight, fg: C.burgundy, bold: true, fontSize: 12, halign: "LEFT", valign: "MIDDLE" });
  const sectionAr = fmt({ bg: C.burgundyLight, fg: C.burgundy, bold: true, fontSize: 12, halign: "RIGHT", valign: "MIDDLE" });
  const body = fmt({ fg: C.ink, fontSize: 10, halign: "LEFT", valign: "TOP", wrap: true, borders: true });
  const bodyAr = fmt({ fg: C.ink, fontSize: 10, halign: "RIGHT", valign: "TOP", wrap: true, borders: true });

  reqs.push(rowHeightReq(sheetId, 0, 36));
  reqs.push(rowsReq(sheetId, 0, 0, [[
    styledCell("", fmt({ bg: C.burgundy })),
    styledCell("Instructions", titleFmt),
    styledCell("تعليمات", titleAr),
    styledCell("Mode d'emploi", titleFmt),
  ]]));
  reqs.push(rowsReq(sheetId, 1, 0, [[
    styledCell("", fmt({})),
    styledCell("English", colHeader),
    styledCell("العربية", colHeaderAr),
    styledCell("Français", colHeader),
  ]]));

  const rows = [
    { kind: "section", en: "Overview", ar: "نظرة عامة", fr: "Vue d'ensemble" },
    { en: "This workbook is the source of truth for your storefront catalog. Edit Products, then click Sync now in the admin portal.", ar: "هذا الملف هو المصدر الرسمي لكتالوج متجركِ. عدّلي المنتجات ثم اضغطي مزامنة الآن في لوحة الإدارة.", fr: "Ce classeur est la source unique du catalogue. Modifiez Products, puis cliquez Sync now dans l'admin." },
    { kind: "section", en: "Header colours", ar: "ألوان الرؤوس", fr: "Couleurs des en-têtes" },
    { en: "Burgundy = REQUIRED column for new products. Other colours group related fields (Identity / Content / Pricing / Taxonomy / Media).", ar: "العنّابي = حقل إلزامي. الألوان الأخرى تجمع الحقول (الهوية / المحتوى / السعر / التصنيف / الصور).", fr: "Bordeaux = colonne obligatoire. Les autres couleurs regroupent les champs (Identité / Contenu / Prix / Taxonomie / Média)." },
    { kind: "section", en: "Updating vs creating", ar: "التعديل والإنشاء", fr: "Mise à jour vs création" },
    { en: "Matching id → update (empty cells leave value alone). New id → create (id, nameEn, nameAr, price, stock, category, subcategory required).", ar: "id موجود → تحديث (الفارغ يبقى). id جديد → إنشاء (يتطلب id, nameEn, nameAr, price, stock, category, subcategory).", fr: "id existant → mise à jour. Nouvel id → création (id, nameEn, nameAr, price, stock, category, subcategory requis)." },
    { kind: "section", en: "Reference sheets", ar: "أوراق المرجع", fr: "Onglets de référence" },
    { en: "Categories → valid keys. Tags → supported tag keys. Sizes → suggested patterns.", ar: "Categories → المفاتيح الصالحة. Tags → الوسوم. Sizes → أنماط مقترحة.", fr: "Categories → clés valides. Tags → clés supportées. Sizes → motifs suggérés." },
    { kind: "section", en: "Tips", ar: "نصائح", fr: "Conseils" },
    { en: "• Filter on the Products header to narrow your view.\n• Frozen header stays visible while you scroll.\n• Stock colour-codes itself (red 0, amber ≤5, green > 5).", ar: "• استخدمي الفلاتر على رأس Products.\n• الرأس المثبّت يبقى ظاهراً.\n• المخزون يتلوّن تلقائياً (أحمر 0، برتقالي ≤5، أخضر > 5).", fr: "• Utilisez les filtres sur l'en-tête.\n• L'en-tête figé reste visible.\n• Le stock se colore (rouge 0, orange ≤5, vert > 5)." },
  ];

  let r = 2;
  for (const line of rows) {
    if (line.kind === "section") {
      reqs.push(rowsReq(sheetId, r, 0, [[
        styledCell("", fmt({ bg: C.burgundyLight })),
        styledCell(line.en, section),
        styledCell(line.ar, sectionAr),
        styledCell(line.fr, section),
      ]]));
      reqs.push(rowHeightReq(sheetId, r, 28));
    } else {
      reqs.push(rowsReq(sheetId, r, 0, [[
        styledCell("", fmt({})),
        styledCell(line.en, body),
        styledCell(line.ar, bodyAr),
        styledCell(line.fr, body),
      ]]));
      reqs.push(rowHeightReq(sheetId, r, 48));
    }
    r += 1;
  }

  reqs.push({
    updateSheetProperties: {
      properties: { sheetId, gridProperties: { frozenRowCount: 2 } },
      fields: "gridProperties.frozenRowCount",
    },
  });
  return reqs;
}

function buildProducts(sheetId, products) {
  const reqs = [];
  reqs.push(...colWidthsReq(sheetId, COLUMNS.map((c) => c.width)));

  // Row 0 (1): group bands
  const groupRow = [];
  COLUMNS.forEach((c) => {
    groupRow.push(styledCell("", fmt({ bg: GROUP_BG[c.group], fg: C.inkSoft, bold: true, fontSize: 9, halign: "LEFT", valign: "MIDDLE", borders: true })));
  });
  // Set label on first col of each group
  for (let i = 0; i < COLUMNS.length; i += 1) {
    if (i === 0 || COLUMNS[i].group !== COLUMNS[i - 1].group) {
      groupRow[i] = styledCell(GROUP_LABEL[COLUMNS[i].group], fmt({ bg: GROUP_BG[COLUMNS[i].group], fg: C.inkSoft, bold: true, fontSize: 9, halign: "LEFT", valign: "MIDDLE", borders: true }));
    }
  }

  // Row 1 (2): column headers
  const headerRow = COLUMNS.map((c) => styledCell(c.label, fmt({
    bg: c.required ? C.burgundy : C.navy, fg: C.white, bold: true, fontSize: 11, halign: "LEFT", valign: "MIDDLE", borders: true,
  })));

  // Row 1 has group bands, row 2 has column headers, data starts at row 3.
  // (No hint/example rows here — they would be parsed as data by the live sync.)
  reqs.push(rowsReq(sheetId, 0, 0, [groupRow, headerRow]));

  let start = 0;
  for (let i = 1; i <= COLUMNS.length; i += 1) {
    if (i === COLUMNS.length || COLUMNS[i].group !== COLUMNS[start].group) {
      if (i - start > 1) {
        reqs.push({
          mergeCells: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: start, endColumnIndex: i },
            mergeType: "MERGE_ALL",
          },
        });
      }
      start = i;
    }
  }

  reqs.push(
    rowHeightReq(sheetId, 0, 22),
    rowHeightReq(sheetId, 1, 26),
  );

  const HEADER_OFFSET = 2;
  const dataRows = products.map((p, ri) => {
    const zebra = ri % 2 === 1;
    return COLUMNS.map((c) => {
      const raw = p[c.key];
      const isAr = c.key === "nameAr" || c.key === "descAr";
      let bg = zebra ? C.zebra : C.bg;
      let fg = C.ink;
      let bold = false;
      if (c.key === "stock" && typeof raw === "number") {
        if (raw === 0) { bg = C.dangerBg; fg = C.danger; bold = true; }
        else if (raw <= 5) { bg = C.warnBg; fg = C.warn; bold = true; }
        else { bg = C.okBg; fg = C.ok; }
      }
      const style = fmt({
        bg, fg, bold,
        fontSize: 10,
        halign: c.numeric ? "RIGHT" : (isAr ? "RIGHT" : "LEFT"),
        valign: "MIDDLE",
        wrap: c.key.startsWith("desc"),
        borders: true,
        numFmt: c.numeric ? "#,##0" : undefined,
      });
      return styledCell(c.numeric && raw !== null && raw !== "" ? Number(raw) : (raw ?? ""), style);
    });
  });
  reqs.push(rowsReq(sheetId, HEADER_OFFSET, 0, dataRows));

  reqs.push({
    updateSheetProperties: {
      properties: { sheetId, gridProperties: { frozenRowCount: 2, rowCount: Math.max(120, products.length + 20), columnCount: COLUMNS.length } },
      fields: "gridProperties(frozenRowCount,rowCount,columnCount)",
    },
  });
  reqs.push({
    setBasicFilter: {
      filter: {
        range: { sheetId, startRowIndex: 1, endRowIndex: products.length + HEADER_OFFSET, startColumnIndex: 0, endColumnIndex: COLUMNS.length },
      },
    },
  });
  return reqs;
}

function buildCategories(sheetId) {
  const reqs = [];
  reqs.push(...colWidthsReq(sheetId, [120, 150, 150, 140, 160, 160]));

  const titleFmt = fmt({ bg: C.burgundy, fg: C.white, bold: true, fontSize: 14, fontFamily: "Cambria", halign: "LEFT", valign: "MIDDLE" });
  const header = fmt({ bg: C.navySoft, fg: C.navy, bold: true, fontSize: 10, halign: "LEFT", valign: "MIDDLE", borders: true });

  reqs.push(rowHeightReq(sheetId, 0, 32));
  reqs.push(rowsReq(sheetId, 0, 0, [[
    styledCell("Categories  ·  الفئات  ·  Catégories", titleFmt),
    ...Array(5).fill(styledCell("", fmt({ bg: C.burgundy }))),
  ]]));
  const headers = ["category key", "category (EN)", "category (AR)", "subcategory key", "subcategory (EN)", "subcategory (AR)"];
  reqs.push(rowsReq(sheetId, 1, 0, [headers.map((h) => styledCell(h, header))]));

  const rows = [];
  let zebra = false;
  for (const c of CATEGORIES) {
    for (let i = 0; i < c.subs.length; i += 1) {
      const [sk, se, sa] = c.subs[i];
      const bg = zebra ? C.zebra : C.bg;
      rows.push([
        styledCell(i === 0 ? c.key : "", fmt({ bg, fg: C.ink, bold: i === 0, fontSize: 10, halign: "LEFT", valign: "MIDDLE", borders: true })),
        styledCell(i === 0 ? c.en : "", fmt({ bg, fg: C.ink, bold: i === 0, fontSize: 10, halign: "LEFT", valign: "MIDDLE", borders: true })),
        styledCell(i === 0 ? c.ar : "", fmt({ bg, fg: C.ink, bold: i === 0, fontSize: 10, halign: "RIGHT", valign: "MIDDLE", borders: true })),
        styledCell(sk, fmt({ bg, fg: C.ink, fontSize: 10, halign: "LEFT", valign: "MIDDLE", borders: true })),
        styledCell(se, fmt({ bg, fg: C.ink, fontSize: 10, halign: "LEFT", valign: "MIDDLE", borders: true })),
        styledCell(sa, fmt({ bg, fg: C.ink, fontSize: 10, halign: "RIGHT", valign: "MIDDLE", borders: true })),
      ]);
      zebra = !zebra;
    }
  }
  reqs.push(rowsReq(sheetId, 2, 0, rows));
  reqs.push({ updateSheetProperties: { properties: { sheetId, gridProperties: { frozenRowCount: 2 } }, fields: "gridProperties.frozenRowCount" } });
  reqs.push({ setBasicFilter: { filter: { range: { sheetId, startRowIndex: 1, endRowIndex: rows.length + 2, startColumnIndex: 0, endColumnIndex: 6 } } } });
  return reqs;
}

function buildTags(sheetId) {
  const reqs = [];
  reqs.push(...colWidthsReq(sheetId, [100, 380, 380, 380]));
  const title = fmt({ bg: C.burgundy, fg: C.white, bold: true, fontSize: 14, fontFamily: "Cambria", halign: "LEFT", valign: "MIDDLE" });
  const header = fmt({ bg: C.navySoft, fg: C.navy, bold: true, fontSize: 10, halign: "LEFT", valign: "MIDDLE", borders: true });
  const headerAr = fmt({ ...header, horizontalAlignment: "RIGHT" });

  reqs.push(rowHeightReq(sheetId, 0, 32));
  reqs.push(rowsReq(sheetId, 0, 0, [[
    styledCell("Tags  ·  الوسوم  ·  Étiquettes", title),
    styledCell("", fmt({ bg: C.burgundy })), styledCell("", fmt({ bg: C.burgundy })), styledCell("", fmt({ bg: C.burgundy })),
  ]]));
  reqs.push(rowsReq(sheetId, 1, 0, [[
    styledCell("tag", header), styledCell("English", header), styledCell("العربية", headerAr), styledCell("Français", header),
  ]]));

  const tagRows = [
    ["new", "Shown with the 'New' badge.", "يظهر بوسم 'جديد'.", "Affiché avec le badge « Nouveau »."],
    ["sale", "Shown with the 'Sale' badge. Combine with compareAt.", "يظهر بوسم 'تخفيض'. استخدميه مع compareAt.", "Affiché avec « Solde ». Combiner avec compareAt."],
    ["bestseller", "Shown with 'Bestseller' badge + surfaced on dashboard.", "يظهر بوسم 'الأكثر مبيعاً' ويُعرض في لوحة التحكم.", "Affiché avec « Best-seller » et mis en avant."],
    ["limited", "Shown with the 'Limited' badge.", "يظهر بوسم 'محدود'.", "Affiché avec « Édition limitée »."],
  ];
  const rows = tagRows.map(([k, en, ar, fr], i) => {
    const bg = i % 2 === 1 ? C.zebra : C.bg;
    return [
      styledCell(k, fmt({ bg, fg: C.burgundy, bold: true, fontSize: 10, halign: "LEFT", valign: "MIDDLE", borders: true })),
      styledCell(en, fmt({ bg, fg: C.ink, fontSize: 10, halign: "LEFT", valign: "MIDDLE", wrap: true, borders: true })),
      styledCell(ar, fmt({ bg, fg: C.ink, fontSize: 10, halign: "RIGHT", valign: "MIDDLE", wrap: true, borders: true })),
      styledCell(fr, fmt({ bg, fg: C.ink, fontSize: 10, halign: "LEFT", valign: "MIDDLE", wrap: true, borders: true })),
    ];
  });
  reqs.push(rowsReq(sheetId, 2, 0, rows));
  reqs.push({ updateSheetProperties: { properties: { sheetId, gridProperties: { frozenRowCount: 2 } }, fields: "gridProperties.frozenRowCount" } });
  return reqs;
}

function buildSizes(sheetId) {
  const reqs = [];
  reqs.push(...colWidthsReq(sheetId, [150, 320, 320, 320]));
  const title = fmt({ bg: C.burgundy, fg: C.white, bold: true, fontSize: 14, fontFamily: "Cambria", halign: "LEFT", valign: "MIDDLE" });
  const header = fmt({ bg: C.navySoft, fg: C.navy, bold: true, fontSize: 10, halign: "LEFT", valign: "MIDDLE", borders: true });
  const headerAr = fmt({ ...header, horizontalAlignment: "RIGHT" });

  reqs.push(rowHeightReq(sheetId, 0, 32));
  reqs.push(rowsReq(sheetId, 0, 0, [[
    styledCell("Sizes  ·  المقاسات  ·  Tailles", title),
    styledCell("", fmt({ bg: C.burgundy })), styledCell("", fmt({ bg: C.burgundy })), styledCell("", fmt({ bg: C.burgundy })),
  ]]));
  reqs.push(rowsReq(sheetId, 1, 0, [[
    styledCell("pattern", header), styledCell("English", header), styledCell("العربية", headerAr), styledCell("Français", header),
  ]]));

  const sizeRows = [
    ["S, M, L", "Standard apparel.", "الملابس القياسية.", "Vêtements standards."],
    ["XS, S, M, L, XL", "Wide-range apparel.", "ملابس بمقاسات موسّعة.", "Vêtements toutes tailles."],
    ["36, 38, 40, 42, 44", "EU shoe sizing.", "مقاسات الأحذية الأوروبية.", "Pointures EU."],
    ["50ml, 100ml", "Perfumes / fragrances.", "العطور والروائح.", "Parfums et fragrances."],
    ["One size", "Accessories / one-size items.", "إكسسوارات بمقاس واحد.", "Accessoires / taille unique."],
  ];
  const rows = sizeRows.map(([k, en, ar, fr], i) => {
    const bg = i % 2 === 1 ? C.zebra : C.bg;
    return [
      styledCell(k, fmt({ bg, fg: C.navy, bold: true, fontSize: 10, halign: "LEFT", valign: "MIDDLE", borders: true })),
      styledCell(en, fmt({ bg, fg: C.ink, fontSize: 10, halign: "LEFT", valign: "MIDDLE", borders: true })),
      styledCell(ar, fmt({ bg, fg: C.ink, fontSize: 10, halign: "RIGHT", valign: "MIDDLE", borders: true })),
      styledCell(fr, fmt({ bg, fg: C.ink, fontSize: 10, halign: "LEFT", valign: "MIDDLE", borders: true })),
    ];
  });
  reqs.push(rowsReq(sheetId, 2, 0, rows));
  reqs.push({ updateSheetProperties: { properties: { sheetId, gridProperties: { frozenRowCount: 2 } }, fields: "gridProperties.frozenRowCount" } });
  return reqs;
}

function buildColumnsRef(sheetId) {
  const reqs = [];
  reqs.push(...colWidthsReq(sheetId, [110, 80, 100, 380, 380, 380, 220]));
  const title = fmt({ bg: C.burgundy, fg: C.white, bold: true, fontSize: 14, fontFamily: "Cambria", halign: "LEFT", valign: "MIDDLE" });
  const header = fmt({ bg: C.navySoft, fg: C.navy, bold: true, fontSize: 10, halign: "LEFT", valign: "MIDDLE", borders: true });
  const headerAr = fmt({ ...header, horizontalAlignment: "RIGHT" });

  reqs.push(rowHeightReq(sheetId, 0, 32));
  reqs.push(rowsReq(sheetId, 0, 0, [[
    styledCell("Columns reference  ·  مرجع الأعمدة  ·  Référence colonnes", title),
    ...Array(6).fill(styledCell("", fmt({ bg: C.burgundy }))),
  ]]));
  reqs.push(rowsReq(sheetId, 1, 0, [["column", "required", "group", "English", "العربية", "Français", "example"].map((h, i) =>
    styledCell(h, i === 4 ? headerAr : header))]));

  const rows = COLUMNS.map((c, i) => {
    const bg = i % 2 === 1 ? C.zebra : C.bg;
    return [
      styledCell(c.label, fmt({ bg, fg: C.ink, bold: true, fontSize: 10, fontFamily: "Consolas", halign: "LEFT", valign: "MIDDLE", borders: true })),
      styledCell(c.required ? "yes" : "no", fmt({ bg: c.required ? C.burgundyLight : bg, fg: c.required ? C.burgundy : C.mute, bold: !!c.required, fontSize: 10, halign: "LEFT", valign: "MIDDLE", borders: true })),
      styledCell(GROUP_LABEL[c.group], fmt({ bg: GROUP_BG[c.group], fg: C.inkSoft, fontSize: 9, halign: "LEFT", valign: "MIDDLE", borders: true })),
      styledCell(c.hintEn, fmt({ bg, fg: C.ink, fontSize: 10, halign: "LEFT", valign: "MIDDLE", wrap: true, borders: true })),
      styledCell(c.hintAr, fmt({ bg, fg: C.ink, fontSize: 10, halign: "RIGHT", valign: "MIDDLE", wrap: true, borders: true })),
      styledCell(c.hintFr, fmt({ bg, fg: C.ink, fontSize: 10, halign: "LEFT", valign: "MIDDLE", wrap: true, borders: true })),
      styledCell(c.example, fmt({ bg, fg: C.mute, italic: true, fontSize: 10, fontFamily: "Consolas", halign: "LEFT", valign: "MIDDLE", wrap: true, borders: true })),
    ];
  });
  reqs.push(rowsReq(sheetId, 2, 0, rows));
  reqs.push({ updateSheetProperties: { properties: { sheetId, gridProperties: { frozenRowCount: 2 } }, fields: "gridProperties.frozenRowCount" } });
  return reqs;
}

main().catch((err) => {
  console.error("✗ Failed:", err.message ?? err);
  if (err.response?.data) console.error(JSON.stringify(err.response.data, null, 2));
  process.exit(1);
});
