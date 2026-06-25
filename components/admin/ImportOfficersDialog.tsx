"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { CheckCircle2, XCircle, FileSpreadsheet } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ImportOfficersDialog({ open, onOpenChange, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const reset = () => {
    setFile(null);
    setResult(null);
  };

  const handleUpload = async () => {
    if (!file) return toast.error("Please choose a file");
    setUploading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/officers/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setResult(data);
      toast.success(data.message);
      if (data.createdCount > 0) onSuccess();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-gray-950 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle>Import Officers from Excel</DialogTitle>
          <DialogDescription className="text-gray-400">
            Upload a .xlsx or .xls file. Expected columns: Service Number, Full
            Name, Rank, Unit, Department, Contact (Email optional). Default login
            password is the officer&apos;s service number.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-700 rounded-xl p-6 cursor-pointer hover:border-blue-500/50 transition-colors">
            <FileSpreadsheet className="h-8 w-8 text-blue-400" />
            <span className="text-sm text-gray-300">
              {file ? file.name : "Click to choose an Excel file"}
            </span>
            <Input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>

          <Button
            onClick={handleUpload}
            disabled={uploading || !file}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {uploading ? <Spinner className="mr-2 h-4 w-4" /> : null}
            {uploading ? "Importing..." : "Upload & Import"}
          </Button>

          {result && (
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-400">
                    {result.createdCount}
                  </p>
                  <p className="text-xs text-gray-400">Imported</p>
                </div>
                <div className="flex-1 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-center">
                  <p className="text-2xl font-bold text-red-400">
                    {result.failedCount}
                  </p>
                  <p className="text-xs text-gray-400">Failed</p>
                </div>
              </div>

              {result.failed?.length > 0 && (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  <p className="text-xs font-semibold text-gray-400 uppercase">
                    Failed Imports
                  </p>
                  {result.failed.map((f: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-xs text-gray-300 bg-gray-900/50 rounded p-2"
                    >
                      <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                      <span>
                        Row {f.row}
                        {f.serviceNumber ? ` (${f.serviceNumber})` : ""}:{" "}
                        {f.reason}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {result.createdCount > 0 && (
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Successful records have been saved.
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
