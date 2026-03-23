/**
 * Parsea precios en formato argentino/español: "$ 1.641,13" -> 1641.13
 */
export function parsePrecio(str) {
  if (str == null || str === "") return null;
  const s = String(str).trim().replace(/\$\s*/g, "").replace(/\./g, "").replace(",", ".");
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

/**
 * Parsea número que puede tener coma decimal: "2,5" -> 2.5
 */
export function parseNumero(str) {
  if (str == null || str === "") return null;
  const s = String(str).trim().replace(",", ".");
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

/**
 * Normaliza nombre de columna para comparar (quita espacios extra, lower)
 */
function normalizeHeader(name) {
  return (name || "").toString().trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Encuentra el índice de columna que coincide con alguno de los alias
 */
function findColumnIndex(headers, aliases) {
  for (let i = 0; i < headers.length; i++) {
    const h = normalizeHeader(headers[i]);
    for (const alias of aliases) {
      if (normalizeHeader(alias) === h) return i;
    }
  }
  return -1;
}

/**
 * Mapea una fila de datos (array) a un objeto con claves camelCase usando mapColumns.
 * mapColumns: { codigo: 2, descripcion: 3, ... }
 */
function rowToProduct(row, mapColumns) {
  const get = (key) => {
    const idx = mapColumns[key];
    if (idx == null || idx < 0) return null;
    const val = row[idx];
    if (val === undefined || val === null) return null;
    const s = typeof val === "number" ? String(val) : String(val).trim();
    return s === "" ? null : s;
  };

  const precioListaSIVA = parsePrecio(get("precioListaSIVA")) ?? parseNumero(get("precioListaSIVA"));
  const precioSugeridoCIVA = parsePrecio(get("precioSugeridoCIVA")) ?? parseNumero(get("precioSugeridoCIVA"));
  const uxb = get("uxb"); // puede ser "2,5" o número; guardamos como string o número
  const uxbNum = parseNumero(uxb);

  return {
    codigo: get("codigo") || null,
    descripcion: get("descripcion") || null,
    familia: get("familia") || null,
    ean: get("ean") || null,
    uxb: uxbNum != null ? uxbNum : uxb,
    precioListaSIVA: precioListaSIVA ?? null,
    precioSugeridoCIVA: precioSugeridoCIVA ?? null,
  };
}

/**
 * Encuentra la fila de encabezado en una hoja (primera fila que contiene "Código" o "Descripcion")
 */
function getCellValue(cell) {
  if (!cell) return "";
  const v = cell.v;
  if (v == null) return "";
  if (typeof v === "number") return String(v);
  if (typeof v === "object" && v instanceof Date) return v.toISOString();
  return String(v).trim();
}

// Tabla TRADI: 7 columnas (Código, Descripcion, FAMILIA, EAN, UXB, Precio Lista S/IVA, Precio Sugerido C/IVA).
// En Excel puede estar en C9:I9 o en otra posición; buscamos la fila donde aparezca "Código" en cualquier columna.
const TRADI_NUM_COLS = 7;

function findHeaderRow(XLSX, sheet, maxRows = 30, maxCols = 20) {
  const range = sheet["!ref"] ? XLSX.utils.decode_range(sheet["!ref"]) : { e: { r: 0, c: 0 } };
  const maxR = Math.min(range.e?.r ?? 0, maxRows);
  const maxC = Math.min(range.e?.c ?? maxCols, maxCols);
  for (let r = 0; r <= maxR; r++) {
    for (let c = 0; c <= maxC; c++) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })];
      const val = normalizeHeader(getCellValue(cell));
      if (val === "código" || val === "codigo") {
        const row = [];
        for (let col = 0; col <= c + TRADI_NUM_COLS; col++) {
          const c2 = sheet[XLSX.utils.encode_cell({ r, c: col })];
          row.push(getCellValue(c2));
        }
        return { rowIndex: r, startCol: c, headers: row };
      }
    }
  }
  return null;
}

/**
 * Parsea un libro XLSX (objeto libro de sheetjs) y devuelve array de productos normalizados.
 * Acepta también CSV leído como hoja.
 */
export function parseNicoWorkbook(workbook) {
  const XLSX = require("xlsx");
  const firstSheet = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheet];
  const headerInfo = findHeaderRow(XLSX, sheet);
  if (!headerInfo) return { products: [], errors: ["No se encontró fila de encabezado (Código/Descripcion). Probá subir el archivo en CSV."] };

  const { rowIndex, startCol } = headerInfo;
  const colEnd = startCol + TRADI_NUM_COLS - 1;
  const mapColumns = {
    codigo: startCol,
    descripcion: startCol + 1,
    familia: startCol + 2,
    ean: startCol + 3,
    uxb: startCol + 4,
    precioListaSIVA: startCol + 5,
    precioSugeridoCIVA: startCol + 6,
  };

  const range = XLSX.utils.decode_range(sheet["!ref"] || "A1");
  const products = [];
  const errors = [];

  for (let r = rowIndex + 1; r <= (range.e?.r ?? rowIndex + 1); r++) {
    const row = [];
    for (let c = 0; c <= colEnd; c++) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })];
      row.push(getCellValue(cell));
    }
    const product = rowToProduct(row, mapColumns);
    if (product.codigo || product.descripcion) {
      products.push(product);
    }
  }

  return { products, errors };
}

/**
 * Parsea archivo CSV como texto (líneas separadas por \n, columnas por coma).
 * Asume que la primera línea con "Código" o "Descripcion" es el encabezado.
 */
export function parseNicoCSVText(csvText) {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim());
  let headerIndex = -1;
  let headers = [];

  for (let i = 0; i < Math.min(lines.length, 30); i++) {
    const row = parseCSVLine(lines[i]);
    const rowStr = row.join(" ").toLowerCase();
    if (rowStr.includes("código") || rowStr.includes("descripcion")) {
      headerIndex = i;
      headers = row;
      break;
    }
  }

  if (headerIndex < 0) {
    return { products: [], errors: ["No se encontró fila de encabezado en el CSV."] };
  }

  // Buscar índice de "Código" en la fila de encabezado (en CSV suele ser 2 por las comas al inicio)
  const aliasesCodigo = ["Código", "codigo"];
  let startCol = -1;
  for (let i = 0; i < headers.length; i++) {
    if (aliasesCodigo.some((a) => normalizeHeader(a) === normalizeHeader(headers[i]))) {
      startCol = i;
      break;
    }
  }
  if (startCol < 0) {
    return { products: [], errors: ["No se encontró columna 'Código' en el encabezado CSV."] };
  }
  // Orden fijo: Código, Descripcion, FAMILIA, EAN, UXB, Precio Lista S/IVA, Precio Sugerido C/IVA (7 columnas)
  const mapColumns = {
    codigo: startCol,
    descripcion: startCol + 1,
    familia: startCol + 2,
    ean: startCol + 3,
    uxb: startCol + 4,
    precioListaSIVA: startCol + 5,
    precioSugeridoCIVA: startCol + 6,
  };

  const products = [];
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    const product = rowToProduct(row, mapColumns);
    if (product.codigo || product.descripcion) {
      products.push(product);
    }
  }

  return { products, errors: [] };
}

/**
 * Parsea una línea CSV respetando comillas (valores con coma dentro de comillas).
 */
function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}
