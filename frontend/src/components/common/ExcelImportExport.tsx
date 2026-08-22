import React, { useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Download } from 'lucide-react';
import { Button } from '../ui/Button';

interface ExcelImportExportProps {
  onImport: (data: any[]) => void;
  exportData: any[];
  filename?: string;
  className?: string;
}

export function ExcelImportExport({ 
  onImport, 
  exportData, 
  filename = 'export',
  className = ''
}: ExcelImportExportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    if (!exportData || exportData.length === 0) {
      alert("No data to export");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      if (!bstr) return;

      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      onImport(data);
      
      // Reset input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <input
        type="file"
        accept=".xlsx, .xls"
        className="hidden"
        ref={fileInputRef}
        onChange={handleImport}
      />
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
      >
        <Upload size={16} />
        Import
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleExport}
        className="flex items-center gap-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
      >
        <Download size={16} />
        Export
      </Button>
    </div>
  );
}
