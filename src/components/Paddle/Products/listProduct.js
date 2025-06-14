import React, { Component } from "react";
import ProductosDataService from "../../../services/tutorial.service";
import { Toast, Modal } from "antd-mobile";
import { IconButton } from '@mui/material';
import SearchIcon from "@mui/icons-material/Search";
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

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
        item: data.item,
        depto: data.depto,
        codigo: data.codigo,
        contrato: data.contrato,
        cliente: data.cliente,
        recibido: data.recibido,
        direccion: data.direccion,
        latitud: data.latitud,
        longitud: data.longitud,
        tipoCliente: data.tipoCliente,
        horasTrabajo: data.horasTrabajo,
        date: data.date,
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
          {/* <div className="new-reservation">
            <a className="btn btn-primary" href="/products" role="button">
              Nuevo producto
            </a>
            <a className="btn btn-primary change-price-button" href="/change-price" role="button">
              Cambiar precios masivamente
            </a>
          </div> */}
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
          <h4>Listado de Visitas</h4>
          <div className="table-container">
            <table className="table">
              <thead className="thead-dark">
                <tr>
                  <th scope="col">Item</th>
                  <th scope="col">Depto</th>
                  <th scope="col">Código</th>
                  <th scope="col">Contrato</th>
                  <th scope="col">Cliente</th>
                  <th scope="col">Recibido Por</th>
                  <th scope="col">Dirección</th>
                  <th scope="col">Latitud</th>
                  <th scope="col">Longitud</th>
                  <th scope="col">Tipo Cliente</th>
                  <th scope="col">Horas Trabajo</th>
                  <th scope="col">Fecha</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products &&
                  displayTable.map((producto, index) => {
                    return (
                      <tr key={index}>
                        <td>{producto.item}</td>
                        <td>{producto.depto}</td>
                        <td>{producto.codigo}</td>
                        <td>{producto.contrato}</td>
                        <td>{producto.cliente}</td>
                        <td>{producto.recibido}</td>
                        <td>{producto.direccion}</td>
                        <td>{producto.latitud}</td>
                        <td>{producto.longitud}</td>
                        <td>{producto.tipoCliente}</td>
                        <td>{producto.horasTrabajo}</td>
                        <td>{producto.date}</td>

                        <td className="column-actions">
                        <IconButton
                          aria-label="delete"
                          className="action__link"
                          href={`/mp/products/${producto.id}`}
                          role="button"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          aria-label="delete"
                          type="button"
                          className="action__button"
                          onClick={() =>
                            alert('Eliminar', 'Estás seguro???', [
                              { text: 'Cancelar' },
                              {
                                text: 'Ok',
                                onPress: () => this.deleteReserva(producto.key),
                              },
                            ])
                          }
                        >
                          <DeleteIcon color="secondary" />
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
