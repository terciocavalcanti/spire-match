import PDFDocument from "pdfkit";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export interface ReportPdfInput {
  days: number;
  vgv: number;
  wonCount: number;
  commissionsPrevisto: number;
  commissionsRecebido: number;
  vgvBreakdown: { label: string; vgv: number; wonCount: number }[];
  attributionByFirstTouch: { channel: string; wonCount: number; vgv: number }[];
}

/**
 * Relatório PDF simples (uma página, sem fontes externas) — pdfkit puro,
 * sem dependência nativa, para caber no build Docker da API sem headless
 * browser. Seção "Financeiro/Relatórios" (D3), exportação mandatada pela
 * seção 11.10 do prompt mestre.
 */
export function buildReportPdf(input: ReportPdfInput): PDFKit.PDFDocument {
  const doc = new PDFDocument({ size: "A4", margin: 50 });

  doc.fontSize(18).text("VALORI MATCH — Relatório comercial", { align: "left" });
  doc.fontSize(10).fillColor("#666").text(`Período: últimos ${input.days} dias — gerado em ${new Date().toLocaleString("pt-BR")}`);
  doc.moveDown(1.5);

  doc.fillColor("#000").fontSize(13).text("Visão geral");
  doc.moveDown(0.3);
  doc.fontSize(11);
  doc.text(`VGV reconhecido: ${currencyFormatter.format(input.vgv)} (${input.wonCount} negócio${input.wonCount === 1 ? "" : "s"} ganho${input.wonCount === 1 ? "" : "s"})`);
  doc.text(`Comissão prevista: ${currencyFormatter.format(input.commissionsPrevisto)}`);
  doc.text(`Comissão recebida: ${currencyFormatter.format(input.commissionsRecebido)}`);
  doc.moveDown(1);

  doc.fontSize(13).text("VGV por corretor");
  doc.moveDown(0.3);
  doc.fontSize(10);
  if (input.vgvBreakdown.length === 0) {
    doc.text("Sem negócios ganhos no período.");
  } else {
    for (const row of input.vgvBreakdown) {
      doc.text(`${row.label} — ${currencyFormatter.format(row.vgv)} (${row.wonCount})`);
    }
  }
  doc.moveDown(1);

  doc.fontSize(13).text("Atribuição por primeiro toque (first-touch)");
  doc.moveDown(0.3);
  doc.fontSize(10);
  if (input.attributionByFirstTouch.length === 0) {
    doc.text("Sem dados de atribuição no período.");
  } else {
    for (const row of input.attributionByFirstTouch) {
      doc.text(`${row.channel} — ${currencyFormatter.format(row.vgv)} (${row.wonCount})`);
    }
  }

  doc.moveDown(2);
  doc
    .fontSize(8)
    .fillColor("#999")
    .text(
      "Metodologia: VGV é reconhecido quando o lead vira GANHO (não na criação). Comissão prevista/recebida nunca é somada ao VGV. Atribuição usa só sinais reais já coletados pelo funil (contato, visita, proposta) — nenhum dado de campanha/UTM é inventado.",
      { width: 495 },
    );

  return doc;
}
