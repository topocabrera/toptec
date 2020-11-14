import React, { Component } from "react";
import Datetime from "react-datetime";
import { Toast, Modal } from "antd-mobile";
import {
  Paper,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  IconButton,
} from "@material-ui/core";
import DeleteIcon from "@material-ui/icons/Delete";
import EditIcon from "@material-ui/icons/Edit";
import moment from "moment";
import ReservationDataService from "../../services/reservation.service";
import { turnos } from "../../utils/default";

const alert = Modal.alert;

export default class ReservaList extends Component {
  constructor(props) {
    super(props);
    this.refreshList = this.refreshList.bind(this);
    this.setActiveTutorial = this.setActiveTutorial.bind(this);
    this.onDataChange = this.onDataChange.bind(this);
    this.onChangeDate = this.onChangeDate.bind(this);
    this.onChangeTurno = this.onChangeTurno.bind(this);
    this.filterReservations = this.filterReservations.bind(this);
    this.deleteReserva = this.deleteReserva.bind(this);
    this.changeSelect = this.changeSelect.bind(this);

    this.state = {
      reservas: [],
      currentIndex: -1,
      date: '',
      turno: "turno1",
      reservaFilter: [],
      cantAdentro: 0,
      cantAfuera: 0,
      cantTotal: 0,
      totalAsistentes: 0,
    };
  }

  componentDidMount() {
    ReservationDataService.getAll()
      .orderByChild("mesa")
      .on("value", this.onDataChange);
  }

  componentWillUnmount() {
    ReservationDataService.getAll().off("value", this.onDataChange);
  }

  onDataChange(items) {
    let reservas = [];
    items.forEach((item) => {
      let data = item.val();
      let key = item.key;
      reservas.push({
        key,
        id: data.id,
        name: data.name,
        adentro: data.adentro,
        mesa: data.mesa,
        cantidad: data.cantidad,
        turno: data.turno,
        date: data.date,
        asistio: data.asistio || false,
      });
    });

    this.setState({
      reservas: reservas,
    });
    this.filterReservations();
  }

  filterReservations(fecha, turnoParam) {
    const { reservas, turno, date } = this.state;
    const dateEmpty = date === '' ?  moment(new Date().getTime()).format("DD-MM-YYYY") : date;
    let reserva = [];
    let cantAdentro = 0;
    let cantAfuera = 0;
    let totalPersonas = 0;
    let totalAsistentes = 0;
    const turnoComp = turnoParam || turno;
    const fechaComp = fecha || dateEmpty;
    reservas.forEach((item) => {
      if (item.date === fechaComp && item.turno === turnoComp) {
        reserva.push(item);
        cantAdentro = item.adentro ? cantAdentro + 1 : cantAdentro;
        cantAfuera = !item.adentro ? cantAfuera + 1 : cantAfuera;
        totalPersonas += parseInt(item.cantidad, 10);
        if (item.asistio) {
          totalAsistentes += parseInt(item.cantidad, 10);
        }
      }
    });
    this.setState({
      reservaFilter: reserva,
      cantAdentro,
      cantAfuera,
      cantTotal: totalPersonas,
      totalAsistentes,
    });
  }

  onChangeDate(e) {
    const dateFormat = e.format("DD-MM-YYYY");
    this.setState({ date: dateFormat });
    this.filterReservations(dateFormat, "");
  }

