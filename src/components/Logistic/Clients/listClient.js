import React, { Component } from "react";
import { Toast } from "antd-mobile";
import ClientsDataService from "../../../services/clients.service";
import { Modal } from "antd-mobile";
import SearchIcon from "@material-ui/icons/Search";

const alert = Modal.alert;

export default class listClient extends Component {
  constructor(props) {
    super(props);
    this.refreshList = this.refreshList.bind(this);
    this.setActiveTutorial = this.setActiveTutorial.bind(this);
    this.deleteClient = this.deleteClient.bind(this);
    this.onDataChange = this.onDataChange.bind(this);
    this.onChangeDate = this.onChangeDate.bind(this);
    this.onChangeTurno = this.onChangeTurno.bind(this);
    this.searchTitle = this.searchTitle.bind(this);

    this.state = {
      clients: [],
      currentTutorial: null,
      currentIndex: -1,
      nombre: "",
      domicilio: "",
      dni: 0,
      clientFilter: [],
      searchTitle: "",
    };
  }

  componentDidMount() {
    ClientsDataService.getAll()
      .orderByChild("id")
      .on("value", this.onDataChange);
  }

  componentWillUnmount() {
    ClientsDataService.getAll().off("value", this.onDataChange);
  }

  onDataChange(items) {
    let clients = [];
    items.forEach((item) => {
      let data = item.val();
      let key = item.key;
      clients.push({
        key,
        id: data.id,
        razonSocial: data.razon_social,
        domicilio: data.domicilio,
        dni: data.dni,
        telefono: data.telefono,
      });
    });

    this.setState({ clients });
  }

  searchTitle(e) {
    const { clients } = this.state;
    clearTimeout(this.timer);
    const value = e.target.value;
    this.timer = setTimeout(() => {
      if (value) {
        clients.forEach((a) => a.domicilio.toLowerCase());
        const filter = clients.filter(
          (client) =>
            client.razonSocial.toLowerCase().match(value.toLowerCase()) ||
            client.domicilio.toLowerCase().match(value.toLowerCase())
        );
        this.setState({ clientFilter: filter, searchTitle: value });
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
      currentTutorial: null,
      currentIndex: -1,
    });
  }

  setActiveTutorial(tutorial, index) {
    this.setState({
      currentTutorial: tutorial,
      currentIndex: index,
    });
  }

  deleteClient(key) {
    ClientsDataService.delete(key)
      .then(() => {
        Toast.success("Eliminado correctamente!!", 1);
      })
      .catch((e) => {
        Toast.fail("Ocurrió un error", 1);
      });
  }

  render() {
    const { clients, searchTitle, clientFilter } = this.state;
    const displayTable = searchTitle !== "" ? clientFilter : clients;
    return (
      <div className="list row">
        <div className="col-md-6">
          <div className="new-reservation">
            <a className="btn btn-primary" href="/client" role="button">
              Nuevo cliente
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
          <h4>Listado de clientes</h4>
          <div className="table-container">
            <table className="table">
              <thead className="thead-dark">
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Razón Social</th>
                  <th scope="col">Dirección</th>
                  <th scope="col">DNI/CUIT</th>
                  <th scope="col">Teléfono</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clients &&
                  displayTable.map((cliente, index) => {
                    return (
                      <tr key={index}>
                        <td>{cliente.id}</td>
                        <td>
                          <a href={`/pedido/${cliente.id}`}>
                            {cliente.razonSocial}
                          </a>
                        </td>
                        <td>{cliente.domicilio}</td>
                        <td>{cliente.dni}</td>
                        <td>{cliente.telefono}</td>
                        <td className="column-actions">
                          <a
                            className="btn btn-light"
                            href={`/client/${cliente.id}`}
                            role="button"
                          >
                            Editar
                          </a>
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() =>
                              alert("Eliminar", "Estás seguro???", [
                                { text: "Cancelar" },
                                {
                                  text: "Ok",
                                  onPress: () =>
                                    this.deleteClient(cliente.key),
                                },
                              ])
                            }
                          >
                            Eliminar
                          </button>
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
