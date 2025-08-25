/// <reference lib="webworker" />

interface ExportPayload {
  title?: string;
  headers?: string[];
  rows: Record<string, unknown>[];
  sheetName?: string;
}

interface ExportMessage {
  type: 'pdf' | 'xlsx';
  payload: ExportPayload;
}

interface ExportResponse {
  ok: boolean;
  type?: 'pdf' | 'xlsx';
  blob?: Blob;
  error?: string;
}

declare const self: DedicatedWorkerGlobalScope;

// Web Worker pour l'export PDF et XLSX
self.onmessage = async (e: MessageEvent<ExportMessage>) => {
  const { type, payload } = e.data || {};
  try {
    if (type === 'pdf') {
      // @ts-expect-error jsPDF types are not complete
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.default || jsPDFModule;
      const doc = new jsPDF();
      doc.text(payload.title || 'Export', 14, 16);
      if (Array.isArray(payload.rows)) {
        // @ts-expect-error autoTable is added by the jspdf-autotable plugin
        doc.autoTable({
          head: [payload.headers || []],
          body: payload.rows,
        });
      }
      const blob = doc.output('blob');
      self.postMessage({ ok: true, type: 'pdf', blob } satisfies ExportResponse);
    } else if (type === 'xlsx') {
      // @ts-expect-error XLSX types need to be imported dynamically
      const XLSX = await import('xlsx');
      const worksheet = XLSX.utils.json_to_sheet(payload.rows || []);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, payload.sheetName || 'Feuille');
      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      self.postMessage({ ok: true, type: 'xlsx', blob } satisfies ExportResponse);
    } else {
      self.postMessage({ ok: false, error: 'Type non supporté' } satisfies ExportResponse);
    }
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Erreur worker';
    self.postMessage({ ok: false, error } satisfies ExportResponse);
  }
};
