import React, { Component } from "react";
import { Toast } from "antd-mobile";
import {
  Button,
  TextField,
  Typography,
  Grid,
  Container,
  InputLabel,
  Select,
  MenuItem,
} from "@material-ui/core";
import ClientService from "../../../services/clients.service";
import { dias } from "../../../utils/default";

export default class editClient extends Component {
  constructor(props) {
    super(props);

    this.state = {
      currentClient: {
        key: null,
        id: 0,
        barrio: "",
        domicilio: "",
        dni: "",
        formato_comercial: "",
        razon_social: "",
        telefono: "",
        dia: 1,
        motivo: "",
        estado: "",
        condicionIva: ""
      },

      submitted: false,
    };
    this.updateClient = this.updateClient.bind(this);
    this.onChangeValues = this.onChangeValues.bind(this);
    this.onDataChange = this.onDataChange.bind(this);
    this.onChangeDay = this.onChangeDay.bind(this);
  }

  componentDidMount() {
    const id = parseInt(this.props.match.params.id, 10);
    ClientService.getAll()
      .orderByChild("id")
      .equalTo(id)
      .once("value", this.onDataChange);
  }

  onDataChange(items) {
    let key = Object.keys(items.val());
    let data = items.val();
    const currentClient = data[key];
    currentClient.key = key[0];
    this.setState({ currentClient });
  }

  onChangeValues(e) {
    const name = e.target.name;
    const value = e.target.value;
    this.setState({
      currentClient: {
        ...this.state.currentClient,
        [name]: value,
      },
    });
  }

  onChangeDay(e) {
    this.setState({
      currentClient: { ...this.state.currentClient, dia: e.target.value },
    });
  }

  updateClient() {
    const data = {
      id: this.state.currentClient.id,
      barrio: this.state.currentClient.barrio,
      domicilio: this.state.currentClient.domicilio,
      dni: this.state.currentClient.dni,
      formato_comercial: this.state.currentClient.formato_comercial,
      razon_social: this.state.currentClient.razon_social,
      telefono: this.state.currentClient.telefono,
      dia: this.state.currentClient.dia,
      motivo: this.state.currentClient.motivo,
      estado: this.state.currentClient.estado,
      condicionIva: this.state.currentClient.condicionIva,
    };

    ClientService.update(this.state.currentClient.key, data)
      .then(() => {
        this.setState({
          submitted: true,
        });
      })
      .catch((e) => {
        console.log(e);
      });
  }

  render() {
    return (
      <Container component="main" maxWidth="xs">
        {this.state.submitted ? (
          <div>
            <h4>Cliente editado correctamente!</h4>
            <a
              className="btn btn-primary go-listado"
              href="/client"
              role="button"
            >
              Nuevo
            </a>
            <a
              className="btn btn-primary go-listado"
              href="/list-client"
              role="button"
            >
              Listado
            </a>
          </div>
        ) : (
          <div className="form-container">
            <Typography component="h1" variant="h5">
              Editar Cliente
            </Typography>
            <div className="login-container">
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    name="id"
                    variant="outlined"
                    disabled
                    fullWidth
                    id="id"
                    label="ID"
                    value={this.state.currentClient.id}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="razon_social"
                    variant="outlined"
                    required
                    fullWidth
                    id="razon_social"
                    label="Razón social"
                    value={this.state.currentClient.razon_social}
                    onChange={this.onChangeValues}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="dni"
                    variant="outlined"
                    required
                    fullWidth
                    id="dni"
                    value={this.state.currentClient.dni}
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
                    value={this.state.currentClient.domicilio}
                    name="domicilio"
                    onChange={this.onChangeValues}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    required
                    fullWidth
                    id="barrio"
                    label="Barrio"
                    value={this.state.currentClient.barrio}
                    name="barrio"
                    onChange={this.onChangeValues}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    required
                    fullWidth
                    id="formato_comercial"
                    label="Formato comercial"
                    value={this.state.currentClient.formato_comercial}
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
                    value={this.state.currentClient.telefono}
                    onChange={this.onChangeValues}
                  />
                </Grid>
                <Grid item xs={12}>
                  <InputLabel>Día</InputLabel>
                  <Select
                    onChange={this.onChangeDay}
                    value={this.state.currentClient.dia}
                    className="select__form"
                    fullWidth
                  >
                    {dias.map((dia) => (
                      <MenuItem key={dia.value} value={dia.value}>
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
                    value={this.state.currentClient.condicionIva}
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
                onClick={this.updateClient}
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
