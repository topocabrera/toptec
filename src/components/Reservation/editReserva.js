import React, { Component } from "react";
import Datetime from "react-datetime";
import { Toast } from "antd-mobile";
import {
  Button,
  TextField,
  Typography,
  Grid,
  Container,
  Checkbox,
  FormControlLabel,
  Tooltip,
  IconButton,
} from "@material-ui/core";
import HelpOutlineIcon from "@material-ui/icons/HelpOutline";
import moment from "moment";
import ReservationDataService from "../../services/reservation.service";

const limitePorMesa = 6;

export default class AddReservation extends Component {
  constructor(props) {
    super(props);
    this.onChangeName = this.onChangeName.bind(this);
    this.onChangeMesa = this.onChangeMesa.bind(this);
    this.onChangeCantidad = this.onChangeCantidad.bind(this);
    this.onChangeAdentro = this.onChangeAdentro.bind(this);
    this.updateReserva = this.updateReserva.bind(this);
    this.changeTooltip = this.changeTooltip.bind(this);
    this.onDataChange = this.onDataChange.bind(this);
    this.getMesas = this.getMesas.bind(this);
    this.obtainLastMesa = this.obtainLastMesa.bind(this);

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
      mesasAdentro: {},
      mesasAfuera: {},
      error: {
        value: false,
        message: "",
      },
      open: false,

      submitted: false,
    };
  }

  componentDidMount() {
    const id = parseInt(this.props.match.params.id, 10);
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
      if (
        data.turno === currentReserva.turno &&
        data.date === currentReserva.date
      ) {
        reservas.push({
          id: data.id,
          name: data.name,
          adentro: data.adentro,
          mesa: data.mesa,
          cantidad: data.cantidad,
          turno: data.turno,
          date: data.date,
        });
      }
    });
    this.setState({
      reservas,
    });
  }

  obtainLastMesa(fecha, turnoParam) {
    const { reservas, turno, date } = this.state;
    // let reserva = [];
    let lastMesaAdentro = 0;
    let lastMesaAfuera = 11;
    const turnoComp = turnoParam || turno;
    const fechaComp = fecha || date;
    reservas.forEach((item) => {
      if (item.date === fechaComp && item.turno === turnoComp) {
        lastMesaAdentro = item.adentro ? item.mesa : lastMesaAdentro;
        lastMesaAfuera = !item.adentro ? item.mesa : lastMesaAfuera;
      }
    });
    this.setState({ lastMesaAdentro, lastMesaAfuera });
  }

  onChangeName(e) {
    this.setState({
      currentReserva: {
        ...this.state.currentReserva,
        name: e.target.value,
      },
    });
  }

  onChangeMesa(e) {
    this.setState({
      currentReserva: {
        ...this.state.currentReserva,
        mesa: e.target.value,
      },
      error: {
        value: false,
        message: "",
      },
    });
  }

  onChangeCantidad(e) {
    this.setState({
      currentReserva: {
        ...this.state.currentReserva,
        cantidad: e.target.value,
      },
    });
  }

  onChangeAdentro(e) {
    this.setState({
      currentReserva: {
        ...this.state.currentReserva,
        adentro: !this.state.currentReserva.adentro,
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

  updateReserva() {
    const data = {
      id: this.state.currentReserva.id,
      name: this.state.currentReserva.name,
      mesa: parseInt(this.state.currentReserva.mesa, 10),
      cantidad: parseInt(this.state.currentReserva.cantidad, 10),
      date: this.state.currentReserva.date,
      turno: this.state.currentReserva.turno,
      adentro: this.state.currentReserva.adentro,
    };

    if (this.validationLugar(data.mesa)) {
      ReservationDataService.update(this.state.currentReserva.key, data)
        .then(() => {
          this.setState({
            submitted: true,
            error: {
              value: false,
              message: "",
            },
          });
        })
        .catch((e) => {
          console.log(e);
        });
    }
  }

  changeTooltip() {
    this.setState({ open: !this.state.open });
  }

  render() {
    return (
      <Container component="main" maxWidth="xs">
        {this.state.submitted ? (
          <div>
            <h4>Reserva editada correctamente!</h4>
            <a
              className="btn btn-success"
              href="/forest/reservation"
              role="button"
            >
              Nueva Reserva
            </a>
            <a
              className="btn btn-primary go-listado"
              href="/forest/reservas"
              role="button"
            >
              Listado
            </a>
          </div>
        ) : (
          <div className="form-container">
            <Typography component="h1" variant="h5">
              Editar Reserva
            </Typography>
            <div className="login-container">
              {this.state.error.value && (
                <div className="alert alert-danger" role="alert">
                  {this.state.error.message}
                  <Tooltip
                    title="Mesas adentro: 1 - 10. Mesas afuera: 11 - 55"
                    open={this.state.open}
                  >
                    <IconButton
                      aria-label="mesas"
                      onClick={this.changeTooltip}
                      color="secondary"
                    >
                      <HelpOutlineIcon />
                    </IconButton>
                  </Tooltip>
                </div>
              )}
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    id="standard-basic"
                    label="Fecha"
                    value={this.state.currentReserva.date}
                    disabled
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    id="standard-basic"
                    label="Turno"
                    value={this.state.currentReserva.turno}
                    disabled
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    required
                    fullWidth
                    className="default__textfield"
                    id="name"
                    label="Nombre"
                    value={this.state.currentReserva.name}
                    name="name"
                    onChange={this.onChangeName}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    className="default__textfield"
                    fullWidth
                    required
                    id="cantidad"
                    label="Cantidad de personas"
                    value={this.state.currentReserva.cantidad}
                    name="cantidad"
                    onChange={this.onChangeCantidad}
                    error={this.state.currentReserva.cantidad > limitePorMesa}
                    helperText={
                      this.state.currentReserva.cantidad > limitePorMesa
                        ? "Cantidad máxima por mesa superada"
                        : ""
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        color="primary"
                        value={this.state.currentReserva.adentro}
                        onChange={this.onChangeAdentro}
                        name="iscumple"
                        checked={this.state.currentReserva.adentro}
                      />
                    }
                    labelPlacement="start"
                    label="Adentro"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    className="default__textfield"
                    fullWidth
                    required
                    id="mesa"
                    label="Mesa"
                    name="mesa"
                    value={this.state.currentReserva.mesa}
                    onChange={this.onChangeMesa}
                    min={this.state.currentReserva.adentro ? 1 : 11}
                    max={this.state.currentReserva.adentro ? 10 : 55}
                  />
                </Grid>
              </Grid>
              <Button
                type="button"
                fullWidth
                variant="contained"
                color="primary"
                className="button__save"
                onClick={this.updateReserva}
                disabled={
                  this.state.currentReserva.name === "" ||
                  this.state.currentReserva.cantidad === ""
                }
              >
                Aceptar
              </Button>
            </div>
          </div>
        )}
      </Container>
    );
  }
}
//       <div className="submit-form">
//         {this.state.submitted ? (
//           <div>
//             <h4>Reserva editada correctamente!</h4>
//             <a className="btn btn-success"  href="/forest/reservation" role="button">
//               Nueva Reserva
//             </a>
//             <a className="btn btn-primary go-listado" href="/forest/reservas" role="button">
//               Listado
//             </a>
//           </div>
//         ) : (
//           <div>
//             <h4>Editar Reserva</h4>
//             <div className="form-group">
//               <TextField
//                 id="standard-basic"
//                 label="Fecha"
//                 value={this.state.currentReserva.date}
//                 disabled
//               />
//             </div>

//             <div className="form-group">
//               <TextField
//                 id="standard-basic"
//                 label="Turno"
//                 value={this.state.currentReserva.turno}
//                 disabled
//               />
//             </div>

//             <div className="form-group">
//               <label htmlFor="name">Nombre</label>
//               <input
//                 type="text"
//                 className="form-control"
//                 id="name"
//                 required
//                 value={this.state.currentReserva.name}
//                 onChange={this.onChangeName}
//                 name="name"
//               />
//             </div>

//             <div className="form-group">
//               <label htmlFor="cantidad">Cantidad</label>
//               <input
//                 type="number"
//                 className="form-control"
//                 id="cantidad"
//                 required
//                 value={this.state.currentReserva.cantidad}
//                 onChange={this.onChangeCantidad}
//                 name="cantidad"
//               />
//             </div>

//             <div className="form-group">
//               <label htmlFor="adentro">Adentro</label>
//               <input
//                 type="checkbox"
//                 className="form-control checkbox__adentro"
//                 id="adentro"
//                 required
//                 value={this.state.currentReserva.adentro}
//                 checked={this.state.currentReserva.adentro}
//                 onChange={this.onChangeAdentro}
//                 name="adentro"
//               />
//             </div>

//             <div className="form-group">
//               <label htmlFor="adentro">Mesa</label>
//               <input
//                 type="number"
//                 className="form-control"
//                 id="mesa"
//                 required
//                 value={this.state.currentReserva.mesa}
//                 onChange={this.onChangeMesa}
//                 min={this.state.currentReserva.adentro ? 1 : 11}
//                 max={this.state.currentReserva.adentro ? 10 : 55}
//                 name="mesa"
//               />
//             </div>

//             {this.state.error.value && (
//               <div className="alert alert-danger" role="alert">
//                 {this.state.error.message}
//               </div>
//             )}

//             <button
//               onClick={this.updateReserva}
//               className="btn btn-success"
//               disabled={this.state.name === "" || this.state.cantidad === ""}
//             >
//               Aceptar
//             </button>
//           </div>
//         )}
//       </div>
//     );
//   }
// }
