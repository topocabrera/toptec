// Etiquetas para mostrar en UI (formato original). Claves en camelCase para uso interno.
export const NICO_PRODUCT_LABELS = {
  codigo: "Código",
  descripcion: "Descripcion",
  familia: "FAMILIA",
  ean: "EAN",
  uxb: "UXB",
  precioListaSIVA: "Precio de Lista S/IVA",
  precioSugeridoCIVA: "Precio Sugerido C/IVA",
};

// En Excel la tabla TRADI está en C9:I9 (columnas C a I, fila 9). Índices 0-based: C=2, D=3, E=4, F=5, G=6, H=7, I=8.
export const TRADI_EXCEL_COL_START = 2;  // columna C
export const TRADI_EXCEL_COL_END = 8;    // columna I (inclusive)
export const TRADI_EXCEL_HEADER_ROW = 8;  // fila 9 en Excel = índice 8
