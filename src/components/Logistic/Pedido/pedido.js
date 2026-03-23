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
import { getSmartService, generateSmartRoute } from "../../../utils/routeHelper";
import SearchIcon from "@mui/icons-material/Search";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import EditIcon from "@mui/icons-material/Edit";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

const alert = Modal.alert;
const Item = List.Item;
const Brief = Item.Brief;
const currentUser = JSON.parse(localStorage.getItem("currentUser"));

// Obtener servicios dinámicamente según el rol del usuario
const PedidosDataService = getSmartService('pedidos');
const ProductosDataService = getSmartService('productos');
const ClientesDataService = getSmartService('clientes');

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
    this.createPedido = this.createPedido.bind(this);
    this.obtenerSiguienteId = this.obtenerSiguienteId.bind(this);
    this.crearPedidoConId = this.crearPedidoConId.bind(this);
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
    this.calcularSubtotal = this.calcularSubtotal.bind(this);
    this.recalcularTotales = this.recalcularTotales.bind(this);
    this.agregarCheque = this.agregarCheque.bind(this);
    this.eliminarCheque = this.eliminarCheque.bind(this);
    this.onChangeCheque = this.onChangeCheque.bind(this);

    this.state = {
      products: [],
      currentProduct: null,
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
    // Evitar pull-to-refresh (swipe para recargar) en navegadores móviles
    document.body.style.overscrollBehaviorY = "none";

    // Alerta al recargar o salir: debe aceptar para confirmar (evita recargas accidentales en mobile)
    this._handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", this._handleBeforeUnload);

    const id = parseInt(this.props.match.params.id, 10);
    // Ya no necesitamos obtener el último ID aquí
    ProductosDataService.getAll()
      .orderByChild("id")
      .once("value", this.onDataChange);
    ClientesDataService.getAll()
      .orderByChild("id")
      .equalTo(id)
      .once("child_added", this.getClient);
    
    // Inicializar el pedido con un ID temporal
    this.setInitialProduct();
  }

  componentWillUnmount() {
    document.body.style.overscrollBehaviorY = "";
    if (this._handleBeforeUnload) {
      window.removeEventListener("beforeunload", this._handleBeforeUnload);
    }
    ProductosDataService.getAll().off("value", this.onDataChange);
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

  setInitialProduct() {
    const idCliente = parseInt(this.props.match.params.id, 10);
    this.setState({
      pedido: {
        id: 0, // Se asignará el ID definitivo al crear el pedido
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
    // Peso siempre es 1 (readonly)
    this.setState({ indexActive: index, peso: "1", precio, precioMayorista, precioMinorista: precio });
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

  // Función para calcular subtotal de forma consistente
  calcularSubtotal(precio, peso, cantidad, descuento, iva, medioIva) {
    const subtotalBase = parseFloat(precio) * parseFloat(peso) * parseFloat(cantidad);
    const subtotalConDescuento = subtotalBase - (subtotalBase * parseFloat(descuento || 0)) / 100;
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

    // Recalcular el subtotal para asegurar consistencia
    const subtotalRecalculado = this.calcularSubtotal(precio, peso, cantidad, descuento, iva, medioIva);
    
    const prodPedido = {
      id: producto.id,
      codigo: producto.codigo,
      descripcion: producto.descripcion,
      marca: producto.marca,
      precioCosto: producto.precioCosto,
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
      cantidad: "",
      descuento: "",
      precio: 0,
      peso: "1",
      tipoPrecio: "precio",
      precioMayorista: 0,
      precioMinorista: 0,
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

  // Método para obtener el siguiente ID de forma más segura
  // Obtiene el ID justo antes de crear el pedido, reduciendo la ventana de colisión
  obtenerSiguienteId() {
    return new Promise((resolve, reject) => {
      // Consultar los últimos 5 pedidos para mayor seguridad
      PedidosDataService.getAll()
        .orderByChild("id")
        .limitToLast(5)
        .once("value")
        .then((snapshot) => {
          let maxId = 0;
          
          // Encontrar el ID máximo de los pedidos existentes
          snapshot.forEach((childSnapshot) => {
            const pedido = childSnapshot.val();
            if (pedido.id && pedido.id > maxId) {
              maxId = pedido.id;
            }
          });
          
          // El nuevo ID será el máximo + 1
          const nuevoId = maxId + 1;
          
          resolve(nuevoId);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  // Método auxiliar para crear el pedido con reintento en caso de ID duplicado
  crearPedidoConId(nuevoId, condPago, datosPago, intentosRestantes = 3) {
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
      id: nuevoId,
      idCliente: this.state.pedido.idCliente,
      clienteName: this.state.pedido.clienteName,
      clienteDomicilio: this.state.pedido.clienteDomicilio,
      productos: productosSanitizados,
      fecha: this.state.pedido.fecha,
      status: this.state.pedido.status,
      fechaEntrega: this.state.pedido.fechaEntrega,
      user: currentUser.userName,
      condPago,
      datosPago,
      total: isNaN(parseFloat(this.state.pedido.total)) ? 0 : parseFloat(this.state.pedido.total),
      totalCosto: isNaN(parseFloat(this.state.pedido.totalCosto)) ? 0 : parseFloat(this.state.pedido.totalCosto),
    };
    
    const estado = { estado: "visitado" };
    ClientesDataService.update(this.state.keyClient, estado)
      .then(() => { })
      .catch((e) => {
        console.error("Error al actualizar estado del cliente:", e);
      });
    
    PedidosDataService.create(data)
      .then(() => {
        // Actualizar el stock de todos los productos del pedido
        this.updateProductStock();
        Toast.hide();
        Toast.loading("Loading...", 1, () => {
          this.setState({
            submitted: true,
          });
        });
      })
      .catch((e) => {
        // Si falla y aún hay reintentos, intentar con el siguiente ID
        if (intentosRestantes > 0) {
          console.warn(`ID ${nuevoId} puede estar duplicado, reintentando con ID ${nuevoId + 1}`);
          this.crearPedidoConId(nuevoId + 1, condPago, datosPago, intentosRestantes - 1);
        } else {
          Toast.hide();
          console.error("Error al crear pedido después de varios intentos:", e);
          Toast.fail("Ocurrió un error al crear el pedido", 2);
        }
      });
  }

  createPedido(condPago, datosPago = {}) {
    // Primero obtener el siguiente ID disponible
    Toast.loading("Generando pedido...", 0);
    
    this.obtenerSiguienteId()
      .then((nuevoId) => {
        this.crearPedidoConId(nuevoId, condPago, datosPago);
      })
      .catch((error) => {
        Toast.hide();
        console.error("Error al obtener siguiente ID:", error);
        Toast.fail("Error al generar ID del pedido", 2);
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

  // Métodos para el modal de forma de pago
  abrirModalFormaPago(formaPago) {
    this.setState({
      modalFormaPago: true,
      formaPagoSeleccionada: formaPago,
      datosPago: {
        comentarios: "",
        cheques: [{
          banco: "",
          nroCheque: "",
          fechaCobranza: "",
          cuit: "",
          monto: ""
        }],
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
                                disabled
                                helperText="El peso siempre es 1"
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
                    subtotalCosto = this.calcularSubtotalCosto(producto?.precioCosto, peso, cantidad);
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
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <h4>Cheques ({this.state.datosPago.cheques.length})</h4>
                      <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={this.agregarCheque}
                        size="small"
                      >
                        Agregar Cheque
                      </Button>
                    </Box>
                    
                    {this.state.datosPago.cheques.map((cheque, index) => (
                      <Box key={index} sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2, mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <h5>Cheque {index + 1}</h5>
                          {this.state.datosPago.cheques.length > 1 && (
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
                          ${this.state.datosPago.cheques.reduce((sum, cheque) => 
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
