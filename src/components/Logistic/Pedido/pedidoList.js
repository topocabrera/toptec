import React, { Component } from "react";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { Toast, Modal } from "antd-mobile";
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
  FormControlLabel,
  Switch,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import * as XLSX from 'xlsx';
// import Button from '@mui/material/Button';

import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import ReceiptIcon from "@mui/icons-material/Receipt";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import DateRangeIcon from "@mui/icons-material/DateRange";
import moment from "moment";
import ListCheckbox from "../../../components/ListCheckbox";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import PaymentIcon from "@mui/icons-material/Payment";
import InfoIcon from "@mui/icons-material/Info";
import BarChartIcon from "@mui/icons-material/BarChart";
import { getSmartService, generateSmartRoute, hasPermission } from "../../../utils/routeHelper";
const queryString = require("query-string");

const alert = Modal.alert;

// Obtener servicios dinámicamente según el rol del usuario
const PedidosDataService = getSmartService('pedidos');
const ClientsDataService = getSmartService('clientes');
const ProductosDataService = getSmartService('productos');

export default class PedidoList extends Component {
  constructor(props) {
    super(props);
    this.refreshList = this.refreshList.bind(this);
    this.setActiveTutorial = this.setActiveTutorial.bind(this);
    this.onDataChange = this.onDataChange.bind(this);
    this.onChangeDate = this.onChangeDate.bind(this);
    this.filterPedidos = this.filterPedidos.bind(this);
    this.setOpen = this.setOpen.bind(this);
    this.expandAll = this.expandAll.bind(this);
    this.deletePedido = this.deletePedido.bind(this);
    this.changeEntrega = this.changeEntrega.bind(this);
    this.changeMostrarPendientes = this.changeMostrarPendientes.bind(this);
    this.getClients = this.getClients.bind(this);
    this.getClientsByDay = this.getClientsByDay.bind(this);
    this.getQuantity = this.getQuantity.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.abrirDetallesPago = this.abrirDetallesPago.bind(this);
    this.cerrarDetallesPago = this.cerrarDetallesPago.bind(this);
    this.generarExcel = this.generarExcel.bind(this);
    this.descargarDiario = this.descargarDiario.bind(this);
    this.abrirModalRango = this.abrirModalRango.bind(this);
    this.cerrarModalRango = this.cerrarModalRango.bind(this);
    this.descargarPorRango = this.descargarPorRango.bind(this);
    this.changeMostrarArchivados = this.changeMostrarArchivados.bind(this);

    this.state = {
      pedidos: [],
      date:
        queryString.parse(this.props.location.search).date ||
        moment(new Date().getTime()).format("DD-MM-YYYY"),
      pedidoFilter: [],
      open: false,
      indexOpen: 0,
      expandAll: false,
      entregaPedido:
        queryString.parse(this.props.location.search).entrega || false,
      mostrarSoloPendientes:
        queryString.parse(this.props.location.search).pendientes === 'true' || false,
      mostrarArchivados:
        queryString.parse(this.props.location.search).archivados === 'true' || false,
      clients: [],
      cantVisitas: 0,
      quantityProd: {},
      openModal: false,
      prodDesc: [],
      // Estados para modal de detalles de pago
      modalDetallesPago: false,
      pedidoSeleccionado: null,
      // Estados para modal de descarga por rango
      modalRango: false,
      fechaRangoInicio: null,
      fechaRangoFin: null,
    };
  }

  componentDidMount() {
    const today = moment(new Date().getTime()).get("day");
    const dateFormat = moment(new Date().getTime()).format("DD-MM-YYYY");
    if (!this.props.location.search) {
      window.location.href = `${generateSmartRoute('/list-pedidos')}?date=${dateFormat}`;
      this.getClients(today);
    } else {
      const params = queryString.parse(this.props.location.search);
      const day = moment(params.date, "DD-MM-AAAA").get("day");
      this.getClients(day);
    }

    PedidosDataService.getAll()
      .orderByChild("id")
      .on("value", this.onDataChange);
  }

  componentWillUnmount() {
    PedidosDataService.getAll().off("value", this.onDataChange);
    ClientsDataService.getAll().off("value", this.onDataChange);
  }