  onChangeTurno(e) {
    this.setState({ turno: e.target.value });

    this.filterReservations("", e.target.value);
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

  deleteReserva(key) {
    ReservationDataService.delete(key)
      .then(() => {
        Toast.success("Eliminado correctamente!!", 1, () => {
          window.location.reload(false);
        });
      })
      .catch((e) => {
        Toast.fail("Ocurrió un error !!!", 2);
      });
  }

  changeSelect(reserva) {
    const data = {
      asistio: !reserva.asistio,
    };

    ReservationDataService.update(reserva.key, data)
      .then(() => {
        this.filterReservations();
      })
      .catch((e) => {
        console.log(e);
      });
  }

  render() {
    const {
      reservaFilter,
      cantAdentro,
      cantAfuera,
      cantTotal,
      totalAsistentes,
    } = this.state;
    const totalMesas = 55;
    const totalAfuera = 45;
    const totalAdentro = 10;
    const colorTotal = cantTotal > 130 ? "red" : "";
    const colorMoment = totalAsistentes > 130 ? "red" : "";
    return (
      <div className="list row">
        <div className="col-md-6">
          <div className="new-reservation">
            <a
              className="btn btn-primary"
              href="/forest/reservation"
              role="button"
            >
              Nueva reserva
            </a>
          </div>
          <h4>Listado de reservas</h4>
          <div className="form-group">
            <label htmlFor="fecha">Seleccione fecha de reserva</label>
            <Datetime
              className="post-input  post-input__event"
              dateFormat="DD-MM-YYYY"
              timeFormat={false}
              name="eventDate"
              utc
              closeOnSelect
              initialValue={moment(new Date().getTime()).format("DD-MM-YYYY")}
              value={this.state.date}
              onChange={this.onChangeDate}
            />
          </div>
          <div className="form-group">
            <InputLabel>Turno</InputLabel>
            <Select
              onChange={this.onChangeTurno}
              value={this.state.turno}
              className="select__form"
              fullWidth
            >
              {turnos.map((turno) => (
                <MenuItem key={turno.value} value={turno.value}>
                  {turno.name}
                </MenuItem>
              ))}
            </Select>
          </div>

          <Paper className="info__pedidos">
            <div className="list__reservas">
              <span className="total__title">
                Total reservas: {reservaFilter.length}{" "}
              </span>
              <span>Adentro: {cantAdentro} </span>
              <span className="cant__afuera">Afuera: {cantAfuera} </span>
            </div>
            <div className="list__libres">
              <span className="total__title free">
                Mesas libres: {totalMesas - reservaFilter.length}
              </span>
              <span>Adentro: {totalAdentro - cantAdentro} </span>
              <span className="cant__afuera">
                Afuera: {totalAfuera - cantAfuera}{" "}
              </span>
            </div>
            <span className={`cant__total ${colorTotal}`}>
              Total Personas: {cantTotal}
            </span>
            <span className={`cant__total-asist ${colorMoment}`}>
              En este momento: {totalAsistentes}
            </span>
          </Paper>
          <div className="table-container">
            <table className="table">
              <thead className="thead-dark">
                <tr>
                  <th scope="col">Asistió</th>
                  <th scope="col">Mesa</th>
                  <th scope="col">Nombre</th>
                  <th scope="col">Cantidad</th>
                  <th scope="col">Ubicación</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {reservaFilter &&
                  reservaFilter.map((reserva, index) => 
                  (
                    <tr key={index}>
                      <td>
                        <Checkbox
                          checked={reserva.asistio}
                          color="primary"
                          onChange={(e) => {
                            e.preventDefault();
                            this.changeSelect(reserva);
                          }}
                        />
                      </td>
                      <td>{reserva.mesa}</td>
                      <td>
                        <a href={`/forest/mesa/${reserva.id}`}>{reserva.name}</a>
                      </td>
                       {/* <td>
                        {reserva.name}
                      </td> */}
                      <td>{reserva.cantidad}</td>
                      <td>{reserva.adentro ? "Adentro" : "Afuera"}</td>
                      <td>
                        <IconButton
                          aria-label="delete"
                          className="action__link"
                          href={`/forest/reserva/${reserva.id}`}
                          role="button"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          aria-label="delete"
                          type="button"
                          className="action__button"
                          onClick={() =>
                            alert("Eliminar", "Estás seguro???", [
                              { text: "Cancelar" },
                              {
                                text: "Ok",
                                onPress: () => this.deleteReserva(reserva.key),
                              },
                            ])
                          }
                        >
                          <DeleteIcon color="secondary" />
                        </IconButton>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {reservaFilter.length === 0 && (
              <div className="empty__container">
                <span className="message-empty">No hay reservas aún</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}
