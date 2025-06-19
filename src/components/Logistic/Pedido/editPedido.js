import React, { Component } from "react";
import moment from "moment";
import { List, Toast } from "antd-mobile";
import {
  TextField,
  InputAdornment,
  Button,
  Checkbox,
  FormControlLabel,
  Table,
  TableBody,
  TableContainer,
  TableCell,
  Paper,
  TableHead,
  TableRow,
  IconButton,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  FormControl,
  Select,
  MenuItem,
} from "@mui/material";
import { Modal } from "antd-mobile";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import ProductosDataService from "../../../services/productos.service";
import PedidosDataService from "../../../services/pedidos.service";
import SearchIcon from "@mui/icons-material/Search";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import EditIcon from "@mui/icons-material/Edit";

const alert = Modal.alert;
const prompt = Modal.prompt;
const currentUser = JSON.parse(localStorage.getItem("currentUser"));

const Item = List.Item;
const Brief = Item.Brief;

export default class EditPedido extends Component {
  constructor(props) {
    super(props);
    this.onDataChange = this.onDataChange.bind(this);
    this.searchTitle = this.searchTitle.bind(this);
    this.onChangeSearchTitle = this.onChangeSearchTitle.bind(this);
    this.setActive = this.setActive.bind(this);
    this.onChangeCantidad = this.onChangeCantidad.bind(this);
    this.onChangePeso = this.onChangePeso.bind(this);
    this.onChangeDto = this.onChangeDto.bind(this);
    this.onChangeIva = this.onChangeIva.bind(this);
    this.onChangeIvaProd = this.onChangeIvaProd.bind(this);
    this.addPedido = this.addPedido.bind(this);
    this.updatePedido = this.updatePedido.bind(this);
    this.getCurrentPedido = this.getCurrentPedido.bind(this);
    this.onChangeDate = this.onChangeDate.bind(this);
    this.setOpen = this.setOpen.bind(this);
    this.deleteProduct = this.deleteProduct.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleOpenModal = this.handleOpenModal.bind(this);
    this.editProduct = this.editProduct.bind(this);
    this.onChangeValueProduct = this.onChangeValueProduct.bind(this);
    this.onChangePrecio = this.onChangePrecio.bind(this);
    this.onChangeTipo = this.onChangeTipo.bind(this);
    // Funciones para manejo de forma de pago
    this.abrirModalFormaPago = this.abrirModalFormaPago.bind(this);
    this.cerrarModalFormaPago = this.cerrarModalFormaPago.bind(this);
    this.onChangeDatosPago = this.onChangeDatosPago.bind(this);
    this.finalizarPedidoConDatos = this.finalizarPedidoConDatos.bind(this);

    this.state = {
      products: [],
      peso: "1",
      cantidad: "",
      descuento: "",
      indexActive: -1,
      pedido: {
        key: null,
        id: 0,
        idCliente: 0,
        clienteName: "",
        productos: [],
        fecha: moment(new Date().getTime()).format("DD-MM-YYYY hh:mm"),
        total: 0,
        totalCosto: 0,
        status: "Creado",
        fechaEntrega: null,
        condPago: "",
        datosPago: {}
      },
      producto: {
        peso: "",
        cantidad: "",
        descuento: "",
        precio: "",
        // iva: "",
      },
      searchTitle: "",
      productoFilter: [],
      iva: false,
      medioIva: false,
      submitted: false,
      open: false,
      editProd: false,
      indexProdOpen: -1,
      tipoPrecio: "precio",
      precioMayorista: 0,
      precioMinorista: 0,
      // Estados para el modal de forma de pago
      modalFormaPago: false,
      formaPagoSeleccionada: "",
      datosPago: {
        // Para Contado
        comentarios: "",
        // Para Cheque
        banco: "",
        nroCheque: "",
        fechaCobranza: "",
        cuit: "",
        // Para Transferencia
        nroTransferencia: "",
        fecha: "",
        emisor: "",
        destinatario: ""
      }
    };
  }