  onDataChange(items) {
    let pedidos = [];
    items.forEach((item) => {
      let data = item.val();
      let key = item.key;
      pedidos.push({
        key,
        id: data.id,
        fecha: data.fecha,
        fechaEntrega: data.fechaEntrega,
        idCliente: data.idCliente,
        clienteName: data.clienteName,
        clienteDomicilio: data.clienteDomicilio,
        productos: data.productos,
        status: data.status,
        condPago: data.condPago || "",
        datosPago: data.datosPago || {},
        total: data.total,
        totalCosto: data.totalCosto,
      });
    });

    this.setState({ pedidos });
    this.filterPedidos();
  }

  filterPedidos(fecha, entrega) {
    const { pedidos, date, entregaPedido, mostrarSoloPendientes, mostrarArchivados } = this.state;
    let pedido = [];

    if (mostrarArchivados) {
      const fechaComp = fecha || date;
      pedidos.forEach((item) => {
        if (item.status === "Archivado") {
          const fechaFormat = entregaPedido
            ? item.fechaEntrega
            : item.fecha?.slice(0, 10);
          if (fechaFormat === fechaComp) {
            pedido.push(item);
          }
        }
      });
    } else if (mostrarSoloPendientes) {
      pedidos.forEach((item) => {
        if (item.status !== "confirmado" && item.status !== "Archivado") {
          pedido.push(item);
        }
      });
    } else {
      const fechaComp = fecha || date;
      pedidos.forEach((item) => {
        if (item.status === "Archivado") return;
        const fechaFormat = entregaPedido
          ? item.fechaEntrega
          : item.fecha?.slice(0, 10);
        if (fechaFormat === fechaComp) {
          pedido.push(item);
        }
      });
    }

    this.setState({ pedidoFilter: pedido });
  }

  getClients(dia) {
    ClientsDataService.getAll()
      .orderByChild("dia")
      .equalTo(dia)
      .on("value", this.getClientsByDay);
  }

  getClientsByDay(items) {
    let clients = [];
    let cantVisitas = 0;
    if (items) {
      items.forEach((item) => {
        let data = item.val();
        clients.push(data);
      });
      clients.forEach((cli) => {
        if (cli.estado === "visitado") {
          cantVisitas += 1;
        }
      });
    }
    this.setState({ clients, cantVisitas });
  }

  onChangeDate(e) {
    const dateFormat = e.format("DD-MM-YYYY");
    window.location.href = this.state.entregaPedido
      ? `${generateSmartRoute('/list-pedidos')}?date=${dateFormat}&entrega=true`
      : `${generateSmartRoute('/list-pedidos')}?date=${dateFormat}`;
  }

  setOpen(index) {
    this.setState({ open: !this.state.open, indexOpen: index });
  }

  refreshList() {
    this.setState({
      currentTutorial: null,
      currentIndex: -1,
    });
  }

  setActiveTutorial(tutorial, index) {
    this.setState({
      currentTutorial: tutorial,
      currentIndex: index,
    });
  }

  deletePedido(key) {
    const { pedidos } = this.state;
    const pedidoAEliminar = pedidos.find(p => p.key === key);

    if (pedidoAEliminar && pedidoAEliminar.productos) {
      // Restaurar stock de cada producto del pedido
      const promesasStock = pedidoAEliminar.productos.map((producto) => {
        return ProductosDataService.getAll()
          .orderByChild("codigo")
          .equalTo(producto.codigo)
          .once("value")
          .then((snapshot) => {
            if (snapshot.exists()) {
              snapshot.forEach((item) => {
                const productoActual = item.val();
                const stockRestaurado = (productoActual.stock || 0) + parseInt(producto.cantidad, 10);
                ProductosDataService.update(item.key, { stock: stockRestaurado });
              });
            }
          });
      });

      Promise.all(promesasStock)
        .then(() => {
          return PedidosDataService.delete(key);
        })
        .then(() => {
          Toast.success("Eliminado correctamente!!", 1, () => {
            window.location.reload(false);
          });
        })
        .catch(() => {
          Toast.fail("Ocurrió un error !!!", 2);
        });
    } else {
      PedidosDataService.delete(key)
        .then(() => {
          Toast.success("Eliminado correctamente!!", 1, () => {
            window.location.reload(false);
          });
        })
        .catch(() => {
          Toast.fail("Ocurrió un error !!!", 2);
        });
    }
  }

  expandAll() {
    this.setState({
      expandAll: !this.state.expandAll,
      open: true,
      indexOpen: -1,
    });
  }

