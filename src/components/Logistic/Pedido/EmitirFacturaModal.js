import React, { useState } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  CircularProgress,
  Alert,
  Divider,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';
import { functionsRegional } from '../../../firebase';
import { getSmartService } from '../../../utils/routeHelper';
import DraftsDataService from '../../../services/drafts.service';

// Issuer configuration (editable constants at top of file)
const ISSUER_CONFIG = {
  condicionIva: 'RI',  // Change to 'MONO' if needed
  ptoVta: 1001,        // Punto de venta PROD: 01001 - RECE para aplicativo y web services
};

// Condición IVA cliente to AFIP Receptor ID
const COND_IVA_TO_RECEPTOR_ID = {
  RI: 1,
  MONO: 6,
  CF: 5,
  EXENTO: 4,
  EX: 4,
};

/**
 * Resolve docTipo from customer condition and dni
 */
function resolveDocTipo(condicionIva, dni) {
  // If dni is 11 digits (CUIT) or RI/MONO → CUIT, else CF
  if (!dni || dni === '0') return 'CF';
  const cleaned = String(dni).replace(/\D/g, '');
  if (cleaned.length === 11) return 'CUIT';
  return 'CF';
}

/**
 * Map condición IVA string to AFIP receptor ID
 */
function condIvaToReceptorId(condicion) {
  const val = COND_IVA_TO_RECEPTOR_ID[condicion];
  return val !== undefined ? val : 5; // default CF
}

/**
 * EmitirFacturaModal component
 * Modal para crear un draft de factura y emitirlo a AFIP
 */
