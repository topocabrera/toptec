import React, { Component } from "react";
import { Toast, Modal } from "antd-mobile";
import ClientsDataService from "../../../services/clients.service";
import { MenuItem, Select, Button, FormControl } from "@material-ui/core";
import SearchIcon from "@material-ui/icons/Search";
import moment from "moment";
import { dias } from "../../../utils/default";

const alert = Modal.alert;

export default class Visita extends Component {
  constructor(props) {
    super(props);
    this.refreshList = this.refreshList.bind(this);
    this.setActiveTutorial = this.setActiveTutorial.bind(this);
    this.onDataChange = this.onDataChange.bind(this);
    this.onChangeDay = this.onChangeDay.bind(this);
    this.filterClients = this.filterClients.bind(this);
    this.searchTitle = this.searchTitle.bind(this);
    this.setMotivo = this.setMotivo.bind(this);
    this.resetAll = this.resetAll.bind(this);

    this.state = {
      clients: [],
      estado: "",
      dia: moment(new Date().getTime()).get("day"),
      motivo: "",
      clientFilter: [],
      clientesPorDia: [],
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
    const dateFormat = moment(new Date().getTime()).get("day");
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
        estado: data.estado,
        dia: data.dia,
        motivo: data.motivo,
      });
    });

    this.setState({ clients });
    this.filterClients(dateFormat);
  }

  filterClients(fecha) {
    const { clients, dia } = this.state;
    let cliente = [];
    const fechaComp = fecha || dia;
    clients.forEach((item) => {
      const fechaFormat = item.dia;
      if (fechaFormat === fechaComp) {
        cliente.push(item);
      }
    });
    this.setState({ clientesPorDia: cliente });
  }

  searchTitle(e) {
    const { clientesPorDia } = this.state;
    clearTimeout(this.timer);
    const value = e.target.value;
    this.timer = setTimeout(() => {
      if (value) {
        clientesPorDia.forEach((a) => a.domicilio.toLowerCase());
        const filter = clientesPorDia.filter(
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

  onChangeDay(e) {
    const dateFormat = e.target.value;

    this.setState({ dia: dateFormat });
    this.filterClients(dateFormat);
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

  setMotivo(key, text) {
    const data = {
      motivo: text,
      estado: "visitado",
    };

    ClientsDataService.update(key, data)
      .then(() => {
        Toast.success("Visita actualizada!", 1, () => {
          window.location.reload(false);
        });
      })
      .catch((e) => {
        Toast.fail("Ocurrió un error !!!", 2);
      });
  }

  resetAll() {
    const data = {
      motivo: "",
      estado: "no visitado",
    };
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.state.clientesPorDia.forEach((client) => {
        ClientsDataService.update(client.key, data)
          .then(() => {})
          .catch((e) => {
            Toast.fail("Ocurrió un error al resetear algun estado!", 2);
          });
      });
      Toast.success("Estados actualizados!", 1, () => {
        window.location.reload(false);
      });
    }, 500);
  }

  render() {
    const { clients, searchTitle, clientFilter, clientesPorDia } = this.state;
    const displayTable = searchTitle !== "" ? clientFilter : clientesPorDia;
    return (
      <div className="list row">
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
                <button className="btn btn-outline-secondary" type="button">
                  <SearchIcon color="action" />
                </button>
              </div>
            </div>
          </div>
          <Button
            color="primary"
            variant="outlined"
            size="small"
            onClick={this.resetAll}
            className="button-reset"
          >
            Resetear estados y motivos de clientes
          </Button>
          <h4 className="title-list">Listado de clientes</h4>
          <FormControl>
            <Select
              onChange={this.onChangeDay}
              value={this.state.dia}
              className="select__day"
            >
              {dias.map((dia) => (
                <MenuItem key={dia.value} value={dia.value}>
                  {dia.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <div className="table-container">
            <table className="table">
              <thead className="thead-dark">
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Razón Social</th>
                  <th scope="col">Dirección</th>
                  <th scope="col">DNI/CUIT</th>
                  <th scope="col">Teléfono</th>
                  <th scope="col">Estado</th>
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
                        <td className="status-client">{cliente.estado}</td>
                        <td className="column-actions">
                          <Button
                            // variant="outlined"
                            color="primary"
                            size="small"
                            className="button-register"
                            disabled={cliente.estado === "visitado"}
                            onClick={() =>
                              alert(
                                "Asentar visita",
                                <div>Motivo de no visita</div>,
                                [
                                  {
                                    text: "Ya tiene stock",
                                    onPress: () =>
                                      this.setMotivo(cliente.key, "stock"),
                                  },
                                  {
                                    text: "Está cerrado",
                                    onPress: () =>
                                      this.setMotivo(cliente.key, "cerrado"),
                                  },
                                  {
                                    text: "No tiene dinero",
                                    onPress: () =>
                                      this.setMotivo(cliente.key, "dinero"),
                                  },
                                  {
                                    text: "Ausente responsable",
                                    onPress: () =>
                                      this.setMotivo(cliente.key, "ausente"),
                                  },
                                  {
                                    text: "Cancelar",
                                  },
                                ]
                              )
                            }
                          >
                            Registrar no venta
                          </Button>
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
