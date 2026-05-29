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
  subcategories: { key: string; en: string; ar?: string; fr?: string }[];
};

// ─────────────────────── Palette ───────────────────────
// A sophisticated, magazine-style palette inspired by editorial layouts.
const C = {
  // Primary brand
  burgundy: "FF7A1632",
  burgundyLight: "FFF4E2E7",
  // Navy/slate for "optional" + info
  navy: "FF1F3258",
  navySoft: "FFEDF1F8",
  // Section dividers (warm)
  taupe: "FFB89870",
  taupeSoft: "FFF3EBDA",
  // Column-group bands
  groupIdentity: "FFE8E4DC", // warm grey
  groupContent: "FFE6E7EE", // cool grey
  groupPrice: "FFF2E6DC", // warm peach
  groupTaxonomy: "FFE2EBE0", // sage
  groupMedia: "FFDFE7F0", // sky
  // Body
  bg: "FFFAFAF7",
  zebra: "FFF4F2EC",
  border: "FFD3D3CB",
  borderHeavy: "FFB0AFA6",
  // Text
  ink: "FF1A1A1A",
  inkSoft: "FF555550",
  mute: "FF7B7B70",
  white: "FFFFFFFF",
  // Status
  ok: "FF1E7A3A",
  okBg: "FFE6F4EA",
  warn: "FFB86B2C",
  warnBg: "FFFCF1E2",
  danger: "FFA52A2A",
  dangerBg: "FFF7E1E1",
} as const;

// ─────────────────────── Columns ───────────────────────
type ColGroup = "identity" | "content" | "price" | "taxonomy" | "media";

type Column = {
  key: keyof CurrentRow;
  label: string;
  width: number;
  required?: boolean;
  numFmt?: string;
  group: ColGroup;
  hintEn: string;
  hintAr: string;
  hintFr: string;
  example: string;
};

const COLUMNS: Column[] = [
  { key: "id", label: "id", width: 16, required: true, group: "identity",
    hintEn: "lowercase a-z, 0-9, hyphens",
    hintAr: "أحرف صغيرة، أرقام، شَرطات",
    hintFr: "lettres minuscules, chiffres, tirets",
    example: "c-tunic-04" },
  { key: "slug", label: "slug", width: 20, group: "identity",
    hintEn: "URL slug — defaults to id",
    hintAr: "رابط — يأخذ قيمة id افتراضياً",
    hintFr: "slug URL — par défaut = id",
    example: "silk-tunic" },
  { key: "nameEn", label: "nameEn", width: 26, required: true, group: "content",
    hintEn: "Product name in English",
    hintAr: "اسم المنتج بالإنجليزية",
    hintFr: "Nom du produit en anglais",
    example: "Silk Tunic" },
  { key: "nameAr", label: "nameAr", width: 26, required: true, group: "content",
    hintEn: "Product name in Arabic",
    hintAr: "اسم المنتج بالعربية",
    hintFr: "Nom du produit en arabe",
    example: "تونيك حريري" },
  { key: "nameFr", label: "nameFr", width: 26, group: "content",
    hintEn: "Optional — French name",
    hintAr: "اختياري — الاسم بالفرنسية",
    hintFr: "Facultatif — nom en français",
    example: "Tunique en soie" },
  { key: "descEn", label: "descEn", width: 36, group: "content",
    hintEn: "Description in English",
    hintAr: "الوصف بالإنجليزية",
    hintFr: "Description en anglais",
    example: "Lightweight silk tunic, hand-stitched." },
  { key: "descAr", label: "descAr", width: 36, group: "content",
    hintEn: "Description in Arabic",
    hintAr: "الوصف بالعربية",
    hintFr: "Description en arabe",
    example: "تونيك من الحرير الخفيف، خياطة يدوية." },
  { key: "descFr", label: "descFr", width: 36, group: "content",
    hintEn: "Description in French",
    hintAr: "الوصف بالفرنسية",
    hintFr: "Description en français",
    example: "Tunique en soie légère, cousue à la main." },
  { key: "price", label: "price", width: 12, required: true, group: "price", numFmt: "#,##0\" MAD\"",
    hintEn: "Selling price in MAD",
    hintAr: "سعر البيع بالدرهم",
    hintFr: "Prix de vente en MAD",
    example: "490" },
  { key: "compareAt", label: "compareAt", width: 14, group: "price", numFmt: "#,##0\" MAD\"",
    hintEn: "Original price — leave empty if not on sale",
    hintAr: "السعر قبل التخفيض — اترك فارغاً إذا لم يكن مخفضاً",
    hintFr: "Prix d'origine — laisser vide si pas en solde",
    example: "620" },
  { key: "stock", label: "stock", width: 10, required: true, group: "price",
    hintEn: "Available units",
    hintAr: "الكمية المتاحة",
    hintFr: "Unités disponibles",
    example: "12" },
  { key: "category", label: "category", width: 16, required: true, group: "taxonomy",
    hintEn: "Pick from Categories sheet",
    hintAr: "اختر من ورقة الفئات",
    hintFr: "Choisir depuis l'onglet Categories",
    example: "clothing" },
  { key: "subcategory", label: "subcategory", width: 16, required: true, group: "taxonomy",
    hintEn: "Pick from Categories sheet",
    hintAr: "اختر من ورقة الفئات",
    hintFr: "Choisir depuis l'onglet Categories",
    example: "tunics" },
  { key: "sizes", label: "sizes", width: 18, group: "taxonomy",
    hintEn: "Comma-separated (S, M, L)",
    hintAr: "مفصولة بفواصل (S, M, L)",
    hintFr: "Séparées par virgules (S, M, L)",
    example: "S, M, L" },
  { key: "tags", label: "tags", width: 24, group: "taxonomy",
    hintEn: "Comma-separated — see Tags sheet",
    hintAr: "مفصولة بفواصل — راجع ورقة الوسوم",
    hintFr: "Séparées par virgules — voir l'onglet Tags",
    example: "new, bestseller" },
  { key: "images", label: "images", width: 58, group: "media",
    hintEn: "Pipe-separated URLs (https://… | https://…)",
    hintAr: "روابط مفصولة بـ | بين كل صورة",
    hintFr: "URLs séparées par | (https://… | https://…)",
    example: "https://example.com/img1.jpg | https://example.com/img2.jpg" },
];

