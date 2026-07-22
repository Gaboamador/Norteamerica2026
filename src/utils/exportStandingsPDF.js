import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDisplayName } from "@/utils/formatDisplayName";

const DOCUMENT_TITLE = "Prode Norteamérica 2026";
const DEFAULT_TABLE_TITLE = "Tabla final";

const PAGE_FORMAT = "a4";
const PAGE_ORIENTATION = "landscape";

const PAGE_MARGIN_X = 12;
const PAGE_MARGIN_TOP = 12;
const PAGE_MARGIN_BOTTOM = 10;

const HEADER_HEIGHT = 29;
const FOOTER_HEIGHT = 8;

const DEFAULT_FONT_SIZE = 9;
const MIN_FONT_SIZE = 6.4;

const DEFAULT_CELL_PADDING_Y = 2.2;
const MIN_CELL_PADDING_Y = 1;

const HEADER_FILL_COLOR = [15, 23, 42];
const HEADER_TEXT_COLOR = [255, 255, 255];

const PRIMARY_TEXT_COLOR = [30, 41, 59];
const SECONDARY_TEXT_COLOR = [100, 116, 139];

const BORDER_COLOR = [203, 213, 225];
const ALTERNATE_ROW_COLOR = [248, 250, 252];

const FIRST_PLACE_COLOR = [254, 243, 199];
const SECOND_PLACE_COLOR = [241, 245, 249];
const THIRD_PLACE_COLOR = [255, 237, 213];

function sanitizeFileName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

function formatExportDate(date = new Date()) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function normalizeNumber(value) {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function normalizePosition(value, fallbackPosition) {
  const position = Number(value);

  return Number.isFinite(position) && position > 0
    ? position
    : fallbackPosition;
}

function buildRows(table) {
  return table.map((user, index) => ({
    position: normalizePosition(user?.position, index + 1),
    participant: formatDisplayName(
      user?.displayName,
      user?.email
    ),
    points: normalizeNumber(user?.points),
    signHits: normalizeNumber(user?.signHits),
    scoredMatches: normalizeNumber(user?.scoredMatches),
    plenos: normalizeNumber(user?.plenos),
  }));
}

function getRowFillColor(position) {
  if (position === 1) return FIRST_PLACE_COLOR;
  if (position === 2) return SECOND_PLACE_COLOR;
  if (position === 3) return THIRD_PLACE_COLOR;

  return null;
}

function getLayoutSettings({
  rowCount,
  availableTableHeight,
}) {
  if (rowCount <= 0) {
    return {
      fontSize: DEFAULT_FONT_SIZE,
      cellPaddingY: DEFAULT_CELL_PADDING_Y,
    };
  }

  const estimatedHeaderHeight = 8;
  const availableRowsHeight =
    availableTableHeight - estimatedHeaderHeight;

  const idealRowHeight =
    availableRowsHeight / rowCount;

  /*
   * Aproximación del alto de fila de jspdf-autotable:
   * alto de texto + padding superior e inferior.
   */
  const idealFontSize = Math.min(
    DEFAULT_FONT_SIZE,
    Math.max(
      MIN_FONT_SIZE,
      (idealRowHeight - MIN_CELL_PADDING_Y * 2) / 0.42
    )
  );

  const estimatedTextHeight = idealFontSize * 0.42;

  const idealPaddingY = Math.min(
    DEFAULT_CELL_PADDING_Y,
    Math.max(
      MIN_CELL_PADDING_Y,
      (idealRowHeight - estimatedTextHeight) / 2
    )
  );

  return {
    fontSize: idealFontSize,
    cellPaddingY: idealPaddingY,
  };
}

function drawDocumentHeader({
  doc,
  tableTitle,
  exportedAt,
  participantCount,
}) {
  doc.setTextColor(...PRIMARY_TEXT_COLOR);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(
    DOCUMENT_TITLE.toUpperCase(),
    PAGE_MARGIN_X,
    PAGE_MARGIN_TOP + 4
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(
    DEFAULT_TABLE_TITLE.toUpperCase(),
    PAGE_MARGIN_X,
    PAGE_MARGIN_TOP + 11
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...SECONDARY_TEXT_COLOR);
  doc.text(
    tableTitle,
    PAGE_MARGIN_X,
    PAGE_MARGIN_TOP + 17
  );

  const pageWidth = doc.internal.pageSize.getWidth();
  const rightEdge = pageWidth - PAGE_MARGIN_X;

  doc.setFontSize(8);
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.35);
  doc.line(
    PAGE_MARGIN_X,
    PAGE_MARGIN_TOP + 22,
    rightEdge,
    PAGE_MARGIN_TOP + 22
  );
}

function drawDocumentFooter({
  doc,
  participantCount,
}) {
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();

  const footerY = pageHeight - 5;

  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.25);
  doc.line(
    PAGE_MARGIN_X,
    footerY - 4,
    pageWidth - PAGE_MARGIN_X,
    footerY - 4
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...SECONDARY_TEXT_COLOR);

  doc.text(
    "Clasificación final del Prode Norteamérica 2026",
    PAGE_MARGIN_X,
    footerY
  );

  doc.text(
    `${participantCount} participante${
      participantCount === 1 ? "" : "s"
    }`,
    pageWidth - PAGE_MARGIN_X,
    footerY,
    {
      align: "right",
    }
  );
}

