import React, { Component } from "react";
import ClientsDataService from "../../../services/clients.service";
import {
  Button,
  TextField,
  Typography,
  Grid,
  Container,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { dias } from "../../../utils/default";

export default class AddClient extends Component {
  constructor(props) {
    super(props);
    this.onChangeValues = this.onChangeValues.bind(this);
    this.onDataChange = this.onDataChange.bind(this);
    this.saveClient = this.saveClient.bind(this);
    this.newClient = this.newClient.bind(this);
    this.onChangeDay = this.onChangeDay.bind(this);

    this.state = {
      barrio: "",
      domicilio: "",
      dni: "",
      formato_comercial: "",
      razon_social: "",
      telefono: "",
      estado: "no visitado",
      motivo: "",
      lastId: 0,
      dia: 1,
      condicionIva: "",

      submitted: false,
    };
  }

  componentDidMount() {
    ClientsDataService.getAll()
      .orderByChild("id")
      .limitToLast(1)
      .once("child_added", this.onDataChange);
  }

  componentWillUnmount() {
    ClientsDataService.getAll().off("child_added", this.onDataChange);
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

  onChangeDay(e) {
    this.setState({ dia: e.target.value });
  }

  saveClient() {
    let data = {
      id: this.state.lastId + 1,
      razon_social: this.state.razon_social,
      domicilio: this.state.domicilio,
      dni: this.state.dni,
      barrio: this.state.barrio,
      formato_comercial: this.state.formato_comercial,
      telefono: this.state.telefono,
      dia: this.state.dia,
      motivo: this.state.motivo,
      estado: this.state.estado,
      condicionIva: this.state.condicionIva,
    };

    ClientsDataService.create(data)
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
      barrio: "",
      domicilio: "",
      dni: "",
      formato_comercial: "",
      razon_social: "",
      telefono: "",
      estado: "no visitado",
      motivo: "",
      dia: 1,
      condicionIva: "",

      submitted: false,
    });
  }

  render() {
    return (
      <Container component="main" maxWidth="xs">
        {this.state.submitted ? (
          <div>
            <h4>Cliente creado correctamente!</h4>
            <button className="btn btn-success" onClick={this.newClient}>
              Nuevo
            </button>
            <a className="btn btn-primary go-listado" href="/logistic/list-client" role="button">
              Listado
            </a>
          </div>
        ) : (
          <div className="form-container">
            <Typography component="h1" variant="h5">
              Nuevo Cliente
            </Typography>
            <div className="login-container">
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    name="razon_social"
                    variant="outlined"
                    required
                    fullWidth
                    autoFocus
                    id="razon_social"
                    label="Razón social"
                    value={this.state.razon_social}
                    onChange={this.onChangeValues}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="dni"
                    variant="outlined"
                    fullWidth
                    id="dni"
                    value={this.state.dni}
                    label="DNI/CUIT"
                    onChange={this.onChangeValues}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    required
                    fullWidth
                    id="domicilio"
                    label="Domicilio"
                    value={this.state.domicilio}
                    name="domicilio"
                    onChange={this.onChangeValues}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    fullWidth
                    id="barrio"
                    label="Barrio"
                    value={this.state.barrio}
                    name="barrio"
                    onChange={this.onChangeValues}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    fullWidth
                    id="formato_comercial"
                    label="Formato comercial"
                    value={this.state.formato_comercial}
                    name="formato_comercial"
                    onChange={this.onChangeValues}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    required
                    fullWidth
                    id="telefono"
                    label="Teléfono"
                    name="telefono"
                    value={this.state.telefono}
                    onChange={this.onChangeValues}
                  />
                </Grid>
                <Grid item xs={12}>
                  <InputLabel>Día</InputLabel>
                  <Select
                    onChange={this.onChangeDay}
                    value={this.state.dia}
                    className="select__form"
                    fullWidth
                  >
                    {dias.map((dia) => (
                      <MenuItem key={dia.value} value={dia.value} name="dia">
                        {dia.name}
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    fullWidth
                    id="condicionIva"
                    label="Condición IVA"
                    name="condicionIva"
                    value={this.state.condicionIva}
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