const GROUP_BG: Record<ColGroup, string> = {
  identity: C.groupIdentity,
  content: C.groupContent,
  price: C.groupPrice,
  taxonomy: C.groupTaxonomy,
  media: C.groupMedia,
};

const GROUP_LABEL: Record<ColGroup, { en: string; ar: string; fr: string }> = {
  identity: { en: "IDENTITY", ar: "الهوية", fr: "IDENTITÉ" },
  content: { en: "CONTENT", ar: "المحتوى", fr: "CONTENU" },
  price: { en: "PRICING & STOCK", ar: "السعر والمخزون", fr: "PRIX ET STOCK" },
  taxonomy: { en: "TAXONOMY", ar: "التصنيف", fr: "TAXONOMIE" },
  media: { en: "MEDIA", ar: "الصور", fr: "MÉDIA" },
};

// ─────────────────────── Style helpers ───────────────────────
const borderThin = (color = C.border) => ({
  top: { style: "thin", color: { rgb: color } },
  bottom: { style: "thin", color: { rgb: color } },
  left: { style: "thin", color: { rgb: color } },
  right: { style: "thin", color: { rgb: color } },
});

const borderHeader = {
  top: { style: "medium", color: { rgb: C.borderHeavy } },
  bottom: { style: "medium", color: { rgb: C.borderHeavy } },
  left: { style: "thin", color: { rgb: C.border } },
  right: { style: "thin", color: { rgb: C.border } },
};

const baseFont = (overrides: Record<string, unknown> = {}) => ({
  name: "Calibri",
  sz: 11,
  color: { rgb: C.ink },
  ...overrides,
});

const titleFont = (overrides: Record<string, unknown> = {}) => ({
  name: "Cambria",
  sz: 22,
  bold: true,
  color: { rgb: C.white },
  ...overrides,
});

function colLetter(idx: number): string {
  let s = "";
  let n = idx;
  while (n >= 0) {
    s = String.fromCharCode((n % 26) + 65) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
}

type Style = Record<string, unknown>;
type CellOpts = { numFmt?: string };

function setCell(
  ws: XLSX.WorkSheet,
  addr: string,
  value: unknown,
  style?: Style,
  opts?: CellOpts,
): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cell: any = { v: value, t: typeof value === "number" ? "n" : "s" };
  if (value === null || value === undefined) {
    cell.v = "";
    cell.t = "s";
  }
  if (style) cell.s = style;
  if (opts?.numFmt) cell.z = opts.numFmt;
  ws[addr] = cell;
}

function rangeRef(rStart: number, cStart: number, rEnd: number, cEnd: number): string {
  return `${colLetter(cStart)}${rStart}:${colLetter(cEnd)}${rEnd}`;
}

