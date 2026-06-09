import React, { Component } from "react";
import {
  Button,
  TextField,
  Typography,
  Grid,
  Container,
} from "@mui/material";
import { getSmartService, generateSmartRoute } from "../../../utils/routeHelper";

export default class AddMarca extends Component {
  constructor(props) {
    super(props);
    this.onChangeValues = this.onChangeValues.bind(this);
    this.onDataChange = this.onDataChange.bind(this);
    this.saveMarca = this.saveMarca.bind(this);
    this.newMarca = this.newMarca.bind(this);

    this.state = {
      nombre: "",
      lastId: 0,
      submitted: false,
    };
  }

  componentDidMount() {
    const MarcasService = getSmartService('marcas');
    MarcasService.getAll()
      .orderByChild("id")
      .limitToLast(1)
      .once("child_added", this.onDataChange);
  }

  componentWillUnmount() {
    const MarcasService = getSmartService('marcas');
    MarcasService.getAll().off("child_added", this.onDataChange);
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

  saveMarca() {
    let data = {
      id: this.state.lastId + 1,
      nombre: this.state.nombre,
    };

    const MarcasService = getSmartService('marcas');
    MarcasService.create(data)
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

  newMarca() {
    this.setState({
      nombre: "",
      submitted: false,
    });
  }

  render() {
    return (
      <Container component="main" maxWidth="xs">
        {this.state.submitted ? (
          <div>
            <h4>Marca creada correctamente!</h4>
            <button className="btn btn-success" onClick={this.newMarca}>
              Nuevo
            </button>
            <a className="btn btn-primary go-listado" href={generateSmartRoute("/list-marcas")} role="button">
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
                    name="nombre"
                    variant="outlined"
                    required
                    fullWidth
                    autoFocus
                    id="nombre"
                    label="Nombre"
                    value={this.state.nombre}
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
                onClick={this.saveMarca}
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
