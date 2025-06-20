import React, { Component } from "react";
import moment from "moment";
import { List, Toast, Modal } from "antd-mobile";
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
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import ProductosDataService from "../../../services/productos.service";
import PedidosDataService from "../../../services/pedidos.service";
import ClientesDataService from "../../../services/clients.service";
import SearchIcon from "@mui/icons-material/Search";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import EditIcon from "@mui/icons-material/Edit";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

const alert = Modal.alert;
const Item = List.Item;
const Brief = Item.Brief;
const currentUser = JSON.parse(localStorage.getItem("currentUser"));

export default class Pedido extends Component {
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
    this.addPedido = this.addPedido.bind(this);
    this.setInitialProduct = this.setInitialProduct.bind(this);
    this.getLastId = this.getLastId.bind(this);
    this.createPedido = this.createPedido.bind(this);
    this.getClient = this.getClient.bind(this);
    this.onChangeDate = this.onChangeDate.bind(this);
    this.setOpen = this.setOpen.bind(this);
    this.deleteProduct = this.deleteProduct.bind(this);
    this.onChangePrecio = this.onChangePrecio.bind(this);
    this.onChangeTipo = this.onChangeTipo.bind(this);
    this.updateProductStock = this.updateProductStock.bind(this);
    this.procesarAgregarPedido = this.procesarAgregarPedido.bind(this);
    this.abrirModalFormaPago = this.abrirModalFormaPago.bind(this);
    this.cerrarModalFormaPago = this.cerrarModalFormaPago.bind(this);
    this.onChangeDatosPago = this.onChangeDatosPago.bind(this);
    this.finalizarPedidoConDatos = this.finalizarPedidoConDatos.bind(this);

    this.state = {
      products: [],
      currentProduct: null,
      lastId: 0,
      peso: "1",
      cantidad: "",
      descuento: "",
      indexActive: -1,
      precio: 0,
      pedido: {
        id: 0,
        idCliente: 0,
        clienteName: "",
        clienteDomicilio: "",
        productos: [],
        fecha: moment(new Date().getTime()).format("DD-MM-YYYY hh:mm"),
        total: 0,
        totalCosto: 0,
        status: "Creado",
        fechaEntrega: moment(new Date().getTime()).add(1, 'days').format("DD-MM-YYYY"),
        user: currentUser.userName
      },
      searchTitle: "",
      productoFilter: [],
      iva: false,
      medioIva: false,
      submitted: false,
      keyClient: '',
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
      .limitToLast(1)
      .once("child_added", this.getLastId);
    ProductosDataService.getAll()
      .orderByChild("id")
      .once("value", this.onDataChange);
    ClientesDataService.getAll()
      .orderByChild("id")
      .equalTo(id)
      .once("child_added", this.getClient);
  }

