import React, { Component } from "react";
import Datetime from "react-datetime";
import { Toast, Modal } from "antd-mobile";
import {
  Paper,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  Button,
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
    this.onDataChange = this.onDataChange.bind(this);
    this.onChangeDate = this.onChangeDate.bind(this);
    this.deleteReserva = this.deleteReserva.bind(this);

    this.state = {
      reservas: [],
      date: "",
    };
  }

  componentDidMount() {
    ReservationDataService.getAll()
      .orderByChild("id")
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
  }

  onChangeDate(e) {
    const dateFormat = e.format("DD-MM-YYYY");
    this.setState({ date: dateFormat });
  }

  deleteReserva() {
    const { date, reservas } = this.state;

    const filerReserva = reservas.filter(
      (reserv) => moment(reserv.date, "DD-MM-YYYY") < moment(date, "DD-MM-YYYY")
    );
    console.log(filerReserva);
    filerReserva.forEach((resrv) => {
      ReservationDataService.delete(resrv.key)
        .then()
        .catch((e) => {
          Toast.fail("Ocurrió un error !!!", 2);
        });
    });
  }

  render() {
    return (
      <div className="list row">
        <div className="col-md-6">
          <h4>Eliminar reservas</h4>
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
          <div>
            <Button
              aria-label="delete"
              type="button"
              variant="contained"
              color="secondary"
              onClick={() =>
                alert("Eliminar", "Estás seguro???", [
                  { text: "Cancelar" },
                  {
                    text: "Ok",
                    onPress: () => this.deleteReserva(),
                  },
                ])
              }
            >
              Eliminar
              <DeleteIcon />
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