// ─────────────────────── Cover sheet ───────────────────────
function buildCoverSheet(stats: { productCount: number }): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  ws["!cols"] = [
    { wch: 4 },
    { wch: 26 },
    { wch: 26 },
    { wch: 26 },
    { wch: 4 },
  ];
  ws["!rows"] = [];
  // Banner band rows 1-3
  for (let r = 1; r <= 3; r += 1) {
    ws["!rows"]![r - 1] = { hpt: r === 2 ? 64 : 18 };
    for (let c = 0; c < 5; c += 1) {
      setCell(ws, `${colLetter(c)}${r}`, "", {
        fill: { fgColor: { rgb: C.burgundy } },
      });
    }
  }
  setCell(ws, "B2", "RACHÉL", {
    fill: { fgColor: { rgb: C.burgundy } },
    font: titleFont({ sz: 28, name: "Cambria" }),
    alignment: { vertical: "center", horizontal: "left" },
  });
  setCell(ws, "C2", "Products workbook", {
    fill: { fgColor: { rgb: C.burgundy } },
    font: titleFont({ sz: 14, bold: false, italic: true }),
    alignment: { vertical: "center", horizontal: "left" },
  });
  setCell(ws, "D2", new Date().toISOString().slice(0, 10), {
    fill: { fgColor: { rgb: C.burgundy } },
    font: titleFont({ sz: 11, bold: false, color: { rgb: C.taupeSoft } }),
    alignment: { vertical: "center", horizontal: "right" },
  });

  // Spacer
  for (let r = 4; r <= 4; r += 1) {
    ws["!rows"]![r - 1] = { hpt: 10 };
  }
  // Stats card
  ws["!rows"]![5] = { hpt: 28 };
  setCell(ws, "B6", "AT A GLANCE", {
    font: baseFont({ sz: 9, bold: true, color: { rgb: C.taupe } }),
    alignment: { vertical: "center", horizontal: "left" },
  });
  ws["!rows"]![6] = { hpt: 56 };
  setCell(ws, "B7", String(stats.productCount), {
    font: baseFont({ name: "Cambria", sz: 36, bold: true, color: { rgb: C.burgundy } }),
    alignment: { vertical: "center", horizontal: "left" },
  });
  setCell(ws, "C7", "products in your catalog\nproduit(s) au catalogue\nمنتج في الكتالوج", {
    font: baseFont({ sz: 10, color: { rgb: C.inkSoft } }),
    alignment: { vertical: "center", horizontal: "left", wrapText: true },
  });

  // What this workbook is
  ws["!rows"]![9] = { hpt: 20 };
  setCell(ws, "B10", "What's in this workbook", {
    font: baseFont({ sz: 13, bold: true, color: { rgb: C.ink } }),
    alignment: { vertical: "center", horizontal: "left" },
  });
  const tocLines: Array<[string, string]> = [
    ["📘 Instructions", "How to use, in EN / AR / FR"],
    ["📦 Products", "The editable catalog — every row is one product"],
    ["🗂  Categories", "Valid category + subcategory keys to use"],
    ["🏷  Tags", "Tag keys (new / sale / bestseller / limited)"],
    ["📏 Sizes", "Common size patterns"],
    ["📑 Columns reference", "Every column described in 3 languages"],
  ];
  tocLines.forEach((line, i) => {
    const r = 11 + i;
    ws["!rows"]![r - 1] = { hpt: 20 };
    setCell(ws, `B${r}`, line[0], {
      font: baseFont({ sz: 11, bold: true, color: { rgb: C.burgundy } }),
      alignment: { vertical: "center", horizontal: "left" },
    });
    setCell(ws, `C${r}`, line[1], {
      font: baseFont({ sz: 10, color: { rgb: C.inkSoft } }),
      alignment: { vertical: "center", horizontal: "left" },
    });
  });

  // Three-step flow
  const flowRow = 19;
  ws["!rows"]![flowRow - 1] = { hpt: 22 };
  setCell(ws, "B" + flowRow, "Three steps", {
    font: baseFont({ sz: 13, bold: true }),
    alignment: { vertical: "center", horizontal: "left" },
  });
  const steps: Array<[string, string]> = [
    ["1", "Edit the Products sheet"],
    ["2", "Save the file (.xlsx)"],
    ["3", "Upload back via the import page"],
  ];
  steps.forEach((s, i) => {
    const r = flowRow + 1 + i;
    ws["!rows"]![r - 1] = { hpt: 22 };
    setCell(ws, `B${r}`, s[0], {
      font: baseFont({ name: "Cambria", sz: 18, bold: true, color: { rgb: C.taupe } }),
      alignment: { vertical: "center", horizontal: "center" },
    });
    setCell(ws, `C${r}`, s[1], {
      font: baseFont({ sz: 11 }),
      alignment: { vertical: "center", horizontal: "left" },
    });
  });

  ws["!ref"] = "A1:E30";
  ws["!freeze"] = { xSplit: 0, ySplit: 0 };
  return ws;
}

