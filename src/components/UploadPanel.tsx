import React, { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { parseCSV, parseXLSX, parseGoogleSheet } from "@/utils/parseData";
import type { ParsedResult } from "@/types/data";
import { FileDown, FileSpreadsheet, Link as LinkIcon, Upload, Send } from "lucide-react";

interface UploadPanelProps {}

export const UploadPanel: React.FC<UploadPanelProps> = () => {
  const navigate = useNavigate();
  const csvRef = useRef<HTMLInputElement>(null);
  const xlsxRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const handleParsed = useCallback((parsed: ParsedResult) => {
    navigate("/builder", { state: parsed });
  }, [navigate]);

  const onFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    try {
      if (file.name.toLowerCase().endsWith(".csv")) {
        handleParsed(await parseCSV(file));
      } else if (file.name.toLowerCase().endsWith(".xlsx") || file.name.toLowerCase().endsWith(".xls")) {
        handleParsed(await parseXLSX(file));
      } else if (file.name.toLowerCase().endsWith(".sql")) {
        alert("SQL parsing will be added soon. Please upload CSV/XLSX or a Google Sheet for now.");
      } else {
        alert("Unsupported file type. Upload CSV, XLSX, or paste a public Google Sheet URL.");
      }
    } catch (e: any) {
      alert(e?.message || "Failed to parse file");
    }
  }, [handleParsed]);

  const onUrlSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!url) return;
    try {
      const res = await parseGoogleSheet(url);
      handleParsed(res);
    } catch (e: any) {
      alert(e?.message || "Failed to fetch sheet");
    }
  }, [url, handleParsed]);

  return (
    <div
      className={`mx-auto max-w-2xl rounded-2xl border border-border bg-secondary/10 p-4 sm:p-6 backdrop-blur ${isDragging ? "ring-2 ring-sidebar-ring" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); onFiles(e.dataTransfer.files); }}
    >
      <div className="flex flex-wrap items-center gap-3 p-2">
        <Button variant="secondary" className="rounded-full" onClick={() => alert("Connect Google Sheets coming soon")}> <FileSpreadsheet className="mr-2 h-4 w-4"/> Connect Google Sheet</Button>
        <Button variant="secondary" className="rounded-full" onClick={() => xlsxRef.current?.click()}> <FileSpreadsheet className="mr-2 h-4 w-4"/> Upload Excel</Button>
        <Button variant="secondary" className="rounded-full" onClick={() => csvRef.current?.click()}> <Upload className="mr-2 h-4 w-4"/> Upload CSV</Button>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="secondary" className="rounded-full"> <LinkIcon className="mr-2 h-4 w-4"/> Paste data</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Paste a public Google Sheet URL</DialogTitle>
            </DialogHeader>
            <form className="flex gap-2" onSubmit={onUrlSubmit}>
              <Input placeholder="https://docs.google.com/spreadsheets/..." value={url} onChange={(e) => setUrl(e.target.value)} />
              <Button type="submit"><Send className="h-4 w-4"/></Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="mt-2 rounded-xl border border-border bg-background/60 p-2 sm:p-3">
        <form className="flex items-center gap-2" onSubmit={onUrlSubmit}>
          <Input placeholder="Paste a public sheet URL or drop a CSV/XLSX here" value={url} onChange={(e) => setUrl(e.target.value)} className="flex-1" />
          <Button type="submit" size="icon" className="rounded-full"><Send className="h-5 w-5"/></Button>
        </form>
      </div>

      <input ref={csvRef} type="file" accept=".csv" className="hidden" onChange={(e) => onFiles(e.target.files)} />
      <input ref={xlsxRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => onFiles(e.target.files)} />
    </div>
  );
};