  componentDidMount() {
    const id = parseInt(this.props.match.params.id, 10);
    PedidosDataService.getAll()
      .orderByChild("id")
      .equalTo(id)
      .once("value", this.getCurrentPedido);
    ProductosDataService.getAll()
      .orderByChild("id")
      .once("value", this.onDataChange);
  }

  componentWillUnmount() {
    PedidosDataService.getAll().off("value", this.getCurrentPedido);
  }

  onDataChange(items) {
    const products = [];
    items.forEach((item) => {
      let data = item.val();
      products.push({
        id: data.id,
        codigo: data.codigo,
        descripcion: data.descripcion,
        marca: data.marca,
        stock: data.stock,
        peso: data.peso,
        precio: data.precio,
        precioMayorista: data.precioMayorista,
        precioCosto: data.precioCosto,
      });
    });
    this.setState({ products });
  }

  getCurrentPedido(item) {
    let key = Object.keys(item.val());
    let data = item.val();
    const pedido = data[key];
    pedido.key = key[0];
    this.setState({ pedido });
  }

  onChangeSearchTitle(e) {
    const searchTitle = e.target.value;

    this.setState({
      searchTitle: searchTitle,
    });
  }

  searchTitle(e) {
    const { products } = this.state;
    clearTimeout(this.timer);
    const value = e.target.value;
    this.timer = setTimeout(() => {
      if (value) {
        const filter = products.filter(
          (prod) =>
            prod.descripcion.toLowerCase().match(value.toLowerCase()) ||
            prod.codigo.toLowerCase().match(value.toLowerCase())
        );
        this.setState({ productoFilter: filter, searchTitle: value });
      } else {
        this.setState({ searchTitle: "" });
      }
    }, 500);
  }

  setActive(peso, index, precio, precioMayorista) {
    this.setState({ indexActive: index, peso, precio, precioMayorista, precioMinorista: precio });
  }

  onChangeCantidad(e) {
    this.setState({ cantidad: e.target.value });
  }

  onChangeDto(e) {
    this.setState({ descuento: e.target.value });
  }

  onChangePeso(e) {
    this.setState({ peso: e.target.value });
  }

  onChangeIva(e) {
    const valor = e.target.value;
    this.setState({ [valor]: !this.state[valor] });
  }

  onChangeDate(e) {
    const dateFormat = e.format("DD-MM-YYYY");
    this.setState({
      pedido: {
        ...this.state.pedido,
        fechaEntrega: dateFormat,
      },
    });
  }

  onChangePrecio(e) {
    this.setState({ precio: e.target.value });
  }

  onChangeTipo(e) {
    const tipoPrecio = e.target.value;
    let nuevoPrecio = "";

    if (tipoPrecio === "precio") {
      nuevoPrecio = this.state.precioMinorista || "";
    } else if (tipoPrecio === "precioMayorista") {
      nuevoPrecio = this.state.precioMayorista || "";
    }

    this.setState({
      tipoPrecio,
      precio: tipoPrecio === "otro" ? "" : nuevoPrecio,
    });
  }

  addPedido(subtotal, idProducto, subtotalCosto) {
    const { products, peso, cantidad, descuento, iva, medioIva, precio } = this.state;
    const produc = products.filter((prod) => prod.id === idProducto);
    let isIva = "No";
    if (iva) {
      isIva = "iva";
    }
    if (medioIva) {
      isIva = "medioIva";
    }
    const prodPedido = {
      id: produc[0].id,
      codigo: produc[0].codigo,
      descripcion: produc[0].descripcion,
      marca: produc[0].marca,
      precioCosto: produc[0].precioCosto,
      precio,
      peso,
      cantidad,
      descuento,
      iva: isIva,
      subtotal,
      subtotalCosto
    };
    this.state.pedido.productos.push(prodPedido);
    const totalCosto = this.state.pedido.totalCosto + subtotalCosto;
    const total = this.state.pedido.total + subtotal;

    this.setState({
      pedido: {
        ...this.state.pedido,
        total,
        totalCosto
      },
      // peso: "1",
      cantidad: "",
      descuento: "",
      iva: false,
      indexActive: -1,
      medioIva: false,
    });
    Toast.success("Cargado correctamente!!", 1);
  }

