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
} from "docx";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// ─────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────

interface TurnoExport {
  id: number;
  tecnicoId: number;
  data: string;
  horaInicio: string;
  horaFim: string;
  tipo: string;
  estado: string;
  observacao: string | null;
  tecnico: { id: number; nome: string; especialidade: string | null } | null;
  createdBy: { id: number; nome: string } | null;
}

interface FiltrosEscala {
  mes: string;
  ano: string;
  tecnico?: string;
  estado?: string;
}

// ─────────────────────────────────────────────────────────────────────
// Utilitários
// ─────────────────────────────────────────────────────────────────────

function formatarData(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return format(date, "dd/MM/yyyy", { locale: ptBR });
}

function formatarDataLonga(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const TIPO_CORES: Record<string, [number, number, number]> = {
  Manhã: [245, 158, 11],
  Tarde: [234, 88, 12],
  Noite: [99, 102, 241],
  Normal: [59, 130, 246],
};

const ESTADO_CORES: Record<string, [number, number, number]> = {
  Agendado: [59, 130, 246],
  "Em curso": [234, 179, 8],
  Concluído: [34, 197, 94],
  Cancelado: [239, 68, 68],
};

function obterTitulo(turnos: TurnoExport[], filtros: FiltrosEscala): string {
  const mesAno = `${MESES[parseInt(filtros.mes) - 1] || filtros.mes} ${filtros.ano}`;
  let titulo = `Escala de Turnos - ${mesAno}`;
  if (filtros.tecnico) titulo += ` (${filtros.tecnico})`;
  if (filtros.estado) titulo += ` [${filtros.estado}]`;
  return titulo;
}

function resumoPorTipo(turnos: TurnoExport[]): { tipo: string; quantidade: number; percentagem: string }[] {
  const total = turnos.length || 1;
  const map: Record<string, number> = { Manhã: 0, Tarde: 0, Noite: 0, Normal: 0 };
  turnos.forEach((t) => {
    map[t.tipo] = (map[t.tipo] || 0) + 1;
  });
  return Object.entries(map).map(([tipo, quantidade]) => ({
    tipo,
    quantidade,
    percentagem: ((quantidade / total) * 100).toFixed(1) + "%",
  }));
}

function resumoPorEstado(turnos: TurnoExport[]): { estado: string; quantidade: number }[] {
  const map: Record<string, number> = {};
  turnos.forEach((t) => {
    map[t.estado] = (map[t.estado] || 0) + 1;
  });
  return Object.entries(map).map(([estado, quantidade]) => ({ estado, quantidade }));
}

// ─────────────────────────────────────────────────────────────────────
// PDF Export
// ─────────────────────────────────────────────────────────────────────

export function exportarEscalaPDF(
  turnos: TurnoExport[],
  filtros: FiltrosEscala
): void {
  const doc = new jsPDF("l", "mm", "a4"); // Landscape for better table fit
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  let y = 18;

  const titulo = obterTitulo(turnos, filtros);

  // ── Cabeçalho ──
  doc.setFontSize(18);
  doc.setTextColor(30, 58, 95);
  doc.text("Imagiologia - Gestão", margin, y);
  y += 7;
  doc.setFontSize(14);
  doc.text(titulo, margin, y);
  y += 6;
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Total de turnos: ${turnos.length}  |  Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, margin, y);
  y += 10;

  // ── Cards Resumo ──
  const resumoEstados = resumoPorEstado(turnos);
  const resumoTipos = resumoPorTipo(turnos);

  // Resumo por Estado
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text("Resumo por Estado", margin, y);
  y += 5;

  const estadoCardW = (pageWidth - 2 * margin - 6) / 4;
  const estadosOrdem = ["Agendado", "Em curso", "Concluído", "Cancelado"];
  estadosOrdem.forEach((estado, i) => {
    const item = resumoEstados.find((r) => r.estado === estado);
    const count = item?.quantidade || 0;
    const x = margin + i * (estadoCardW + 2);
    const cor = ESTADO_CORES[estado] || [150, 150, 150];
    doc.setDrawColor(cor[0], cor[1], cor[2]);
    doc.setFillColor(cor[0], cor[1], cor[2]);
    doc.roundedRect(x, y, estadoCardW, 14, 1.5, 1.5, "FD");
    doc.setTextColor(255);
    doc.setFontSize(7);
    doc.text(estado, x + estadoCardW / 2, y + 5, { align: "center" });
    doc.setFontSize(11);
    doc.text(String(count), x + estadoCardW / 2, y + 12, { align: "center" });
  });
  y += 20;

  // Resumo por Tipo
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text("Resumo por Tipo de Turno", margin, y);
  y += 5;

  const tipoCardW = (pageWidth - 2 * margin - 6) / 4;
  const tiposOrdem = ["Manhã", "Tarde", "Noite", "Normal"];
  tiposOrdem.forEach((tipo, i) => {
    const item = resumoTipos.find((r) => r.tipo === tipo);
    const count = item?.quantidade || 0;
    const pct = item?.percentagem || "0%";
    const x = margin + i * (tipoCardW + 2);
    const cor = TIPO_CORES[tipo] || [150, 150, 150];
    doc.setDrawColor(cor[0], cor[1], cor[2]);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, y, tipoCardW, 16, 1.5, 1.5, "FD");
    doc.setDrawColor(cor[0], cor[1], cor[2]);
    doc.roundedRect(x, y, tipoCardW, 16, 1.5, 1.5, "S");
    doc.setTextColor(cor[0], cor[1], cor[2]);
    doc.setFontSize(7);
    doc.text(tipo, x + tipoCardW / 2, y + 5, { align: "center" });
    doc.setFontSize(10);
    doc.text(String(count), x + tipoCardW / 2, y + 10, { align: "center" });
    doc.setFontSize(6);
    doc.setTextColor(120);
    doc.text(pct, x + tipoCardW / 2, y + 14, { align: "center" });
  });
  y += 22;

  // ── Tabela de Turnos ──
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text("Detalhe dos Turnos", margin, y);
  y += 5;

  if (turnos.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("Nenhum turno encontrado para o período selecionado.", margin, y);
  } else {
    const tableBody = turnos.map((t) => [
      formatarData(t.data),
      t.horaInicio,
      t.horaFim,
      t.tecnico?.nome || "—",
      t.tecnico?.especialidade || "—",
      t.tipo,
      t.estado,
      t.observacao || "—",
    ]);

    autoTable(doc, {
      startY: y,
      head: [["Data", "Início", "Fim", "Técnico", "Especialidade", "Tipo", "Estado", "Observações"]],
      body: tableBody,
      margin: { left: margin, right: margin },
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 8,
      },
      bodyStyles: { fontSize: 7 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 24 },
        1: { cellWidth: 16 },
        2: { cellWidth: 16 },
        3: { cellWidth: 40 },
        4: { cellWidth: 30 },
        5: { cellWidth: 20 },
        6: { cellWidth: 22 },
        7: { cellWidth: 60 },
      },
    });
  }

  // ── Rodapé ──
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(
      `Imagiologia - Gestão | Escala de Turnos | Página ${i} de ${pageCount}`,
      margin,
      pageHeight - 8
    );
  }

  // Download
  const filename = `escala-turnos-${filtros.mes}-${filtros.ano}.pdf`;
  doc.save(filename);
}