// ─────────────────────── Instructions sheet ───────────────────────
function buildInstructionsSheet(): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  ws["!cols"] = [
    { wch: 4 },
    { wch: 56 },
    { wch: 56 },
    { wch: 56 },
  ];
  ws["!rows"] = [];

  // Banner row
  ws["!rows"]![0] = { hpt: 38 };
  for (let c = 0; c < 4; c += 1) {
    setCell(ws, `${colLetter(c)}1`, "", {
      fill: { fgColor: { rgb: C.burgundy } },
    });
  }
  setCell(ws, "B1", "Instructions", {
    fill: { fgColor: { rgb: C.burgundy } },
    font: titleFont({ sz: 18 }),
    alignment: { vertical: "center", horizontal: "left" },
  });
  setCell(ws, "C1", "تعليمات", {
    fill: { fgColor: { rgb: C.burgundy } },
    font: titleFont({ sz: 18 }),
    alignment: { vertical: "center", horizontal: "right" },
  });
  setCell(ws, "D1", "Mode d'emploi", {
    fill: { fgColor: { rgb: C.burgundy } },
    font: titleFont({ sz: 18 }),
    alignment: { vertical: "center", horizontal: "left" },
  });

  // Column headers row 2
  ws["!rows"]![1] = { hpt: 22 };
  ["", "English", "العربية", "Français"].forEach((h, i) => {
    setCell(ws, `${colLetter(i)}2`, h, {
      font: baseFont({ sz: 11, bold: true, color: { rgb: C.taupe } }),
      fill: { fgColor: { rgb: C.taupeSoft } },
      alignment: {
        vertical: "center",
        horizontal: i === 2 ? "right" : "left",
      },
      border: borderHeader,
    });
  });

  const rows: Array<{ en: string; ar: string; fr: string; section?: boolean }> = [
    { en: "Overview", ar: "نظرة عامة", fr: "Vue d'ensemble", section: true },
    {
      en: "This workbook is the source of truth for your storefront catalog. Edit the Products sheet, save, and upload back to the portal.",
      ar: "هذا الملف هو المصدر الرسمي لكتالوج متجرك. عدّلي ورقة المنتجات، احفظي، ثم ارفعيه عبر بوابة الإدارة.",
      fr: "Ce classeur est la source unique du catalogue de votre boutique. Modifiez l'onglet Products, enregistrez, puis téléversez via le portail.",
    },
    { en: "Header colours", ar: "ألوان الرؤوس", fr: "Couleurs des en-têtes", section: true },
    {
      en: "Burgundy band = REQUIRED column for new products. Other colour bands group related fields (Identity / Content / Pricing / Taxonomy / Media).",
      ar: "الشريط العنّابي = حقل إلزامي للمنتجات الجديدة. الألوان الأخرى تجمع الحقول المتشابهة (الهوية / المحتوى / السعر / التصنيف / الصور).",
      fr: "Bande bordeaux = colonne OBLIGATOIRE pour les nouveaux produits. Les autres couleurs regroupent les champs liés (Identité / Contenu / Prix / Taxonomie / Média).",
    },
    {
      en: "Row 2 of the Products sheet is a styled example — overwrite or delete it before importing.",
      ar: "الصف الثاني في ورقة المنتجات هو مثال للتوضيح — استبدليه أو احذفيه قبل الاستيراد.",
      fr: "La ligne 2 de l'onglet Products est un exemple stylé — remplacez-la ou supprimez-la avant l'import.",
    },
    { en: "Updating vs. creating", ar: "التعديل والإنشاء", fr: "Mise à jour vs. création", section: true },
    {
      en: "If a row's id matches an existing product, the row updates it. Empty cells leave the field alone.",
      ar: "إذا كان id يطابق منتجاً موجوداً، يتم تحديث المنتج. الخلايا الفارغة تترك الحقل دون تغيير.",
      fr: "Si l'id correspond à un produit existant, la ligne le met à jour. Les cellules vides laissent le champ inchangé.",
    },
    {
      en: "If a row's id is new, the product is created. You must fill id, nameEn, nameAr, price, stock, category, subcategory.",
      ar: "إذا كان id جديداً، يتم إنشاء المنتج. يجب تعبئة: id, nameEn, nameAr, price, stock, category, subcategory.",
      fr: "Si l'id est nouveau, le produit est créé. Renseignez id, nameEn, nameAr, price, stock, category, subcategory.",
    },
    { en: "Reference sheets", ar: "أوراق المرجع", fr: "Onglets de référence", section: true },
    {
      en: "Categories → valid category + subcategory keys. Tags → the four supported tag keys. Sizes → suggested size patterns.",
      ar: "Categories → مفاتيح الفئات والفئات الفرعية الصالحة. Tags → الوسوم المدعومة. Sizes → أنماط مقترحة للمقاسات.",
      fr: "Categories → clés de catégorie + sous-catégorie. Tags → les quatre clés de tags supportées. Sizes → motifs de taille suggérés.",
    },
    { en: "Working in Google Drive", ar: "العمل عبر Google Drive", fr: "Travailler dans Google Drive", section: true },
    {
      en: "Save this file in Drive, open with Google Sheets to edit with your team, then File → Download → Microsoft Excel (.xlsx) and re-upload.",
      ar: "احفظي الملف في Drive، افتحيه عبر Google Sheets للعمل مع فريقكِ، ثم ملف ← تنزيل ← Microsoft Excel (.xlsx) وأعيدي رفعه.",
      fr: "Enregistrez ce fichier dans Drive, ouvrez-le avec Google Sheets pour collaborer, puis Fichier → Télécharger → Microsoft Excel (.xlsx) et téléversez.",
    },
    { en: "Tips", ar: "نصائح", fr: "Conseils", section: true },
    {
      en: "• Use filters on the Products header to narrow your view.\n• Frozen header stays visible while you scroll.\n• Empty cells preserve the existing value on update.",
      ar: "• استخدمي الفلاتر على رأس ورقة المنتجات لتضييق العرض.\n• الرأس المثبّت يبقى ظاهراً عند التمرير.\n• الخلايا الفارغة تحافظ على القيمة السابقة عند التحديث.",
      fr: "• Utilisez les filtres sur l'en-tête Products pour affiner la vue.\n• L'en-tête figé reste visible lors du défilement.\n• Les cellules vides conservent la valeur existante.",
    },
  ];

  let r = 3;
  rows.forEach((line) => {
    if (line.section) {
      ws["!rows"]![r - 1] = { hpt: 28 };
      // section header band
      for (let c = 0; c < 4; c += 1) {
        setCell(ws, `${colLetter(c)}${r}`, "", {
          fill: { fgColor: { rgb: C.burgundyLight } },
        });
      }
      setCell(ws, `B${r}`, line.en, {
        fill: { fgColor: { rgb: C.burgundyLight } },
        font: baseFont({ sz: 12, bold: true, color: { rgb: C.burgundy } }),
        alignment: { vertical: "center", horizontal: "left" },
      });
      setCell(ws, `C${r}`, line.ar, {
        fill: { fgColor: { rgb: C.burgundyLight } },
        font: baseFont({ sz: 12, bold: true, color: { rgb: C.burgundy } }),
        alignment: { vertical: "center", horizontal: "right" },
      });
      setCell(ws, `D${r}`, line.fr, {
        fill: { fgColor: { rgb: C.burgundyLight } },
        font: baseFont({ sz: 12, bold: true, color: { rgb: C.burgundy } }),
        alignment: { vertical: "center", horizontal: "left" },
      });
      r += 1;
      return;
    }
    const lines = line.en.split("\n").length;
    ws["!rows"]![r - 1] = { hpt: Math.max(38, lines * 18) };
    setCell(ws, `B${r}`, line.en, {
      font: baseFont({ sz: 10, color: { rgb: C.ink } }),
      alignment: { vertical: "top", horizontal: "left", wrapText: true },
      border: borderThin(),
    });
    setCell(ws, `C${r}`, line.ar, {
      font: baseFont({ sz: 10, color: { rgb: C.ink } }),
      alignment: { vertical: "top", horizontal: "right", wrapText: true, readingOrder: 2 },
      border: borderThin(),
    });
    setCell(ws, `D${r}`, line.fr, {
      font: baseFont({ sz: 10, color: { rgb: C.ink } }),
      alignment: { vertical: "top", horizontal: "left", wrapText: true },
      border: borderThin(),
    });
    r += 1;
  });

  ws["!ref"] = `A1:D${r + 5}`;
  ws["!freeze"] = { xSplit: 0, ySplit: 2 };
  return ws;
}

