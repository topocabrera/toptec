import React, { Component } from "react";
import Datetime from "react-datetime";
import { Toast, Modal } from "antd-mobile";
import {
  Breadcrumbs,
  TextField,
  Typography,
  Link,
  Container,
  Checkbox,
  FormControlLabel,
  Tooltip,
  IconButton,
} from "@material-ui/core";
import NavigateNextIcon from "@material-ui/icons/NavigateNext";
import FiberManualRecordIcon from "@material-ui/icons/FiberManualRecord";
import moment from "moment";
import ReservationDataService from "../../services/reservation.service";
const alert = Modal.alert;

const limitePorMesa = 6;

export default class AddReservation extends Component {
  constructor(props) {
    super(props);
    this.onChangeName = this.onChangeName.bind(this);
    this.updateReserva = this.updateReserva.bind(this);
    this.onDataChange = this.onDataChange.bind(this);
    this.getMesas = this.getMesas.bind(this);

    this.state = {
      currentReserva: {
        key: null,
        id: 0,
        name: "",
        adentro: false,
        mesa: 0,
        cantidad: "",
        date: moment(new Date().getTime()).format("DD-MM-YYYY"),
        turno: "turno1",
      },
      reservas: [],
      open: false,

      submitted: false,
    };
  }

  componentDidMount() {
    const id = parseInt(this.props.match.params.id, 10);
    console.log("id", id);
    ReservationDataService.getAll()
      .orderByChild("id")
      .equalTo(id)
      .once("value", this.onDataChange);
  }

  componentWillUnmount() {
    ReservationDataService.getAll().off("child_added", this.onDataChange);
  }

  onDataChange(items) {
    let key = Object.keys(items.val());
    let data = items.val();
    const currentReserva = data[key];
    currentReserva.key = key[0];
    this.setState({ currentReserva });
    ReservationDataService.getAll()
      .orderByChild("mesa")
      .on("value", this.getMesas);
  }

  getMesas(items) {
    const { currentReserva } = this.state;
    let reservas = [];
    items.forEach((item) => {
      let data = item.val();
      let key = item.key;
      if (data.date === currentReserva.date && data.activa) {
        reservas.push({
          key,
          id: data.id,
          mesa: data.mesa,
          turno: data.turno,
          date: data.date,
          activa: data.activa || false,
        });
      }
    });
    this.setState({
      reservas,
    });
  }

  onChangeName(e) {
    this.setState({
      currentReserva: {
        ...this.state.currentReserva,
        name: e.target.value,
      },
    });
  }

  validationLugar(mesa) {
    if (this.state.currentReserva.adentro && mesa > 10) {
      this.setState({
        error: {
          value: true,
          message: "Número de mesa no corresponde para Adentro",
        },
      });
      return false;
    }
    if (!this.state.currentReserva.adentro && (mesa > 55 || mesa < 11)) {
      this.setState({
        error: {
          value: true,
          message: "Número de mesa no corresponde para Afuera",
        },
      });
      return false;
    }
    if (
      this.state.reservas.filter(
        (res) => res.mesa === mesa && res.id !== this.state.currentReserva.id
      ).length > 0
    ) {
      this.setState({
        error: {
          value: true,
          message: "Ya existe otra reserva con ese Nº de mesa",
        },
      });
      return false;
    }

    if (this.state.currentReserva.cantidad > limitePorMesa) {
      this.setState({
        error: {
          value: true,
          message: `Cantidad máxima por mesas (${limitePorMesa}) superada`,
        },
      });
      return false;
    }

    return true;
  }

