import React, { Component } from "react";
import { Toast } from "antd-mobile";
import { Modal } from "antd-mobile";
import SearchIcon from "@mui/icons-material/Search";
import { IconButton, Tooltip } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { getSmartService, generateSmartRoute } from "../../../utils/routeHelper";

const alert = Modal.alert;

export default class listMarcas extends Component {
  constructor(props) {
    super(props);
    this.refreshList = this.refreshList.bind(this);
    this.deleteMarca = this.deleteMarca.bind(this);
    this.onDataChange = this.onDataChange.bind(this);
    this.searchTitle = this.searchTitle.bind(this);

    this.state = {
      marcas: [],
      currentIndex: -1,
      marcasFilter: [],
      searchTitle: "",
    };
  }

  componentDidMount() {
    const MarcasService = getSmartService('marcas');
    MarcasService.getAll()
      .orderByChild("id")
      .on("value", this.onDataChange);
  }

  componentWillUnmount() {
    const MarcasService = getSmartService('marcas');
    MarcasService.getAll().off("value", this.onDataChange);
  }

  onDataChange(items) {
    let marcas = [];
    items.forEach((item) => {
      let data = item.val();
      let key = item.key;
      marcas.push({
        key,
        id: data.id,
        nombre: data.nombre,
      });
    });

    this.setState({ marcas });
  }

  searchTitle(e) {
    const { marcas } = this.state;
    clearTimeout(this.timer);
    const value = e.target.value;
    this.timer = setTimeout(() => {
      if (value) {
        const filter = marcas.filter(
          (marca) =>
            marca.nombre.toLowerCase().match(value.toLowerCase())
        );
        this.setState({ marcasFilter: filter, searchTitle: value });
      } else {
        this.setState({ searchTitle: "" });
      }
    }, 500);
  }

  refreshList() {
    this.setState({
      currentIndex: -1,
    });
  }

  deleteMarca(key) {
    const MarcasService = getSmartService('marcas');
    MarcasService.delete(key)
      .then(() => {
        Toast.success("Eliminado correctamente!!", 1);
      })
      .catch((e) => {
        Toast.fail("Ocurrió un error", 1);
      });
  }

  render() {
    const { marcas, searchTitle, marcasFilter } = this.state;
    const displayTable = searchTitle !== "" ? marcasFilter : marcas;
    return (
      <div className="list row">
        <div className="col-md-6">
          <div className="new-reservation">
            <a className="btn btn-primary" href={generateSmartRoute("/marca")} role="button">
              Nueva marca
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
                <button className="btn btn-outline-secondary" type="button">
                  <SearchIcon color="action" />
                </button>
              </div>
            </div>
          </div>
          <h4>Listado de marcas</h4>
          <div className="table-container">
            <table className="table">
              <thead className="thead-dark">
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Nombre</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {marcas &&
                  displayTable.map((marca, index) => {
                    return (
                      <tr key={index}>
                        <td>{marca.id}</td>
                        <td>{marca.nombre}</td>
                        <td className="column-actions">
                          <IconButton
                            className="action__link"
                            href={generateSmartRoute(`/marca/${marca.id}`)}
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
                                    this.deleteMarca(marca.key),
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
