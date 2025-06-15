import React, { Component } from "react";
import ProductosDataService from "../../../services/productos.service";
import { Toast, Modal } from "antd-mobile";
import SearchIcon from "@mui/icons-material/Search";
import { IconButton } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

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

    this.state = {
      products: [],
      currentProduct: null,
      currentIndex: -1,
      productoFilter: [],
      searchTitle: "",
    };
  }

  componentDidMount() {
    ProductosDataService.getAll()
      .orderByChild("id")
      .on("value", this.onDataChange);
  }

  componentWillUnmount() {
    ProductosDataService.getAll().off("value", this.onDataChange);
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
    ProductosDataService.delete(key)
      .then(() => {
        Toast.success("Eliminado correctamente!!", 1);
      })
      .catch((e) => {
        Toast.fail("Ocurrió un error", 1);
      });
  }

  render() {
    const { products, searchTitle, productoFilter } = this.state;
    const displayTable = searchTitle !== "" ? productoFilter : products;
    return (
      <div className="list row">
        <div className="col-md-6">
          <div className="new-reservation">
            <a className="btn btn-primary" href="/logistic/products" role="button">
              Nuevo producto
            </a>
            <a className="btn btn-primary change-price-button" href="/logistic/change-price" role="button">
              Cambiar precios masivamente
            </a>
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
                  <th scope="col">Precio Costo</th>
                  <th scope="col">Precio Venta Minorista</th>
                  <th scope="col">Precio Venta Mayorista</th>
                  <th scope="col">Dif. con P. Costo</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products &&
                  displayTable.map((producto, index) => {
                    const difPMayorista = producto.precioMayorista
                      ? parseFloat((producto.precioMayorista - producto.precioCosto).toFixed(2))
                      : 0;
                    const difCosto = parseFloat((producto.precio - producto.precioCosto).toFixed(2));
                    return (
                      <tr key={index}>
                        <td>{producto.codigo}</td>
                        <td>{producto.descripcion}</td>
                        <td>{producto.peso}</td>
                        <td>{producto.marca}</td>
                        <td>{producto.stock}</td>
                        <td>${producto.precioCosto}</td>
                        <td>${producto.precio}</td>
                        <td>${producto.precioMayorista || '-'}</td>
                        <td>
                          <div>
                            <div>
                              <strong>P. Minorista:</strong> ${difCosto}
                            </div>
                            <div>
                              <strong>P. Mayorista:</strong> ${difPMayorista}
                            </div>
                          </div>
                        </td>
                        <td className="column-actions">
                          <IconButton
                            className="action__link"
                            href={`/logistic/product/${producto.id}`}
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
