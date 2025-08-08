import Papa from "papaparse";
import * as XLSX from "xlsx";
import { DataTable, ParsedResult, Row } from "@/types/data";

function toNumberIfPossible(v: any) {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return v;
  const s = String(v).trim();
  if (s === "") return null;
  const n = Number(s.replace(/,/g, ""));
  return Number.isNaN(n) ? s : n;
}

export async function parseCSV(file: File): Promise<ParsedResult> {
  const text = await file.text();
  const { data } = Papa.parse<string[]>(text, { skipEmptyLines: true });
  const [header, ...rows] = data as string[][];
  const table: DataTable = {
    headers: header.map((h) => String(h ?? "col")),
    rows: rows.map((r) => {
      const row: Row = {};
      header.forEach((h, i) => (row[String(h ?? `col_${i}`)] = toNumberIfPossible(r[i])));
      return row;
    }),
  };
  return { table, sourceName: file.name };
}

export async function parseXLSX(file: File): Promise<ParsedResult> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: null });
  const headers = Object.keys(json[0] ?? {});
  const rows: Row[] = json.map((r) => {
    const row: Row = {};
    headers.forEach((h) => (row[h] = toNumberIfPossible(r[h])));
    return row;
  });
  return { table: { headers, rows }, sourceName: file.name };
}

export async function parseGoogleSheet(url: string): Promise<ParsedResult> {
  // Try to coerce common Google Sheets URLs to CSV export
  let exportUrl = url.trim();
  const gidMatch = exportUrl.match(/gid=(\d+)/);
  const gid = gidMatch ? gidMatch[1] : "0";
  if (exportUrl.includes("/edit")) {
    exportUrl = exportUrl.replace(/\/edit.*$/, `/export?format=csv&gid=${gid}`);
  } else if (!exportUrl.includes("export?format=csv")) {
    // fallback, hope it works as-is
    exportUrl = `${exportUrl}${exportUrl.includes("?") ? "&" : "?"}format=csv`;
  }
  const res = await fetch(exportUrl);
  if (!res.ok) throw new Error("Failed to fetch Google Sheet. Make sure it's public.");
  const text = await res.text();
  const { data } = Papa.parse<string[]>(text, { skipEmptyLines: true });
  const [header, ...rows] = data as string[][];
  const table: DataTable = {
    headers: (header ?? []).map((h) => String(h ?? "col")),
    rows: rows.map((r) => {
      const row: Row = {};
      (header ?? []).forEach((h, i) => (row[String(h ?? `col_${i}`)] = toNumberIfPossible(r[i])));
      return row;
    }),
  };
  return { table, sourceName: "Google Sheet" };
}

export function suggestChartType(headers: string[], rows: Row[]):
  | "bar"
  | "line"
  | "pie"
  | "column"
  | "scatter"
  | "table" {
  const numericColumns = headers.filter((h) => rows.some((r) => typeof r[h] === "number"));
  const categoricalColumns = headers.filter((h) => rows.some((r) => typeof r[h] === "string"));
  if (numericColumns.length >= 2) return "scatter";
  if (numericColumns.length === 1 && categoricalColumns.length >= 1) return "column";
  if (headers.length <= 2 && rows.length <= 8) return "pie";
  if (rows.length > 50) return "line";
  return "table";
}
