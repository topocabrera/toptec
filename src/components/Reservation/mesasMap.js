import React, { Component } from "react";
import Datetime from "react-datetime";
import { Toast, Modal } from "antd-mobile";
import { Breadcrumbs, Typography, Link, Container } from "@material-ui/core";
import NavigateNextIcon from "@material-ui/icons/NavigateNext";
import FiberManualRecordIcon from "@material-ui/icons/FiberManualRecord";
import moment from "moment";
import ReservationDataService from "../../services/reservation.service";
import { mesasArray } from "../../utils/default";
const queryString = require("query-string");
const alert = Modal.alert;

export default class MesaMap extends Component {
  constructor(props) {
    super(props);
    this.updateReserva = this.updateReserva.bind(this);
    this.getMesas = this.getMesas.bind(this);
    this.changeMesa = this.changeMesa.bind(this);
    this.resetValues = this.resetValues.bind(this);
    
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
      type: "",
      reservas: [],
      open: false,
      turno: "",

      submitted: false,
    };
  }

  componentDidMount() {
    if (this.props.location.search) {
      const params = queryString.parse(this.props.location.search);
      ReservationDataService.getAll()
        .orderByChild("date")
        .equalTo(params.date)
        .once("value", this.getMesas);
    }
  }

  componentWillUnmount() {
    ReservationDataService.getAll().off("child_added", this.onDataChange);
  }

  getMesas(items) {
    let reservas = [];
    items.forEach((item) => {
      let data = item.val();
      let key = item.key;
      reservas.push({
        key,
        name: data.name,
        id: data.id,
        mesa: data.mesa,
        turno: data.turno,
        date: data.date,
        cantidad: data.cantidad,
        activa: data.activa || false,
      });
    });
    this.setState({
      reservas,
      date: queryString.parse(this.props.location.search).date,
    });
  }

  changeMesa(e, nroMesa, reserva, type) {
    const filterReserva =
      this.state.turno !== ""
        ? reserva.filter((reserv) => reserv.turno === this.state.turno)[0]
        : reserva[0];
    this.setState({
      currentReserva: filterReserva,
      type,
    });
  }

  selectTurno(turno) {
    this.setState({ turno });
  }

  resetValues() {
    this.setState({
      type: "",
      open: false,
      turno: "",
    })
  }

  updateReserva(e, nroMesa, reserva, type) {
    const dataSet = {
      mesa: nroMesa,
      activa: true,
    };

    const dataActive = {
      activa: false,
      mesa: "",
    };

    const dataUpdate = {
      activa: true,
      mesa: this.state.currentReserva.mesa,
    };

    const mesaFilter =
      reserva !== "" && reserva.length > 1
        ? reserva.filter((res) => res.turno === this.state.currentReserva.turno)
        : reserva;

    if (reserva && type === "free") {
      ReservationDataService.update(mesaFilter[0].key, dataActive)
        .then(() => {
          Toast.success("Mesa liberada correctamente!!", 1);
          window.location.reload();
        })
        .catch((e) => {
          Toast.fail("Ocurrió un error !!!", 2);
        });
    }

    if (this.state.type === "assign") {
      ReservationDataService.update(this.state.currentReserva.key, dataSet)
        .then(() => {
          Toast.success("Mesa actualizada correctamente!!", 1);
          window.location.reload();
        })
        .catch((e) => {
          Toast.fail("Ocurrió un error !!!", 2);
        });
    }

    if (this.state.type === "transport") {
      ReservationDataService.update(mesaFilter[0].key, dataUpdate)
        .then()
        .catch((e) => {
          Toast.fail("Ocurrió un error !!!", 2);
        });
      ReservationDataService.update(this.state.currentReserva.key, dataSet)
        .then(() => {
          Toast.success("Mesa actualizada correctamente!!", 1);
          window.location.reload();
        })
        .catch((e) => {
          Toast.fail("Ocurrió un error !!!", 2);
        });
    }
  }

  render() {
    const { currentReserva, reservas, type } = this.state;
    const mesas = [];
    mesasArray.forEach((mesa, i) => {
      const mesaFilter = reservas.filter((res) => res.mesa === mesa);
      const turnoFilter = mesaFilter.filter((filt) => filt.turno === currentReserva.turno);
      let mesaColor = "";
      if (mesaFilter.length > 1) {
        mesaColor = "button-mesa two-colors";
      }
      if (mesaFilter.length === 1) {
        mesaColor = `button-mesa ${mesaFilter[0].turno}`;
      }
      mesas.push(
        <button
          disabled={
            (mesaFilter.length > 0 &&
              type === "assign" &&
              turnoFilter.length > 0) ||
            (mesaFilter.length === 0 && type === "") ||
            (type === "transport" && (mesaFilter.length === 0 || turnoFilter.length <= 0))
          }
          key={i}
          className={mesaFilter.length > 0 ? mesaColor : "button-mesa"}
          onClick={(e) => {
            if (mesaFilter.length > 0 && type === "") {
              const nombre = mesaFilter.length === 1 ? mesaFilter[0].name : turnoFilter[0].name
              const turno = mesaFilter.length === 1 ? mesaFilter[0].turno : turnoFilter[0].turno
              const cantidad = mesaFilter.length === 1 ? mesaFilter[0].cantidad : turnoFilter[0].cantidad
              alert("Actualizar mesas",
              <div>
                <span className="detail__reserva-modal">Nombre: {nombre}</span>
                <span className="detail__reserva-modal">Turno: {turno}</span>
                <span className="detail__reserva-modal">Cant. Personas: {cantidad}</span>
              </div>, [
                {
                  text: "Asignar nueva mesa",
                  onPress: () => this.changeMesa(e, mesa, mesaFilter, "assign"),
                },
                {
                  text: "Intercambiar mesas",
                  onPress: () =>
                    this.changeMesa(e, mesa, mesaFilter, "transport"),
                },
                {
                  text: "Liberar mesa",
                  onPress: () =>
                    this.updateReserva(e, mesa, mesaFilter, "free"),
                },
                {
                  text: "Cancelar",
                  onPress: () => this.resetValues(),
                },
              ]);
              if (mesaFilter.length > 1) {
                alert("Actualizar mesas", <div>Seleccionar turno</div>, [
                  {
                    text: "Turno 1",
                    onPress: () => this.selectTurno("turno1"),
                  },
                  {
                    text: "Turno 2",
                    onPress: () => this.selectTurno("turno2"),
                  },
                  {
                    text: "Cancelar",
                    onPress: () => this.resetValues(),
                  },
                ]);
              }
            }
            if (type === "assign") {
              e.preventDefault();
              this.updateReserva(e, mesa, currentReserva, "");
            }
            if (type === "transport") {
              e.preventDefault();
              this.updateReserva(e, mesa, mesaFilter, "");
            }
          }}
        >
          {mesa}
        </button>
      );
    });

    // for (let i = 601; i < 604; i += 1) {
    //   const mesaFilter = reservas.filter((res) => res.mesa === i);
    //   let mesaColor = "";
    //   if (mesaFilter.length > 1) {
    //     mesaColor = "button-mesa digits two-colors";
    //   }
    //   if (mesaFilter.length === 1) {
    //     mesaColor = `button-mesa digits ${mesaFilter[0].turno}`;
    //   }
    //   mesas.push(
    //     <button
    //       disabled={reservas.filter((res) => res.mesa === i).length > 0}
    //       key={i}
    //       className={mesaFilter.length > 0 ? mesaColor : "button-mesa digits"}
    //       onClick={(e) => {
    //         if (mesaFilter.length > 0) {
    //           alert("Actualizar mesas", <div>Que desea hacer?</div>, [
    //             {
    //               text: "Asignar mesa",
    //               onPress: () => this.updateReserva(e, i, mesaFilter, "assign"),
    //             },
    //             {
    //               text: "Liberar mesa",
    //               onPress: () => this.updateReserva(e, i, mesaFilter, "free"),
    //             },
    //             {
    //               text: "Cancelar",
    //             },
    //           ]);
    //         } else {
    //           e.preventDefault();
    //           this.updateReserva(e, i, "", "");
    //         }
    //       }}
    //     >
    //       {i}
    //     </button>
    //   );
    // }

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
          Reservas del {this.state.date}
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
