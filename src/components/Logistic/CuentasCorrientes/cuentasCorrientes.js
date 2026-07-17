import React, { useState, useEffect } from "react";
import { Toast } from "antd-mobile";
import moment from "moment";
import {
  Box,
  TextField,
  Collapse,
  Table,
  TableBody,
  TableContainer,
  TableCell,
  IconButton,
  Button,
  Paper,
  TableHead,
  TableRow,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  InputAdornment,
  Card,
  CardContent,
  Grid,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import PaymentIcon from "@mui/icons-material/Payment";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import * as XLSX from "xlsx";
import { getSmartService, generateSmartRoute } from "../../../utils/routeHelper";

const CuentasCorrientes = () => {
  const [cuentas, setCuentas] = useState([]);
  const [cuentasFilter, setCuentasFilter] = useState([]);
  const [searchTitle, setSearchTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);

  // Estados para Registrar Pago
  const [openPagoDialog, setOpenPagoDialog] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [montoAbono, setMontoAbono] = useState("");
  const [comentariosPago, setComentariosPago] = useState("");

  const [cuentasBancarias, setCuentasBancarias] = useState([]);
  const [selectedCuentaId, setSelectedCuentaId] = useState("");
  const [depositarBanco, setDepositarBanco] = useState(false);

  useEffect(() => {
    const CuentasBancoService = getSmartService('cuentasBanco');
    if (CuentasBancoService) {
      CuentasBancoService.getAll().once("value", (snapshot) => {
        const list = [];
        snapshot.forEach((item) => {
          list.push({ key: item.key, ...item.val() });
        });
        setCuentasBancarias(list);
        if (list.length > 0) {
          setSelectedCuentaId(list[0].key);
          setDepositarBanco(true);
        }
      });
    }
  }, []);

  const processCuentas = (clients, pedidos) => {
    // Filtrar pedidos que sean "Cta Corriente / Entregado" y tengan saldo pendiente > 0
    const pendingPedidos = pedidos.filter(
      (p) => p.status === "Cta Corriente / Entregado" && p.saldoPendiente > 0
    );

    // Agrupar pedidos pendientes por cliente
    const grouped = {};
    pendingPedidos.forEach((p) => {
      const idCliente = p.idCliente;
      if (!grouped[idCliente]) {
        const cli = clients.find((c) => c.id === idCliente) || {};
        grouped[idCliente] = {
          idCliente,
          clienteName: p.clienteName || cli.razonSocial || "Cliente Desconocido",
          domicilio: p.clienteDomicilio || cli.domicilio || "-",
          telefono: cli.telefono || "-",
          pedidos: [],
          saldoTotal: 0,
        };
      }
      grouped[idCliente].pedidos.push(p);
      grouped[idCliente].saldoTotal += p.saldoPendiente;
    });

    const list = Object.values(grouped);
    // Ordenar alfabéticamente por cliente
    list.sort((a, b) => a.clienteName.localeCompare(b.clienteName));
    setCuentas(list);
    setCuentasFilter(list);
    setLoading(false);
  };

  useEffect(() => {
    const PedidosService = getSmartService('pedidos');
    const ClientsService = getSmartService('clientes');

    if (!PedidosService || !ClientsService) {
      setLoading(false);
      return;
    }

    let currentClients = [];
    let currentPedidos = [];

    const onClientsChange = (snapshot) => {
      const clientsData = [];
      snapshot.forEach((item) => {
        const data = item.val();
        clientsData.push({
          key: item.key,
          id: data.id,
          razonSocial: data.razon_social || data.clienteName || "",
          domicilio: data.domicilio || "",
          telefono: data.telefono || "",
        });
      });
      currentClients = clientsData;
      processCuentas(currentClients, currentPedidos);
    };

    const onPedidosChange = (snapshot) => {
      const pedidosData = [];
      snapshot.forEach((item) => {
        const data = item.val();
        const total = isNaN(parseFloat(data.total)) ? 0 : parseFloat(data.total);
        
        let defaultMontoPagado = 0;
        let defaultSaldoPendiente = 0;
        if (data.status === "Pagado / Entregado") {
          defaultMontoPagado = total;
          defaultSaldoPendiente = 0;
        } else if (data.status === "Cta Corriente / Entregado") {
          defaultMontoPagado = 0;
          defaultSaldoPendiente = total;
        }

        const resolvedMontoPagado = data.montoPagado !== undefined ? parseFloat(data.montoPagado) : defaultMontoPagado;
        const resolvedSaldoPendiente = data.status === "Cta Corriente / Entregado"
          ? Math.max(0, total - resolvedMontoPagado)
          : (data.status === "Pagado / Entregado" ? 0 : (data.saldoPendiente !== undefined ? parseFloat(data.saldoPendiente) : defaultSaldoPendiente));

        pedidosData.push({
          key: item.key,
          id: data.id,
          idCliente: data.idCliente,
          clienteName: data.clienteName,
          clienteDomicilio: data.clienteDomicilio,
          fecha: data.fecha,
          status: data.status,
          total: total,
          montoPagado: resolvedMontoPagado,
          saldoPendiente: resolvedSaldoPendiente,
        });
      });
      currentPedidos = pedidosData;
      processCuentas(currentClients, currentPedidos);
    };

    ClientsService.getAll().on("value", onClientsChange);
    PedidosService.getAll().on("value", onPedidosChange);

    return () => {
      ClientsService.getAll().off("value", onClientsChange);
      PedidosService.getAll().off("value", onPedidosChange);
    };
  }, []);

  const searchClient = (e) => {
    const query = e.target.value;
    setSearchTitle(query);
    if (!query) {
      setCuentasFilter(cuentas);
      return;
    }
    const filtered = cuentas.filter((c) =>
      c.clienteName.toLowerCase().includes(query.toLowerCase())
    );
    setCuentasFilter(filtered);
  };

  const toggleRowExpansion = (idCliente) => {
    setExpandedRow(expandedRow === idCliente ? null : idCliente);
  };

  const handleOpenPago = (pedido) => {
    setPedidoSeleccionado(pedido);
    setMontoAbono(pedido.saldoPendiente.toFixed(2));
    setComentariosPago("");
    setOpenPagoDialog(true);
  };

  const handleSavePago = () => {
    const abono = parseFloat(parseFloat(montoAbono).toFixed(2));
    const pendingRounded = parseFloat(pedidoSeleccionado.saldoPendiente.toFixed(2));
    if (abono > pendingRounded) {
      Toast.fail(`El monto no puede superar el saldo pendiente de $${pendingRounded.toFixed(2)}`, 2);
      return;
    }

    const PedidosService = getSmartService('pedidos');
    const nuevoSaldo = Math.max(0, parseFloat((pedidoSeleccionado.saldoPendiente - abono).toFixed(2)));
    const nuevoMontoPagado = (pedidoSeleccionado.montoPagado || 0) + abono;

    const updateData = {
      montoPagado: nuevoMontoPagado,
      saldoPendiente: nuevoSaldo,
    };

    if (nuevoSaldo === 0) {
      updateData.status = "Pagado / Entregado";
    }

    // Agregar un registro simple de cobro en datos de pago si procede
    if (comentariosPago.trim()) {
      updateData.datosPago = {
        comentariosCobro: comentariosPago
      };
    }

    PedidosService.update(pedidoSeleccionado.key, updateData)
      .then(() => {
        if (depositarBanco && selectedCuentaId) {
          const LibroBancoService = getSmartService('libroBanco');
          const CuentasBancoService = getSmartService('cuentasBanco');
          const cuentaSeleccionada = cuentasBancarias.find(c => c.key === selectedCuentaId);
          if (cuentaSeleccionada) {
            const nuevoSaldoBanco = (cuentaSeleccionada.saldoActual || 0) + abono;
            const movimiento = {
              fecha: moment().format("DD-MM-YYYY"),
              concepto: `Cobro Pedido #${pedidoSeleccionado.id} - Cliente: ${pedidoSeleccionado.clienteName}`,
              monto: abono,
              estado: "vinculado",
              tipoVinculo: "cliente",
              idVinculo: pedidoSeleccionado.key,
              cuentaId: selectedCuentaId,
              referenciaAdicional: `Cobro Cta. Corriente. Comentarios: ${comentariosPago}`,
              fechaCreacion: new Date().toISOString()
            };
            return Promise.all([
              LibroBancoService.create(movimiento),
              CuentasBancoService.update(selectedCuentaId, { saldoActual: nuevoSaldoBanco })
            ]);
          }
        }
      })
      .then(() => {
        Toast.success("Pago registrado con éxito!", 1);
        setOpenPagoDialog(false);
        setPedidoSeleccionado(null);
      })
      .catch((e) => {
        console.error("Error al registrar pago:", e);
        Toast.fail("Ocurrió un error al registrar el cobro", 2);
      });
  };

  const handleExportExcel = () => {
    if (cuentasFilter.length === 0) return;

    const wb = XLSX.utils.book_new();
    const rows = [
      ["CLIENTE / PEDIDO #", "FECHA", "TOTAL PEDIDO", "MONTO PAGADO", "SALDO PENDIENTE", "DOMICILIO / COMENTARIOS DE COBRO", "TELÉFONO"]
    ];

    cuentasFilter.forEach((c) => {
      // Fila principal del Cliente
      rows.push([
        c.clienteName.toUpperCase(),
        "",
        "",
        "",
        c.saldoTotal,
        c.domicilio,
        c.telefono
      ]);

      // Filas de detalle de pedidos
      c.pedidos.forEach((p) => {
        rows.push([
          `  Pedido #${p.id}`,
          p.fecha,
          p.total,
          p.montoPagado || 0,
          p.saldoPendiente,
          p.datosPago?.comentariosCobro || p.datosPago?.comentariosPago || "-",
          ""
        ]);
      });

      // Fila vacía de separación
      rows.push(["", "", "", "", "", "", ""]);
    });

    // Fila total general
    rows.push([
      "TOTAL DE SALDOS GENERAL",
      "",
      "",
      "",
      totalCuentasPorCobrar,
      "",
      ""
    ]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [
      { wch: 30 }, // Cliente / Pedido #
      { wch: 15 }, // Fecha
      { wch: 15 }, // Total
      { wch: 15 }, // Monto Pagado
      { wch: 18 }, // Saldo Pendiente
      { wch: 45 }, // Domicilio / Comentarios
      { wch: 15 }  // Teléfono
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Cta Cte Clientes Detalle");
    XLSX.writeFile(wb, `Cuentas_Corrientes_Detalle_${moment().format("DD-MM-YYYY")}.xlsx`);
  };

  // Calcular total general de cuentas por cobrar
  const totalCuentasPorCobrar = cuentas.reduce((sum, item) => sum + item.saldoTotal, 0);

  return (
    <Box sx={{ p: 2 }}>
      {/* Botón Volver */}
      <Box sx={{ mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          href={generateSmartRoute('/list-pedidos')}
          color="inherit"
        >
          Volver a Pedidos
        </Button>
      </Box>

      {/* Título de la sección */}
      <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1, color: "#1976d2" }}>
        Módulo de Cuentas Corrientes
      </Typography>
      <Typography variant="subtitle1" sx={{ color: "#666", mb: 3 }}>
        Control de saldos y cobros pendientes por cliente y pedido.
      </Typography>

      {/* Grid de Resumen */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: "#fff8e1", borderLeft: "5px solid #ffb300", boxShadow: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                TOTAL CUENTAS POR COBRAR
              </Typography>
              <Typography variant="h3" component="div" sx={{ fontWeight: "bold", color: "#b78103" }}>
                ${totalCuentasPorCobrar.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: "#e3f2fd", borderLeft: "5px solid #1e88e5", boxShadow: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                CLIENTES CON SALDO PENDIENTE
              </Typography>
              <Typography variant="h3" component="div" sx={{ fontWeight: "bold", color: "#1565c0" }}>
                {cuentas.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Buscador */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <TextField
          label="Buscar cliente..."
          variant="outlined"
          size="small"
          value={searchTitle}
          onChange={searchClient}
          sx={{ width: { xs: "100%", sm: "350px" } }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="outlined"
          color="success"
          startIcon={<FileDownloadIcon />}
          onClick={handleExportExcel}
          disabled={cuentasFilter.length === 0}
        >
          Exportar Saldos Excel
        </Button>
      </Box>

      {/* Tabla de Clientes con Cuentas Corrientes */}
      <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
        <Table aria-label="collapsible table">
          <TableHead sx={{ bgcolor: "#f5f5f5" }}>
            <TableRow>
              <TableCell width="50" />
              <TableCell sx={{ fontWeight: "bold" }}>Cliente</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Domicilio</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Teléfono</TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>Saldo Acumulado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3, color: "#666", fontStyle: "italic" }}>
                  Cargando cuentas corrientes...
                </TableCell>
              </TableRow>
            ) : cuentasFilter.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3, color: "#666", fontStyle: "italic" }}>
                  No se encontraron cuentas corrientes pendientes
                </TableCell>
              </TableRow>
            ) : (
              cuentasFilter.map((row) => (
                <React.Fragment key={row.idCliente}>
                  <TableRow hover sx={{ cursor: "pointer", '& > *': { borderBottom: 'unset' } }} onClick={() => toggleRowExpansion(row.idCliente)}>
                    <TableCell onClick={(e) => { e.stopPropagation(); toggleRowExpansion(row.idCliente); }}>
                      <IconButton size="small">
                        {expandedRow === row.idCliente ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                      </IconButton>
                    </TableCell>
                    <TableCell component="th" scope="row" sx={{ fontWeight: "bold" }}>
                      {row.clienteName}
                    </TableCell>
                    <TableCell>{row.domicilio}</TableCell>
                    <TableCell>{row.telefono}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold", color: "#d32f2f", fontSize: "1.1rem" }}>
                      ${row.saldoTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
                      <Collapse in={expandedRow === row.idCliente} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 2, p: 2, bgcolor: "#fafafa", borderRadius: 1, border: "1px solid #e0e0e0" }}>
                          <Typography variant="h6" gutterBottom component="div" sx={{ color: "#1976d2", display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ReceiptLongIcon fontSize="small" />
                            Pedidos Pendientes
                          </Typography>
                          <Table size="small" aria-label="purchases">
                            <TableHead>
                              <TableRow sx={{ bgcolor: "#eee" }}>
                                <TableCell sx={{ fontWeight: "bold" }}>Pedido ID</TableCell>
                                <TableCell sx={{ fontWeight: "bold" }}>Fecha</TableCell>
                                <TableCell align="right" sx={{ fontWeight: "bold" }}>Total Pedido</TableCell>
                                <TableCell align="right" sx={{ fontWeight: "bold" }}>Monto Pagado</TableCell>
                                <TableCell align="right" sx={{ fontWeight: "bold" }}>Saldo Pendiente</TableCell>
                                <TableCell align="center" sx={{ fontWeight: "bold" }}>Acciones</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {row.pedidos.map((pedido) => (
                                <TableRow key={pedido.id} hover>
                                  <TableCell sx={{ fontWeight: "bold" }}>#{pedido.id}</TableCell>
                                  <TableCell>{pedido.fecha}</TableCell>
                                  <TableCell align="right">${pedido.total.toFixed(2)}</TableCell>
                                  <TableCell align="right" sx={{ color: "#2e7d32" }}>${pedido.montoPagado.toFixed(2)}</TableCell>
                                  <TableCell align="right" sx={{ color: "#d32f2f", fontWeight: "bold" }}>
                                    ${pedido.saldoPendiente.toFixed(2)}
                                  </TableCell>
                                  <TableCell align="center">
                                    <Button
                                      variant="contained"
                                      color="success"
                                      size="small"
                                      startIcon={<PaymentIcon />}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenPago(pedido);
                                      }}
                                    >
                                      Registrar Pago
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialogo para Registrar Pago */}
      {pedidoSeleccionado && (
        <Dialog
          open={openPagoDialog}
          onClose={() => setOpenPagoDialog(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
            <PaymentIcon color="success" />
            Registrar Pago
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
              <Typography variant="body1">
                <strong>Cliente:</strong> {pedidoSeleccionado.clienteName}
              </Typography>
              <Typography variant="body1">
                <strong>Pedido ID:</strong> #{pedidoSeleccionado.id} (Fecha: {pedidoSeleccionado.fecha})
              </Typography>
              <Box sx={{ p: 1.5, bgcolor: '#f1f8e9', borderRadius: 1, borderLeft: '4px solid #4caf50' }}>
                <Typography variant="body2" color="text.secondary">
                  DETALLE DE IMPORTES:
                </Typography>
                <Typography variant="body1">
                  <strong>Total:</strong> ${pedidoSeleccionado.total.toFixed(2)}
                </Typography>
                <Typography variant="body1">
                  <strong>Monto Pagado:</strong> ${pedidoSeleccionado.montoPagado.toFixed(2)}
                </Typography>
                <Typography variant="body1" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
                  <strong>Saldo Pendiente:</strong> ${pedidoSeleccionado.saldoPendiente.toFixed(2)}
                </Typography>
              </Box>

              <TextField
                label="Monto a Cobrar"
                type="number"
                value={montoAbono}
                onChange={(e) => setMontoAbono(e.target.value)}
                fullWidth
                variant="outlined"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />

              <TextField
                label="Comentarios del Cobro (opcional)"
                value={comentariosPago}
                onChange={(e) => setComentariosPago(e.target.value)}
                fullWidth
                multiline
                rows={2}
                variant="outlined"
                placeholder="Ej. Cobrado en efectivo, transferencia recibida..."
              />

              {cuentasBancarias.length > 0 && (
                <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
                  <InputLabel id="select-cuenta-deposito-label">Depositar en Cuenta Bancaria</InputLabel>
                  <Select
                    labelId="select-cuenta-deposito-label"
                    value={selectedCuentaId}
                    onChange={(e) => {
                      setSelectedCuentaId(e.target.value);
                      setDepositarBanco(e.target.value !== "");
                    }}
                    label="Depositar en Cuenta Bancaria"
                  >
                    <MenuItem value="">-- No depositar en Banco --</MenuItem>
                    {cuentasBancarias.map((c) => (
                      <MenuItem key={c.key} value={c.key}>
                        {c.bancoNombre} ({c.nroCuenta || "Sin número"}) - Saldo: ${c.saldoActual?.toFixed(2)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={() => setOpenPagoDialog(false)} color="inherit">
              Cancelar
            </Button>
            <Button onClick={handleSavePago} variant="contained" color="success">
              Guardar Pago
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default CuentasCorrientes;
