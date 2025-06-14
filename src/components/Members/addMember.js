import React, { Component } from "react";
import MemberDataService from "../../services/member.service";
import { DatePicker as Datetime } from '@mui/x-date-pickers/DatePicker';
import {
  Button,
  TextField,
  Typography,
  Grid,
  Container,
  InputLabel,
} from "@mui/material";
import moment from "moment";

export default class AddMember extends Component {
  constructor(props) {
    super(props);
    this.onChangeValues = this.onChangeValues.bind(this);
    this.onDataChange = this.onDataChange.bind(this);
    this.saveClient = this.saveClient.bind(this);
    this.newClient = this.newClient.bind(this);
    this.onChangeDate = this.onChangeDate.bind(this);
    this.onChangeDateVenc = this.onChangeDateVenc.bind(this);

    this.state = {
      nombre: "",
      dni: "",
      contacto: "",
      telefono: "",
      actividad: "",
      date: moment(new Date().getTime()).format("DD-MM-YYYY"),
      dateVenc: moment(new Date().getTime()).add(1, 'month').format("DD-MM-YYYY"),
      lastId: 0,

      submitted: false,
    };
  }

  componentDidMount() {
    MemberDataService.getAll()
      .orderByChild("id")
      .limitToLast(1)
      .once("child_added", this.onDataChange);
  }

  componentWillUnmount() {
    MemberDataService.getAll().off("child_added", this.onDataChange);
  }

  onDataChange(items) {
    this.setState({
      lastId: items.val().id || 0,
    });
  }

  onChangeValues(e) {
    const name = e.target.name;
    const value = e.target.value;
    this.setState({ [name]: value });
  }

  onChangeDate(e) {
    const dateFormat = e.format("DD-MM-YYYY");
    this.setState({ date: dateFormat });
  }

  onChangeDateVenc(e) {
    const dateFormat = e.format("DD-MM-YYYY");
    this.setState({ dateVenc: dateFormat });
  }

  saveClient() {
    let data = {
      id: this.state.lastId + 1,
      nombre: this.state.nombre,
      dni: this.state.dni,
      contacto: this.state.contacto,
      telefono: this.state.telefono,
      date: this.state.date,
      dateVenc: this.state.dateVenc,
      actividad: this.state.actividad,
    };

    MemberDataService.create(data)
      .then(() => {
        this.setState({
          submitted: true,
          lastId: this.state.lastId + 1,
        });
      })
      .catch((e) => {
        console.log(e);
      });
  }

  newClient() {
    this.setState({
      nombre: '',
      dni: '',
      contacto: '',
      telefono: '',
      actividad: '',
      date: moment(new Date().getTime()).format("DD-MM-YYYY"),
      dateVenc: moment(new Date().getTime()).add(1, 'month').format("DD-MM-YYYY"),

      submitted: false,
    });
  }

  render() {
    return (
      <Container component="main" maxWidth="xs">
        {this.state.submitted ? (
          <div>
            <h4>Socio creado correctamente!</h4>
            <button className="btn btn-success" onClick={this.newClient}>
              Nuevo
            </button>
            <a className="btn btn-primary go-listado" href="/member-list" role="button">
              Listado
            </a>
          </div>
        ) : (
          <div className="form-container">
            <Typography component="h1" variant="h5">
              Nuevo Socio
            </Typography>
            <div className="login-container">
              <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      variant="outlined"
                      required
                      fullWidth
                      className="default__textfield"
                      id="nombre"
                      label="Nombre y Apellido"
                      value={this.state.nombre}
                      name="nombre"
                      onChange={this.onChangeValues}
                    />
                  </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="dni"
                    required
                    className="default__textfield"
                    variant="outlined"
                    fullWidth
                    id="dni"
                    value={this.state.dni}
                    label="DNI"
                    onChange={this.onChangeValues}
                  />
                </Grid>
                <Grid item xs={12}>
                  <InputLabel>Fecha inicio</InputLabel>
                  <Datetime
                    className="post-input  post-input__event"
                    dateFormat="DD-MM-YYYY"
                    timeFormat={false}
                    name="date"
                    utc
                    closeOnSelect
                    value={this.state.date}
                    onChange={this.onChangeDate}
                  />
                </Grid>
                <Grid item xs={12}>
                  <InputLabel>Fecha Vencimiento</InputLabel>
                  <Datetime
                    className="post-input  post-input__event"
                    dateFormat="DD-MM-YYYY"
                    timeFormat={false}
                    name="datevenc"
                    utc
                    closeOnSelect
                    value={this.state.dateVenc}
                    onChange={this.onChangeDateVenc}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    required
                    fullWidth
                    className="default__textfield"
                    id="telefono"
                    label="Teléfono"
                    name="telefono"
                    value={this.state.telefono}
                    onChange={this.onChangeValues}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    className="default__textfield"
                    fullWidth
                    id="actividad"
                    label="Actividad"
                    value={this.state.actividad}
                    name="actividad"
                    onChange={this.onChangeValues}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    className="default__textfield"
                    fullWidth
                    id="contacto"
                    label="Contacto de emergencia"
                    value={this.state.contacto}
                    name="contacto"
                    onChange={this.onChangeValues}
                  />
                </Grid>
              </Grid>
              <Button
                type="button"
                fullWidth
                variant="contained"
                color="primary"
                className="button__save"
                onClick={this.saveClient}
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
