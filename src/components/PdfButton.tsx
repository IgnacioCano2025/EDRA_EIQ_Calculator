import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useEiqStore } from '@/state/store'
import { categorize } from '@/domain/eiq/categorize'

export default function PdfButton() {
  const { input, result } = useEiqStore()
  const exportPdf = async () => {
    if (!result) return
    const doc = new jsPDF()

    // Header
    doc.setFontSize(18)
    doc.text('Calculadora EIQ – EDRA', 14, 18)
    doc.setFontSize(10)
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 24)
    doc.text(`Productor: ${input.producerName}  |  Lote: ${input.fieldName}`, 14, 30)
    doc.text(`Campaña: ${input.campaign}`, 14, 36)

    const cat = categorize(result.totalEiqPerHa)
    doc.setFontSize(12)
    doc.text(`Categoría: ${cat}`, 14, 44)

    // Totales
    autoTable(doc, {
      startY: 50,
      head: [['Indicador', 'Valor']],
      body: [
        ['Total EIQ/ha', String(result.totalEiqPerHa)],
      ]
    })

    // Detalle
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Producto', 'Dosis', 'Usos', 'EIQ/ha']],
      body: result.byProduct.map(p => {
        const src = input.products.find(x => x.id === p.productId);
        const dose = src?.dose ?? 0;
        const times = src?.timesUsed ?? 1;
        const unit = src?.unit ?? '';
        return [
          p.name,
          unit ? `${dose} ${unit}` : String(dose),
          String(times),
          String(p.eiqPerHa),
          p.byIngredient.map(b => `${b.name}: ${b.eiq}`).join('\n')
        ];
      }),
      styles: { cellWidth: 'wrap' },
      columnStyles: { 3: { cellWidth: 90 } }
    })

    // Footer
    const h = doc.internal.pageSize.getHeight()
    doc.setFontSize(8)
    doc.text('EDRA – Informe generado automáticamente', 14, h - 10)

    doc.save(`EIQ_EDRA_${Date.now()}.pdf`)
  }
  return <button className="btn" onClick={exportPdf}>Exportar PDF</button>
}
