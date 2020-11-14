import React, { Component } from "react";
import Datetime from "react-datetime";
import { Toast } from "antd-mobile";
import {
  Button,
  TextField,
  Typography,
  Grid,
  Container,
  InputLabel,
  MenuItem,
  Select,
  Checkbox,
  FormControlLabel,
  Tooltip,
  IconButton,
} from "@material-ui/core";
import HelpOutlineIcon from "@material-ui/icons/HelpOutline";
import moment from "moment";
import ReservationDataService from "../../services/reservation.service";
import { turnos } from "../../utils/default";

const limitePorMesa = 6;

export default class AddReservation extends Component {
  constructor(props) {
    super(props);
    this.onChangeName = this.onChangeName.bind(this);
    this.onChangeCantidad = this.onChangeCantidad.bind(this);
    this.onChangeAdentro = this.onChangeAdentro.bind(this);
    this.onChangeDate = this.onChangeDate.bind(this);
    this.onChangeTurno = this.onChangeTurno.bind(this);
    this.onChangeCumple = this.onChangeCumple.bind(this);
    this.saveReserva = this.saveReserva.bind(this);
    this.newReserva = this.newReserva.bind(this);
    this.onDataChange = this.onDataChange.bind(this);
    this.getMesas = this.getMesas.bind(this);
    this.obtainLastMesa = this.obtainLastMesa.bind(this);

    this.state = {
      name: "",
      adentro: false,
      mesa: '',
      cantidad: "",
      date: moment(new Date().getTime()).format("DD-MM-YYYY"),
      turno: "turno1",
      lastId: 0,
      mesasAdentro: {},
      mesasAfuera: {},
      error: false,
      isCumple: false,
      cantidadMesas: "",

      submitted: false,
    };
  }

  componentDidMount() {
    ReservationDataService.getAll()
      .orderByChild("id")
      .limitToLast(1)
      .once("child_added", this.onDataChange);
    ReservationDataService.getAll()
      .orderByChild("mesa")
      .on("value", this.getMesas);
  }

  componentWillUnmount() {
    ReservationDataService.getAll().off("child_added", this.onDataChange);
  }

  onDataChange(items) {
    this.setState({
      lastId: items.val().id || 0,
    });
  }

  getMesas(items) {
    let reservas = [];
    items.forEach((item) => {
      let data = item.val();
      reservas.push({
        name: data.name,
        adentro: data.adentro,
        mesa: data.mesa,
        cantidad: data.cantidad,
        turno: data.turno,
        date: data.date,
      });
    });
    this.setState({
      reservas: reservas,
    });
    this.obtainLastMesa();
  }

  obtainLastMesa(fecha, turnoParam) {
    const { reservas, turno, date } = this.state;
    let lastMesaAdentro = 0;
    let lastMesaAfuera = 10;
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
      name: e.target.value,
    });
  }

  onChangeCantidad(e) {
    this.setState({
      cantidad: e.target.value,
    });
  }

  onChangeAdentro() {
    this.setState({
      adentro: !this.state.adentro,
    });
  }

  onChangeCumple() {
    this.setState({
      isCumple: !this.state.isCumple,
    });
  }

  onChangeDate(e) {
    const dateFormat = e.format("DD-MM-YYYY");
    this.setState({ date: dateFormat });
    this.obtainLastMesa(dateFormat, "");
  }

  onChangeTurno(e) {
    this.setState({ turno: e.target.value });
    this.obtainLastMesa("", e.target.value);
  }

  validationLugar(mesa) {
    if (this.state.adentro && mesa > 10) {
      return false;
    }
    if (!this.state.adentro && mesa > 55) {
      return false;
    }
    return true;
  }

  saveReserva() {
    const promises = [];
    const cantMesasDiv = this.state.cantidad / limitePorMesa;
    const cantMesas =
      this.state.cantidad % limitePorMesa === 0
        ? Math.trunc(cantMesasDiv)
        : Math.trunc(cantMesasDiv) + 1;
    let restoMesas = this.state.cantidad;
    const nameCumple = this.state.isCumple
      ? `${this.state.name} (Cumple)`
      : this.state.name;
    for (let i = 1; i < cantMesas + 1; i++) {
      let quantity = restoMesas < limitePorMesa ? restoMesas : limitePorMesa;
      let data = {
        id: this.state.lastId + i,
        name: nameCumple,
        adentro: this.state.adentro,
        // mesa: this.state.adentro
        //   ? this.state.lastMesaAdentro + i
        //   : this.state.lastMesaAfuera + i,
        mesa: '',
        cantidad: quantity,
        date: this.state.date,
        turno: this.state.turno,
        asistio: false,
        activa: false,
      };
      restoMesas = restoMesas - limitePorMesa;
      // if (this.validationLugar(data.mesa)) {
        promises.push(data);
      // } else {
      //   this.setState({ error: true });
      // }
    }

    if (cantMesas === promises.length) {
      promises.forEach((data) => {
        ReservationDataService.create(data)
          .then(() => {
            Toast.loading("Loading...", 1, () => {
              this.setState({
                submitted: true,
              });
            });
          })
          .catch((e) => {
            Toast.fail("Ocurrió un error !!!", 2);
          });
      });
    }
  }

  newReserva() {
    this.setState({
      name: "",
      adentro: false,
      mesa: 0,
      cantidad: 0,
      date: moment(new Date().getTime()).format("DD-MM-YYYY"),
      turno: "turno1",
      isCumple: false,

      submitted: false,
    });
  }

  render() {
    const textUbicacion = this.state.adentro ? "Adentro" : "Afuera";
    return (
      <Container component="main" maxWidth="xs">
        {this.state.submitted ? (
          <div>
            <h4>Reserva creada correctamente!</h4>
            <a
              role="button"
              className="btn btn-success"
              href="/forest/reservation"
            >
              Nueva
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
              Nueva Reserva
            </Typography>
            <div className="login-container">
              {this.state.error && (
                <div className="alert alert-danger" role="alert">
                  Se superó la cantidad máxima de mesas para {textUbicacion}
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
                  <InputLabel>Fecha</InputLabel>
                  <Datetime
                    className="post-input  post-input__event"
                    dateFormat="DD-MM-YYYY"
                    timeFormat={false}
                    name="eventDate"
                    utc
                    closeOnSelect
                    value={this.state.date}
                    onChange={this.onChangeDate}
                  />
                </Grid>
                <Grid item xs={12}>
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
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    required
                    fullWidth
                    className="default__textfield"
                    id="name"
                    label="Nombre"
                    value={this.state.name}
                    name="name"
                    onChange={this.onChangeName}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        color="primary"
                        value={this.state.isCumple}
                        onChange={this.onChangeCumple}
                        name="iscumple"
                      />
                    }
                    labelPlacement="start"
                    label="Cumpleaños?"
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
                    value={this.state.cantidad}
                    name="cantidad"
                    onChange={this.onChangeCantidad}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        color="primary"
                        value={this.state.adentro}
                        onChange={this.onChangeAdentro}
                        name="iscumple"
                      />
                    }
                    labelPlacement="start"
                    label="Adentro"
                  />
                </Grid>
              </Grid>
              <Button
                type="button"
                fullWidth
                variant="contained"
                color="primary"
                className="button__save"
                onClick={this.saveReserva}
                disabled={this.state.name === "" || this.state.cantidad === ""}
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