const EmitirFacturaModal = ({ open, onClose, pedido, pedidoKey, currentClient }) => {
  // Form state
  const [formState, setFormState] = useState({
    cbteType: 'FB',
    concepto: 1,
    issuerCondicionIva: ISSUER_CONFIG.condicionIva,
    ptoVta: ISSUER_CONFIG.ptoVta,
    globalIvaRate: 21,
    itemIvaRates: {}, // { [index]: 21 | 10.5 }
    itemTaxModes: {}, // { [index]: 'GRAVADO'|'EXENTO'|'NOGRAVADO' }
  });

  // Flow state
  const [phase, setPhase] = useState('form'); // 'form' | 'submitting' | 'success' | 'error'
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFormChange = (key, value) => {
    setFormState((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleItemIvaChange = (index, value) => {
    setFormState((prev) => ({
      ...prev,
      itemIvaRates: { ...prev.itemIvaRates, [index]: value },
    }));
  };

  const handleItemTaxModeChange = (index, value) => {
    setFormState((prev) => ({
      ...prev,
      itemTaxModes: { ...prev.itemTaxModes, [index]: value },
    }));
  };

  const buildDraft = () => {
    const cbte = {
      type: formState.cbteType,
      fecha: moment().format('YYYYMMDD'),
      concepto: formState.concepto,
      moneda: 'PES',
      cotizacion: 1,
    };

    const issuer = {
      condicionIva: formState.issuerCondicionIva,
      ptoVta: Number(formState.ptoVta),
    };

    const isFacturaA = formState.cbteType === 'FA';
    const dniClean = String(currentClient.dni || '0').replace(/\D/g, '');
    const docTipo = resolveDocTipo(formState.issuerCondicionIva, dniClean);
    const customer = {
      docTipo,
      docNro: dniClean,
      // Factura A requiere receptor RI (ID=1) con CUIT obligatoriamente
      condicionIvaReceptorId: isFacturaA ? 1 : condIvaToReceptorId(currentClient.condicionIva),
    };

    const items = (pedido.productos || []).map((prod, i) => {
      const ivaRate = formState.itemIvaRates[i] ?? formState.globalIvaRate;
      const taxMode = formState.itemTaxModes[i] ?? 'GRAVADO';

      // Calculate net price (without IVA)
      let unitPriceNet;
      if (taxMode === 'GRAVADO') {
        unitPriceNet = prod.precio / (1 + ivaRate / 100);
      } else {
        unitPriceNet = prod.precio;
      }

      // Discount as fixed amount (not percentage)
      const descuentoPct = parseFloat(prod.descuento) || 0;
      const discount = prod.cantidad * unitPriceNet * (descuentoPct / 100);

      return {
        description: prod.descripcion,
        qty: prod.cantidad,
        unitPriceNet: Math.round(unitPriceNet * 10000) / 10000,
        discount: Math.round(discount * 100) / 100,
        tax: {
          mode: taxMode,
          ...(taxMode === 'GRAVADO' ? { ivaRate } : {}),
        },
        _meta: {
          codigo: prod.codigo,
          precioConIva: prod.precio,
          descuento: prod.descuento,
        },
      };
    });

    return {
      status: 'DRAFT',
      createdAt: Date.now(),
      cbte,
      issuer,
      customer,
      items,
      _meta: {
        pedidoId: pedido.id,
        clienteName: pedido.clienteName,
        clienteDomicilio: pedido.clienteDomicilio,
        user: pedido.user,
      },
    };
  };

  const handleSubmit = async () => {
    try {
      // Validation
      console.log('🔍 Validando cliente y productos...');
      if (!currentClient.dni || currentClient.dni === '0') {
        console.error('❌ CUIT/DNI faltante');
        setError('CUIT/DNI del cliente requerido');
        setPhase('error');
        return;
      }

      if (formState.cbteType === 'FA') {
        const cuitClean = String(currentClient.dni || '').replace(/\D/g, '');
        if (cuitClean.length !== 11) {
          setError('Factura A requiere que el cliente tenga CUIT (11 dígitos)');
          setPhase('error');
          return;
        }
      }

      if (!pedido.productos || pedido.productos.length === 0) {
        console.error('❌ No hay productos');
        setError('El pedido debe tener al menos un producto');
        setPhase('error');
        return;
      }

      console.log('✅ Validación OK');
      setPhase('submitting');

      // Build draft
      console.log('📝 Construyendo draft...');
      const draft = buildDraft();
      console.log('✅ Draft construido:', draft);

      // Create draft in RTDB
      console.log('📝 Guardando draft en RTDB...');
      const ref = await DraftsDataService.create(draft);
      const draftId = ref.key;
      console.log('✅ Draft creado con ID:', draftId);

      // Call Cloud Function via POST with CORS
      console.log('🚀 Llamando Cloud Function...');
      const endpoint = 'https://emitinvoice-tp2smwpmrq-rj.a.run.app';
      console.log('🌐 Endpoint:', endpoint);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId }),
      });

      console.log('📡 Respuesta recibida, status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Cloud Function error:', error);
        throw new Error(error.error || response.statusText);
      }

      const resultData = await response.json();
      console.log('✅ Datos de respuesta:', resultData);
      console.log('📄 PDF URL:', resultData.pdfUrl ? 'Disponible ✅' : 'No disponible ❌');
      setResult(resultData);

      // Update pedido with AFIP status
      console.log('📋 Actualizando pedido con estado AFIP...');
      const PedidosService = getSmartService('pedidos');
      await PedidosService.update(pedidoKey, {
        afipStatus: 'EMITTED',
        afipInvoiceId: resultData.invoiceId,
        afipCae: resultData.afip.cae,
        afipCaeVto: resultData.afip.caeVto,
        afipCbteNro: resultData.afip.cbteNro,
        afipPdfUrl: resultData.pdfUrl || null,
      });
      console.log('✅ Pedido actualizado');

      setPhase('success');
    } catch (err) {
      console.error('💥 Error completo:', err);
      setError(err.message || 'Error al emitir comprobante');
      setPhase('error');
    }
  };

  const handleReset = () => {
    setPhase('form');
    setError(null);
    setResult(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (!pedido || !currentClient) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Emitir Factura AFIP</DialogTitle>

      <DialogContent>
        {/* FORM PHASE */}
        {phase === 'form' && (
          <>
            {/* Row 1: Invoice type + Concepto + IVA global */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Tipo Comprobante</InputLabel>
                <Select
                  value={formState.cbteType}
                  onChange={(e) => handleFormChange('cbteType', e.target.value)}
                  label="Tipo Comprobante"
                >
                  <MenuItem value="FA">Factura A</MenuItem>
                  <MenuItem value="FB">Factura B</MenuItem>
                  <MenuItem value="FC">Factura C</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Concepto</InputLabel>
                <Select
                  value={formState.concepto}
                  onChange={(e) => handleFormChange('concepto', e.target.value)}
                  label="Concepto"
                >
                  <MenuItem value={1}>Productos</MenuItem>
                  <MenuItem value={2}>Servicios</MenuItem>
                  <MenuItem value={3}>Productos y Servicios</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>IVA Global</InputLabel>
                <Select
                  value={formState.globalIvaRate}
                  onChange={(e) => handleFormChange('globalIvaRate', e.target.value)}
                  label="IVA Global"
                >
                  <MenuItem value={21}>21%</MenuItem>
                  <MenuItem value={10.5}>10.5%</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Row 2: Issuer settings */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Cond. IVA Emisor</InputLabel>
                <Select
                  value={formState.issuerCondicionIva}
                  onChange={(e) => handleFormChange('issuerCondicionIva', e.target.value)}
                  label="Cond. IVA Emisor"
                >
                  <MenuItem value="RI">Responsable Inscripto</MenuItem>
                  <MenuItem value="MONO">Monotributo</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Punto de Venta"
                type="number"
                value={formState.ptoVta}
                disabled
                onChange={(e) => handleFormChange('ptoVta', Number(e.target.value))}
                fullWidth
              />
            </Box>

            {/* Row 3: Customer info (read-only) */}
            <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="subtitle2">Cliente</Typography>
              <Typography>{pedido.clienteName}</Typography>
              <Typography>CUIT: {currentClient.dni || '—'}</Typography>
              <Typography>Cond. IVA: {currentClient.condicionIva || '—'}</Typography>
            </Box>

            {/* Row 4: Items table with per-item IVA override */}
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2">Items ({pedido.productos?.length})</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Descripción</TableCell>
                  <TableCell align="right">Cant.</TableCell>
                  <TableCell align="right">Precio</TableCell>
                  <TableCell align="right">Dto.</TableCell>
                  <TableCell width={120}>IVA</TableCell>
                  <TableCell width={140}>Tipo</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pedido.productos?.map((prod, i) => (
                  <TableRow key={i}>
                    <TableCell>{prod.descripcion}</TableCell>
                    <TableCell align="right">{prod.cantidad}</TableCell>
                    <TableCell align="right">${Number(prod.precio).toFixed(2)}</TableCell>
                    <TableCell align="right">{prod.descuento || 0}%</TableCell>
                    <TableCell>
                      <Select
                        size="small"
                        value={formState.itemIvaRates[i] ?? formState.globalIvaRate}
                        onChange={(e) => handleItemIvaChange(i, e.target.value)}
                      >
                        <MenuItem value={21}>21%</MenuItem>
                        <MenuItem value={10.5}>10.5%</MenuItem>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        size="small"
                        value={formState.itemTaxModes[i] ?? 'GRAVADO'}
                        onChange={(e) => handleItemTaxModeChange(i, e.target.value)}
                      >
                        <MenuItem value="GRAVADO">Gravado</MenuItem>
                        <MenuItem value="EXENTO">Exento</MenuItem>
                        <MenuItem value="NOGRAVADO">No Gravado</MenuItem>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}

        {/* SUBMITTING PHASE */}
        {phase === 'submitting' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Procesando con AFIP...</Typography>
          </Box>
        )}

        {/* SUCCESS PHASE */}
        {phase === 'success' && result && (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              Comprobante emitido exitosamente
            </Alert>
            <Box sx={{ p: 2 }}>
              <Typography>
                <strong>CAE:</strong> {result.afip?.cae}
              </Typography>
              <Typography>
                <strong>Vto. CAE:</strong> {result.afip?.caeVto}
              </Typography>
              <Typography>
                <strong>Nro. Comprobante:</strong> {result.afip?.cbteNro}
              </Typography>
              {result.pdfUrl && (
                <Button
                  variant="outlined"
                  href={result.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ mt: 2 }}
                >
                  Descargar PDF
                </Button>
              )}
            </Box>
          </Box>
        )}

        {/* ERROR PHASE */}
        {phase === 'error' && (
          <Alert severity="error">{error}</Alert>
        )}
      </DialogContent>

      <DialogActions>
        {phase === 'form' && (
          <>
            <Button onClick={handleClose}>Cancelar</Button>
            <Button variant="contained" color="primary" onClick={handleSubmit}>
              Emitir a AFIP
            </Button>
          </>
        )}

        {phase === 'success' && (
          <Button onClick={handleClose}>Cerrar</Button>
        )}

        {phase === 'error' && (
          <>
            <Button onClick={handleReset}>Volver</Button>
            <Button onClick={handleClose}>Cancelar</Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

EmitirFacturaModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  pedido: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    clienteName: PropTypes.string,
    clienteDomicilio: PropTypes.string,
    user: PropTypes.string,
    productos: PropTypes.arrayOf(
      PropTypes.shape({
        codigo: PropTypes.string,
        descripcion: PropTypes.string,
        cantidad: PropTypes.number,
        precio: PropTypes.number,
        descuento: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      })
    ),
  }).isRequired,
  pedidoKey: PropTypes.string.isRequired,
  currentClient: PropTypes.shape({
    dni: PropTypes.string,
    condicionIva: PropTypes.string,
  }).isRequired,
};

export default EmitirFacturaModal;