  deleteProduct(codigo) {
    const { pedido } = this.state;
    var index = pedido.productos.findIndex((prd) => prd.codigo === codigo);
    pedido.productos.splice(index, 1);
    let newTotal = 0;
    let newTotalCosto = 0;
    pedido.productos.forEach((prd) => {
      newTotal += prd.subtotal;
      newTotalCosto += prd.subtotalCosto;
    });
    this.setState({
      pedido: {
        ...this.state.pedido,
        total: newTotal,
        totalCosto: newTotalCosto
      },
    });
  }

  handleOpenModal(index, product) {
    this.setState({
      editProd: true,
      indexProdOpen: index,
      producto: {
        peso: product.peso,
        cantidad: product.cantidad,
        precio: product.precio,
        descuento: product.descuento,
      },
    });
  }

  handleClose() {
    this.setState({
      editProd: false,
      indexProdOpen: -1,
    });
  }

  onChangeValueProduct(e) {
    const name = e.target.name;
    const value = e.target.value;
    this.setState({
      producto: {
        ...this.state.producto,
        [name]: value,
      },
    });
  }

  onChangeIvaProd(e) {
    const valor = e.target.value;
    this.setState({ [valor]: !this.state[valor] });
  }

  editProduct(product) {
    const { pedido, producto } = this.state
    const subtotal = producto.precio * producto.peso * producto.cantidad;
    const subtotalCosto = product.precioCosto * producto.peso * producto.cantidad;
    const subtotalDto = subtotal - (subtotal * producto.descuento) / 100;
    product.peso = producto.peso;
    product.cantidad = producto.cantidad;
    product.descuento = producto.descuento;
    product.precio = producto.precio;
    product.subtotal = subtotalDto;
    product.subtotalCosto = subtotalCosto;

    let newTotal = 0;
    let newTotalCosto = 0;
    pedido.productos.forEach((prd) => {
      newTotal += prd.subtotal;
      newTotalCosto += prd.subtotalCosto;
    });
    this.setState({
      pedido: {
        ...this.state.pedido,
        total: newTotal,
        totalCosto: newTotalCosto,
      },
      editProd: false,
      indexProdOpen: -1,
      producto: {
        // peso: "1",
        cantidad: "",
        descuento: "",
        iva: "",
      },
    });
  }

  updatePedido() {
    let data = {
      id: this.state.pedido.id,
      idCliente: this.state.pedido.idCliente,
      clienteName: this.state.pedido.clienteName,
      productos: this.state.pedido.productos,
      fecha: this.state.pedido.fecha,
      status: this.state.pedido.status,
      fechaEntrega: this.state.pedido.fechaEntrega,
      total: this.state.pedido.total,
      totalCosto: this.state.pedido.totalCosto,
    };

    PedidosDataService.update(this.state.pedido.key, data)
      .then(() => {
        Toast.loading("Loading...", 1, () => {
          this.setState({
            submitted: true,
          });
        });
      })
      .catch((e) => {
        Toast.fail("Ocurrió un error !!!", 2);
      });
  }

  setOpen() {
    this.setState({ open: !this.state.open });
  }

  // Funciones para manejo de forma de pago
  abrirModalFormaPago(formaPago) {
    // Si el pedido ya tiene datos de pago, cargarlos en el modal
    const datosPagoExistentes = this.state.pedido.datosPago || {};
    
    this.setState({
      modalFormaPago: true,
      formaPagoSeleccionada: formaPago,
      datosPago: {
        // Para Contado
        comentarios: datosPagoExistentes.comentarios || "",
        // Para Cheque
        banco: datosPagoExistentes.banco || "",
        nroCheque: datosPagoExistentes.nroCheque || "",
        fechaCobranza: datosPagoExistentes.fechaCobranza || "",
        cuit: datosPagoExistentes.cuit || "",
        // Para Transferencia
        nroTransferencia: datosPagoExistentes.nroTransferencia || "",
        fecha: datosPagoExistentes.fecha || "",
        emisor: datosPagoExistentes.emisor || "",
        destinatario: datosPagoExistentes.destinatario || ""
      }
    });
  }