// ─────────────────────── Products sheet ───────────────────────
function buildProductsSheet(currentRows: CurrentRow[]): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  ws["!cols"] = COLUMNS.map((c) => ({ wch: c.width }));
  ws["!rows"] = [];

  // Row 1: group bands (label of each section)
  ws["!rows"]![0] = { hpt: 22 };
  let cursor = 0;
  while (cursor < COLUMNS.length) {
    const group = COLUMNS[cursor].group;
    let span = 1;
    while (cursor + span < COLUMNS.length && COLUMNS[cursor + span].group === group) {
      span += 1;
    }
    const startCol = cursor;
    const endCol = cursor + span - 1;
    for (let c = startCol; c <= endCol; c += 1) {
      setCell(ws, `${colLetter(c)}1`, c === startCol ? GROUP_LABEL[group].en : "", {
        fill: { fgColor: { rgb: GROUP_BG[group] } },
        font: baseFont({ sz: 9, bold: true, color: { rgb: C.inkSoft }, name: "Calibri" }),
        alignment: { vertical: "center", horizontal: "left" },
        border: {
          top: { style: "thin", color: { rgb: C.border } },
          bottom: { style: "thin", color: { rgb: C.border } },
          left: c === startCol ? { style: "thin", color: { rgb: C.border } } : undefined,
          right: c === endCol ? { style: "thin", color: { rgb: C.border } } : undefined,
        },
      });
    }
    // merge across the band
    if (!ws["!merges"]) ws["!merges"] = [];
    ws["!merges"].push({
      s: { r: 0, c: startCol },
      e: { r: 0, c: endCol },
    });
    cursor += span;
  }

  // Row 2: column headers
  ws["!rows"]![1] = { hpt: 26 };
  COLUMNS.forEach((col, i) => {
    setCell(ws, `${colLetter(i)}2`, col.label, {
      fill: { fgColor: { rgb: col.required ? C.burgundy : C.navy } },
      font: baseFont({
        sz: 11,
        bold: true,
        color: { rgb: C.white },
        name: "Calibri",
      }),
      alignment: { vertical: "center", horizontal: "left" },
      border: borderHeader,
    });
  });

  // Row 3: hint row (EN)
  ws["!rows"]![2] = { hpt: 22 };
  COLUMNS.forEach((col, i) => {
    setCell(ws, `${colLetter(i)}3`, col.hintEn, {
      fill: { fgColor: { rgb: GROUP_BG[col.group] } },
      font: baseFont({ sz: 9, italic: true, color: { rgb: C.inkSoft } }),
      alignment: { vertical: "center", horizontal: "left", wrapText: true },
      border: borderThin(),
    });
  });

  // Row 4: example row
  ws["!rows"]![3] = { hpt: 24 };
  COLUMNS.forEach((col, i) => {
    const style: Style = {
      fill: { fgColor: { rgb: C.taupeSoft } },
      font: baseFont({ sz: 10, italic: true, color: { rgb: C.taupe } }),
      alignment: { vertical: "center", horizontal: col.numFmt ? "right" : "left", wrapText: true },
      border: borderThin(),
    };
    if (col.numFmt) {
      const n = Number(col.example);
      setCell(ws, `${colLetter(i)}4`, Number.isFinite(n) ? n : col.example, style, { numFmt: col.numFmt });
    } else {
      setCell(ws, `${colLetter(i)}4`, col.example, style);
    }
  });

  // Data rows
  const HEADER_OFFSET = 4; // banner+header+hint+example
  let totalRows = HEADER_OFFSET;
  currentRows.forEach((row, ri) => {
    const r = HEADER_OFFSET + 1 + ri;
    const zebra = ri % 2 === 1;
    ws["!rows"]![r - 1] = { hpt: 22 };
    COLUMNS.forEach((col, ci) => {
      const addr = `${colLetter(ci)}${r}`;
      const raw = row[col.key] as string | number | null;
      const isNumeric = !!col.numFmt;
      // Conditional stock highlighting
      let cellFill: string = zebra ? C.zebra : C.bg;
      let cellInkColor: string = C.ink;
      if (col.key === "stock" && typeof raw === "number") {
        if (raw === 0) {
          cellFill = C.dangerBg;
          cellInkColor = C.danger;
        } else if (raw <= 5) {
          cellFill = C.warnBg;
          cellInkColor = C.warn;
        } else {
          cellFill = C.okBg;
          cellInkColor = C.ok;
        }
      }
      const style: Style = {
        fill: { fgColor: { rgb: cellFill } },
        font: baseFont({
          sz: 10,
          color: { rgb: cellInkColor },
          bold: col.key === "stock" && typeof raw === "number" && raw <= 5,
        }),
        alignment: {
          vertical: "center",
          horizontal: isNumeric ? "right" : col.key === "nameAr" || col.key === "descAr" ? "right" : "left",
          wrapText: col.key === "descEn" || col.key === "descAr" || col.key === "descFr",
          readingOrder: col.key === "nameAr" || col.key === "descAr" ? 2 : undefined,
        },
        border: borderThin(),
      };
      if (isNumeric) {
        const n = typeof raw === "number" ? raw : raw === null || raw === "" ? null : Number(raw);
        setCell(ws, addr, n, style, { numFmt: col.numFmt });
      } else {
        setCell(ws, addr, raw ?? "", style);
      }
    });
    totalRows = r;
  });

  const lastCol = colLetter(COLUMNS.length - 1);
  ws["!ref"] = `A1:${lastCol}${Math.max(totalRows + 5, 100)}`;
  ws["!autofilter"] = { ref: `A2:${lastCol}2` };
  // Freeze top 4 rows (banner + header + hint + example)
  ws["!freeze"] = { xSplit: 0, ySplit: 4 };
  return ws;
}

