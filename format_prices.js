const fs = require('fs');
const path = require('path');

// Función para formatear un precio
function formatPrice(priceString) {
  if (!priceString || priceString === '') {
    return priceString;
  }
  
  // Convertir a string si no lo es
  let price = String(priceString);
  
  // Caso 1: Si tiene coma como separador decimal, reemplazar por punto
  if (price.includes(',')) {
    price = price.replace(',', '.');
  }
  
  // Caso 2: Si tiene punto como separador de miles (más de 4 dígitos antes del punto decimal)
  // Buscar el último punto (que sería el separador decimal)
  const lastDotIndex = price.lastIndexOf('.');
  
  if (lastDotIndex > 0) {
    // Verificar si el punto es separador de miles o decimal
    const beforeDot = price.substring(0, lastDotIndex);
    const afterDot = price.substring(lastDotIndex + 1);
    
    // Si después del punto hay más de 2 dígitos, es separador de miles
    if (afterDot.length > 2) {
      // Es separador de miles, eliminar el punto
      price = beforeDot + afterDot;
    }
    // Si después del punto hay 2 dígitos y antes hay más de 3, podría ser separador de miles
    else if (afterDot.length === 2 && beforeDot.length > 3) {
      // Verificar si es realmente separador de miles (ej: "15.697.29")
      const dotsCount = (price.match(/\./g) || []).length;
      if (dotsCount > 1) {
        // Hay múltiples puntos, el último es decimal, los anteriores son separadores de miles
        const parts = price.split('.');
        const decimalPart = parts.pop(); // Última parte es decimal
        const integerPart = parts.join(''); // Unir las demás partes
        price = integerPart + '.' + decimalPart;
      }
    }
  }
  
  return price;
}

// Función principal
function formatPricesInFile() {
  const filePath = '/Users/jcabrera/Downloads/toptec-6a5ef-productos-max-export.json';
  
  try {
    // Leer el archivo
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    
    let changesCount = 0;
    
    // Procesar cada producto
    Object.keys(data).forEach(key => {
      const product = data[key];
      let productChanged = false;
      
      // Formatear precio
      if (product.precio) {
        const originalPrecio = product.precio;
        product.precio = formatPrice(product.precio);
        if (originalPrecio !== product.precio) {
          console.log(`Producto ${product.codigo} - Precio: "${originalPrecio}" → "${product.precio}"`);
          productChanged = true;
        }
      }
      
      // Formatear precioCosto
      if (product.precioCosto) {
        const originalPrecioCosto = product.precioCosto;
        product.precioCosto = formatPrice(product.precioCosto);
        if (originalPrecioCosto !== product.precioCosto) {
          console.log(`Producto ${product.codigo} - PrecioCosto: "${originalPrecioCosto}" → "${product.precioCosto}"`);
          productChanged = true;
        }
      }
      
      // Formatear precioMayorista
      if (product.precioMayorista) {
        const originalPrecioMayorista = product.precioMayorista;
        product.precioMayorista = formatPrice(product.precioMayorista);
        if (originalPrecioMayorista !== product.precioMayorista) {
          console.log(`Producto ${product.codigo} - PrecioMayorista: "${originalPrecioMayorista}" → "${product.precioMayorista}"`);
          productChanged = true;
        }
      }
      
      if (productChanged) {
        changesCount++;
      }
    });
    
    // Escribir el archivo formateado
    const formattedContent = JSON.stringify(data, null, 2);
    const outputPath = '/Users/jcabrera/Downloads/toptec-6a5ef-productos-max-export-formatted.json';
    fs.writeFileSync(outputPath, formattedContent, 'utf8');
    
    console.log(`\n✅ Procesamiento completado:`);
    console.log(`- Productos modificados: ${changesCount}`);
    console.log(`- Archivo formateado guardado en: ${outputPath}`);
    
  } catch (error) {
    console.error('Error procesando el archivo:', error);
  }
}

// Ejecutar el script
formatPricesInFile();