  componentWillUnmount() {
    ProductosDataService.getAll().off("value", this.onDataChange);
    PedidosDataService.getAll().off("child_added", this.getLastId);
    ClientesDataService.getAll().off("child_added", this.getClient);
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
        precio: data.precio,
        precioMayorista: data.precioMayorista,
        precioCosto: data.precioCosto,
        peso: data.peso,
      });
    });
    this.setState({ products });
  }

  getLastId(items) {
    this.setState({ lastId: items.val().id || 0 });
    this.setInitialProduct();
  }

  setInitialProduct() {
    const lastId = this.state.lastId;
    const idCliente = parseInt(this.props.match.params.id, 10);
    this.setState({
      pedido: {
        id: lastId + 1,
        idCliente,
        clienteName: "",
        clienteDomicilio: "",
        status: "Creado",
        productos: [],
        fecha: moment(new Date().getTime()).format("DD-MM-YYYY hh:mm"),
        total: 0,
        totalCosto: 0,
        fechaEntrega: moment(new Date().getTime()).add(1, 'days').format("DD-MM-YYYY"),
        user: currentUser.userName,
      },
    });
  }

  getClient(item) {
    this.setState({
      pedido: {
        ...this.state.pedido,
        clienteName: item.val().razon_social || "",
        clienteDomicilio: item.val().domicilio || "",
      },
      keyClient: item.key,
    });
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
            prod.codigo?.toString()?.toLowerCase().match(value.toLowerCase())
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

  onChangePrecio(e) {
    this.setState({ precio: e.target.value });
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
    const { products, cantidad, peso, descuento, iva, medioIva, precio } = this.state;
    console.log('subtotalCosto', subtotalCosto);

    const produc = products.filter((prod) => prod.id === idProducto);
    const producto = produc[0];

    // Validar stock disponible
    const cantidadSolicitada = parseFloat(cantidad);
    const stockDisponible = parseFloat(producto.stock) || 0;

    // Verificar si la cantidad solicitada es mayor o igual al stock disponible
    if (cantidadSolicitada >= stockDisponible) {
      const mensaje = stockDisponible === 0
        ? `El producto "${producto.descripcion}" no tiene stock disponible.`
        : `¡Advertencia! La cantidad solicitada (${cantidadSolicitada}) es mayor o igual al stock disponible (${stockDisponible}) del producto "${producto.descripcion}".`;

      alert(
        "Stock Insuficiente",
        mensaje + " ¿Desea continuar de todos modos?",
        [
          { text: "Cancelar" },
          {
            text: "Continuar",
            onPress: () => this.procesarAgregarPedido(subtotal, idProducto, subtotalCosto, producto)
          },
        ]
      );
      return; // Salir del método si hay advertencia
    }

    // Si el stock es suficiente, continuar normalmente
    this.procesarAgregarPedido(subtotal, idProducto, subtotalCosto, producto);
  }

  // Método separado para procesar la adición del pedido
  procesarAgregarPedido(subtotal, idProducto, subtotalCosto, producto) {
    const { cantidad, peso, descuento, iva, medioIva, precio } = this.state;

    let isIva = "No";
    if (iva) {
      isIva = "iva";
    }
    if (medioIva) {
      isIva = "medioIva";
    }
    const prodPedido = {
      id: producto.id,
      codigo: producto.codigo,
      descripcion: producto.descripcion,
      marca: producto.marca,
      precioCosto: producto.precioCosto,
      precio,
      peso,
      cantidad,
      descuento,
      iva: isIva,
      subtotal,
      subtotalCosto
    };
    this.state.pedido.productos.push(prodPedido);
    const total = this.state.pedido.total + subtotal;
    console.log('this.state.pedido.totalCosto', this.state.pedido.totalCosto, subtotalCosto);

    const totalCosto = this.state.pedido.totalCosto + subtotalCosto;

    this.setState({
      pedido: {
        ...this.state.pedido,
        total,
        totalCosto
      },
      cantidad: "",
      descuento: "",
      // peso: "",
      indexActive: -1,
      iva: false,
      medioIva: false,
    });
    Toast.success("Cargado correctamente!!", 1);
  }

  createPedido(condPago, datosPago = {}) {
    let data = {
      id: this.state.pedido.id,
      idCliente: this.state.pedido.idCliente,
      clienteName: this.state.pedido.clienteName,
      clienteDomicilio: this.state.pedido.clienteDomicilio,
      productos: this.state.pedido.productos,
      fecha: this.state.pedido.fecha,
      status: this.state.pedido.status,
      fechaEntrega: this.state.pedido.fechaEntrega,
      user: currentUser.userName,
      condPago,
      datosPago, // Agregar los datos específicos de la forma de pago
      total: this.state.pedido.total,
      totalCosto: this.state.pedido.totalCosto,
    };
    const estado = { estado: "visitado" }
    ClientesDataService.update(this.state.keyClient, estado)
      .then(() => { })
      .catch((e) => {
        Toast.fail("Ocurrió un error !!!", 2);
      });
    PedidosDataService.create(data)
      .then(() => {
        // Actualizar el stock de todos los productos del pedido
        this.updateProductStock();
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

  // Nuevo método para actualizar el stock de los productos
  updateProductStock() {
    const { pedido } = this.state;

    // Obtener todos los productos de la base de datos para actualizarlos
    ProductosDataService.getAll()
      .once("value", (snapshot) => {
        const productosDB = {};
        const productKeys = {};

        // Crear un mapa de productos con sus keys para facilitar la búsqueda
        snapshot.forEach((childSnapshot) => {
          const producto = childSnapshot.val();
          const key = childSnapshot.key;
          productosDB[producto.id] = producto;
          productKeys[producto.id] = key;
        });

        // Procesar cada producto del pedido
        pedido.productos.forEach((productoPedido) => {
          const productoEnDB = productosDB[productoPedido.id];
          const productoKey = productKeys[productoPedido.id];

          if (productoEnDB && productoKey) {
            // Calcular el total de cantidad a descontar (cantidad
            const cantidadADescontar = parseFloat(productoPedido.cantidad);
            const stockActual = parseFloat(productoEnDB.stock) || 0;
            // const nuevoStock = Math.max(0, stockActual - cantidadADescontar); // No permitir stock negativo
            const nuevoStock = stockActual - cantidadADescontar; // No permitir stock negativo

            // Actualizar el producto con el nuevo stock
            const datosActualizacion = {
              stock: nuevoStock
            };

            ProductosDataService.update(productoKey, datosActualizacion)
              .then(() => {
                console.log(`Stock actualizado para producto ${productoPedido.codigo}: ${stockActual} -> ${nuevoStock}`);
              })
              .catch((error) => {
                console.error(`Error actualizando stock del producto ${productoPedido.codigo}:`, error);
                Toast.fail(`Error actualizando stock del producto ${productoPedido.codigo}`, 2);
              });
          } else {
            console.warn(`Producto no encontrado en la base de datos: ID ${productoPedido.id}`);
          }
        });
      })
      .catch((error) => {
        console.error("Error obteniendo productos para actualizar stock:", error);
        Toast.fail("Error actualizando el stock de los productos", 2);
      });
  }

  setOpen() {
    this.setState({ open: !this.state.open });
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
        totalCosto: newTotalCosto,
      },
    });
  }

  // Métodos para el modal de forma de pago
  abrirModalFormaPago(formaPago) {
    this.setState({
      modalFormaPago: true,
      formaPagoSeleccionada: formaPago,
      datosPago: {
        comentarios: "",
        banco: "",
        nroCheque: "",
        fechaCobranza: "",
        cuit: "",
        nroTransferencia: "",
        fecha: "",
        emisor: "",
        destinatario: ""
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

    // Cerrar modal y crear pedido
    this.cerrarModalFormaPago();
    this.createPedido(formaPagoSeleccionada, datosPago);
  }

  render() {
    const {
      submitted,
      products,
      searchTitle,
      indexActive,
      descuento,
      cantidad,
      productoFilter,
      iva,
      medioIva,
      peso,
      pedido,
      open,
      precio,
      tipoPrecio,
      editProd,
      indexProdOpen,
      modalFormaPago,
      formaPagoSeleccionada,
      datosPago,
    } = this.state;
    const displayTable = searchTitle !== "" ? productoFilter : products;
    let subtotalDto = 0.0;
    let subtotalCosto = 0.0;
    const valorIva = iva ? 0.21 : 0.105;
    return (
      <div className="list row">
        {submitted ? (
          <div>
            <h4>Pedido creado correctamente!</h4>
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
            <h4>Pedido - {pedido.clienteName}</h4>

            <div className="form-group">
              {/* <Datetime
                className="post-input  post-input__event"
                dateFormat="DD-MM-YYYY"
                timeFormat={false}
                name="eventDate"
                utc
                closeOnSelect
                value={pedido.fechaEntrega}
                onChange={this.onChangeDate}
              /> */}
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <DatePicker
                  label="Fecha entrega pedido"
                  value={pedido.fechaEntrega}
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
                    {pedido.productos && pedido.productos.map((row, index) => (
                      <TableRow key={row.codigo}>
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
                          {/* <IconButton
                            className="action__link"
                            size="small"
                            onClick={(e) => {
                              e.preventDefault();
                              this.handleOpenModal(index);
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
                                name="descuento"
                                label="Desc."
                                value={producto.descuento}
                                onChange={this.onChangeValueProduct}
                              /> */}
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
                              </div>
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
                              >
                                Aceptar
                              </Button>
                            </DialogActions>
                          </Dialog> */}
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
                    subtotalCosto = producto?.precioCosto * peso * cantidad;
                    const subtotal = precio * peso * cantidad;
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
                              !isActive || cantidad === "" || peso === ""
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
            <div role="region" className="total-banner">
              <p className="total__text">
                Total: $ {pedido.total.toFixed(2)}
              </p>
              <Button
                variant="contained"
                color="primary"
                className="total__button"
                onClick={() =>
                  alert(
                    "Forma de Pago",
                    "Seleccione la forma de pago:",
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
                Finalizar pedido
              </Button>
            </div>

            {/* Modal de Forma de Pago */}
            <Dialog
              open={this.state.modalFormaPago}
              onClose={this.cerrarModalFormaPago}
              maxWidth="sm"
              fullWidth
            >
              <DialogTitle>
                Datos de {this.state.formaPagoSeleccionada}
              </DialogTitle>
              <DialogContent>
                {this.state.formaPagoSeleccionada === 'Contado' && (
                  <TextField
                    autoFocus
                    margin="dense"
                    label="Comentarios (opcional)"
                    type="text"
                    fullWidth
                    multiline
                    rows={3}
                    variant="outlined"
                    value={this.state.datosPago.comentarios}
                    onChange={(e) => this.onChangeDatosPago('comentarios', e.target.value)}
                  />
                )}

                {this.state.formaPagoSeleccionada === 'Cheque' && (
                  <>
                    <TextField
                      autoFocus
                      margin="dense"
                      label="Banco *"
                      type="text"
                      fullWidth
                      variant="outlined"
                      value={this.state.datosPago.banco}
                      onChange={(e) => this.onChangeDatosPago('banco', e.target.value)}
                    />
                    <TextField
                      margin="dense"
                      label="Nro de Cheque *"
                      type="text"
                      fullWidth
                      variant="outlined"
                      value={this.state.datosPago.nroCheque}
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
                      value={this.state.datosPago.fechaCobranza}
                      onChange={(e) => this.onChangeDatosPago('fechaCobranza', e.target.value)}
                    />
                    <TextField
                      margin="dense"
                      label="CUIT *"
                      type="text"
                      fullWidth
                      variant="outlined"
                      value={this.state.datosPago.cuit}
                      onChange={(e) => this.onChangeDatosPago('cuit', e.target.value)}
                    />
                  </>
                )}

                {this.state.formaPagoSeleccionada === 'Transferencia' && (
                  <>
                    <TextField
                      autoFocus
                      margin="dense"
                      label="Nro Transferencia *"
                      type="text"
                      fullWidth
                      variant="outlined"
                      value={this.state.datosPago.nroTransferencia}
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
                      value={this.state.datosPago.fecha}
                      onChange={(e) => this.onChangeDatosPago('fecha', e.target.value)}
                    />
                    <TextField
                      margin="dense"
                      label="Emisor *"
                      type="text"
                      fullWidth
                      variant="outlined"
                      value={this.state.datosPago.emisor}
                      onChange={(e) => this.onChangeDatosPago('emisor', e.target.value)}
                    />
                    <TextField
                      margin="dense"
                      label="Destinatario *"
                      type="text"
                      fullWidth
                      variant="outlined"
                      value={this.state.datosPago.destinatario}
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
                  Finalizar Pedido
                </Button>
              </DialogActions>
            </Dialog>
          </div>
        )}
      </div>
    );
  }
}