// ─────────────────────────────────────────────────────────────────────
// Excel Export
// ─────────────────────────────────────────────────────────────────────

export function exportarEscalaExcel(
  turnos: TurnoExport[],
  filtros: FiltrosEscala
): void {
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Escala (Detalhe) ──
  const escalaData = [
    ["Data", "Hora Início", "Hora Fim", "Técnico", "Especialidade", "Tipo", "Estado", "Observações"],
    ...turnos.map((t) => [
      formatarData(t.data),
      t.horaInicio,
      t.horaFim,
      t.tecnico?.nome || "—",
      t.tecnico?.especialidade || "—",
      t.tipo,
      t.estado,
      t.observacao || "—",
    ]),
  ];
  const wsEscala = XLSX.utils.aoa_to_sheet(escalaData);

  // Set column widths
  wsEscala["!cols"] = [
    { wch: 14 }, // Data
    { wch: 12 }, // Hora Início
    { wch: 12 }, // Hora Fim
    { wch: 25 }, // Técnico
    { wch: 20 }, // Especialidade
    { wch: 12 }, // Tipo
    { wch: 14 }, // Estado
    { wch: 35 }, // Observações
  ];

  XLSX.utils.book_append_sheet(wb, wsEscala, "Escala");

  // ── Sheet 2: Resumo por Tipo ──
  const resumoTipos = resumoPorTipo(turnos);
  const tipoData = [
    ["Tipo de Turno", "Quantidade", "Percentagem"],
    ...resumoTipos.map((r) => [r.tipo, r.quantidade, r.percentagem]),
  ];
  const wsTipo = XLSX.utils.aoa_to_sheet(tipoData);
  wsTipo["!cols"] = [{ wch: 18 }, { wch: 14 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsTipo, "Resumo por Tipo");

  // ── Sheet 3: Resumo por Estado ──
  const resumoEstados = resumoPorEstado(turnos);
  const estadoData = [
    ["Estado", "Quantidade"],
    ...resumoEstados.map((r) => [r.estado, r.quantidade]),
  ];
  const wsEstado = XLSX.utils.aoa_to_sheet(estadoData);
  wsEstado["!cols"] = [{ wch: 18 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsEstado, "Resumo por Estado");

  // ── Sheet 4: Resumo Geral ──
  const mesAno = `${MESES[parseInt(filtros.mes) - 1] || filtros.mes} ${filtros.ano}`;
  const geralData = [
    ["Indicador", "Valor"],
    ["Mês/Ano", mesAno],
    ["Total de Turnos", turnos.length],
    ["Total Técnicos", new Set(turnos.map((t) => t.tecnicoId)).size],
    ["Data de Exportação", format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })],
  ];
  if (filtros.tecnico) geralData.push(["Filtro Técnico", filtros.tecnico]);
  if (filtros.estado) geralData.push(["Filtro Estado", filtros.estado]);
  const wsGeral = XLSX.utils.aoa_to_sheet(geralData);
  wsGeral["!cols"] = [{ wch: 22 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, wsGeral, "Resumo Geral");

  // Download
  const filename = `escala-turnos-${filtros.mes}-${filtros.ano}.xlsx`;
  XLSX.writeFile(wb, filename);
}

// ─────────────────────────────────────────────────────────────────────
// Word Export
// ─────────────────────────────────────────────────────────────────────

export async function exportarEscalaWord(
  turnos: TurnoExport[],
  filtros: FiltrosEscala
): Promise<void> {
  const mesAno = `${MESES[parseInt(filtros.mes) - 1] || filtros.mes} ${filtros.ano}`;
  const titulo = obterTitulo(turnos, filtros);
  const geradoEm = `Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`;

  const sections: (Paragraph | Table)[] = [];

  // Helpers
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
          new TextRun({ text, bold, size, font: "Calibri" }),
        ],
        spacing: { after: 100 },
      })
    );
  }

  function addTable(headers: string[], rows: (string | number)[][]) {
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
                    new TextRun({ text: h, bold: true, color: "FFFFFF", size: 18, font: "Calibri" }),
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
                      new TextRun({ text: String(cell), size: 18, font: "Calibri" }),
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
          text: "Imagiologia - Gestão",
          bold: true,
          size: 28,
          font: "Calibri",
          color: "1E3A5F",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 50 },
    })
  );
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: titulo,
          bold: true,
          size: 26,
          font: "Calibri",
          color: "2563EB",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    })
  );
  addText(`Total de turnos: ${turnos.length}`, false, 20);
  addText(geradoEm, false, 20);
  sections.push(new Paragraph({ spacing: { after: 300 } }));

  // ════════════════════════════════════════════
  // RESUMO POR ESTADO
  // ════════════════════════════════════════════
  addHeading("Resumo por Estado");
  const resumoEstados = resumoPorEstado(turnos);
  addTable(
    ["Estado", "Quantidade"],
    resumoEstados.map((r) => [r.estado, r.quantidade])
  );

  // ════════════════════════════════════════════
  // RESUMO POR TIPO
  // ════════════════════════════════════════════
  addHeading("Resumo por Tipo de Turno");
  addSubHeading("Distribuição dos turnos por período");
  const resumoTipos = resumoPorTipo(turnos);
  addTable(
    ["Tipo de Turno", "Quantidade", "Percentagem"],
    resumoTipos.map((r) => [r.tipo, r.quantidade, r.percentagem])
  );

  // ════════════════════════════════════════════
  // DETALHE DOS TURNOS
  // ════════════════════════════════════════════
  addHeading("Detalhe dos Turnos");
  addSubHeading("Relação completa de todos os turnos");

  if (turnos.length === 0) {
    addText("Nenhum turno encontrado para o período selecionado.", false, 22);
  } else {
    addTable(
      ["Data", "Início", "Fim", "Técnico", "Especialidade", "Tipo", "Estado", "Observações"],
      turnos.map((t) => [
        formatarData(t.data),
        t.horaInicio,
        t.horaFim,
        t.tecnico?.nome || "—",
        t.tecnico?.especialidade || "—",
        t.tipo,
        t.estado,
        t.observacao || "—",
      ])
    );
  }

  // ════════════════════════════════════════════
  // INFORMAÇÕES ADICIONAIS
  // ════════════════════════════════════════════
  addHeading("Informações Adicionais");
  addText(`Mês/Ano: ${mesAno}`, false, 20);
  addText(`Total de Turnos: ${turnos.length}`, false, 20);
  addText(`Total de Técnicos: ${new Set(turnos.map((t) => t.tecnicoId)).size}`, false, 20);
  addText(`Data de Exportação: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, false, 20);
  if (filtros.tecnico) addText(`Filtro aplicado - Técnico: ${filtros.tecnico}`, false, 20);
  if (filtros.estado) addText(`Filtro aplicado - Estado: ${filtros.estado}`, false, 20);

  // ════════════════════════════════════════════
  // BUILD DOCUMENT
  // ════════════════════════════════════════════
  const doc = new Document({
    title: titulo,
    description: `Escala de Turnos - ${mesAno}`,
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 22 },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1200,
              bottom: 1440,
              left: 1200,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Imagiologia - Gestão | Escala de Turnos",
                    bold: true,
                    size: 16,
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
                  new TextRun({ text: "Página ", size: 16, color: "999999" }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "999999" }),
                  new TextRun({ text: " de ", size: 16, color: "999999" }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: "999999" }),
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
  a.download = `escala-turnos-${filtros.mes}-${filtros.ano}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}

