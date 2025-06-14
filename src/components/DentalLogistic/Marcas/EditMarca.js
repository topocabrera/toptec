import React, { Component } from "react";
import { Toast } from "antd-mobile";
import {
  Button,
  TextField,
  Typography,
  Grid,
  Container,
  InputAdornment,
} from "@mui/material";
import MarcaService from "../../../services/marcas.service";

export default class EditMarca extends Component {
  constructor(props) {
    super(props);

    this.state = {
      currentClient: {
        key: null,
        id: 0,
        nombre: "",
        descripcion: "",
        porcentaje: "",
      },

      submitted: false,
    };
    this.updateClient = this.updateClient.bind(this);
    this.onChangeValues = this.onChangeValues.bind(this);
    this.onDataChange = this.onDataChange.bind(this);
  }

  componentDidMount() {
    const id = parseInt(this.props.match.params.id, 10);
    MarcaService.getAll()
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

  updateClient() {
    const data = {
      id: this.state.currentClient.id,
      nombre: this.state.currentClient.nombre,
      descripcion: this.state.currentClient.descripcion,
      porcentaje: this.state.currentClient.porcentaje,
    };

    MarcaService.update(this.state.currentClient.key, data)
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
            <h4>Marca editada correctamente!</h4>
            <a
              className="btn btn-primary go-listado"
              href="/dental/marca"
              role="button"
            >
              Nuevo
            </a>
            <a
              className="btn btn-primary go-listado"
              href="/dental/marcas"
              role="button"
            >
              Listado
            </a>
          </div>
        ) : (
          <div className="form-container">
            <Typography component="h1" variant="h5">
              Editar Marca
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
                    variant="outlined"
                    required
                    fullWidth
                    id="nombre"
                    label="Nombre"
                    value={this.state.currentClient.nombre}
                    name="nombre"
                    onChange={this.onChangeValues}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    required
                    fullWidth
                    id="descripcion"
                    label="Descripción"
                    value={this.state.currentClient.descripcion}
                    name="descripcion"
                    onChange={this.onChangeValues}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    type="number"
                    required
                    fullWidth
                    id="porcentaje"
                    label="Porcentaje ganancia"
                    value={this.state.currentClient.porcentaje}
                    name="porcentaje"
                    onChange={this.onChangeValues}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          %
                        </InputAdornment>
                      ),
                    }}
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