/**
 * Genera y descarga la tabla final del prode en PDF.
 *
 * @param {Object} options
 * @param {Array} options.table Tabla de posiciones ya calculada.
 * @param {string} options.tableTitle Nombre visible de la tabla o grupo.
 * @param {Date} [options.exportDate] Fecha opcional de exportación.
 */
export function exportStandingsPDF({
  table,
  tableTitle = "Clasificación general",
  exportDate = new Date(),
}) {
  if (!Array.isArray(table) || table.length === 0) {
    throw new Error(
      "No hay posiciones disponibles para exportar."
    );
  }

  const rows = buildRows(table);

  const doc = new jsPDF({
    orientation: PAGE_ORIENTATION,
    unit: "mm",
    format: PAGE_FORMAT,
    compress: true,
  });

  const pageHeight = doc.internal.pageSize.getHeight();

  const tableStartY =
    PAGE_MARGIN_TOP + HEADER_HEIGHT;

  const availableTableHeight =
    pageHeight -
    tableStartY -
    PAGE_MARGIN_BOTTOM -
    FOOTER_HEIGHT;

  const {
    fontSize,
    cellPaddingY,
  } = getLayoutSettings({
    rowCount: rows.length,
    availableTableHeight,
  });

  const exportedAt = formatExportDate(exportDate);

  drawDocumentHeader({
    doc,
    tableTitle,
    exportedAt,
    participantCount: rows.length,
  });

  autoTable(doc, {
    startY: tableStartY,

    margin: {
      left: PAGE_MARGIN_X,
      right: PAGE_MARGIN_X,
      bottom: PAGE_MARGIN_BOTTOM + FOOTER_HEIGHT,
    },

    tableWidth: "auto",

    head: [[
      "Pos.",
      "Participante",
      "Puntos",
      "Signos",
      "Puntuados",
      "Plenos",
    ]],

    body: rows.map((row) => [
      row.position,
      row.participant,
      row.points,
      row.signHits,
      row.scoredMatches,
      row.plenos,
    ]),

    theme: "grid",

    styles: {
      font: "helvetica",
      fontSize,
      textColor: PRIMARY_TEXT_COLOR,
      lineColor: BORDER_COLOR,
      lineWidth: 0.2,
      cellPadding: {
        top: cellPaddingY,
        right: 2,
        bottom: cellPaddingY,
        left: 2,
      },
      valign: "middle",
      overflow: "ellipsize",
    },

    headStyles: {
      fillColor: HEADER_FILL_COLOR,
      textColor: HEADER_TEXT_COLOR,
      fontStyle: "bold",
      halign: "center",
      lineColor: HEADER_FILL_COLOR,
      lineWidth: 0.2,
      cellPadding: {
        top: Math.max(1.6, cellPaddingY),
        right: 2,
        bottom: Math.max(1.6, cellPaddingY),
        left: 2,
      },
    },

    alternateRowStyles: {
      fillColor: ALTERNATE_ROW_COLOR,
    },

    columnStyles: {
      0: {
        cellWidth: 15,
        halign: "center",
        fontStyle: "bold",
      },

      1: {
        cellWidth: "auto",
        halign: "left",
      },

      2: {
        cellWidth: 24,
        halign: "center",
        fontStyle: "bold",
      },

      3: {
        cellWidth: 24,
        halign: "center",
      },

      4: {
        cellWidth: 29,
        halign: "center",
      },

      5: {
        cellWidth: 22,
        halign: "center",
      },
    },

    didParseCell: (data) => {
      if (data.section !== "body") return;

      const row = rows[data.row.index];
      const fillColor = getRowFillColor(row.position);

      if (fillColor) {
        data.cell.styles.fillColor = fillColor;
      }

      if (
        row.position === 1 &&
        (data.column.index === 0 ||
          data.column.index === 1 ||
          data.column.index === 2)
      ) {
        data.cell.styles.fontStyle = "bold";
      }
    },

    didDrawPage: () => {
      drawDocumentFooter({
        doc,
        participantCount: rows.length,
      });
    },
  });

  /*
   * La tabla está diseñada para entrar en una hoja. Este control evita
   * descargar silenciosamente un documento de varias páginas si en el futuro
   * aumenta demasiado la cantidad de participantes.
   */
  if (doc.getNumberOfPages() > 1) {
    throw new Error(
      "La tabla tiene demasiados participantes para exportarse de forma legible en una sola hoja A4."
    );
  }

  const safeTableName =
    sanitizeFileName(tableTitle) ||
    "clasificacion-general";

  doc.save(
    `prode-norteamerica-2026-${safeTableName}.pdf`
  );
}

export default exportStandingsPDF;