// ─────────────────────── Categories sheet ───────────────────────
function buildCategoriesSheet(categories: CategoryRef[]): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  const cols = [
    { wch: 18 }, // category key
    { wch: 22 }, // category EN
    { wch: 22 }, // category AR
    { wch: 18 }, // subcategory key
    { wch: 22 }, // subcategory EN
    { wch: 22 }, // subcategory AR
  ];
  ws["!cols"] = cols;
  ws["!rows"] = [];

  // Banner
  ws["!rows"]![0] = { hpt: 32 };
  for (let c = 0; c < cols.length; c += 1) {
    setCell(ws, `${colLetter(c)}1`, "", { fill: { fgColor: { rgb: C.burgundy } } });
  }
  setCell(ws, "A1", "Categories  ·  الفئات  ·  Catégories", {
    fill: { fgColor: { rgb: C.burgundy } },
    font: titleFont({ sz: 15 }),
    alignment: { vertical: "center", horizontal: "left" },
  });

  // Headers row 2
  const headers = [
    { en: "category key", ar: "مفتاح الفئة" },
    { en: "category (EN)", ar: "الفئة (EN)" },
    { en: "category (AR)", ar: "الفئة (AR)" },
    { en: "subcategory key", ar: "مفتاح الفئة الفرعية" },
    { en: "subcategory (EN)", ar: "الفئة الفرعية (EN)" },
    { en: "subcategory (AR)", ar: "الفئة الفرعية (AR)" },
  ];
  ws["!rows"]![1] = { hpt: 24 };
  headers.forEach((h, i) => {
    setCell(ws, `${colLetter(i)}2`, h.en, {
      fill: { fgColor: { rgb: C.navySoft } },
      font: baseFont({ sz: 10, bold: true, color: { rgb: C.navy } }),
      alignment: { vertical: "center", horizontal: "left" },
      border: borderHeader,
    });
  });

  let r = 3;
  categories.forEach((c, ci) => {
    const zebra = ci % 2 === 1;
    const bg = zebra ? C.zebra : C.bg;
    if (c.subcategories.length === 0) {
      [c.key, c.en, c.ar ?? "", "", "", ""].forEach((v, i) => {
        setCell(ws, `${colLetter(i)}${r}`, v, {
          fill: { fgColor: { rgb: bg } },
          font: baseFont({ sz: 10 }),
          alignment: { vertical: "center", horizontal: i === 2 || i === 5 ? "right" : "left", readingOrder: i === 2 ? 2 : undefined },
          border: borderThin(),
        });
      });
      r += 1;
      return;
    }
    c.subcategories.forEach((s, si) => {
      const showCat = si === 0;
      [
        showCat ? c.key : "",
        showCat ? c.en : "",
        showCat ? c.ar ?? "" : "",
        s.key,
        s.en,
        s.ar ?? "",
      ].forEach((v, i) => {
        setCell(ws, `${colLetter(i)}${r}`, v, {
          fill: { fgColor: { rgb: bg } },
          font: baseFont({
            sz: 10,
            bold: (i === 0 || i === 1) && showCat,
            color: { rgb: C.ink },
          }),
          alignment: {
            vertical: "center",
            horizontal: i === 2 || i === 5 ? "right" : "left",
            readingOrder: i === 2 || i === 5 ? 2 : undefined,
          },
          border: borderThin(),
        });
      });
      r += 1;
    });
  });

  ws["!ref"] = `A1:F${r - 1}`;
  ws["!autofilter"] = { ref: `A2:F2` };
  ws["!freeze"] = { xSplit: 0, ySplit: 2 };
  return ws;
}

