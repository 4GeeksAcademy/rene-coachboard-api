import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * ExportPDF: Button to export a DOM node as a PDF file.
 * Props:
 *   - targetRef: React ref to the DOM node to export
 *   - fileName: name for the PDF file
 */
export default function ExportPDF({ targetRef, fileName = 'box_score.pdf' }) {
  const handleExport = async () => {
    if (!targetRef.current) return;
    const canvas = await html2canvas(targetRef.current);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
    pdf.addImage(imgData, 'PNG', 20, 20, imgWidth * ratio - 40, imgHeight * ratio - 40);
    pdf.save(fileName);
  };
  return (
    <button className="mt-2 bg-red-700 text-white px-3 py-1 rounded hover:bg-red-800 ml-2" onClick={handleExport}>
      Export PDF
    </button>
  );
}
