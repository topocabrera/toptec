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
} from "@material-ui/core";
import Datetime from "react-datetime";
import ProductosDataService from "../../../services/productos.service";
import PedidosDataService from "../../../services/pedidos.service";
import ClientesDataService from "../../../services/clients.service";
import SearchIcon from "@material-ui/icons/Search";
import HighlightOffIcon from "@material-ui/icons/HighlightOff";
import EditIcon from "@material-ui/icons/Edit";
import KeyboardArrowDownIcon from "@material-ui/icons/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@material-ui/icons/KeyboardArrowUp";

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
    
    this.state = {
      products: [],
      currentProduct: null,
      lastId: 0,
      peso: "1",
      cantidad: "",
      descuento: "",
      indexActive: -1,
      pedido: {
        id: 0,
        idCliente: 0,
        clienteName: "",
        clienteDomicilio: "",
        productos: [],
        fecha: moment(new Date().getTime()).format("DD-MM-YYYY hh:mm"),
        total: 0,
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
            prod.codigo.toLowerCase().match(value.toLowerCase())
        );
        this.setState({ productoFilter: filter, searchTitle: value });
      } else {
        this.setState({ searchTitle: "" });
      }
    }, 500);
  }

  setActive(peso, index) {
    this.setState({ indexActive: index, peso });
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

  addPedido(subtotal, idProducto) {
    const { products, cantidad, peso, descuento, iva, medioIva } = this.state;
    const produc = products.filter((prod) => prod.id === idProducto);
    let isIva = "No";
    if (iva) {
      isIva = "iva";
    }
    if (medioIva) {
      isIva = "medioIva";
    }
    const prodPedido = {
      codigo: produc[0].codigo,
      descripcion: produc[0].descripcion,
      marca: produc[0].marca,
      precio: produc[0].precio,
      peso,
      cantidad,
      descuento,
      iva: isIva,
      subtotal,
    };
    this.state.pedido.productos.push(prodPedido);
    const total = this.state.pedido.total + subtotal;

    this.setState({
      pedido: {
        ...this.state.pedido,
        total,
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

  createPedido(condPago) {
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
      total: this.state.pedido.total,
    };
    const estado = { estado: "visitado" }
    ClientesDataService.update(this.state.keyClient, estado)
    .then(() => {})
    .catch((e) => {
      Toast.fail("Ocurrió un error !!!", 2);
    });
    PedidosDataService.create(data)
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


  deleteProduct(codigo) {
    const { pedido } = this.state;
    var index = pedido.productos.findIndex((prd) => prd.codigo === codigo);
    pedido.productos.splice(index, 1);
    let newTotal = 0;
    pedido.productos.forEach((prd) => {
      newTotal += prd.subtotal;
    });
    this.setState({
      pedido: {
        ...this.state.pedido,
        total: newTotal,
      },
    });
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
      editProd,
      indexProdOpen,
    } = this.state;
    const displayTable = searchTitle !== "" ? productoFilter : products;
    let subtotalDto = 0.0;
    const valorIva = iva ? 0.21 : 0.105;
    return (
      <div className="list row">
        {submitted ? (
          <div>
            <h4>Pedido creado correctamente!</h4>
            <a
              className="btn btn-primary go-listado"
              href="/new-visit"
              role="button"
            >
              Nuevo Pedido
            </a>
            <a
              className="btn btn-primary go-listado"
              href="/list-pedidos"
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
              <label htmlFor="fecha">Fecha de entrega de pedido</label>
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
                            this.setActive(producto.peso, index);
                          }
                        }}
                        wrap
                      >
                        <div className="prod__description-container">
                          <span className="prod__description">
                            {producto.descripcion}{" "}
                          </span>
                          <Brief>{producto.marca}</Brief>
                          <span className="prod__codigo-text">
                            #{producto.codigo}
                          </span>
                          <span className="am-list-extra precio">
                            ${producto.precio}
                          </span>
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
                              this.addPedido(subtotalDto, producto.id);
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
                // onClick={this.createPedido}
                onClick={() =>
                  alert(
                    "Tipo cobro",
                    <div></div>,
                    [
                      {
                        text: "Contado",
                        onPress: () =>
                          this.createPedido('contado'),
                      },
                      {
                        text: "Contado 7 dias",
                        onPress: () =>
                          this.createPedido('a 7 dias'),
                      },
                      {
                        text: "Contado 14 dias",
                        onPress: () =>
                          this.createPedido('a 14 dias'),
                      },
                      {
                        text: "Contado 21 dias",
                        onPress: () =>
                          this.createPedido('a 21 dias'),
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
          </div>
        )}
      </div>
    );
  }
}