// ─────────────────────── Tags sheet ───────────────────────
function buildTagsSheet(): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  ws["!cols"] = [{ wch: 14 }, { wch: 50 }, { wch: 50 }, { wch: 50 }];
  ws["!rows"] = [];

  ws["!rows"]![0] = { hpt: 32 };
  for (let c = 0; c < 4; c += 1) {
    setCell(ws, `${colLetter(c)}1`, "", { fill: { fgColor: { rgb: C.burgundy } } });
  }
  setCell(ws, "A1", "Tags  ·  الوسوم  ·  Étiquettes", {
    fill: { fgColor: { rgb: C.burgundy } },
    font: titleFont({ sz: 15 }),
    alignment: { vertical: "center", horizontal: "left" },
  });

  const headers = ["tag", "English", "العربية", "Français"];
  ws["!rows"]![1] = { hpt: 24 };
  headers.forEach((h, i) =>
    setCell(ws, `${colLetter(i)}2`, h, {
      fill: { fgColor: { rgb: C.navySoft } },
      font: baseFont({ sz: 10, bold: true, color: { rgb: C.navy } }),
      alignment: { vertical: "center", horizontal: i === 2 ? "right" : "left" },
      border: borderHeader,
    }),
  );

  const tagRows: Array<{ k: string; en: string; ar: string; fr: string }> = [
    { k: "new", en: "Shown with the 'New' badge on the storefront.", ar: "يظهر بوسم 'جديد' في المتجر.", fr: "Affiché avec le badge « Nouveau » sur la boutique." },
    { k: "sale", en: "Shown with the 'Sale' badge. Combine with compareAt for the strike-through price.", ar: "يظهر بوسم 'تخفيض'. استخدميه مع compareAt لإظهار السعر الأصلي.", fr: "Affiché avec le badge « Solde ». Combinez avec compareAt pour le prix barré." },
    { k: "bestseller", en: "Shown with the 'Bestseller' badge and surfaced on the dashboard.", ar: "يظهر بوسم 'الأكثر مبيعاً' ويُعرض في لوحة التحكم.", fr: "Affiché avec le badge « Best-seller » et mis en avant sur le tableau de bord." },
    { k: "limited", en: "Shown with the 'Limited' badge.", ar: "يظهر بوسم 'محدود'.", fr: "Affiché avec le badge « Édition limitée »." },
  ];
  tagRows.forEach((t, i) => {
    const r = i + 3;
    const zebra = i % 2 === 1;
    const bg = zebra ? C.zebra : C.bg;
    ws["!rows"]![r - 1] = { hpt: 32 };
    setCell(ws, `A${r}`, t.k, {
      fill: { fgColor: { rgb: bg } },
      font: baseFont({ sz: 10, bold: true, color: { rgb: C.burgundy } }),
      alignment: { vertical: "center", horizontal: "left" },
      border: borderThin(),
    });
    setCell(ws, `B${r}`, t.en, {
      fill: { fgColor: { rgb: bg } },
      font: baseFont({ sz: 10 }),
      alignment: { vertical: "center", horizontal: "left", wrapText: true },
      border: borderThin(),
    });
    setCell(ws, `C${r}`, t.ar, {
      fill: { fgColor: { rgb: bg } },
      font: baseFont({ sz: 10 }),
      alignment: { vertical: "center", horizontal: "right", wrapText: true, readingOrder: 2 },
      border: borderThin(),
    });
    setCell(ws, `D${r}`, t.fr, {
      fill: { fgColor: { rgb: bg } },
      font: baseFont({ sz: 10 }),
      alignment: { vertical: "center", horizontal: "left", wrapText: true },
      border: borderThin(),
    });
  });

  ws["!ref"] = `A1:D${tagRows.length + 2}`;
  ws["!freeze"] = { xSplit: 0, ySplit: 2 };
  return ws;
}

// ─────────────────────── Sizes sheet ───────────────────────
function buildSizesSheet(): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  ws["!cols"] = [{ wch: 22 }, { wch: 46 }, { wch: 46 }, { wch: 46 }];
  ws["!rows"] = [];

  ws["!rows"]![0] = { hpt: 32 };
  for (let c = 0; c < 4; c += 1) {
    setCell(ws, `${colLetter(c)}1`, "", { fill: { fgColor: { rgb: C.burgundy } } });
  }
  setCell(ws, "A1", "Sizes  ·  المقاسات  ·  Tailles", {
    fill: { fgColor: { rgb: C.burgundy } },
    font: titleFont({ sz: 15 }),
    alignment: { vertical: "center", horizontal: "left" },
  });

  const headers = ["pattern", "English", "العربية", "Français"];
  ws["!rows"]![1] = { hpt: 24 };
  headers.forEach((h, i) =>
    setCell(ws, `${colLetter(i)}2`, h, {
      fill: { fgColor: { rgb: C.navySoft } },
      font: baseFont({ sz: 10, bold: true, color: { rgb: C.navy } }),
      alignment: { vertical: "center", horizontal: i === 2 ? "right" : "left" },
      border: borderHeader,
    }),
  );

  const sizeRows: Array<{ k: string; en: string; ar: string; fr: string }> = [
    { k: "S, M, L", en: "Standard apparel.", ar: "الملابس القياسية.", fr: "Vêtements standards." },
    { k: "XS, S, M, L, XL", en: "Wide-range apparel.", ar: "ملابس بمقاسات موسّعة.", fr: "Vêtements toutes tailles." },
    { k: "36, 38, 40, 42, 44", en: "EU shoe sizing.", ar: "مقاسات الأحذية الأوروبية.", fr: "Pointures EU." },
    { k: "50ml, 100ml", en: "Perfumes / fragrances.", ar: "العطور والروائح.", fr: "Parfums et fragrances." },
    { k: "One size", en: "Accessories / one-size items.", ar: "الإكسسوارات والمنتجات بمقاس واحد.", fr: "Accessoires / taille unique." },
  ];
  sizeRows.forEach((s, i) => {
    const r = i + 3;
    const zebra = i % 2 === 1;
    const bg = zebra ? C.zebra : C.bg;
    ws["!rows"]![r - 1] = { hpt: 24 };
    setCell(ws, `A${r}`, s.k, {
      fill: { fgColor: { rgb: bg } },
      font: baseFont({ sz: 10, bold: true, color: { rgb: C.navy } }),
      alignment: { vertical: "center", horizontal: "left" },
      border: borderThin(),
    });
    setCell(ws, `B${r}`, s.en, {
      fill: { fgColor: { rgb: bg } },
      font: baseFont({ sz: 10 }),
      alignment: { vertical: "center", horizontal: "left" },
      border: borderThin(),
    });
    setCell(ws, `C${r}`, s.ar, {
      fill: { fgColor: { rgb: bg } },
      font: baseFont({ sz: 10 }),
      alignment: { vertical: "center", horizontal: "right", readingOrder: 2 },
      border: borderThin(),
    });
    setCell(ws, `D${r}`, s.fr, {
      fill: { fgColor: { rgb: bg } },
      font: baseFont({ sz: 10 }),
      alignment: { vertical: "center", horizontal: "left" },
      border: borderThin(),
    });
  });

  ws["!ref"] = `A1:D${sizeRows.length + 2}`;
  ws["!freeze"] = { xSplit: 0, ySplit: 2 };
  return ws;
}

