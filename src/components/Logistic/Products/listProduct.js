import React, { Component } from "react";
import { Toast, Modal } from "antd-mobile";
import SearchIcon from "@mui/icons-material/Search";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { IconButton, TextField, InputAdornment, Box, Autocomplete, Button } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { getSmartService, generateSmartRoute, canViewCostPrice, canEditProducts, canChangePrice, getPriceLabels, isNicoRole } from "../../../utils/routeHelper";
import moment from "moment";
import * as XLSX from 'xlsx';

const alert = Modal.alert;

export default class listProduct extends Component {
  constructor(props) {
    super(props);
    this.refreshList = this.refreshList.bind(this);
    this.setActiveProduct = this.setActiveProduct.bind(this);
    this.onDataChange = this.onDataChange.bind(this);
    this.onMarcasChange = this.onMarcasChange.bind(this);
    this.onChangeDate = this.onChangeDate.bind(this);
    this.onChangeTurno = this.onChangeTurno.bind(this);
    this.searchTitle = this.searchTitle.bind(this);
    this.onChangeSearchTitle = this.onChangeSearchTitle.bind(this);
    this.onChangeMarcaFilter = this.onChangeMarcaFilter.bind(this);
    this.deleteProduct = this.deleteProduct.bind(this);
    this.handleEditPrice = this.handleEditPrice.bind(this);
    this.handleCancelEdit = this.handleCancelEdit.bind(this);
    this.handleSavePrice = this.handleSavePrice.bind(this);
    this.handleSaveStock = this.handleSaveStock.bind(this);
    this.renderPriceCell = this.renderPriceCell.bind(this);
    this.renderStockCell = this.renderStockCell.bind(this);
    this.descargarExcel = this.descargarExcel.bind(this);

    this.state = {
      products: [],
      currentProduct: null,
      currentIndex: -1,
      productoFilter: [],
      searchTitle: "",
      marcaFilter: "",
      marcas: [],
      editingPrice: null, // { productoKey, field } - null cuando no se está editando
      tempPrice: "", // Precio temporal durante la edición
    };
    
    // Verificar si el usuario puede editar precios (max, windy y nico)
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    this.userRole = currentUser?.rol;
    this.canEditPrice = this.userRole === 'max' || this.userRole === 'windy' || this.userRole === 'nico';
  }

