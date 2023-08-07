import React, { Component } from "react";
import Datetime from "react-datetime";
import {
  Button,
  TextField,
  Typography,
  Grid,
  Container,
  InputLabel,
  MenuItem,
  Select,
} from "@material-ui/core";
import ProductosDataService from "../../../services/tutorial.service";
import { tipoCliente, horasTrabajo } from "../../../utils/default";
import moment from "moment";

export default class AddProduct extends Component {
  constructor(props) {
    super(props);
    this.onChangeItem = this.onChangeItem.bind(this);
    this.onChangeDepto = this.onChangeDepto.bind(this);
    this.onChangeTipoCliente = this.onChangeTipoCliente.bind(this);
    this.onChangeHoras = this.onChangeHoras.bind(this);
    this.onChangeStock = this.onChangeStock.bind(this);
    this.onChangePrecio = this.onChangePrecio.bind(this);
    this.onDataChange = this.onDataChange.bind(this);
    this.saveProduct = this.saveProduct.bind(this);
    this.newProduct = this.newProduct.bind(this);
    this.onChangeValues = this.onChangeValues.bind(this);

    this.state = {
      item: "",
      depto: "",
      codigo: "",
      contrato: "",
      cliente: "",
      recibido: "",
      direccion: "",
      latitud: "",
      longitud: "",
      tipoCliente: "",
      horasTrabajo: "",
      date: moment(new Date().getTime()).format("DD-MM-YYYY"),

      submitted: false,
    };
  }

  componentDidMount() {
    ProductosDataService.getAll()
      .orderByChild("id")
      .limitToLast(1)
      .once("child_added", this.onDataChange);
  }

  componentWillUnmount() {
    ProductosDataService.getAll().off("child_added", this.onDataChange);
  }

  onDataChange(items) {
    this.setState({
      lastId: items.val().id || 0,
    });
    console.log(items.val().id);
  }

  onChangeItem(e) {
    this.setState({
      item: e.target.value,
    });
  }

  onChangeDepto(e) {
    this.setState({
      descripcion: e.target.value,
    });
  }

  onChangeTipoCliente(e) {
    this.setState({ tipoCliente: e.target.value });
  }

  onChangeHoras(e) {
    this.setState({ horasTrabajo: e.target.value });
  }

  onChangePrecio(e) {
    this.setState({ precio: e.target.value });
  }

  onChangeStock(e) {
    this.setState({
      stock: e.target.value,
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
    this.obtainLastMesa(dateFormat, "");
  }

  saveProduct() {
    let data = {
      id: this.state.lastId + 1,
      item: this.state.item,
      depto: this.state.depto,
      codigo: this.state.codigo,
      contrato: this.state.contrato,
      cliente: this.state.cliente,
      recibido: this.state.recibido,
      direccion: this.state.direccion,
      latitud: this.state.latitud,
      longitud: this.state.longitud,
      tipoCliente: this.state.tipoCliente,
      horasTrabajo: this.state.horasTrabajo,
      date: this.state.date,
    };

    ProductosDataService.create(data)
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

  newProduct() {
    this.setState({
      item: "",
      depto: "",
      codigo: "",
      contrato: "",
      cliente: "",
      recibido: "",
      direccion: "",
      latitud: "",
      longitud: "",
      tipoCliente: "",
      horasTrabajo: "",
      date: moment(new Date().getTime()).format("DD-MM-YYYY"),
      lastId: this.state.lastId,

      submitted: false,
    });
  }

  render() {
    return (
      <Container component="main" maxWidth="xs">
        {this.state.submitted ? (
          <div>
            <h4>Producto creado correctamente!</h4>
            <button className="btn btn-success" onClick={this.newProduct}>
              Nuevo
            </button>
            <a
              className="btn btn-primary go-listado"
              href="/list-products"
              role="button"
            >
              Listado
            </a>
          </div>
        ) : (
          <div className="form-container">
            <Typography component="h1" variant="h5">
              Nueva Visita
            </Typography>
            <div className="login-container">
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    required
                    fullWidth
                    className="default__textfield"
                    id="item"
                    label="Item"
                    value={this.state.item}
                    name="item"
                    onChange={this.onChangeValues}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    required
                    fullWidth
                    className="default__textfield"
                    id="depto"
                    label="Depto"
                    value={this.state.depto}
                    name="depto"
                    onChange={this.onChangeValues}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    required
                    fullWidth
                    className="default__textfield"
                    id="codigo"
                    label="Código"
                    value={this.state.codigo}
                    name="codigo"
                    onChange={this.onChangeValues}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    required
                    fullWidth
                    className="default__textfield"
                    id="contrato"
                    label="Contrato"
                    value={this.state.contrato}
                    name="contrato"
                    onChange={this.onChangeValues}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    required
                    fullWidth
                    className="default__textfield"
                    id="cliente"
                    label="Cliente"
                    value={this.state.cliente}
                    name="cliente"
                    onChange={this.onChangeValues}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    fullWidth
                    className="default__textfield"
                    id="recibido"
                    label="Persona que recibió"
                    value={this.state.recibido}
                    name="recibido"
                    onChange={this.onChangeValues}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    required
                    fullWidth
                    className="default__textfield"
                    id="direccion"
                    label="Dirección"
                    value={this.state.direccion}
                    name="direccion"
                    onChange={this.onChangeValues}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    fullWidth
                    className="default__textfield"
                    id="latitud"
                    label="latitud"
                    value={this.state.latitud}
                    name="latitud"
                    onChange={this.onChangeValues}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    fullWidth
                    className="default__textfield"
                    id="longitud"
                    label="longitud"
                    value={this.state.longitud}
                    name="longitud"
                    onChange={this.onChangeValues}
                  />
                </Grid>
                <Grid item xs={12}>
                  <InputLabel>Tipo Cliente</InputLabel>
                  <Select
                    onChange={this.onChangeTipoCliente}
                    value={this.state.tipoCliente}
                    className="select__form"
                    fullWidth
                  >
                    {tipoCliente.map((tipo) => (
                      <MenuItem key={tipo} value={tipo}>
                        {tipo}
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>
                <Grid item xs={12}>
                  <InputLabel>Hora de trabajo</InputLabel>
                  <Select
                    onChange={this.onChangeHoras}
                    value={this.state.horasTrabajo}
                    className="select__form"
                    fullWidth
                  >
                    {horasTrabajo.map((horas) => (
                      <MenuItem key={horas} value={horas}>
                        {horas}
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>
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
              </Grid>
              <Button
                type="button"
                fullWidth
                variant="contained"
                color="primary"
                className="button__save"
                onClick={this.saveProduct}
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
