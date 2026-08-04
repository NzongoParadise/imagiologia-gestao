import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  Header,
  Footer,
  PageNumber,
  PageOrientation,
} from "docx";
import type { RelatorioPeriodo } from "@/server/actions/relatorios-actions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// ─────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────

interface FiltrosExportacao {
  dataInicio: string;
  dataFim: string;
  estado?: string;
  procedencia?: string;
  tecnico?: string;
  modalidade?: string;
}

// ─────────────────────────────────────────────────────────────────────
// Utilitários
// ─────────────────────────────────────────────────────────────────────

function formatarData(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return format(date, "dd/MM/yyyy", { locale: ptBR });
}

function tituloRelatorio(filtros: FiltrosExportacao): string {
  const estado = filtros.estado && filtros.estado !== "todos" ? ` - ${filtros.estado}` : "";
  const proc = filtros.procedencia && filtros.procedencia !== "0" ? ` - ${filtros.procedencia}` : "";
  const tec = filtros.tecnico && filtros.tecnico !== "0" ? ` - ${filtros.tecnico}` : "";
  const mod = filtros.modalidade && filtros.modalidade !== "0" ? ` - ${filtros.modalidade}` : "";
  return `Relatório de Exames${estado}${proc}${tec}${mod}`;
}

// ─────────────────────────────────────────────────────────────────────
// PDF Export
// ─────────────────────────────────────────────────────────────────────