  updateReserva(e, nroMesa, reserva, type) {
    const dataSet = {
      mesa: nroMesa,
      adentro: nroMesa < 20,
      activa: true,
    };

    const dataActive = {
      activa: false,
      mesa: "",
    };

    const dataUpdate = {
      activa: true,
      mesa:
        this.state.currentReserva.mesa !== ""
          ? this.state.currentReserva.mesa
          : "",
    };

    const mesaFilter =
      reserva !== "" && reserva.length > 1
        ? reserva.filter((res) => res.turno === this.state.currentReserva.turno)
        : reserva;

        console.log(reserva, mesaFilter, this.state.currentReserva.mesa);

    if (reserva && type === "free") {
      ReservationDataService.update(mesaFilter[0].key, dataActive)
        .then(() => {
          Toast.success("Mesa actualizada correctamente!!", 1);
        })
        .catch((e) => {
          Toast.fail("Ocurrió un error !!!", 2);
        });
    } else {
      if (
        this.state.currentReserva.mesa === "" &&
        type === "assign" &&
        reserva.filter((res) => res.turno === this.state.currentReserva.turno).length > 0
      ) {
        Toast.fail("Ya hay una mesa asignada en este turno", 2);
      } else if (
        this.state.currentReserva.mesa !== "" &&
        type === "assign" &&
        reserva
      ) {
        ReservationDataService.update(reserva[0].key, dataUpdate)
          .then()
          .catch((e) => {
            Toast.fail("Ocurrió un error !!!", 2);
          });
        ReservationDataService.update(this.state.currentReserva.key, dataSet)
          .then(() => {
            Toast.success("Mesa asignada correctamente!!", 1);
          })
          .catch((e) => {
            Toast.fail("Ocurrió un error !!!", 2);
          });
      } else {
        ReservationDataService.update(this.state.currentReserva.key, dataSet)
          .then(() => {
            Toast.success("Mesa asignada correctamente!!", 1);
          })
          .catch((e) => {
            Toast.fail("Ocurrió un error !!!", 2);
          });
      }
    }
  }

  render() {
    const { currentReserva, reservas } = this.state;
    const mesas = [];
    for (let i = 1; i < 71; i += 1) {
      const mesaFilter = reservas.filter((res) => res.mesa === i);
      let mesaColor = "";
      if (mesaFilter.length > 1) {
        mesaColor = "button-mesa two-colors";
      }
      if (mesaFilter.length === 1) {
        mesaColor = `button-mesa ${mesaFilter[0].turno}`;
      }
      mesas.push(
        <button
          // disabled={reservas.filter((res) => res.mesa === i).length > 0}
          key={i}
          className={mesaFilter.length > 0 ? mesaColor : "button-mesa"}
          onClick={(e) => {
            if (mesaFilter.length > 0) {
              alert("Actualizar mesas", <div>Que desea hacer?</div>, [
                {
                  text: "Asignar mesa",
                  onPress: () => this.updateReserva(e, i, mesaFilter, "assign"),
                },
                {
                  text: "Liberar mesa",
                  onPress: () => this.updateReserva(e, i, mesaFilter, "free"),
                },
                {
                  text: "Cancelar",
                },
              ]);
            } else {
              e.preventDefault();
              this.updateReserva(e, i, "", "");
            }
          }}
        >
          {i}
        </button>
      );
    }

    for (let i = 601; i < 604; i += 1) {
      const mesaFilter = reservas.filter((res) => res.mesa === i);
      let mesaColor = "";
      if (mesaFilter.length > 1) {
        mesaColor = "button-mesa digits two-colors";
      }
      if (mesaFilter.length === 1) {
        mesaColor = `button-mesa digits ${mesaFilter[0].turno}`;
      }
      mesas.push(
        <button
          disabled={reservas.filter((res) => res.mesa === i).length > 0}
          key={i}
          className={mesaFilter.length > 0 ? mesaColor : "button-mesa digits"}
          onClick={(e) => {
            if (mesaFilter.length > 0) {
              alert("Actualizar mesas", <div>Que desea hacer?</div>, [
                {
                  text: "Asignar mesa",
                  onPress: () => this.updateReserva(e, i, mesaFilter, "assign"),
                },
                {
                  text: "Liberar mesa",
                  onPress: () => this.updateReserva(e, i, mesaFilter, "free"),
                },
                {
                  text: "Cancelar",
                },
              ]);
            } else {
              e.preventDefault();
              this.updateReserva(e, i, "", "");
            }
          }}
        >
          {i}
        </button>
      );
    }

    return (
      <Container className="map__container" component="main" maxWidth="xs">
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="breadcrumb"
        >
          <Link color="primary" href="/forest/reservas">
            Listado reservas
          </Link>
          <Typography color="textPrimary">Seleccionar mesa</Typography>
        </Breadcrumbs>
        <Typography component="h1" variant="h5">
          Reserva: {currentReserva.name.toUpperCase()}
        </Typography>
        <span>
          <FiberManualRecordIcon color="secondary" />
          Turno 1
        </span>
        <span className="turno2-text">
          <FiberManualRecordIcon color="primary" />
          Turno 2
        </span>
        <div className="button-mesa__container">{mesas}</div>
      </Container>
    );
  }
}
