import React, { Component } from "react";
import Datetime from "react-datetime";
import { Toast, Modal } from "antd-mobile";
import {
  Box,
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
} from "@material-ui/core";
import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";
import ArrowDropUpIcon from "@material-ui/icons/ArrowDropUp";
import KeyboardArrowDownIcon from "@material-ui/icons/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@material-ui/icons/KeyboardArrowUp";
import ReceiptIcon from "@material-ui/icons/Receipt";
import moment from "moment";
import ListCheckbox from "../../../components/ListCheckbox";
import PrintOutlinedIcon from "@material-ui/icons/PrintOutlined";
import DeleteIcon from "@material-ui/icons/Delete";
import EditIcon from "@material-ui/icons/Edit";
import PedidosDataService from "../../../services/pedidos.service";
import ClientsDataService from "../../../services/clients.service";
const queryString = require("query-string");

const alert = Modal.alert;

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
    this.getClients = this.getClients.bind(this);
    this.getClientsByDay = this.getClientsByDay.bind(this);
    this.getQuantity = this.getQuantity.bind(this);
    this.handleClose = this.handleClose.bind(this);

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
      clients: [],
      cantVisitas: 0,
      quantityProd: {},
      openModal: false,
      prodDesc: [],
    };
  }

  componentDidMount() {
    const today = moment(new Date().getTime()).get("day");
    const dateFormat = moment(new Date().getTime()).format("DD-MM-YYYY");
    if (!this.props.location.search) {
      window.location.href = `/list-pedidos?date=${dateFormat}`;
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
        total: data.total,
      });
    });

    this.setState({ pedidos });
    this.filterPedidos();
  }

  filterPedidos(fecha, entrega) {
    const { pedidos, date, entregaPedido } = this.state;
    let pedido = [];
    const fechaComp = fecha || date;
    pedidos.forEach((item) => {
      const fechaFormat = entregaPedido
        ? item.fechaEntrega
        : item.fecha.slice(0, 10);
      if (fechaFormat === fechaComp) {
        pedido.push(item);
      }
    });
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
      ? `/list-pedidos?date=${dateFormat}&entrega=true`
      : `/list-pedidos?date=${dateFormat}`;
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
    PedidosDataService.delete(key)
      .then(() => {
        Toast.success("Eliminado correctamente!!", 1, () => {
          window.location.reload(false);
        });
      })
      .catch((e) => {
        Toast.fail("Ocurrió un error !!!", 2);
      });
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
      window.location.href = `/list-pedidos?date=${this.state.date}`;
    } else {
      window.location.href = `/list-pedidos?date=${this.state.date}&entrega=true`;
    }
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

  render() {
    const {
      pedidoFilter,
      open,
      indexOpen,
      expandAll,
      entregaPedido,
      clients,
      cantVisitas,
      openModal,
      quantityProd,
      prodDesc,
    } = this.state;
    let totalPorDia = 0;

    pedidoFilter.forEach((prd) => (totalPorDia += prd.total));
    const keyCodigos = Object.keys(quantityProd);
    return (
      <div className="list row">
        <div className="col-md-6">
          <div className="new-reservation">
            <a className="btn btn-primary" href="/new-visit" role="button">
              Nuevo pedido
            </a>
            <Button
              variant="contained"
              color="default"
              className="inform-button"
              endIcon={<ReceiptIcon />}
              onClick={this.getQuantity}
            >
              Cant. x prod.
            </Button>
          </div>
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
            </div>
          </Paper>
          <div className="form-group">
            <FormControlLabel
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
            <label className="fecha-text">
              {entregaPedido ? "Fecha entrega pedido" : "Fecha creación pedido"}
            </label>
            <Datetime
              className="post-input  post-input__event"
              dateFormat="DD-MM-YYYY"
              timeFormat={false}
              name="eventDate"
              utc
              closeOnSelect
              value={this.state.date}
              onChange={this.onChangeDate}
            />
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
                            ${pedido.total.toFixed(2)}
                          </TableCell>
                          <TableCell
                            className={`color__status ${pedido.status.toLowerCase()}`}
                            onClick={(e) => {
                              e.preventDefault();
                              this.setOpen(index);
                            }}
                          >
                            {pedido.status}
                          </TableCell>
                          <TableCell>
                            <IconButton
                              aria-label="delete"
                              className="action__link"
                              href={`/edit-pedido/${pedido.id}`}
                              role="button"
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              aria-label="delete"
                              type="button"
                              className="action__button"
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
                            <IconButton
                              href={`/imprimir/${pedido.id}`}
                              role="button"
                              aria-label="imprimir"
                              className="action__link"
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
        </div>
      </div>
    );
  }
}