  cerrarModalFormaPago() {
    this.setState({
      modalFormaPago: false,
      formaPagoSeleccionada: "",
    });
  }

  onChangeDatosPago(campo, valor) {
    this.setState({
      datosPago: {
        ...this.state.datosPago,
        [campo]: valor
      }
    });
  }

  finalizarPedidoConDatos() {
    const { formaPagoSeleccionada, datosPago } = this.state;

    // Validar campos obligatorios según la forma de pago
    let camposRequeridos = [];
    switch (formaPagoSeleccionada) {
      case 'Contado':
        // Comentarios es opcional para contado
        break;
      case 'Cheque':
        if (!datosPago.banco) camposRequeridos.push('Banco');
        if (!datosPago.nroCheque) camposRequeridos.push('Nro de Cheque');
        if (!datosPago.fechaCobranza) camposRequeridos.push('Fecha Cobranza');
        if (!datosPago.cuit) camposRequeridos.push('CUIT');
        break;
      case 'Transferencia':
        if (!datosPago.nroTransferencia) camposRequeridos.push('Nro Transferencia');
        if (!datosPago.fecha) camposRequeridos.push('Fecha');
        if (!datosPago.emisor) camposRequeridos.push('Emisor');
        if (!datosPago.destinatario) camposRequeridos.push('Destinatario');
        break;
    }

    if (camposRequeridos.length > 0) {
      Toast.fail(`Faltan completar los siguientes campos: ${camposRequeridos.join(', ')}`, 3);
      return;
    }

    // Actualizar el pedido con los datos de pago
    this.setState({
      pedido: {
        ...this.state.pedido,
        condPago: formaPagoSeleccionada,
        datosPago: datosPago,
      }
    }, () => {
      // Después de actualizar el estado, actualizar el pedido en la base de datos
      this.updatePedidoConPago();
    });
    
    this.cerrarModalFormaPago();
  }

  updatePedidoConPago() {
    let data = {
      id: this.state.pedido.id,
      idCliente: this.state.pedido.idCliente,
      clienteName: this.state.pedido.clienteName,
      productos: this.state.pedido.productos,
      fecha: this.state.pedido.fecha,
      status: this.state.pedido.status,
      fechaEntrega: this.state.pedido.fechaEntrega,
      total: this.state.pedido.total,
      totalCosto: this.state.pedido.totalCosto,
      condPago: this.state.pedido.condPago,
      datosPago: this.state.pedido.datosPago,
    };

    PedidosDataService.update(this.state.pedido.key, data)
      .then(() => {
        Toast.success("Pedido actualizado con datos de pago!", 2);
      })
      .catch((e) => {
        Toast.fail("Ocurrió un error al actualizar !!!", 2);
      });
  }

