import "server-only";
import { google } from "googleapis";

export type SheetsConfig = {
  sheetId: string;
  credentials: { client_email: string; private_key: string };
  tabName: string;
};

function decodeKey(raw: string): {
  client_email: string;
  private_key: string;
} | null {
  let json = raw.trim();
  // Allow base64-encoded JSON for easier env var handling
  if (!json.startsWith("{")) {
    try {
      json = Buffer.from(json, "base64").toString("utf-8");
    } catch {
      return null;
    }
  }
  try {
    const parsed = JSON.parse(json) as Record<string, unknown>;
    const email = parsed.client_email;
    const key = parsed.private_key;
    if (typeof email !== "string" || typeof key !== "string") return null;
    return {
      client_email: email,
      // Some env stores escape newlines as \n
      private_key: key.replace(/\\n/g, "\n"),
    };
  } catch {
    return null;
  }
}

export function getSheetsConfig(): SheetsConfig | null {
  const sheetId = process.env.GOOGLE_SHEETS_ID?.trim();
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.trim();
  const tabName = (process.env.GOOGLE_SHEETS_TAB ?? "Products").trim();
  if (!sheetId || !rawKey) return null;
  const credentials = decodeKey(rawKey);
  if (!credentials) return null;
  return { sheetId, credentials, tabName };
}

export function isSheetsConfigured(): boolean {
  return getSheetsConfig() !== null;
}

async function getClient() {
  const cfg = getSheetsConfig();
  if (!cfg) throw new Error("sheets_not_configured");
  const auth = new google.auth.JWT({
    email: cfg.credentials.client_email,
    key: cfg.credentials.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  await auth.authorize();
  return google.sheets({ version: "v4", auth });
}

type SheetCellValue = string | number | boolean | null;

/**
 * Read all rows from the configured tab and return parsed product rows.
 * Header row is auto-detected by scanning the first 6 rows for the literal "id".
 */
export async function readSheetRows(): Promise<{
  serviceAccount: string;
  sheetId: string;
  tabName: string;
  headers: string[];
  rows: Record<string, SheetCellValue>[];
}> {
  const cfg = getSheetsConfig();
  if (!cfg) throw new Error("sheets_not_configured");
  const sheets = await getClient();
  const range = `${cfg.tabName}!A1:P1000`;
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: cfg.sheetId,
    range,
    valueRenderOption: "UNFORMATTED_VALUE",
  });
  const values = (res.data.values ?? []) as SheetCellValue[][];
  // Find header row (search first 6 rows for one containing "id" exactly in col A)
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(values.length, 6); i += 1) {
    const first = String(values[i]?.[0] ?? "").trim().toLowerCase();
    if (first === "id") {
      headerRowIndex = i;
      break;
    }
  }
  if (headerRowIndex === -1) {
    return {
      serviceAccount: cfg.credentials.client_email,
      sheetId: cfg.sheetId,
      tabName: cfg.tabName,
      headers: [],
      rows: [],
    };
  }
  const headers = values[headerRowIndex].map((h) => String(h ?? "").trim());
  const rows: Record<string, SheetCellValue>[] = [];
  for (let i = headerRowIndex + 1; i < values.length; i += 1) {
    const row = values[i];
    if (!row || row.length === 0) continue;
    const obj: Record<string, SheetCellValue> = {};
    headers.forEach((h, c) => {
      if (!h) return;
      const v = row[c];
      obj[h] = v === undefined ? null : v;
    });
    // Skip rows where id is empty/missing
    const id = String(obj.id ?? "").trim();
    if (!id) continue;
    rows.push(obj);
  }
  return {
    serviceAccount: cfg.credentials.client_email,
    sheetId: cfg.sheetId,
    tabName: cfg.tabName,
    headers,
    rows,
  };
}

export function sheetUrl(sheetId: string, tabName?: string): string {
  const base = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
  // No reliable way to deep-link to a tab by name without gid; this is good enough.
  return tabName ? `${base}?usp=sharing` : base;
}
