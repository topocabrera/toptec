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
} from "@material-ui/core";
import { Modal } from "antd-mobile";
import Datetime from "react-datetime";
import KeyboardArrowDownIcon from "@material-ui/icons/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@material-ui/icons/KeyboardArrowUp";
import ProductosDataService from "../../../services/productos.service";
import PedidosDataService from "../../../services/pedidos.service";
import SearchIcon from "@material-ui/icons/Search";
import HighlightOffIcon from "@material-ui/icons/HighlightOff";
import EditIcon from "@material-ui/icons/Edit";

const alert = Modal.alert;
const prompt = Modal.prompt;

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

    this.state = {
      products: [],
      peso: "1",
      cantidad: "",
      descuento: "",
      indexActive: 0,
      pedido: {
        key: null,
        id: 0,
        idCliente: 0,
        clienteName: "",
        productos: [],
        fecha: moment(new Date().getTime()).format("DD-MM-YYYY hh:mm"),
        total: 0,
        status: "Creado",
        fechaEntrega: "",
      },
      producto: {
        peso: "",
        cantidad: "",
        descuento: "",
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
        precio: data.precio,
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

  setActive(index) {
    this.setState({ indexActive: index });
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
    const { products, peso, cantidad, descuento, iva, medioIva } = this.state;
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
      peso: "1",
      cantidad: "",
      descuento: "",
      iva: false,
      medioIva: false,
    });
    Toast.success("Cargado correctamente!!", 1);
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

  handleOpenModal(index, product) {
    this.setState({
      editProd: true,
      indexProdOpen: index,
      producto: {
        peso: product.peso,
        cantidad: product.cantidad,
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
    const subtotal = product.precio * producto.peso * producto.cantidad;
    const subtotalDto = subtotal - (subtotal * producto.descuento) / 100;
    product.peso = producto.peso;
    product.cantidad = producto.cantidad;
    product.descuento = producto.descuento;
    product.subtotal = subtotalDto;

    let newTotal = 0;
    pedido.productos.forEach((prd) => {
      newTotal += prd.subtotal;
    });
    this.setState({
      pedido: {
        ...this.state.pedido,
        total: newTotal,
      },
      editProd: false,
      indexProdOpen: -1,
      producto: {
        peso: "",
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
    } = this.state;
    const displayTable = searchTitle !== "" ? productoFilter : products;
    let subtotalDto = 0.0;
    const valorIva = iva ? 0.21 : 0.105;
    return (
      <div className="list row">
        {submitted ? (
          <div>
            <h4>Pedido editado correctamente!</h4>
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
                    {pedido.productos.map((row, index) => (
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
                          this.setActive(index);
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
            <div role="region" className="total-banner">
              <p className="total__text">Total: $ {pedido.total.toFixed(2)}</p>
              <Button
                variant="contained"
                color="primary"
                className="total__button"
                onClick={this.updatePedido}
              >
                Actualizar pedido
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }
}