  changeEntrega() {
    if (this.state.entregaPedido) {
      window.location.href = `${generateSmartRoute('/list-pedidos')}?date=${this.state.date}`;
    } else {
      window.location.href = `${generateSmartRoute('/list-pedidos')}?date=${this.state.date}&entrega=true`;
    }
  }

  changeMostrarPendientes() {
    const nuevoEstado = !this.state.mostrarSoloPendientes;
    const urlParams = new URLSearchParams(this.props.location.search);

    if (nuevoEstado) {
      urlParams.set('pendientes', 'true');
      urlParams.delete('archivados');
    } else {
      urlParams.delete('pendientes');
    }

    window.location.href = `${generateSmartRoute('/list-pedidos')}?${urlParams.toString()}`;
  }

  changeMostrarArchivados() {
    const nuevoEstado = !this.state.mostrarArchivados;
    const urlParams = new URLSearchParams(this.props.location.search);

    if (nuevoEstado) {
      urlParams.set('archivados', 'true');
      urlParams.delete('pendientes');
    } else {
      urlParams.delete('archivados');
    }

    window.location.href = `${generateSmartRoute('/list-pedidos')}?${urlParams.toString()}`;
  }

  getQuantity() {
    const { pedidoFilter } = this.state;
    let cantByProd = {};
    const arrayProd = [];
    pedidoFilter.forEach((pedido) => {
      if (pedido.productos) {
        pedido.productos.forEach((prod) => {
          const quantity = parseInt(prod.cantidad, 10);
          const prodDesc = {
            codigo: prod.codigo,
            desc: prod.descripcion,
          };
          if (cantByProd[prod.codigo] === undefined) {
            cantByProd[prod.codigo] = quantity;
          } else {
            cantByProd[prod.codigo] += quantity;
          }
          if (arrayProd.filter((pr) => pr.codigo === prod.codigo).length < 1) {
            arrayProd.push(prodDesc);
          }
        });
      }
    });
    this.setState({
      openModal: true,
      quantityProd: cantByProd,
      prodDesc: arrayProd,
    });
  }

  handleClose() {
    this.setState({ openModal: false });
  }

  // Métodos para modal de detalles de pago
  abrirDetallesPago(pedido) {
    this.setState({
      modalDetallesPago: true,
      pedidoSeleccionado: pedido,
    });
  }

  cerrarDetallesPago() {
    this.setState({
      modalDetallesPago: false,
      pedidoSeleccionado: null,
    });
  }

  generarExcel(pedidosData, filename) {
    const ars = (num) =>
      (parseFloat(num) || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });

    const rows = [
      ['FECHA', 'CLIENTE', 'COD ARTICULO', 'DESCRIPCION', 'UNIDADES', 'PRECIO', 'TOTAL'],
    ];

    let grandTotal = 0;

    pedidosData.forEach((pedido) => {
      const fecha = pedido.fecha?.slice(0, 10) || '';
      if (pedido.productos && pedido.productos.length > 0) {
        pedido.productos.forEach((prod, idx) => {
          const subtotal = parseFloat(prod.subtotal) || (parseFloat(prod.precio) * parseInt(prod.cantidad, 10));
          grandTotal += subtotal;
          rows.push([
            idx === 0 ? fecha : '',
            idx === 0 ? pedido.clienteName : '',
            prod.codigo,
            prod.descripcion,
            parseInt(prod.cantidad, 10),
            ars(prod.precio),
            ars(subtotal),
          ]);
        });
      } else {
        const total = parseFloat(pedido.total) || 0;
        grandTotal += total;
        rows.push([fecha, pedido.clienteName, '', '', '', '', ars(total)]);
      }
    });