  render() {
    const {
      submitted,
      products,
      searchTitle,
      indexActive,
      peso,
      descuento,
      cantidad,
      productoFilter,
      iva,
      medioIva,
      pedido,
      open,
      editProd,
      indexProdOpen,
      producto,
      precio,
      tipoPrecio,
      modalFormaPago,
      formaPagoSeleccionada,
      datosPago
    } = this.state;
    const displayTable = searchTitle !== "" ? productoFilter : products;
    let subtotalDto = 0.0;
    let subtotalCosto = 0.0;
    const valorIva = iva ? 0.21 : 0.105;
    return (
      <div className="list row">
        {submitted ? (
          <div>
            <h4>Pedido editado correctamente!</h4>
            <a
              className="btn btn-primary go-listado"
              href="/logistic/new-visit"
              role="button"
            >
              Nuevo Pedido
            </a>
            <a
              className="btn btn-primary go-listado"
              href="/logistic/list-pedidos"
              role="button"
            >
              Listado
            </a>
          </div>
        ) : (
          <div className="col-md-6">
            <div className="col-md-8">
              <div className="input-group mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar"
                  onChange={this.searchTitle}
                />
                <div className="input-group-append">
                  <button
                    className="btn btn-outline-secondary search-button"
                    type="button"
                    onClick={this.searchTitle}
                  >
                    <SearchIcon color="action" />
                  </button>
                </div>
              </div>
            </div>
            <h4>Editar Pedido - {pedido.clienteName}</h4>

            <div className="form-group">
              {/*  <label htmlFor="fecha">Fecha de entrega de pedido</label>
              <Datetime
                className="post-input  post-input__event"
                dateFormat="DD-MM-YYYY"
                timeFormat={false}
                name="eventDate"
                utc
                closeOnSelect
                value={pedido.fechaEntrega}
                onChange={this.onChangeDate}
              />
            </div> */}
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <DatePicker
                  label="Fecha entrega pedido"
                  value={pedido.fechaEntrega ? moment(pedido.fechaEntrega, "DD-MM-YYYY") : null}
                  onChange={this.onChangeDate}
                  inputFormat="DD-MM-YYYY" // en v5 es "inputFormat", no "format"
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

            <Link
              component="button"
              variant="body2"
              className="open-products"
              onClick={this.setOpen}
            >
              Mostrar productos del pedido
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </Link>
            {open && (
              <TableContainer
                className="table-products__container"
                component={Paper}
              >
                <Table size="small" aria-label="a dense table">
                  <TableHead>
                    <TableRow>
                      <TableCell></TableCell>
                      <TableCell>Código</TableCell>
                      <TableCell>Precio</TableCell>
                      <TableCell>Peso</TableCell>
                      <TableCell>Cant.</TableCell>
                      <TableCell>Descripción</TableCell>
                      <TableCell>Marca</TableCell>
                      <TableCell>Descuento</TableCell>
                      <TableCell>IVA</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pedido.productos.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <IconButton
                            color="secondary"
                            aria-label="eliminar"
                            component="span"
                            size="small"
                            onClick={() =>
                              alert("Eliminar", "Eliminar producto?", [
                                { text: "Cancelar" },
                                {
                                  text: "Ok",
                                  onPress: () => this.deleteProduct(row.codigo),
                                },
                              ])
                            }
                          >
                            <HighlightOffIcon />
                          </IconButton>
                          <IconButton
                            className="action__link"
                            size="small"
                            onClick={(e) => {
                              e.preventDefault();
                              this.handleOpenModal(index, row);
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                          <Dialog
                            open={editProd && indexProdOpen === index}
                            aria-labelledby="form-dialog-title"
                          >
                            <DialogTitle
                              id="form-dialog-title"
                              onClose={this.handleClose}
                            >
                              Editar producto
                            </DialogTitle>
                            <DialogContent>
                              <TextField
                                className="prod-input"
                                autoFocus
                                fullWidth
                                margin="dense"
                                name="peso"
                                label="Peso"
                                // disabled={currentUser.userName !== 'NicoV01'}
                                value={producto.peso}
                                onChange={this.onChangeValueProduct}
                              />
                              <TextField
                                className="prod-input"
                                fullWidth
                                margin="dense"
                                name="cantidad"
                                label="Cant."
                                value={producto.cantidad}
                                onChange={this.onChangeValueProduct}
                              />
                              <TextField
                                className="prod-input"
                                // margin="dense"
                                fullWidth
                                name="precio"
                                label="Precio"
                                value={producto.precio}
                                onChange={this.onChangeValueProduct}
                              />
                              <TextField
                                className="prod-input"
                                // margin="dense"
                                fullWidth
                                name="descuento"
                                label="Desc."
                                value={producto.descuento}
                                onChange={this.onChangeValueProduct}
                              />
                              {/* <div>
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      color="default"
                                      checked={iva}
                                      onChange={this.onChangeIvaProd}
                                      value="iva"
                                    />
                                  }
                                  label="IVA"
                                />
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      color="default"
                                      checked={medioIva}
                                      onChange={this.onChangeIvaProd}
                                      value="medioIva"
                                    />
                                  }
                                  label="1/2 IVA"
                                />
                              </div> */}
                            </DialogContent>
                            <DialogActions>
                              <Button
                                color="primary"
                                onClick={this.handleClose}
                              >
                                Cancelar
                              </Button>
                              <Button
                                color="primary"
                                onClick={(e) => {
                                  e.preventDefault();
                                  this.editProduct(row);
                                }}
                                disabled={producto.cantidad === '' || producto.peso === ''}
                              >
                                Aceptar
                              </Button>
                            </DialogActions>
                          </Dialog>
                        </TableCell>
                        <TableCell component="th" scope="row">
                          {row.codigo}
                        </TableCell>
                        <TableCell>${row.precio}</TableCell>
                        <TableCell>{row.peso}</TableCell>
                        <TableCell>{row.cantidad}</TableCell>
                        <TableCell>{row.descripcion}</TableCell>
                        <TableCell>{row.marca}</TableCell>
                        <TableCell>{row.descuento}</TableCell>
                        <TableCell>{row.iva}</TableCell>
                        <TableCell align="right">
                          ${row.subtotal.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            <div className="table-container pedido">
              {products &&
                displayTable.map((producto, index) => {
                  const isActive = indexActive === index;
                  if (isActive) {
                    subtotalCosto = producto.precioCosto * peso * cantidad;
                    const subtotal = producto.precio * peso * cantidad;
                    subtotalDto =
                      subtotal -
                      (subtotal * descuento) / 100 +
                      (iva || medioIva ? subtotal * valorIva : 0);
                  }
                  return (
                    <List className="my-list" key={index}>
                      <Item
                        multipleLine
                        onClick={(e) => {
                          e.preventDefault();
                          if (!isActive) {
                            this.setActive(producto.peso, index, producto.precio, producto.precioMayorista);
                          }
                        }}
                        wrap
                      >
                        <div className="prod__description-container">
                          <span className="prod__codigo-text">
                            #{producto.codigo}
                          </span>
                          <span className="prod__description">
                            {producto.descripcion}{" "}
                          </span>
                          <Brief>{producto.marca}</Brief>
                          {isActive ? (
                            <Box display="flex" gap={2} alignItems="center">
                              <FormControl variant="standard">
                                <Select
                                  labelId="tipo-precio-label"
                                  value={tipoPrecio}
                                  onChange={this.onChangeTipo}
                                  sx={{ minWidth: 110 }}
                                >
                                  <MenuItem value="precio">P. Minorista</MenuItem>
                                  <MenuItem value="precioMayorista">P. Mayorista</MenuItem>
                                  <MenuItem value="otro">Otro</MenuItem>
                                </Select>
                              </FormControl>

                              <TextField
                                id="standard-start-adornment"
                                className="prod__precio"
                                type="number"
                                disabled={tipoPrecio !== "otro"}
                                onChange={this.onChangePrecio}
                                value={precio}
                                sx={{ maxWidth: 150, marginBottom: '4px' }}
                                InputProps={{
                                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                }}
                                variant="standard"
                              />
                            </Box>
                          ) : (
                            <span className="am-list-extra precio">
                              ${producto.precio}
                            </span>
                          )}
                          <span className="prod__stock-text">
                            S: {producto.stock}
                          </span>
                          {isActive && (
                            <div>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    color="default"
                                    checked={iva}
                                    onChange={this.onChangeIva}
                                    value="iva"
                                  />
                                }
                                label="IVA"
                              />
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    color="default"
                                    checked={medioIva}
                                    onChange={this.onChangeIva}
                                    value="medioIva"
                                  />
                                }
                                label="1/2 IVA"
                              />
                              <TextField
                                id="standard-read-only-input"
                                className="prod__subtotal"
                                label="Subtotal"
                                value={subtotalDto.toFixed(2)}
                                InputProps={{
                                  readOnly: true,
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      $
                                    </InputAdornment>
                                  ),
                                }}
                              />
                            </div>
                          )}
                        </div>
                        {isActive && (
                          <div className="prod__codigo-container">
                            <TextField
                              id="standard-start-adornment"
                              type="number"
                              onChange={this.onChangePeso}
                              value={isActive ? peso : ""}
                              // disabled={currentUser.userName !== 'NicoV01'}
                              InputProps={{
                                endAdornment: (
                                  <InputAdornment position="end">
                                    Kg
                                  </InputAdornment>
                                ),
                              }}
                            />
                            <TextField
                              id="standard-basic"
                              label="Cantidad"
                              type="number"
                              value={isActive ? cantidad : ""}
                              onChange={this.onChangeCantidad}
                            />
                            <TextField
                              id="standard-basic"
                              label="Dto"
                              type="number"
                              className="input-dto"
                              value={isActive ? descuento : ""}
                              onChange={this.onChangeDto}
                              InputProps={{
                                endAdornment: (
                                  <InputAdornment position="end">
                                    %
                                  </InputAdornment>
                                ),
                              }}
                            />
                          </div>
                        )}
                        <div className="prod__button-container">
                          <Button
                            className="prod__button-add"
                            variant="contained"
                            onClick={(e) => {
                              e.preventDefault();
                              this.addPedido(subtotalDto, producto.id, subtotalCosto);
                            }}
                            disabled={
                              !isActive || peso === "" || cantidad === ""
                            }
                          >
                            Agregar
                          </Button>
                        </div>
                      </Item>
                    </List>
                  );
                })}
            </div>
            {/* Mostrar información de pago actual */}
            {pedido.condPago && (
              <div style={{ margin: '10px 0', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
                <h5>Información de Pago Actual:</h5>
                <p><strong>Tipo de Pago:</strong> {pedido.condPago}</p>
                {pedido.condPago === 'Contado' && pedido.datosPago?.comentarios && (
                  <p><strong>Comentarios:</strong> {pedido.datosPago.comentarios}</p>
                )}
                {pedido.condPago === 'Cheque' && (
                  <>
                    <p><strong>Banco:</strong> {pedido.datosPago?.banco}</p>
                    <p><strong>Nro de Cheque:</strong> {pedido.datosPago?.nroCheque}</p>
                    <p><strong>Fecha Cobranza:</strong> {pedido.datosPago?.fechaCobranza}</p>
                    <p><strong>CUIT:</strong> {pedido.datosPago?.cuit}</p>
                  </>
                )}
                {pedido.condPago === 'Transferencia' && (
                  <>
                    <p><strong>Nro Transferencia:</strong> {pedido.datosPago?.nroTransferencia}</p>
                    <p><strong>Fecha:</strong> {pedido.datosPago?.fecha}</p>
                    <p><strong>Emisor:</strong> {pedido.datosPago?.emisor}</p>
                    <p><strong>Destinatario:</strong> {pedido.datosPago?.destinatario}</p>
                  </>
                )}
              </div>
            )}

            <div role="region" className="total-banner">
              <p className="total__text">Total: $ {pedido.total.toFixed(2)}</p>
                            <div className="total-buttons" style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px' }}>
                <Button
                  variant="contained"
                  color="primary"
                  className="total__button"
                  onClick={this.updatePedido}
                >
                  Actualizar pedido
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  className="total__button"
                  onClick={() =>
                    alert(
                      "Forma de Pago",
                      `Forma de pago actual: ${pedido.condPago || 'No definida'}\n\nSeleccione nueva forma de pago:`,
                      [
                        {
                          text: "Contado",
                          onPress: () => this.abrirModalFormaPago('Contado'),
                        },
                        {
                          text: "Cheque",
                          onPress: () => this.abrirModalFormaPago('Cheque'),
                        },
                        {
                          text: "Transferencia",
                          onPress: () => this.abrirModalFormaPago('Transferencia'),
                        },
                        {
                          text: "Cancelar",
                        },
                      ]
                    )
                  }
                  disabled={pedido.total === 0}
                >
                  {pedido.condPago ? `Editar Pago (${pedido.condPago})` : 'Definir Forma de Pago'}
                </Button>
              </div>
              </div>

            {/* Modal de Forma de Pago */}
            <Dialog
              open={modalFormaPago}
              onClose={this.cerrarModalFormaPago}
              maxWidth="sm"
              fullWidth
            >
              <DialogTitle>
                Datos de {formaPagoSeleccionada}
              </DialogTitle>
              <DialogContent>
                {formaPagoSeleccionada === 'Contado' && (
                  <TextField
                    autoFocus
                    margin="dense"
                    label="Comentarios (opcional)"
                    type="text"
                    fullWidth
                    multiline
                    rows={3}
                    variant="outlined"
                    value={datosPago.comentarios}
                    onChange={(e) => this.onChangeDatosPago('comentarios', e.target.value)}
                  />
                )}

                {formaPagoSeleccionada === 'Cheque' && (
                  <>
                    <TextField
                      autoFocus
                      margin="dense"
                      label="Banco *"
                      type="text"
                      fullWidth
                      variant="outlined"
                      value={datosPago.banco}
                      onChange={(e) => this.onChangeDatosPago('banco', e.target.value)}
                    />
                    <TextField
                      margin="dense"
                      label="Nro de Cheque *"
                      type="text"
                      fullWidth
                      variant="outlined"
                      value={datosPago.nroCheque}
                      onChange={(e) => this.onChangeDatosPago('nroCheque', e.target.value)}
                    />
                    <TextField
                      margin="dense"
                      label="Fecha Cobranza *"
                      type="date"
                      fullWidth
                      variant="outlined"
                      InputLabelProps={{
                        shrink: true,
                      }}
                      value={datosPago.fechaCobranza}
                      onChange={(e) => this.onChangeDatosPago('fechaCobranza', e.target.value)}
                    />
                    <TextField
                      margin="dense"
                      label="CUIT *"
                      type="text"
                      fullWidth
                      variant="outlined"
                      value={datosPago.cuit}
                      onChange={(e) => this.onChangeDatosPago('cuit', e.target.value)}
                    />
                  </>
                )}

                {formaPagoSeleccionada === 'Transferencia' && (
                  <>
                    <TextField
                      autoFocus
                      margin="dense"
                      label="Nro Transferencia *"
                      type="text"
                      fullWidth
                      variant="outlined"
                      value={datosPago.nroTransferencia}
                      onChange={(e) => this.onChangeDatosPago('nroTransferencia', e.target.value)}
                    />
                    <TextField
                      margin="dense"
                      label="Fecha *"
                      type="date"
                      fullWidth
                      variant="outlined"
                      InputLabelProps={{
                        shrink: true,
                      }}
                      value={datosPago.fecha}
                      onChange={(e) => this.onChangeDatosPago('fecha', e.target.value)}
                    />
                    <TextField
                      margin="dense"
                      label="Emisor *"
                      type="text"
                      fullWidth
                      variant="outlined"
                      value={datosPago.emisor}
                      onChange={(e) => this.onChangeDatosPago('emisor', e.target.value)}
                    />
                    <TextField
                      margin="dense"
                      label="Destinatario *"
                      type="text"
                      fullWidth
                      variant="outlined"
                      value={datosPago.destinatario}
                      onChange={(e) => this.onChangeDatosPago('destinatario', e.target.value)}
                    />
                  </>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={this.cerrarModalFormaPago} color="secondary">
                  Cancelar
                </Button>
                <Button onClick={this.finalizarPedidoConDatos} color="primary" variant="contained">
                  Guardar Datos de Pago
                </Button>
              </DialogActions>
            </Dialog>
          </div>
        )}
      </div>
    );
  }
}
