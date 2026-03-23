import React, { Component } from "react";
import { Toast, Modal } from "antd-mobile";
import SearchIcon from "@mui/icons-material/Search";
import { IconButton, TextField, InputAdornment, Box } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { getSmartService, generateSmartRoute, canViewCostPrice, canEditProducts, canChangePrice } from "../../../utils/routeHelper";

const alert = Modal.alert;

export default class listProduct extends Component {
  constructor(props) {
    super(props);
    this.refreshList = this.refreshList.bind(this);
    this.setActiveProduct = this.setActiveProduct.bind(this);
    this.onDataChange = this.onDataChange.bind(this);
    this.onChangeDate = this.onChangeDate.bind(this);
    this.onChangeTurno = this.onChangeTurno.bind(this);
    this.searchTitle = this.searchTitle.bind(this);
    this.onChangeSearchTitle = this.onChangeSearchTitle.bind(this);
    this.deleteProduct = this.deleteProduct.bind(this);
    this.handleEditPrice = this.handleEditPrice.bind(this);
    this.handleCancelEdit = this.handleCancelEdit.bind(this);
    this.handleSavePrice = this.handleSavePrice.bind(this);
    this.renderPriceCell = this.renderPriceCell.bind(this);

    this.state = {
      products: [],
      currentProduct: null,
      currentIndex: -1,
      productoFilter: [],
      searchTitle: "",
      editingPrice: null, // { productoKey, field } - null cuando no se está editando
      tempPrice: "", // Precio temporal durante la edición
    };
    
    // Verificar si el usuario puede editar precios (solo max y windy)
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    this.userRole = currentUser?.rol;
    this.canEditPrice = this.userRole === 'max' || this.userRole === 'windy';
  }

  componentDidMount() {
    const ProductosService = getSmartService('productos');
    ProductosService.getAll()
      .orderByChild("id")
      .on("value", this.onDataChange);
  }

  componentWillUnmount() {
    const ProductosService = getSmartService('productos');
    ProductosService.getAll().off("value", this.onDataChange);
  }