  componentDidMount() {
    const ProductosService = getSmartService('productos');
    ProductosService.getAll()
      .orderByChild("id")
      .on("value", this.onDataChange);

    const MarcasService = getSmartService('marcas');
    MarcasService.getAll()
      .orderByChild("id")
      .once("value", this.onMarcasChange);
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
        precioAlternativo: data.precioAlternativo,
        codigoBarras: data.codigoBarras,
      });
    });

    this.setState({ products });
  }

  onMarcasChange(items) {
    const marcas = [];
    items.forEach((item) => {
      marcas.push(item.val().nombre);
    });
    this.setState({ marcas });
  }

  onChangeMarcaFilter(e) {
    this.setState({ marcaFilter: e.target.value });
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

  handleSaveStock(productoKey) {
    const newStock = parseInt(this.state.tempPrice, 10);

    if (isNaN(newStock) || newStock < 0) {
      Toast.fail("El stock debe ser un número entero válido mayor o igual a 0", 2);
      return;
    }

    Toast.loading("Actualizando stock...", 0);

    const ProductosService = getSmartService('productos');
    ProductosService.update(productoKey, { stock: newStock })
      .then(() => {
        Toast.hide();
        Toast.success("Stock actualizado correctamente!", 1);
        this.setState({ editingPrice: null, tempPrice: "" });
      })
      .catch((e) => {
        Toast.hide();
        console.error("Error al actualizar stock:", e);
        Toast.fail("Error al actualizar el stock", 2);
      });
  }

  renderStockCell(producto) {
    const { editingPrice, tempPrice } = this.state;
    const field = 'stock';
    const isEditing = editingPrice?.productoKey === producto.key && editingPrice?.field === field;
    const currentValue = producto.stock;
    const displayValue = currentValue !== null && currentValue !== undefined && currentValue !== '' ? currentValue : '-';

    if (!this.canEditPrice) {
      return <td>{displayValue}</td>;
    }

    return (
      <td>
        {isEditing ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: '150px' }}>
            <TextField
              size="small"
              type="number"
              value={tempPrice}
              onChange={(e) => this.setState({ tempPrice: e.target.value })}
              sx={{ width: 90 }}
              autoFocus
              inputProps={{ step: "1", min: "0" }}
            />
            <IconButton size="small" color="success" onClick={() => this.handleSaveStock(producto.key)} title="Guardar">
              <CheckIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" color="error" onClick={() => this.handleCancelEdit()} title="Cancelar">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: '80px' }}>
            <span style={{ minWidth: '30px' }}>{displayValue}</span>
            <IconButton
              size="small"
              onClick={() => this.handleEditPrice(producto.key, field, currentValue ?? 0)}
              title="Editar stock"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      </td>
    );
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

  descargarExcel() {
    const { products, searchTitle, productoFilter, marcaFilter } = this.state;
    let displayTable = searchTitle !== "" ? productoFilter : products;
    if (marcaFilter !== "") {
      displayTable = displayTable.filter((prod) => prod.marca === marcaFilter);
    }

    if (displayTable.length === 0) {
      Toast.fail('No hay productos para descargar', 2);
      return;
    }

    const fecha = moment().format('DD-MM-YYYY');
    const rows = [
      ['FECHA', 'MARCA', 'COD ART', 'DESCRIPCION', 'CANTIDAD'],
    ];

    displayTable.forEach((prod, idx) => {
      rows.push([
        idx === 0 ? fecha : '',
        prod.marca || '',
        prod.codigo || '',
        prod.descripcion || '',
        prod.stock !== null && prod.stock !== undefined && prod.stock !== '' ? prod.stock : 0,
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 13 },
      { wch: 20 },
      { wch: 12 },
      { wch: 35 },
      { wch: 12 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Productos');
    XLSX.writeFile(wb, `productos_stock_${fecha}.xlsx`);
  }

  render() {
    const { products, searchTitle, productoFilter, marcaFilter, marcas } = this.state;
    let displayTable = searchTitle !== "" ? productoFilter : products;

    // Filtrar por marca si está seleccionada
    if (marcaFilter !== "") {
      displayTable = displayTable.filter((prod) => prod.marca === marcaFilter);
    }
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
            <Button
              variant="outlined"
              color="success"
              startIcon={<FileDownloadIcon />}
              onClick={this.descargarExcel}
              sx={{ marginLeft: '10px' }}
            >
              Descargar stock
            </Button>
          </div>
          <div className="col-md-8" style={{ paddingLeft: 0 }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <div className="input-group mb-3" style={{ flex: 1 }}>
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
              <div style={{ flex: 1, marginTop: '-6px' }}>
                <Autocomplete
                  options={[{ label: "Todas las marcas", value: "" }, ...marcas.map((marca) => ({ label: marca, value: marca }))]}
                  getOptionLabel={(option) => option.label}
                  value={marcas.length > 0 ? { label: this.state.marcaFilter === "" ? "Todas las marcas" : this.state.marcaFilter, value: this.state.marcaFilter } : { label: "Cargando...", value: "" }}
                  onChange={(_, newValue) => {
                    this.setState({ marcaFilter: newValue?.value || "" });
                  }}
                  renderInput={(params) => <TextField {...params} label="Marca" />}
                  size="small"
                />
              </div>
            </div>
          </div>
          <h4>Listado de productos</h4>
          <div className="table-container">
            <table className="table">
              <thead className="thead-dark">
                <tr>
                  <th scope="col">Código</th>
                  {/* <th scope="col">Código de Barras</th> */}
                  <th scope="col">Descripción</th>
                  {/* <th scope="col">Peso</th> */}
                  <th scope="col">Marca</th>
                  <th scope="col">Stock</th>
                  {canViewCostPrice() && <th scope="col">Precio Costo</th>}
                  {!isNicoRole() && <th scope="col">{getPriceLabels().mayorista}</th>}
                  <th scope="col">{getPriceLabels().minorista}</th>
                  {!isNicoRole() && <th scope="col">{getPriceLabels().alternativo}</th>}
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
                        {/* <td>{producto.codigoBarras || '-'}</td> */}
                        <td>{producto.descripcion || '-'}</td>
                        {/* <td>{producto.peso || '-'}</td> */}
                        <td>{producto.marca || '-'}</td>
                        {this.renderStockCell(producto)}
                        {canViewCostPrice() && this.renderPriceCell(producto, 'precioCosto', 'Precio Costo')}
                        {!isNicoRole() && this.renderPriceCell(producto, 'precioMayorista', getPriceLabels().mayorista)}
                        {this.renderPriceCell(producto, 'precio', getPriceLabels().minorista)}
                        {!isNicoRole() && this.renderPriceCell(producto, 'precioAlternativo', getPriceLabels().alternativo)}
                        {canViewCostPrice() && (
                          <td>
                            <div>
                              <div>
                                <strong>{getPriceLabels().minorista}:</strong> {isNaN(difCosto) ? '-' : `$${difCosto.toFixed(2)}`}
                              </div>
                              {!isNicoRole() && (
                                <div>
                                  <strong>{getPriceLabels().mayorista}:</strong> {precioMayoristaValid > 0 && !isNaN(difPMayorista) ? `$${difPMayorista.toFixed(2)}` : '-'}
                                </div>
                              )}
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
