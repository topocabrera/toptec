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
import { getSmartService, generateSmartRoute } from "../../../utils/routeHelper";
import SearchIcon from "@mui/icons-material/Search";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

const alert = Modal.alert;
const prompt = Modal.prompt;
const currentUser = JSON.parse(localStorage.getItem("currentUser"));

const Item = List.Item;
const Brief = Item.Brief;

// Obtener servicios dinámicamente según el rol del usuario
const PedidosDataService = getSmartService('pedidos');
const ProductosDataService = getSmartService('productos');

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
    this.calcularSubtotal = this.calcularSubtotal.bind(this);
    this.recalcularTotales = this.recalcularTotales.bind(this);
    this.agregarCheque = this.agregarCheque.bind(this);
    this.eliminarCheque = this.eliminarCheque.bind(this);
    this.onChangeCheque = this.onChangeCheque.bind(this);

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
        peso: "1", // Peso siempre es 1 (readonly)
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
        // Para Cheque (array de cheques)
        cheques: [{
          banco: "",
          nroCheque: "",
          fechaCobranza: "",
          cuit: "",
          monto: ""
        }],
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
    // Peso siempre es 1 (readonly)
    this.setState({ 
      indexActive: index, 
      peso: "1", 
      precio, 
      precioMayorista, 
      precioMinorista: precio,
      tipoPrecio: "precio",
      cantidad: "",
      descuento: "",
      iva: false,
      medioIva: false
    });
  }

  onChangeCantidad(e) {
    this.setState({ cantidad: e.target.value });
  }

  onChangeDto(e) {
    this.setState({ descuento: e.target.value });
  }

  onChangePeso(e) {
    // No hacer nada - el peso siempre es 1 (readonly)
    // this.setState({ peso: e.target.value });
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

  // Función para calcular subtotal de forma consistente
  calcularSubtotal(precio, peso, cantidad, descuento, iva, medioIva) {
    // Manejar valores vacíos o inválidos
    const precioNum = parseFloat(precio) || 0;
    const pesoNum = parseFloat(peso) || 0;
    const cantidadNum = parseFloat(cantidad) || 0;
    const descuentoNum = parseFloat(descuento) || 0;
    
    const subtotalBase = precioNum * pesoNum * cantidadNum;
    const subtotalConDescuento = subtotalBase - (subtotalBase * descuentoNum) / 100;
    const valorIva = iva ? 0.21 : (medioIva ? 0.105 : 0);
    const subtotalFinal = subtotalConDescuento + (subtotalConDescuento * valorIva);
    return subtotalFinal || 0;
  }

  // Función para calcular subtotal de costo de forma segura
  calcularSubtotalCosto(precioCosto, peso, cantidad) {
    // Convertir valores a número, si son vacíos, null, undefined o NaN, usar 0
    const precioCostoNum = parseFloat(precioCosto) || 0;
    const pesoNum = parseFloat(peso) || 0;
    const cantidadNum = parseFloat(cantidad) || 0;
    
    const subtotalCostoFinal = precioCostoNum * pesoNum * cantidadNum;
    
    // Asegurarse de que el resultado no sea NaN
    return isNaN(subtotalCostoFinal) ? 0 : subtotalCostoFinal;
  }

  // Función para recalcular el total del pedido
  recalcularTotales() {
    const { pedido } = this.state;
    let nuevoTotal = 0;
    let nuevoTotalCosto = 0;
    
    pedido.productos.forEach((prod) => {
      const subtotal = parseFloat(prod.subtotal);
      const subtotalCosto = parseFloat(prod.subtotalCosto);
      
      nuevoTotal += isNaN(subtotal) ? 0 : subtotal;
      nuevoTotalCosto += isNaN(subtotalCosto) ? 0 : subtotalCosto;
    });

    this.setState({
      pedido: {
        ...this.state.pedido,
        total: nuevoTotal,
        totalCosto: nuevoTotalCosto
      }
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

    // Recalcular el subtotal para asegurar consistencia
    const subtotalRecalculado = this.calcularSubtotal(precio, peso, cantidad, descuento, iva, medioIva);

    const prodPedido = {
      id: produc[0].id,
      codigo: produc[0].codigo,
      descripcion: produc[0].descripcion,
      marca: produc[0].marca,
      precioCosto: produc[0].precioCosto,
      precio: parseFloat(precio),
      peso: parseFloat(peso),
      cantidad: parseFloat(cantidad),
      descuento: parseFloat(descuento || 0),
      iva: isIva,
      subtotal: subtotalRecalculado,
      subtotalCosto: isNaN(parseFloat(subtotalCosto)) ? 0 : parseFloat(subtotalCosto)
    };

    // Crear nuevo array de productos en lugar de mutar el estado
    const nuevosProductos = [...this.state.pedido.productos, prodPedido];

    // Primero actualizar el pedido y limpiar el formulario
    this.setState({
      pedido: {
        ...this.state.pedido,
        productos: nuevosProductos
      },
      peso: "1",
      precio: 0,
      tipoPrecio: "precio",
      precioMayorista: 0,
      precioMinorista: 0,
      cantidad: "",
      descuento: "",
      iva: false,
      medioIva: false,
    }, () => {
      // Recalcular totales después de actualizar el estado
      this.recalcularTotales();
    });

    // Luego forzar que el producto quede inactivo
    setTimeout(() => {
      this.setState({ indexActive: -1 });
    }, 0);
    
    Toast.success("Cargado correctamente!!", 1);
  }

  deleteProduct(codigo) {
    const { pedido } = this.state;
    const index = pedido.productos.findIndex((prd) => prd.codigo === codigo);
    
    if (index !== -1) {
      // Crear nuevo array sin el producto eliminado
      const nuevosProductos = pedido.productos.filter((prd) => prd.codigo !== codigo);
      
      this.setState({
        pedido: {
          ...this.state.pedido,
          productos: nuevosProductos
        }
      }, () => {
        // Recalcular totales después de eliminar el producto
        this.recalcularTotales();
      });
    }
  }

  handleOpenModal(index, product) {
    this.setState({
      editProd: true,
      indexProdOpen: index,
      producto: {
        peso: "1", // Peso siempre es 1 (readonly)
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
    
    // Ignorar cambios en el campo peso (siempre debe ser 1)
    if (name === 'peso') {
      return;
    }
    
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
    const { pedido, producto } = this.state;
    
    // Determinar el IVA del producto original
    let iva = false;
    let medioIva = false;
    if (product.iva === "iva") {
      iva = true;
    } else if (product.iva === "medioIva") {
      medioIva = true;
    }

    // Calcular el nuevo subtotal usando la función consistente
    const subtotalRecalculado = this.calcularSubtotal(
      producto.precio, 
      producto.peso, 
      producto.cantidad, 
      producto.descuento, 
      iva, 
      medioIva
    );
    
    const subtotalCosto = this.calcularSubtotalCosto(product.precioCosto, producto.peso, producto.cantidad);
    
    // Actualizar el producto con los nuevos valores
    product.peso = parseFloat(producto.peso);
    product.cantidad = parseFloat(producto.cantidad);
    product.descuento = parseFloat(producto.descuento || 0);
    product.precio = parseFloat(producto.precio);
    product.subtotal = subtotalRecalculado;
    product.subtotalCosto = subtotalCosto;

    this.setState({
      editProd: false,
      indexProdOpen: -1,
      producto: {
        peso: "1", // Peso siempre es 1 (readonly)
        cantidad: "",
        descuento: "",
        iva: "",
      },
    }, () => {
      // Recalcular totales después de editar el producto
      this.recalcularTotales();
    });
  }

  updatePedido() {
    // Sanitizar productos para evitar NaN
    const productosSanitizados = this.state.pedido.productos.map(prod => ({
      ...prod,
      subtotal: isNaN(parseFloat(prod.subtotal)) ? 0 : parseFloat(prod.subtotal),
      subtotalCosto: isNaN(parseFloat(prod.subtotalCosto)) ? 0 : parseFloat(prod.subtotalCosto),
      precio: isNaN(parseFloat(prod.precio)) ? 0 : parseFloat(prod.precio),
      cantidad: isNaN(parseFloat(prod.cantidad)) ? 0 : parseFloat(prod.cantidad),
      peso: isNaN(parseFloat(prod.peso)) ? 0 : parseFloat(prod.peso),
      descuento: isNaN(parseFloat(prod.descuento)) ? 0 : parseFloat(prod.descuento)
    }));
    
    let data = {
      id: this.state.pedido.id,
      idCliente: this.state.pedido.idCliente,
      clienteName: this.state.pedido.clienteName,
      productos: productosSanitizados,
      fecha: this.state.pedido.fecha,
      status: this.state.pedido.status,
      fechaEntrega: this.state.pedido.fechaEntrega,
      total: isNaN(parseFloat(this.state.pedido.total)) ? 0 : parseFloat(this.state.pedido.total),
      totalCosto: isNaN(parseFloat(this.state.pedido.totalCosto)) ? 0 : parseFloat(this.state.pedido.totalCosto),
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
    
    // Para cheques, verificar si existe el formato antiguo y convertirlo
    let chequesData = [];
    if (formaPago === 'Cheque') {
      if (datosPagoExistentes.cheques && Array.isArray(datosPagoExistentes.cheques)) {
        // Ya está en formato nuevo
        chequesData = datosPagoExistentes.cheques.length > 0 ? datosPagoExistentes.cheques : [{
          banco: "",
          nroCheque: "",
          fechaCobranza: "",
          cuit: "",
          monto: ""
        }];
      } else if (datosPagoExistentes.banco || datosPagoExistentes.nroCheque) {
        // Formato antiguo, convertir a array
        chequesData = [{
          banco: datosPagoExistentes.banco || "",
          nroCheque: datosPagoExistentes.nroCheque || "",
          fechaCobranza: datosPagoExistentes.fechaCobranza || "",
          cuit: datosPagoExistentes.cuit || "",
          monto: this.state.pedido.total?.toString() || ""
        }];
      } else {
        // Nuevo cheque
        chequesData = [{
          banco: "",
          nroCheque: "",
          fechaCobranza: "",
          cuit: "",
          monto: ""
        }];
      }
    }
    
    this.setState({
      modalFormaPago: true,
      formaPagoSeleccionada: formaPago,
      datosPago: {
        // Para Contado
        comentarios: datosPagoExistentes.comentarios || "",
        // Para Cheque (array de cheques)
        cheques: chequesData,
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

  agregarCheque() {
    const { datosPago } = this.state;
    const nuevosCheques = [...datosPago.cheques, {
      banco: "",
      nroCheque: "",
      fechaCobranza: "",
      cuit: "",
      monto: ""
    }];
    
    this.setState({
      datosPago: {
        ...datosPago,
        cheques: nuevosCheques
      }
    });
  }

  eliminarCheque(index) {
    const { datosPago } = this.state;
    if (datosPago.cheques.length > 1) {
      const nuevosCheques = datosPago.cheques.filter((_, i) => i !== index);
      this.setState({
        datosPago: {
          ...datosPago,
          cheques: nuevosCheques
        }
      });
    }
  }

  onChangeCheque(index, campo, valor) {
    const { datosPago } = this.state;
    const nuevosCheques = [...datosPago.cheques];
    nuevosCheques[index] = {
      ...nuevosCheques[index],
      [campo]: valor
    };
    
    this.setState({
      datosPago: {
        ...datosPago,
        cheques: nuevosCheques
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
        // Validar cada cheque
        datosPago.cheques.forEach((cheque, index) => {
          if (!cheque.banco) camposRequeridos.push(`Banco del cheque ${index + 1}`);
          if (!cheque.nroCheque) camposRequeridos.push(`Nro de Cheque ${index + 1}`);
          if (!cheque.fechaCobranza) camposRequeridos.push(`Fecha Cobranza del cheque ${index + 1}`);
          if (!cheque.cuit) camposRequeridos.push(`CUIT del cheque ${index + 1}`);
          if (!cheque.monto) camposRequeridos.push(`Monto del cheque ${index + 1}`);
        });
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

    // Validar que la suma de cheques sea igual al total del pedido
    if (formaPagoSeleccionada === 'Cheque') {
      const totalCheques = datosPago.cheques.reduce((sum, cheque) => {
        return sum + (parseFloat(cheque.monto) || 0);
      }, 0);
      
      const totalPedido = this.state.pedido.total;
      
      if (Math.abs(totalCheques - totalPedido) > 0.01) {
        Toast.fail(`La suma de los cheques ($${totalCheques.toFixed(2)}) debe ser igual al total del pedido ($${totalPedido.toFixed(2)})`, 4);
        return;
      }
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
    // Sanitizar productos para evitar NaN
    const productosSanitizados = this.state.pedido.productos.map(prod => ({
      ...prod,
      subtotal: isNaN(parseFloat(prod.subtotal)) ? 0 : parseFloat(prod.subtotal),
      subtotalCosto: isNaN(parseFloat(prod.subtotalCosto)) ? 0 : parseFloat(prod.subtotalCosto),
      precio: isNaN(parseFloat(prod.precio)) ? 0 : parseFloat(prod.precio),
      cantidad: isNaN(parseFloat(prod.cantidad)) ? 0 : parseFloat(prod.cantidad),
      peso: isNaN(parseFloat(prod.peso)) ? 0 : parseFloat(prod.peso),
      descuento: isNaN(parseFloat(prod.descuento)) ? 0 : parseFloat(prod.descuento)
    }));
    
    let data = {
      id: this.state.pedido.id,
      idCliente: this.state.pedido.idCliente,
      clienteName: this.state.pedido.clienteName,
      productos: productosSanitizados,
      fecha: this.state.pedido.fecha,
      status: this.state.pedido.status,
      fechaEntrega: this.state.pedido.fechaEntrega,
      total: isNaN(parseFloat(this.state.pedido.total)) ? 0 : parseFloat(this.state.pedido.total),
      totalCosto: isNaN(parseFloat(this.state.pedido.totalCosto)) ? 0 : parseFloat(this.state.pedido.totalCosto),
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
                      {/* <TableCell>Peso</TableCell> */}
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
                              {/* <TextField
                                className="prod-input"
                                autoFocus
                                fullWidth
                                margin="dense"
                                name="peso"
                                label="Peso"
                                disabled
                                value={producto.peso}
                                onChange={this.onChangeValueProduct}
                                helperText="El peso siempre es 1"
                              /> */}
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
                                disabled={producto.cantidad === ''}
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
                        {/* <TableCell>{row.peso}</TableCell> */}
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
                    subtotalCosto = this.calcularSubtotalCosto(producto.precioCosto, peso, cantidad);
                    // Usar la función consistente para calcular el subtotal
                    subtotalDto = this.calcularSubtotal(precio, peso, cantidad, descuento, iva, medioIva);
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
                            {/* <TextField
                              id="standard-start-adornment"
                              type="number"
                              onChange={this.onChangePeso}
                              value={isActive ? peso : ""}
                              disabled
                              InputProps={{
                                endAdornment: (
                                  <InputAdornment position="end">
                                    Kg
                                  </InputAdornment>
                                ),
                              }}
                            /> */}
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
                              !isActive || cantidad === ""
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
                    {pedido.datosPago?.cheques && Array.isArray(pedido.datosPago.cheques) ? (
                      pedido.datosPago.cheques.map((cheque, index) => (
                        <div key={index} style={{ marginBottom: '10px', padding: '8px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                          <p><strong>Cheque {index + 1}:</strong></p>
                          <p style={{ marginLeft: '15px' }}><strong>Banco:</strong> {cheque.banco}</p>
                          <p style={{ marginLeft: '15px' }}><strong>Nro de Cheque:</strong> {cheque.nroCheque}</p>
                          <p style={{ marginLeft: '15px' }}><strong>Fecha Cobranza:</strong> {cheque.fechaCobranza}</p>
                          <p style={{ marginLeft: '15px' }}><strong>CUIT:</strong> {cheque.cuit}</p>
                          <p style={{ marginLeft: '15px' }}><strong>Monto:</strong> ${cheque.monto}</p>
                        </div>
                      ))
                    ) : (
                      // Formato antiguo (compatibilidad hacia atrás)
                      <>
                        <p><strong>Banco:</strong> {pedido.datosPago?.banco}</p>
                        <p><strong>Nro de Cheque:</strong> {pedido.datosPago?.nroCheque}</p>
                        <p><strong>Fecha Cobranza:</strong> {pedido.datosPago?.fechaCobranza}</p>
                        <p><strong>CUIT:</strong> {pedido.datosPago?.cuit}</p>
                      </>
                    )}
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
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <h4>Cheques ({datosPago.cheques.length})</h4>
                      <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={this.agregarCheque}
                        size="small"
                      >
                        Agregar Cheque
                      </Button>
                    </Box>
                    
                    {datosPago.cheques.map((cheque, index) => (
                      <Box key={index} sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2, mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <h5>Cheque {index + 1}</h5>
                          {datosPago.cheques.length > 1 && (
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => this.eliminarCheque(index)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </Box>
                        
                        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                          <TextField
                            margin="dense"
                            label="Banco *"
                            type="text"
                            fullWidth
                            variant="outlined"
                            value={cheque.banco}
                            onChange={(e) => this.onChangeCheque(index, 'banco', e.target.value)}
                          />
                          <TextField
                            margin="dense"
                            label="Nro de Cheque *"
                            type="text"
                            fullWidth
                            variant="outlined"
                            value={cheque.nroCheque}
                            onChange={(e) => this.onChangeCheque(index, 'nroCheque', e.target.value)}
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
                            value={cheque.fechaCobranza}
                            onChange={(e) => this.onChangeCheque(index, 'fechaCobranza', e.target.value)}
                          />
                          <TextField
                            margin="dense"
                            label="CUIT *"
                            type="text"
                            fullWidth
                            variant="outlined"
                            value={cheque.cuit}
                            onChange={(e) => this.onChangeCheque(index, 'cuit', e.target.value)}
                          />
                          <TextField
                            margin="dense"
                            label="Monto *"
                            type="number"
                            fullWidth
                            variant="outlined"
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            }}
                            value={cheque.monto}
                            onChange={(e) => this.onChangeCheque(index, 'monto', e.target.value)}
                          />
                        </Box>
                      </Box>
                    ))}
                    
                    <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong>Total Cheques:</strong>
                        <strong>
                          ${datosPago.cheques.reduce((sum, cheque) => 
                            sum + (parseFloat(cheque.monto) || 0), 0).toFixed(2)}
                        </strong>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong>Total Pedido:</strong>
                        <strong>${this.state.pedido.total.toFixed(2)}</strong>
                      </Box>
                    </Box>
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
