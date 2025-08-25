// Web Worker pour offloader jsPDF et xlsx
// Messages attendus: { type: 'pdf'|'xlsx', payload: any }

self.onmessage = async (e: MessageEvent) => {
  const { type, payload } = e.data || {};
  try {
    if (type === 'pdf') {
      const jsPDFModule: any = await import('jspdf');
      const jsPDF = jsPDFModule.default || jsPDFModule;
      const doc = new jsPDF();
      doc.text(payload.title || 'Export', 14, 16);
      if (Array.isArray(payload.rows)) {
        (doc as any).autoTable({
          head: [payload.headers || []],
          body: payload.rows,
        });
      }
      const blob = doc.output('blob');
      (self as any).postMessage({ ok: true, type: 'pdf', blob });
    } else if (type === 'xlsx') {
      const XLSX: any = await import('xlsx');
      const worksheet = XLSX.utils.json_to_sheet(payload.rows || []);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, payload.sheetName || 'Feuille');
      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      (self as any).postMessage({ ok: true, type: 'xlsx', blob });
    } else {
      (self as any).postMessage({ ok: false, error: 'Type non supporté' });
    }
  } catch (err: any) {
    (self as any).postMessage({ ok: false, error: err?.message || 'Erreur worker' });
  }
};