export function exportarPDF(
  relatorio: RelatorioPeriodo,
  filtros: FiltrosExportacao
): void {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = 20;

  // ── Cabeçalho ──
  doc.setFontSize(18);
  doc.text("Relatório de Exames", margin, y);
  y += 7;
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(
    `Período: ${formatarData(filtros.dataInicio)} a ${formatarData(filtros.dataFim)}`,
    margin,
    y
  );
  y += 5;
  doc.text(`Gerado em: ${formatarData(new Date().toISOString())}`, margin, y);
  y += 10;

  // ── Cards Resumo ──
  const cardLabels = [
    { label: "Total Exames", value: relatorio.totalExames.toString() },
    { label: "Atendidos", value: relatorio.examesAtendidos.toString() },
    { label: "Pendentes", value: relatorio.examesPendentes.toString() },
    { label: "Cancelados", value: relatorio.examesCancelados.toString() },
  ];

  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text("Resumo", margin, y);
  y += 6;

  const cardW = (pageWidth - 2 * margin - 6) / 4;
  cardLabels.forEach((card, i) => {
    const x = margin + i * (cardW + 2);
    doc.setDrawColor(200);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, y, cardW, 18, 2, 2, "FD");
    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text(card.label, x + cardW / 2, y + 6, { align: "center" });
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(card.value, x + cardW / 2, y + 14, { align: "center" });
  });
  y += 26;

  // ── Tabela: Distribuição por Modalidade ──
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text("Distribuição por Modalidade", margin, y);
  y += 5;

  if (relatorio.modalidades.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["Modalidade", "Tipo de Exame", "Quantidade"]],
      body: relatorio.modalidades.map((m) => [m.modalidade, m.tipoExame, m.count.toString()]),
      margin: { left: margin, right: margin },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  } else {
    y += 5;
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("Nenhum dado disponível", margin, y);
    y += 10;
  }

  // ── Tabela: Distribuição por Procedência ──
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text("Distribuição por Procedência", margin, y);
  y += 5;

  if (relatorio.procedencias.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["Procedência", "Quantidade"]],
      body: relatorio.procedencias.map((p) => [p.procedencia, p.count.toString()]),
      margin: { left: margin, right: margin },
      headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  } else {
    y += 5;
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("Nenhum dado disponível", margin, y);
    y += 10;
  }

  // ── Tabela: Exames por Técnico ──
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text("Exames por Técnico", margin, y);
  y += 5;

  if (relatorio.tecnicos.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["Técnico", "Quantidade"]],
      body: relatorio.tecnicos.map((t) => [t.tecnico, t.count.toString()]),
      margin: { left: margin, right: margin },
      headStyles: { fillColor: [139, 92, 246], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  } else {
    y += 5;
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("Nenhum dado disponível", margin, y);
    y += 10;
  }

  // ── Distribuição por Sexo ──
  if (relatorio.totalSexoMapeado > 0) {
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Distribuição por Sexo", margin, y);
    y += 5;

    const sexoData = Object.entries(relatorio.contagemSexo);
    autoTable(doc, {
      startY: y,
      head: [["Sexo", "Quantidade"]],
      body: sexoData.map(([sexo, count]) => [sexo, count.toString()]),
      margin: { left: margin, right: margin },
      headStyles: { fillColor: [245, 158, 11], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // ── Tendência Diária ──
  if (relatorio.tendenciaDiaria.length > 0) {
    // Check if we need a new page
    if (y > 220) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Tendência Diária", margin, y);
    y += 5;

    const dailyData = relatorio.tendenciaDiaria.map((d) => [
      formatarData(d.dia),
      d.total.toString(),
    ]);

    autoTable(doc, {
      startY: y,
      head: [["Data", "Exames Realizados"]],
      body: dailyData,
      margin: { left: margin, right: margin },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
  }

  // ── Rodapé ──
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Imagiologia - Gestão | Página ${i} de ${pageCount}`,
      margin,
      doc.internal.pageSize.getHeight() - 10
    );
  }

  // Download
  const filename = `relatorio-${filtros.dataInicio}-a-${filtros.dataFim}.pdf`;
  doc.save(filename);
}

// ─────────────────────────────────────────────────────────────────────
// Excel Export
// ─────────────────────────────────────────────────────────────────────

export function exportarExcel(
  relatorio: RelatorioPeriodo,
  filtros: FiltrosExportacao
): void {
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Resumo ──
  const resumoData = [
    ["Indicador", "Valor"],
    ["Total de Exames", relatorio.totalExames],
    ["Exames Atendidos", relatorio.examesAtendidos],
    ["Exames Pendentes", relatorio.examesPendentes],
    ["Exames Cancelados", relatorio.examesCancelados],
    ["Taxa de Atendimento (%)", relatorio.taxaAtendimento],
    ["Total Pacientes (Sexo Mapeado)", relatorio.totalSexoMapeado],
    ["Sexo mais Atendido", relatorio.sexoMaisAtendido],
    ["Período Início", formatarData(filtros.dataInicio)],
    ["Período Fim", formatarData(filtros.dataFim)],
    ["Data de Exportação", formatarData(new Date().toISOString())],
  ];
  const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
  XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo");

  // ── Sheet 2: Modalidades ──
  if (relatorio.modalidades.length > 0) {
    const modalData = [
      ["Modalidade", "Tipo de Exame", "Quantidade"],
      ...relatorio.modalidades.map((m) => [m.modalidade, m.tipoExame, m.count]),
    ];
    const wsModal = XLSX.utils.aoa_to_sheet(modalData);
    XLSX.utils.book_append_sheet(wb, wsModal, "Modalidades");
  }

  // ── Sheet 3: Procedências ──
  if (relatorio.procedencias.length > 0) {
    const procData = [
      ["Procedência", "Quantidade"],
      ...relatorio.procedencias.map((p) => [p.procedencia, p.count]),
    ];
    const wsProc = XLSX.utils.aoa_to_sheet(procData);
    XLSX.utils.book_append_sheet(wb, wsProc, "Procedências");
  }

  // ── Sheet 4: Técnicos ──
  if (relatorio.tecnicos.length > 0) {
    const tecData = [
      ["Técnico", "Quantidade"],
      ...relatorio.tecnicos.map((t) => [t.tecnico, t.count]),
    ];
    const wsTec = XLSX.utils.aoa_to_sheet(tecData);
    XLSX.utils.book_append_sheet(wb, wsTec, "Técnicos");
  }

  // ── Sheet 5: Tendência Diária ──
  if (relatorio.tendenciaDiaria.length > 0) {
    const trendData = [
      ["Data", "Exames Realizados"],
      ...relatorio.tendenciaDiaria.map((d) => [formatarData(d.dia), d.total]),
    ];
    const wsTrend = XLSX.utils.aoa_to_sheet(trendData);
    XLSX.utils.book_append_sheet(wb, wsTrend, "Tendência Diária");
  }

  // ── Sheet 6: Distribuição por Sexo ──
  if (relatorio.totalSexoMapeado > 0) {
    const sexoData = [
      ["Sexo", "Quantidade"],
      ...Object.entries(relatorio.contagemSexo),
    ];
    const wsSexo = XLSX.utils.aoa_to_sheet(sexoData);
    XLSX.utils.book_append_sheet(wb, wsSexo, "Distribuição por Sexo");
  }

  // Download
  const filename = `relatorio-${filtros.dataInicio}-a-${filtros.dataFim}.xlsx`;
  XLSX.writeFile(wb, filename);
}

// ─────────────────────────────────────────────────────────────────────
// Word Export
// ─────────────────────────────────────────────────────────────────────

export async function exportarWord(
  relatorio: RelatorioPeriodo,
  filtros: FiltrosExportacao
): Promise<void> {
  const titulo = tituloRelatorio(filtros);
  const periodo = `Período: ${formatarData(filtros.dataInicio)} a ${formatarData(filtros.dataFim)}`;
  const geradoEm = `Gerado em: ${formatarData(new Date().toISOString())}`;

  const sections: (Paragraph | Table)[] = [];

  // Helper to add a heading
  function addHeading(text: string) {
    sections.push(
      new Paragraph({
        text,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 300, after: 200 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 6, color: "2563EB" },
        },
      })
    );
  }

  function addSubHeading(text: string) {
    sections.push(
      new Paragraph({
        text,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 150 },
      })
    );
  }

  function addText(text: string, bold = false, size = 22) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold,
            size,
            font: "Calibri",
          }),
        ],
        spacing: { after: 100 },
      })
    );
  }

  function addTable(
    headers: string[],
    rows: (string | number)[][]
  ) {
    const tableRows: TableRow[] = [];

    // Header row
    tableRows.push(
      new TableRow({
        tableHeader: true,
        children: headers.map(
          (h) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: h, bold: true, color: "FFFFFF", size: 20, font: "Calibri" }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              shading: { fill: "2563EB" },
            })
        ),
      })
    );

    // Data rows
    rows.forEach((row) => {
      tableRows.push(
        new TableRow({
          children: row.map(
            (cell) =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: String(cell), size: 20, font: "Calibri" }),
                    ],
                  }),
                ],
              })
          ),
        })
      );
    });

    sections.push(
      new Table({
        rows: tableRows,
        width: { size: 100, type: WidthType.PERCENTAGE },
      })
    );

    sections.push(new Paragraph({ spacing: { after: 200 } }));
  }

  // ════════════════════════════════════════════
  // TITLE
  // ════════════════════════════════════════════
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: titulo,
          bold: true,
          size: 32,
          font: "Calibri",
          color: "1E3A5F",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    })
  );
  addText(periodo, false, 22);
  addText(geradoEm, false, 22);
  sections.push(new Paragraph({ spacing: { after: 300 } }));

  // ════════════════════════════════════════════
  // RESUMO
  // ════════════════════════════════════════════
  addHeading("Resumo");
  addTable(
    ["Indicador", "Valor"],
    [
      ["Total de Exames", relatorio.totalExames],
      ["Exames Atendidos", relatorio.examesAtendidos],
      ["Exames Pendentes", relatorio.examesPendentes],
      ["Exames Cancelados", relatorio.examesCancelados],
      ["Taxa de Atendimento", `${relatorio.taxaAtendimento}%`],
      ["Sexo mais Atendido", relatorio.sexoMaisAtendido],
    ]
  );

  // ════════════════════════════════════════════
  // MODALIDADES
  // ════════════════════════════════════════════
  if (relatorio.modalidades.length > 0) {
    addHeading("Distribuição por Modalidade");
    addSubHeading("Exames realizados por secção");
    addTable(
      ["Modalidade", "Tipo de Exame", "Quantidade"],
      relatorio.modalidades.map((m) => [m.modalidade, m.tipoExame, m.count])
    );
  }

  // ════════════════════════════════════════════
  // PROCEDÊNCIAS
  // ════════════════════════════════════════════
  if (relatorio.procedencias.length > 0) {
    addHeading("Distribuição por Procedência");
    addSubHeading("Origem dos exames realizados");
    addTable(
      ["Procedência", "Quantidade"],
      relatorio.procedencias.map((p) => [p.procedencia, p.count])
    );
  }

  // ════════════════════════════════════════════
  // TÉCNICOS
  // ════════════════════════════════════════════
  if (relatorio.tecnicos.length > 0) {
    addHeading("Exames por Técnico");
    addSubHeading("Desempenho individual dos técnicos");
    addTable(
      ["Técnico", "Quantidade"],
      relatorio.tecnicos.map((t) => [t.tecnico, t.count])
    );
  }

  // ════════════════════════════════════════════
  // SEXO
  // ════════════════════════════════════════════
  if (relatorio.totalSexoMapeado > 0) {
    addHeading("Distribuição por Sexo");
    addTable(
      ["Sexo", "Quantidade"],
      Object.entries(relatorio.contagemSexo).map(([sexo, count]) => [sexo, count])
    );
  }

  // ════════════════════════════════════════════
  // TENDÊNCIA DIÁRIA
  // ════════════════════════════════════════════
  if (relatorio.tendenciaDiaria.length > 0) {
    addHeading("Tendência Diária");
    addSubHeading("Exames realizados por dia no período");
    addTable(
      ["Data", "Exames Realizados"],
      relatorio.tendenciaDiaria.map((d) => [formatarData(d.dia), d.total])
    );
  }

  // ════════════════════════════════════════════
  // BUILD DOCUMENT
  // ════════════════════════════════════════════
  const doc = new Document({
    title: titulo,
    description: `Relatório de exames do período ${formatarData(filtros.dataInicio)} a ${formatarData(filtros.dataFim)}`,
    styles: {
      default: {
        document: {
          run: {
            font: "Calibri",
            size: 22,
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Imagiologia - Gestão",
                    bold: true,
                    size: 18,
                    color: "999999",
                  }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "Página ", size: 18, color: "999999" }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "999999" }),
                  new TextRun({ text: " de ", size: 18, color: "999999" }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: "999999" }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children: sections,
      },
    ],
  });

  // Generate and download
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `relatorio-${filtros.dataInicio}-a-${filtros.dataFim}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}

