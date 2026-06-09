const PDFDocument = require('pdfkit');

/**
 * Generate invoice PDF in ARCA format
 * @param {object} opts
 * @param {object} opts.draft - the full RTDB draft object
 * @param {object} opts.afip - afipBlock from emitComprobante with cae, caeVto, cbteNro
 * @param {string} opts.invoiceId
 * @param {object} opts.totals - computed totals snapshot
 * @returns {Promise<Buffer>}
 */
async function generateInvoicePdf(opts) {
  const { draft, afip, invoiceId, totals } = opts;

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 30, size: 'A4' });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const meta = draft._meta || {};
      const cbte = draft.cbte || {};
      const issuer = draft.issuer || {};
      const customer = draft.customer || {};
      const items = draft.items || [];

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const margin = 30;
      const contentWidth = pageWidth - 2 * margin;

      // ========== HEADER: ORIGINAL / DUPLICADO / TRIPLICADO ==========
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000').text('ORIGINAL', margin, 20);

      // ========== COMPANY INFO + INVOICE TYPE ==========
      const headerY = 45;

      // Left side: Company name + address
      doc.fontSize(14)
        .font('Helvetica-Bold')
        .text('ESCOBAL RODRIGO', margin, headerY);

      doc.fontSize(9)
        .font('Helvetica')
        .text('Razón Social: ESCOBAL RODRIGO', margin, headerY + 20);

      doc.text('Domicilio Comercial: Las Rosas 252 - Mendiolaza, Córdoba', margin, headerY + 32);

      doc.fontSize(9)
        .font('Helvetica')
        .text('Condición frente al IVA: IVA Responsable Inscripto', margin, headerY + 44);

      // Right side: Invoice type letter (A, B, C)
      const letterSize = 60;
      const letterX = pageWidth - margin - letterSize;
      const letterY = headerY - 10;

      doc.rect(letterX, letterY, letterSize, letterSize).stroke();
      doc.fontSize(48)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text(cbte.type?.slice(-1) || 'A', letterX, letterY + 5, { width: letterSize, align: 'center' });

      // Right side: Invoice details
      const detailsX = pageWidth - margin - 200;
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .text(`FACTURA`, detailsX, headerY);

      doc.fontSize(10)
        .font('Helvetica')
        .text(`Punto de Venta: ${String(issuer.ptoVta || 0).padStart(5, '0')}`, detailsX, headerY + 18);

      doc.text(`Comp. Nro: ${String(afip.cbteNro || 0).padStart(8, '0')}`, detailsX, headerY + 30);

      doc.text(`Fecha de Emisión: ${formatDateDDMMYYYY(cbte.fecha)}`, detailsX, headerY + 42);

      doc.text(`CUIT: ${issuer._meta?.cuit || '20355283403'}`, detailsX, headerY + 54);

      doc.fontSize(8).text(`Ingresos Brutos: 02/09/2020`, detailsX, headerY + 64);
      doc.text(`Fecha de Inicio de Actividades: 02/09/2020`, detailsX, headerY + 72);

      // ========== SEPARATOR LINE ==========
      const separatorY = headerY + 95;
      doc.moveTo(margin, separatorY).lineTo(pageWidth - margin, separatorY).stroke();

      // ========== CLIENT INFO SECTION ==========
      const clientY = separatorY + 15;
      doc.fontSize(9).font('Helvetica');

      doc.text(`CUIT: ${customer.docNro || '0'}`, margin, clientY);
      doc.text(`Apellido y Nombre / Razón Social: ${meta.clienteName || 'N/A'}`, margin, clientY + 12);
      doc.text(`Condición frente al IVA: ${getCondicionIvaName(customer.condicionIvaReceptorId)}`, margin, clientY + 24);
      doc.text(`Condición de venta: Contado`, margin, clientY + 36);
      doc.text(`Domicilio Comercial: ${meta.clienteDomicilio || ''}`, margin, clientY + 48);

      // ========== ITEMS TABLE ==========
      const tableY = clientY + 70;
      const colWidths = {
        codigo: 40,
        producto: 150,
        cantidad: 45,
        umedida: 45,
        precioUnit: 55,
        bonif: 40,
        subtotal: 50,
        alicuota: 40,
        subtotalConIva: 50,
      };

      // Table header
      doc.fontSize(8)
        .font('Helvetica-Bold')
        .fillColor('#ffffff')
        .rect(margin, tableY, contentWidth, 18)
        .fill('#333333');

      let colX = margin + 3;
      doc.fillColor('#ffffff')
        .text('Código', colX, tableY + 4, { width: colWidths.codigo, height: 15 });
      colX += colWidths.codigo;

      doc.text('Producto / Servicio', colX, tableY + 4, { width: colWidths.producto, height: 15 });
      colX += colWidths.producto;

      doc.text('Cantidad', colX, tableY + 4, { width: colWidths.cantidad, align: 'center', height: 15 });
      colX += colWidths.cantidad;

      doc.text('U.medida', colX, tableY + 4, { width: colWidths.umedida, align: 'center', height: 15 });
      colX += colWidths.umedida;

      doc.text('Precio Unit.', colX, tableY + 4, { width: colWidths.precioUnit, align: 'right', height: 15 });
      colX += colWidths.precioUnit;

      doc.text('% Bonif', colX, tableY + 4, { width: colWidths.bonif, align: 'right', height: 15 });
      colX += colWidths.bonif;

      doc.text('Subtotal', colX, tableY + 4, { width: colWidths.subtotal, align: 'right', height: 15 });
      colX += colWidths.subtotal;

      doc.text('Alícuota IVA', colX, tableY + 4, { width: colWidths.alicuota, align: 'center', height: 15 });
      colX += colWidths.alicuota;

      doc.text('Subtotal c/IVA', colX, tableY + 4, { width: colWidths.subtotalConIva, align: 'right', height: 15 });

      // Table rows
      let rowY = tableY + 18;
      doc.fontSize(8).font('Helvetica').fillColor('#000000');

      items.forEach((item, index) => {
        const itemMeta = item._meta || {};
        const rowHeight = 12;

        // Alternate row colors
        if (index % 2 === 0) {
          doc.fillColor('#f5f5f5').rect(margin, rowY, contentWidth, rowHeight).fill();
          doc.fillColor('#000000');
        }

        const codigo = itemMeta.codigo || '';
        const descripcion = item.description || '';
        const cantidad = String(item.qty || 0);
        const umedida = 'unidades';
        const precioUnit = Number(item.unitPriceNet || 0).toFixed(2);
        const bonif = Number(item.discount || 0).toFixed(2);
        const subtotal = (item.qty * item.unitPriceNet - item.discount).toFixed(2);
        const alicuota = item.tax?.ivaRate || '0%';
        const subtotalConIva = (item.qty * item.unitPriceNet - item.discount + (item.qty * item.unitPriceNet - item.discount) * (item.tax?.ivaRate || 0) / 100).toFixed(2);

        colX = margin + 3;
        doc.text(codigo, colX, rowY + 2, { width: colWidths.codigo });
        colX += colWidths.codigo;

        doc.text(descripcion, colX, rowY + 2, { width: colWidths.producto });
        colX += colWidths.producto;

        doc.text(cantidad, colX, rowY + 2, { width: colWidths.cantidad, align: 'center' });
        colX += colWidths.cantidad;

        doc.text(umedida, colX, rowY + 2, { width: colWidths.umedida, align: 'center' });
        colX += colWidths.umedida;

        doc.text(`$${precioUnit}`, colX, rowY + 2, { width: colWidths.precioUnit, align: 'right' });
        colX += colWidths.precioUnit;

        doc.text(bonif, colX, rowY + 2, { width: colWidths.bonif, align: 'right' });
        colX += colWidths.bonif;

        doc.text(`$${subtotal}`, colX, rowY + 2, { width: colWidths.subtotal, align: 'right' });
        colX += colWidths.subtotal;

        doc.text(`${alicuota}%`, colX, rowY + 2, { width: colWidths.alicuota, align: 'center' });
        colX += colWidths.alicuota;

        doc.text(`$${subtotalConIva}`, colX, rowY + 2, { width: colWidths.subtotalConIva, align: 'right' });

        rowY += rowHeight;
      });

      // ========== TOTALS SECTION ==========
      const totalsY = rowY + 10;
      doc.moveTo(margin, totalsY).lineTo(pageWidth - margin, totalsY).stroke();

      const totalsStartY = totalsY + 12;
      const totalsLabelX = pageWidth - margin - 180;
      const totalsValueX = pageWidth - margin - 60;

      doc.fontSize(8).font('Helvetica');

      let ivaY = totalsStartY;

      doc.text('Importe Otros Tributos: $', totalsLabelX, ivaY);
      doc.text('0,00', totalsValueX, ivaY, { align: 'right' });
      ivaY += 10;

      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('Importe Neto Gravado: $', totalsLabelX, ivaY);
      doc.text(Number(totals.neto || 0).toFixed(2), totalsValueX, ivaY, { align: 'right' });
      ivaY += 10;

      doc.fontSize(8).font('Helvetica');

      if (totals.iva27 > 0) {
        doc.text('IVA 27%: $', totalsLabelX, ivaY);
        doc.text(Number(totals.iva27 || 0).toFixed(2), totalsValueX, ivaY, { align: 'right' });
        ivaY += 9;
      }

      if (totals.iva21 > 0) {
        doc.text('IVA 21%: $', totalsLabelX, ivaY);
        doc.text(Number(totals.iva21 || 0).toFixed(2), totalsValueX, ivaY, { align: 'right' });
        ivaY += 9;
      }

      if (totals.iva105 > 0) {
        doc.text('IVA 10.5%: $', totalsLabelX, ivaY);
        doc.text(Number(totals.iva105 || 0).toFixed(2), totalsValueX, ivaY, { align: 'right' });
        ivaY += 9;
      }

      if (totals.iva5 > 0) {
        doc.text('IVA 5%: $', totalsLabelX, ivaY);
        doc.text(Number(totals.iva5 || 0).toFixed(2), totalsValueX, ivaY, { align: 'right' });
        ivaY += 9;
      }

      if (totals.exento > 0) {
        doc.text('Exento: $', totalsLabelX, ivaY);
        doc.text(Number(totals.exento || 0).toFixed(2), totalsValueX, ivaY, { align: 'right' });
        ivaY += 9;
      }

      if (totals.noGravado > 0) {
        doc.text('No Gravado: $', totalsLabelX, ivaY);
        doc.text(Number(totals.noGravado || 0).toFixed(2), totalsValueX, ivaY, { align: 'right' });
        ivaY += 9;
      }

      doc.text('Importe Otros Tributos: $', totalsLabelX, ivaY);
      doc.text('0,00', totalsValueX, ivaY, { align: 'right' });
      ivaY += 10;

      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Importe Total: $', totalsLabelX, ivaY);
      doc.text(Number(totals.total || 0).toFixed(2), totalsValueX, ivaY, { align: 'right' });

      // ========== FOOTER ==========
      const footerY = pageHeight - 60;
      doc.moveTo(margin, footerY).lineTo(pageWidth - margin, footerY).stroke();

      doc.fontSize(9).font('Helvetica');
      doc.text('Pág. 1/1', pageWidth / 2 - 20, footerY + 10, { align: 'center' });

      doc.fontSize(8);
      doc.text('ARCA', pageWidth / 2 + 80, footerY + 10);
      doc.text('Comprobante Autorizado', pageWidth / 2 + 80, footerY + 22);

      doc.text(`CAE Nº: ${afip.cae || 'N/A'}`, pageWidth / 2 - 100, footerY + 10);
      doc.text(`Fecha de Vto. de CAE: ${formatDateDDMMYYYY(afip.caeVto)}`, pageWidth / 2 - 100, footerY + 22);

      doc.fontSize(7).fillColor('#666666');
      doc.text('Esta Agencia no se responsabiliza por los datos ingresados en el detalle de la operación', margin, footerY + 40, {
        width: contentWidth,
        align: 'center',
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Format YYYYMMDD to DD/MM/YYYY
 */
function formatDateDDMMYYYY(dateStr) {
  if (!dateStr || dateStr.length !== 8) return 'N/A';
  const year = dateStr.slice(0, 4);
  const month = dateStr.slice(4, 6);
  const day = dateStr.slice(6, 8);
  return `${day}/${month}/${year}`;
}

/**
 * Get condition IVA name
 */
function getCondicionIvaName(id) {
  const map = {
    1: 'IVA Responsable Inscripto',
    6: 'Monotributo',
    5: 'Consumidor Final',
    4: 'Exento',
  };
  return map[id] || 'N/A';
}

module.exports = { generateInvoicePdf };