    rows.push(['', '', '', '', '', 'TOTAL GENERAL', ars(grandTotal)]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 15 },
      { wch: 35 },
      { wch: 14 },
      { wch: 40 },
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pedidos');
    XLSX.writeFile(wb, filename);
  }

  descargarDiario() {
    const { pedidoFilter, date, entregaPedido } = this.state;
    if (pedidoFilter.length === 0) {
      Toast.fail('No hay pedidos para descargar', 2);
      return;
    }
    const tipo = entregaPedido ? 'entrega' : 'creacion';
    this.generarExcel(pedidoFilter, `pedidos_${tipo}_${date}.xlsx`);
  }

  abrirModalRango() {
    this.setState({ modalRango: true });
  }

  cerrarModalRango() {
    this.setState({ modalRango: false, fechaRangoInicio: null, fechaRangoFin: null });
  }

  descargarPorRango() {
    const { pedidos, fechaRangoInicio, fechaRangoFin, entregaPedido } = this.state;

    if (!fechaRangoInicio || !fechaRangoFin) {
      Toast.fail('Por favor selecciona ambas fechas', 2);
      return;
    }

    const inicio = moment(fechaRangoInicio);
    const fin = moment(fechaRangoFin);

    if (fin.isBefore(inicio)) {
      Toast.fail('La fecha de fin debe ser posterior a la de inicio', 2);
      return;
    }

    const pedidosFiltrados = pedidos.filter((pedido) => {
      const fechaStr = entregaPedido ? pedido.fechaEntrega : pedido.fecha?.slice(0, 10);
      const fechaPedido = moment(fechaStr, 'DD-MM-YYYY');
      return fechaPedido.isSameOrAfter(inicio, 'day') && fechaPedido.isSameOrBefore(fin, 'day');
    });

    if (pedidosFiltrados.length === 0) {
      Toast.fail('No hay pedidos en ese rango de fechas', 2);
      return;
    }

    const desde = inicio.format('DD-MM-YYYY');
    const hasta = fin.format('DD-MM-YYYY');
    this.generarExcel(pedidosFiltrados, `pedidos_${desde}_al_${hasta}.xlsx`);
    this.setState({ modalRango: false, fechaRangoInicio: null, fechaRangoFin: null });
  }

  render() {
    const {
      pedidoFilter,
      open,
      indexOpen,
      expandAll,
      entregaPedido,
      mostrarSoloPendientes,
      mostrarArchivados,
      clients,
      cantVisitas,
      openModal,
      quantityProd,
      prodDesc,
      modalDetallesPago,
      pedidoSeleccionado,
    } = this.state;
    const { modalRango } = this.state;
    let totalPorDia = 0;
    let totalPorDiaCosto = 0;

    pedidoFilter.forEach((prd) => (totalPorDia += prd.total || 0));
    pedidoFilter.forEach((prd) => (prd?.totalCosto ? totalPorDiaCosto += prd.totalCosto : 0));
    const totalDif = totalPorDia - totalPorDiaCosto;
    const keyCodigos = Object.keys(quantityProd);
    return (
      <div className="list row">
        <div className="col-md-6">
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            <a className="btn btn-primary" href={generateSmartRoute("/list-client")} role="button">
              Nuevo pedido
            </a>
            <Button
              variant="contained"
              className="inform-button"
              endIcon={<ReceiptIcon />}
              onClick={this.getQuantity}
            >
              Cant. x prod.
            </Button>
            <Button
              variant="outlined"
              color="success"
              endIcon={<FileDownloadIcon />}
              onClick={this.descargarDiario}
            >
              Descargar diario
            </Button>
            <Button
              variant="outlined"
              color="success"
              endIcon={<DateRangeIcon />}
              onClick={this.abrirModalRango}
            >
              Descargar por rango
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              endIcon={<BarChartIcon />}
              href={generateSmartRoute('/estadisticas')}
            >
              Estadísticas
            </Button>
          </Box>
          <Dialog
            onClose={this.handleClose}
            aria-labelledby="customized-dialog-title"
            open={openModal}
          >
            <DialogContent dividers>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Código</TableCell>
                      <TableCell>Descripción</TableCell>
                      <TableCell>Cantidad</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {keyCodigos.map((row) => {
                      return (
                        <TableRow key={row}>
                          <TableCell>{row}</TableCell>
                          <TableCell>
                            {prodDesc.filter((pr) => pr.codigo === row)[0].desc}
                          </TableCell>
                          <TableCell>{quantityProd[row]}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </DialogContent>
            <DialogActions>
              <Button onClick={this.handleClose} color="primary">
                Cerrar
              </Button>
            </DialogActions>
          </Dialog>
          <h4>Listado de pedidos</h4>
          <Paper className="info__pedidos">
            <div className="container__info">
              <span className="text__info">
                Cant. pedidos:{" "}
                <p className="text__dato">{pedidoFilter.length}</p>
              </span>
              <span className="text__info-right">
                Cant. no venta:{" "}
                <p className="text__dato">
                  {cantVisitas - pedidoFilter.length}
                </p>
              </span>
              <span className="text__info-right">
                Total del día: ${" "}
                <p className="text__dato">{totalPorDia.toFixed(2)}</p>
              </span>
            </div>
            <div className="container__info">
              <span className="text__info">
                Visitas: <p className="text__dato">{cantVisitas}</p>
              </span>
              <span className="text__info-right">
                Cant. clientes: <p className="text__dato">{clients.length}</p>
              </span>
              <span className="text__info-right">
                Total (P.Venta - P.Costo): ${" "} <p className="text__dato">{totalDif.toFixed(2)}</p>
              </span>
            </div>
          </Paper>
          <div className="form-group">
            <FormControlLabel
              sx={{ marginRight: '15px', marginTop: '20px' }}
              control={
                <Switch
                  checked={entregaPedido}
                  onChange={this.changeEntrega}
                  size="small"
                  name="checkedB"
                  color="primary"
                />
              }
              labelPlacement="start"
              label={
                entregaPedido
                  ? "Cambiar a fecha creación pedido"
                  : "Cambiar a fecha entrega pedido"
              }
            />
            <FormControlLabel
              sx={{ marginRight: '15px', marginTop: '20px' }}
              control={
                <Switch
                  checked={mostrarSoloPendientes}
                  onChange={this.changeMostrarPendientes}
                  size="small"
                  name="checkedPendientes"
                  color="primary"
                />
              }
              labelPlacement="start"
              label={
                mostrarSoloPendientes
                  ? "Ver todos los pedidos"
                  : "Ver solo pedidos pendientes"
              }
            />
            <FormControlLabel
              sx={{ marginRight: '15px', marginTop: '20px' }}
              control={
                <Switch
                  checked={mostrarArchivados}
                  onChange={this.changeMostrarArchivados}
                  size="small"
                  name="checkedArchivados"
                  color="warning"
                />
              }
              labelPlacement="start"
              label={
                mostrarArchivados
                  ? "Ver pedidos actuales"
                  : "Ver pedidos archivados"
              }
            />
            {/* <label className="fecha-text">
              {entregaPedido ? "Fecha entrega pedido" : "Fecha creación pedido"}
            </label> */}
            {/* <LocalizationProvider dateAdapter={AdapterMoment}>
              <DatePicker
                label="Fecha del evento"
                // value={this.state.date ? moment(this.state.date, "DD-MM-YYYY") : null}
                // onChange={(newValue) => this.onChangeDate(newValue)}
                format="DD-MM-YYYY"
                slotProps={{
                  textField: {
                    className: "post-input post-input__event",
                    name: "eventDate",
                  }
                }}
              />
            </LocalizationProvider> */}
            <LocalizationProvider dateAdapter={AdapterMoment}>
              <DatePicker
                label={entregaPedido ? "Fecha entrega pedido" : "Fecha creación pedido"}
                value={this.state.date ? moment(this.state.date, "DD-MM-YYYY") : null}
                onChange={(newValue) => this.onChangeDate(newValue)}
                inputFormat="DD-MM-YYYY"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    className="post-input post-input__event"
                    name="eventDate"
                  />
                )}
              />
            </LocalizationProvider>
          </div>
          <div className="table-container">
            <TableContainer component={Paper}>
              <Table aria-label="collapsible table">
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <Tooltip title="Expandir todos">
                        <IconButton
                          color="primary"
                          aria-label="expandir todos"
                          onClick={this.expandAll}
                          size="small"
                        >
                          {!expandAll ? (
                            <ArrowDropDownIcon />
                          ) : (
                            <ArrowDropUpIcon />
                          )}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Domicilio</TableCell>
                    <TableCell>Tipo pago</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pedidoFilter &&
                    pedidoFilter.map((pedido, index) => (
                      <React.Fragment key={index}>
                        <TableRow>
                          <TableCell
                            onClick={(e) => {
                              e.preventDefault();
                              this.setOpen(index);
                            }}
                          >
                            {pedido.productos && (
                              <IconButton
                                aria-label="expand row"
                                size="small"
                                onClick={(e) => {
                                  e.preventDefault();
                                  this.setOpen(index);
                                }}
                              >
                                {open && indexOpen === index ? (
                                  <KeyboardArrowUpIcon />
                                ) : (
                                  <KeyboardArrowDownIcon />
                                )}
                              </IconButton>
                            )}
                          </TableCell>
                          <TableCell
                            component="th"
                            scope="row"
                            onClick={(e) => {
                              e.preventDefault();
                              this.setOpen(index);
                            }}
                          >
                            {pedido.clienteName}
                          </TableCell>
                          <TableCell
                            component="th"
                            scope="row"
                            onClick={(e) => {
                              e.preventDefault();
                              this.setOpen(index);
                            }}
                          >
                            {pedido.clienteDomicilio}
                          </TableCell>
                          <TableCell
                            component="th"
                            scope="row"
                            onClick={(e) => {
                              e.preventDefault();
                              this.setOpen(index);
                            }}
                          >
                            {pedido.condPago}
                          </TableCell>
                          <TableCell
                            onClick={(e) => {
                              e.preventDefault();
                              this.setOpen(index);
                            }}
                          >
                            ${(pedido.total || 0).toFixed(2)}
                          </TableCell>
                          <TableCell
                            className={`color__status ${(pedido.status || '').toLowerCase().split(" ")[0]}`}
                            onClick={(e) => {
                              e.preventDefault();
                              this.setOpen(index);
                            }}
                          >
                            {pedido.status}
                          </TableCell>
                          <TableCell>
                            {/* Botón de detalles de pago */}
                            <Tooltip title="Ver detalles de pago">
                              <IconButton
                                aria-label="detalles-pago"
                                size="small"
                                onClick={() => this.abrirDetallesPago(pedido)}
                                disabled={!pedido.condPago}
                              >
                                <PaymentIcon color={pedido.condPago ? "primary" : "disabled"} />
                              </IconButton>
                            </Tooltip>
                            <IconButton
                              aria-label="editar"
                              className="action__link"
                              href={generateSmartRoute(`/edit-pedido/${pedido.id}`)}
                              role="button"
                              size="small"
                            >
                              <EditIcon />
                            </IconButton>
                            {hasPermission('edit_orders') && (
                              <IconButton
                                aria-label="eliminar"
                                type="button"
                                className="action__button"
                                size="small"
                                onClick={() =>
                                  alert("Eliminar", "Estás seguro???", [
                                    { text: "Cancelar" },
                                    {
                                      text: "Ok",
                                      onPress: () =>
                                        this.deletePedido(pedido.key),
                                    },
                                  ])
                                }
                              >
                                <DeleteIcon color="secondary" />
                              </IconButton>
                            )}
                            <IconButton
                              href={generateSmartRoute(`/imprimir/${pedido.id}`)}
                              role="button"
                              aria-label="imprimir"
                              className="action__link"
                              size="small"
                            >
                              <PrintOutlinedIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell
                            style={{ paddingBottom: 0, paddingTop: 0 }}
                            colSpan={6}
                          >
                            {open && indexOpen === index && pedido.productos && (
                              <Collapse in={open} timeout="auto" unmountOnExit>
                                <Box margin={1}>
                                  <ListCheckbox
                                    productos={pedido.productos}
                                    pedido={pedido}
                                  />
                                </Box>
                              </Collapse>
                            )}
                            {expandAll && pedido.productos && (
                              <Collapse in={open} timeout="auto" unmountOnExit>
                                <Box margin={1}>
                                  <ListCheckbox
                                    productos={pedido.productos}
                                    pedido={pedido}
                                  />
                                </Box>
                              </Collapse>
                            )}
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            {pedidoFilter.length === 0 && (
              <div className="empty__container">
                <span className="message-empty">No hay pedidos aún</span>
              </div>
            )}
          </div>

          {/* Modal de Detalles de Pago */}
          <Dialog
            open={modalDetallesPago}
            onClose={this.cerrarDetallesPago}
            maxWidth="sm"
            fullWidth
            PaperProps={{
              style: {
                margin: '8px',
                maxWidth: '95vw',
              }
            }}
          >
            <DialogTitle sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              backgroundColor: '#f5f5f5',
              borderBottom: '1px solid #e0e0e0'
            }}>
              <PaymentIcon color="primary" />
              Detalles de Pago
              {pedidoSeleccionado && (
                <Box component="span" sx={{ ml: 'auto', fontSize: '0.9rem', color: '#666' }}>
                  Pedido #{pedidoSeleccionado.id}
                </Box>
              )}
            </DialogTitle>
            <DialogContent sx={{ padding: { xs: '16px', sm: '24px' } }}>
              {pedidoSeleccionado && (
                <Box>
                  {/* Información general del pedido */}
                  <Box sx={{ mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ fontWeight: 'bold', color: '#333', mb: 0.5 }}>Cliente:</Box>
                        <Box sx={{ fontSize: '0.9rem' }}>{pedidoSeleccionado.clienteName}</Box>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ fontWeight: 'bold', color: '#333', mb: 0.5 }}>Total:</Box>
                        <Box sx={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#2e7d32' }}>
                          ${pedidoSeleccionado.total?.toFixed(2)}
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  {/* Forma de pago */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{
                      fontWeight: 'bold',
                      fontSize: '1.1rem',
                      color: '#1976d2',
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <InfoIcon fontSize="small" />
                      Forma de Pago: {pedidoSeleccionado.condPago}
                    </Box>

                    {/* Detalles específicos según el tipo de pago */}
                    {pedidoSeleccionado.condPago === 'Contado' && (
                      <Box sx={{ pl: 2 }}>
                        {pedidoSeleccionado.datosPago?.comentarios ? (
                          <Box>
                            <Box sx={{ fontWeight: 'bold', mb: 1 }}>Comentarios:</Box>
                            <Box sx={{
                              p: 2,
                              bgcolor: '#fff3e0',
                              borderLeft: '4px solid #ff9800',
                              borderRadius: '0 4px 4px 0',
                              fontStyle: 'italic'
                            }}>
                              {pedidoSeleccionado.datosPago.comentarios}
                            </Box>
                          </Box>
                        ) : (
                          <Box sx={{ color: '#666', fontStyle: 'italic' }}>
                            Sin comentarios adicionales
                          </Box>
                        )}
                      </Box>
                    )}

                    {pedidoSeleccionado.condPago === 'Cheque' && (
                      <Box sx={{ pl: 2 }}>
                        {pedidoSeleccionado.datosPago?.cheques && Array.isArray(pedidoSeleccionado.datosPago.cheques) ? (
                          // Formato nuevo: múltiples cheques
                          <>
                            <Box sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2' }}>
                              Cheques ({pedidoSeleccionado.datosPago.cheques.length})
                            </Box>
                            {pedidoSeleccionado.datosPago.cheques.map((cheque, index) => (
                              <Box key={index} sx={{ mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 1, border: '1px solid #e3f2fd' }}>
                                <Box sx={{ fontWeight: 'bold', mb: 1, color: '#1976d2' }}>
                                  Cheque {index + 1}
                                </Box>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                                  <Box>
                                    <Box sx={{ fontWeight: 'bold', mb: 0.5 }}>Banco:</Box>
                                    <Box sx={{ p: 1, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                                      {cheque.banco || 'No especificado'}
                                    </Box>
                                  </Box>
                                  <Box>
                                    <Box sx={{ fontWeight: 'bold', mb: 0.5 }}>Nro de Cheque:</Box>
                                    <Box sx={{ p: 1, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                                      {cheque.nroCheque || 'No especificado'}
                                    </Box>
                                  </Box>
                                  <Box>
                                    <Box sx={{ fontWeight: 'bold', mb: 0.5 }}>Fecha Cobranza:</Box>
                                    <Box sx={{ p: 1, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                                      {cheque.fechaCobranza || 'No especificado'}
                                    </Box>
                                  </Box>
                                  <Box>
                                    <Box sx={{ fontWeight: 'bold', mb: 0.5 }}>CUIT:</Box>
                                    <Box sx={{ p: 1, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                                      {cheque.cuit || 'No especificado'}
                                    </Box>
                                  </Box>
                                  {cheque.monto && (
                                    <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
                                      <Box sx={{ fontWeight: 'bold', mb: 0.5 }}>Monto:</Box>
                                      <Box sx={{ p: 1, bgcolor: '#e8f5e8', borderRadius: 1, fontWeight: 'bold' }}>
                                        ${parseFloat(cheque.monto).toFixed(2)}
                                      </Box>
                                    </Box>
                                  )}
                                </Box>
                              </Box>
                            ))}
                            <Box sx={{ mt: 2, p: 2, bgcolor: '#e8f5e8', borderRadius: 1 }}>
                              <Box sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                                Total Cheques: ${pedidoSeleccionado.datosPago.cheques.reduce((sum, cheque) =>
                                  sum + (parseFloat(cheque.monto) || 0), 0).toFixed(2)}
                              </Box>
                            </Box>
                          </>
                        ) : (
                          // Formato antiguo: un solo cheque (compatibilidad hacia atrás)
                          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                            <Box>
                              <Box sx={{ fontWeight: 'bold', mb: 0.5 }}>Banco:</Box>
                              <Box sx={{ p: 1, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                                {pedidoSeleccionado.datosPago?.banco || 'No especificado'}
                              </Box>
                            </Box>
                            <Box>
                              <Box sx={{ fontWeight: 'bold', mb: 0.5 }}>Nro de Cheque:</Box>
                              <Box sx={{ p: 1, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                                {pedidoSeleccionado.datosPago?.nroCheque || 'No especificado'}
                              </Box>
                            </Box>
                            <Box>
                              <Box sx={{ fontWeight: 'bold', mb: 0.5 }}>Fecha Cobranza:</Box>
                              <Box sx={{ p: 1, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                                {pedidoSeleccionado.datosPago?.fechaCobranza || 'No especificado'}
                              </Box>
                            </Box>
                            <Box>
                              <Box sx={{ fontWeight: 'bold', mb: 0.5 }}>CUIT:</Box>
                              <Box sx={{ p: 1, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                                {pedidoSeleccionado.datosPago?.cuit || 'No especificado'}
                              </Box>
                            </Box>
                          </Box>
                        )}
                      </Box>
                    )}

                    {pedidoSeleccionado.condPago === 'Transferencia' && (
                      <Box sx={{ pl: 2 }}>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                          <Box>
                            <Box sx={{ fontWeight: 'bold', mb: 0.5 }}>Nro Transferencia:</Box>
                            <Box sx={{ p: 1, bgcolor: '#e8f5e8', borderRadius: 1 }}>
                              {pedidoSeleccionado.datosPago?.nroTransferencia || 'No especificado'}
                            </Box>
                          </Box>
                          <Box>
                            <Box sx={{ fontWeight: 'bold', mb: 0.5 }}>Fecha:</Box>
                            <Box sx={{ p: 1, bgcolor: '#e8f5e8', borderRadius: 1 }}>
                              {pedidoSeleccionado.datosPago?.fecha || 'No especificado'}
                            </Box>
                          </Box>
                          <Box>
                            <Box sx={{ fontWeight: 'bold', mb: 0.5 }}>Emisor:</Box>
                            <Box sx={{ p: 1, bgcolor: '#e8f5e8', borderRadius: 1 }}>
                              {pedidoSeleccionado.datosPago?.emisor || 'No especificado'}
                            </Box>
                          </Box>
                          <Box>
                            <Box sx={{ fontWeight: 'bold', mb: 0.5 }}>Destinatario:</Box>
                            <Box sx={{ p: 1, bgcolor: '#e8f5e8', borderRadius: 1 }}>
                              {pedidoSeleccionado.datosPago?.destinatario || 'No especificado'}
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    )}

                    {/* Si no hay forma de pago específica */}
                    {!pedidoSeleccionado.condPago && (
                      <Box sx={{
                        p: 2,
                        bgcolor: '#ffebee',
                        borderRadius: 1,
                        textAlign: 'center',
                        color: '#d32f2f'
                      }}>
                        No se ha especificado una forma de pago para este pedido
                      </Box>
                    )}
                  </Box>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ padding: { xs: '16px', sm: '24px' } }}>
              <Button
                onClick={this.cerrarDetallesPago}
                color="primary"
                variant="contained"
                fullWidth={window.innerWidth < 600}
              >
                Cerrar
              </Button>
            </DialogActions>
          </Dialog>
        </div>

        {/* Modal de Descarga por Rango de Fechas */}
        <Dialog
          open={this.state.modalRango}
          onClose={this.cerrarModalRango}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
            <DateRangeIcon color="success" />
            Descargar pedidos por rango
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <DatePicker
                  label="Fecha desde"
                  value={this.state.fechaRangoInicio}
                  onChange={(val) => this.setState({ fechaRangoInicio: val })}
                  inputFormat="DD-MM-YYYY"
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
                <DatePicker
                  label="Fecha hasta"
                  value={this.state.fechaRangoFin}
                  onChange={(val) => this.setState({ fechaRangoFin: val })}
                  inputFormat="DD-MM-YYYY"
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
              <Box sx={{ fontSize: '0.85rem', color: '#666', fontStyle: 'italic' }}>
                Se filtrarán pedidos por fecha de {entregaPedido ? 'entrega' : 'creación'} según la selección actual.
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={this.cerrarModalRango} color="inherit">Cancelar</Button>
            <Button onClick={this.descargarPorRango} variant="contained" color="success" endIcon={<FileDownloadIcon />}>
              Descargar
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }
}
