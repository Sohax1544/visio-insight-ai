export type Row = Record<string, string | number | null>;

export interface DataTable {
  headers: string[];
  rows: Row[];
}

export type ChartKind =
  | "column"
  | "bar"
  | "line"
  | "combo"
  | "pie"
  | "heatmap"
  | "table"
  | "funnel"
  | "scatter";

export interface ParsedResult {
  table: DataTable;
  sourceName?: string;
}