  onDataChange(items) {
    const products = [];
    items.forEach((item) => {
      let key = item.key;
      let data = item.val();
      products.push({
        key,
        id: data.id,
        codigo: data.codigo,
        descripcion: data.descripcion,
        peso: data.peso,
        marca: data.marca,
        stock: data.stock,
        precio: data.precio,
        precioCosto: data.precioCosto,
        precioMayorista: data.precioMayorista,
      });
    });

    this.setState({ products });
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
            prod.codigo.toLowerCase().match(value.toLowerCase()) ||
            prod.marca.toLowerCase().match(value.toLowerCase())
        );
        this.setState({ productoFilter: filter, searchTitle: value });
      } else {
        this.setState({ searchTitle: "" });
      }
    }, 500);
  }

  onChangeDate(e) {
    const dateFormat = e.format("DD-MM-YYYY");
    this.setState({ date: dateFormat });
    // this.filterReservations(dateFormat, "");
  }

  onChangeTurno(e) {
    this.setState({ turno: e.target.value });

    // this.filterReservations("", e.target.value);
  }

  refreshList() {
    this.setState({
      currentProduct: null,
      currentIndex: -1,
    });
  }

  setActiveProduct(product, index) {
    this.setState({
      currentProduct: product,
      currentIndex: index,
    });
  }

  deleteProduct(key) {
    const ProductosService = getSmartService('productos');
    ProductosService.delete(key)
      .then(() => {
        Toast.success("Eliminado correctamente!!", 1);
      })
      .catch((e) => {
        Toast.fail("Ocurrió un error", 1);
      });
  }

  handleEditPrice(productoKey, field, currentValue) {
    this.setState({
      editingPrice: { productoKey, field },
      tempPrice: currentValue.toString()
    });
  }

  handleCancelEdit() {
    this.setState({
      editingPrice: null,
      tempPrice: ""
    });
  }

  handleSavePrice(productoKey, field) {
    const newPrice = parseFloat(this.state.tempPrice);
    
    if (isNaN(newPrice) || newPrice < 0) {
      Toast.fail("El precio debe ser un número válido mayor o igual a 0", 2);
      return;
    }

    // Actualizar el producto en Firebase
    const updateData = {
      [field]: newPrice
    };

    Toast.loading("Actualizando precio...", 0);

    const ProductosService = getSmartService('productos');
    ProductosService.update(productoKey, updateData)
      .then(() => {
        Toast.hide();
        Toast.success("Precio actualizado correctamente!", 1);
        this.setState({
          editingPrice: null,
          tempPrice: ""
        });
      })
      .catch((e) => {
        Toast.hide();
        console.error("Error al actualizar precio:", e);
        Toast.fail("Error al actualizar el precio", 2);
      });
  }

  renderPriceCell(producto, field, fieldLabel) {
    const { editingPrice, tempPrice } = this.state;
    const isEditing = editingPrice?.productoKey === producto.key && editingPrice?.field === field;
    const currentValue = producto[field];
    
    // Sanitizar el valor para evitar NaN
    let displayValue = 0;
    if (currentValue !== null && currentValue !== undefined && currentValue !== '') {
      const parsed = parseFloat(currentValue);
      displayValue = isNaN(parsed) ? 0 : parsed;
    }

    if (!this.canEditPrice) {
      // Si no tiene permisos, solo mostrar el precio
      const priceDisplay = displayValue === 0 || isNaN(displayValue) ? '-' : `$${displayValue.toFixed(2)}`;
      return <td>{priceDisplay}</td>;
    }

    return (
      <td>
        {isEditing ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: '200px' }}>
            <TextField
              size="small"
              type="number"
              value={tempPrice}
              onChange={(e) => this.setState({ tempPrice: e.target.value })}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              sx={{ width: 120 }}
              autoFocus
              inputProps={{ step: "0.01" }}
            />
            <IconButton
              size="small"
              color="success"
              onClick={() => this.handleSavePrice(producto.key, field)}
              title="Guardar"
            >
              <CheckIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={() => this.handleCancelEdit()}
              title="Cancelar"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: '120px' }}>
            <span style={{ minWidth: '60px' }}>
              {displayValue === 0 || isNaN(displayValue) ? '-' : `$${displayValue.toFixed(2)}`}
            </span>
            <IconButton
              size="small"
              onClick={() => this.handleEditPrice(producto.key, field, displayValue)}
              title={`Editar ${fieldLabel}`}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      </td>
    );
  }

  render() {
    const { products, searchTitle, productoFilter } = this.state;
    const displayTable = searchTitle !== "" ? productoFilter : products;
    return (
      <div className="list row">
        <div className="col-md-6">
          <div className="new-reservation">
            {canEditProducts() && (
              <a className="btn btn-primary" href={generateSmartRoute("/products")} role="button">
                Nuevo producto
              </a>
            )}
            {canChangePrice() && (
              <a className="btn btn-primary change-price-button" href={generateSmartRoute("/change-price")} role="button">
                Cambiar precios masivamente
              </a>
            )}
          </div>
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
                >
                  <SearchIcon color="action" />
                </button>
              </div>
            </div>
          </div>
          <h4>Listado de productos</h4>
          <div className="table-container">
            <table className="table">
              <thead className="thead-dark">
                <tr>
                  <th scope="col">Código</th>
                  <th scope="col">Descripción</th>
                  <th scope="col">Peso</th>
                  <th scope="col">Marca</th>
                  <th scope="col">Stock</th>
                  {canViewCostPrice() && <th scope="col">Precio Costo</th>}
                  <th scope="col">Precio Venta Minorista</th>
                  <th scope="col">Precio Venta Mayorista</th>
                  {canViewCostPrice() && <th scope="col">Dif. con P. Costo</th>}
                  {canEditProducts() && <th scope="col">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {products &&
                  displayTable.map((producto, index) => {
                    // Sanitizar valores para evitar NaN
                    const precioCosto = parseFloat(producto.precioCosto);
                    const precioMinorista = parseFloat(producto.precio);
                    const precioMayorista = parseFloat(producto.precioMayorista);
                    
                    const precioCostoValid = isNaN(precioCosto) ? 0 : precioCosto;
                    const precioMinoristaValid = isNaN(precioMinorista) ? 0 : precioMinorista;
                    const precioMayoristaValid = isNaN(precioMayorista) ? 0 : precioMayorista;
                    
                    const difCosto = precioMinoristaValid - precioCostoValid;
                    const difPMayorista = precioMayoristaValid > 0 ? precioMayoristaValid - precioCostoValid : 0;
                    
                    return (
                      <tr key={index}>
                        <td>{producto.codigo || '-'}</td>
                        <td>{producto.descripcion || '-'}</td>
                        <td>{producto.peso || '-'}</td>
                        <td>{producto.marca || '-'}</td>
                        <td>{producto.stock !== null && producto.stock !== undefined && producto.stock !== '' ? producto.stock : '-'}</td>
                        {canViewCostPrice() && this.renderPriceCell(producto, 'precioCosto', 'Precio Costo')}
                        {this.renderPriceCell(producto, 'precio', 'Precio Venta Minorista')}
                        {this.renderPriceCell(producto, 'precioMayorista', 'Precio Venta Mayorista')}
                        {canViewCostPrice() && (
                          <td>
                            <div>
                              <div>
                                <strong>P. Minorista:</strong> {isNaN(difCosto) ? '-' : `$${difCosto.toFixed(2)}`}
                              </div>
                              <div>
                                <strong>P. Mayorista:</strong> {precioMayoristaValid > 0 && !isNaN(difPMayorista) ? `$${difPMayorista.toFixed(2)}` : '-'}
                              </div>
                            </div>
                          </td>
                        )}
                        {canEditProducts() && (
                          <td className="column-actions">
                            <IconButton
                              className="action__link"
                              href={generateSmartRoute(`/product/${producto.id}`)}
                              role="button"
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              type="button"
                              className="action__button"
                              onClick={() =>
                                alert("Eliminar", "Estás seguro???", [
                                  { text: "Cancelar" },
                                  {
                                    text: "Ok",
                                    onPress: () =>
                                      this.deleteProduct(producto.key),
                                  },
                                ])
                              }
                            >
                              <DeleteIcon sx={{ color: 'red' }} />
                            </IconButton>
                          </td>
                        )}
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}