// ─────────────────────── Columns reference sheet ───────────────────────
function buildColumnsRefSheet(): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  ws["!cols"] = [
    { wch: 16 },
    { wch: 12 },
    { wch: 14 },
    { wch: 56 },
    { wch: 56 },
    { wch: 56 },
    { wch: 34 },
  ];
  ws["!rows"] = [];

  ws["!rows"]![0] = { hpt: 32 };
  for (let c = 0; c < 7; c += 1) {
    setCell(ws, `${colLetter(c)}1`, "", { fill: { fgColor: { rgb: C.burgundy } } });
  }
  setCell(ws, "A1", "Columns reference  ·  مرجع الأعمدة  ·  Référence colonnes", {
    fill: { fgColor: { rgb: C.burgundy } },
    font: titleFont({ sz: 15 }),
    alignment: { vertical: "center", horizontal: "left" },
  });

  const headers = ["column", "required", "group", "English", "العربية", "Français", "example"];
  ws["!rows"]![1] = { hpt: 24 };
  headers.forEach((h, i) =>
    setCell(ws, `${colLetter(i)}2`, h, {
      fill: { fgColor: { rgb: C.navySoft } },
      font: baseFont({ sz: 10, bold: true, color: { rgb: C.navy } }),
      alignment: { vertical: "center", horizontal: i === 4 ? "right" : "left" },
      border: borderHeader,
    }),
  );

  COLUMNS.forEach((col, i) => {
    const r = i + 3;
    const zebra = i % 2 === 1;
    const bg = zebra ? C.zebra : C.bg;
    ws["!rows"]![r - 1] = { hpt: 28 };
    setCell(ws, `A${r}`, col.label, {
      fill: { fgColor: { rgb: bg } },
      font: baseFont({ sz: 10, bold: true, name: "Cascadia Mono", color: { rgb: C.ink } }),
      alignment: { vertical: "center", horizontal: "left" },
      border: borderThin(),
    });
    setCell(ws, `B${r}`, col.required ? "yes" : "no", {
      fill: { fgColor: { rgb: col.required ? C.burgundyLight : bg } },
      font: baseFont({ sz: 10, bold: !!col.required, color: { rgb: col.required ? C.burgundy : C.mute } }),
      alignment: { vertical: "center", horizontal: "left" },
      border: borderThin(),
    });
    setCell(ws, `C${r}`, GROUP_LABEL[col.group].en, {
      fill: { fgColor: { rgb: GROUP_BG[col.group] } },
      font: baseFont({ sz: 9, color: { rgb: C.inkSoft } }),
      alignment: { vertical: "center", horizontal: "left" },
      border: borderThin(),
    });
    setCell(ws, `D${r}`, col.hintEn, {
      fill: { fgColor: { rgb: bg } },
      font: baseFont({ sz: 10 }),
      alignment: { vertical: "center", horizontal: "left", wrapText: true },
      border: borderThin(),
    });
    setCell(ws, `E${r}`, col.hintAr, {
      fill: { fgColor: { rgb: bg } },
      font: baseFont({ sz: 10 }),
      alignment: { vertical: "center", horizontal: "right", wrapText: true, readingOrder: 2 },
      border: borderThin(),
    });
    setCell(ws, `F${r}`, col.hintFr, {
      fill: { fgColor: { rgb: bg } },
      font: baseFont({ sz: 10 }),
      alignment: { vertical: "center", horizontal: "left", wrapText: true },
      border: borderThin(),
    });
    setCell(ws, `G${r}`, col.example, {
      fill: { fgColor: { rgb: bg } },
      font: baseFont({ sz: 10, italic: true, color: { rgb: C.mute }, name: "Cascadia Mono" }),
      alignment: { vertical: "center", horizontal: "left", wrapText: true },
      border: borderThin(),
    });
  });

  ws["!ref"] = `A1:G${COLUMNS.length + 2}`;
  ws["!autofilter"] = { ref: `A2:G2` };
  ws["!freeze"] = { xSplit: 0, ySplit: 2 };
  return ws;
}

// ─────────────────────── Build workbook ───────────────────────
export function buildProTemplate(currentRows: CurrentRow[], categories: CategoryRef[]): ArrayBuffer {
  const wb = XLSX.utils.book_new();

  const cover = buildCoverSheet({ productCount: currentRows.length });
  XLSX.utils.book_append_sheet(wb, cover, "Cover");

  const instr = buildInstructionsSheet();
  XLSX.utils.book_append_sheet(wb, instr, "Instructions");

  const products = buildProductsSheet(currentRows);
  XLSX.utils.book_append_sheet(wb, products, "Products");

  const cats = buildCategoriesSheet(categories);
  XLSX.utils.book_append_sheet(wb, cats, "Categories");

  const tags = buildTagsSheet();
  XLSX.utils.book_append_sheet(wb, tags, "Tags");

  const sizes = buildSizesSheet();
  XLSX.utils.book_append_sheet(wb, sizes, "Sizes");

  const ref = buildColumnsRefSheet();
  XLSX.utils.book_append_sheet(wb, ref, "Columns reference");

  // Sheet tab colours (Workbook XML extension supported by xlsx-js-style)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sheets = (wb as any).Sheets as Record<string, XLSX.WorkSheet>;
  const tabColors: Record<string, string> = {
    Cover: C.burgundy.slice(2),
    Instructions: C.taupe.slice(2),
    Products: C.burgundy.slice(2),
    Categories: C.navy.slice(2),
    Tags: C.navy.slice(2),
    Sizes: C.navy.slice(2),
    "Columns reference": C.taupe.slice(2),
  };
  for (const [name, hex] of Object.entries(tabColors)) {
    const s = sheets[name];
    if (s) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (s as any)["!tabColor"] = { rgb: hex };
    }
  }

  // Default to Cover
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
