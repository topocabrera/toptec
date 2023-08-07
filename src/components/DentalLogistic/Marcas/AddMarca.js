import React, { Component } from "react";
import MarcaDataService from "../../../services/marcas.service";
import {
  Button,
  TextField,
  Typography,
  Grid,
  Container,
} from "@material-ui/core";

export default class AddMarca extends Component {
  constructor(props) {
    super(props);
    this.onChangeValues = this.onChangeValues.bind(this);
    this.onDataChange = this.onDataChange.bind(this);
    this.saveClient = this.saveClient.bind(this);
    this.newClient = this.newClient.bind(this);
    
    this.state = {
      nombre: "",
      descripcion: "",
      lastId: 0,

      submitted: false,
    };
  }

  componentDidMount() {
    MarcaDataService.getAll()
      .orderByChild("id")
      .limitToLast(1)
      .once("child_added", this.onDataChange);
  }

  componentWillUnmount() {
    MarcaDataService.getAll().off("child_added", this.onDataChange);
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

  saveClient() {
    let data = {
      id: this.state.lastId + 1,
      descripcion: this.state.descripcion,
      nombre: this.state.nombre,
    };

    MarcaDataService.create(data)
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
      nombre: "",
      descripcion: "",

      submitted: false,
    });
  }

  render() {
    return (
      <Container component="main" maxWidth="xs">
        {this.state.submitted ? (
          <div>
            <h4>Marca creada correctamente!</h4>
            <button className="btn btn-success" onClick={this.newClient}>
              Nuevo
            </button>
            <a className="btn btn-primary go-listado" href="/dental/marcas" role="button">
              Listado
            </a>
          </div>
        ) : (
          <div className="form-container">
            <Typography component="h1" variant="h5">
              Nueva Marca
            </Typography>
            <div className="login-container">
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    required
                    fullWidth
                    id="nombre"
                    label="nombre"
                    value={this.state.nombre}
                    name="nombre"
                    onChange={this.onChangeValues}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="descripcion"
                    variant="outlined"
                    required
                    fullWidth
                    autoFocus
                    id="descripcion"
                    label="Descripción"
                    value={this.state.descripcion}
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
