import React, { Component } from "react";
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
import ProductosDataService from "../../../services/productos.service";
import MarcasDataService from "../../../services/marcas.service";
// import marcas from "../../../utils/default";

export default class AddProduct extends Component {
  constructor(props) {
    super(props);
    this.onDataChange = this.onDataChange.bind(this);
    this.saveProduct = this.saveProduct.bind(this);
    this.newProduct = this.newProduct.bind(this);
    this.onChangeValues = this.onChangeValues.bind(this);
    this.onDataChangeMarca = this.onDataChangeMarca.bind(this);

    this.state = {
      id: 0,
      descripcion: "",
      marca: "Sin marca",
      precioDolar: 0,
      precioCosto: 0,
      precioContado: 0,
      precio_credito_1_cuota: 0,
      stock: 0,
      lastId: 0,
      marcas: [],

      submitted: false,
    };
  }

  componentDidMount() {
    ProductosDataService.getAll()
      .orderByChild("id")
      .limitToLast(1)
      .once("child_added", this.onDataChange);
      MarcasDataService.getAll()
      .orderByChild("id")
      .on("value", this.onDataChangeMarca);
  }

  componentWillUnmount() {
    ProductosDataService.getAll().off("child_added", this.onDataChange);
  }

  onDataChange(items) {
    this.setState({
      lastId: items.val().id || 0,
    });
  }

  onDataChangeMarca(items) {
    this.setState({ marcas: Object.values(items.val()) });
  }

  onChangeValues(e) {
    const name = e.target.name;
    const value = e.target.value;
    this.setState({ [name]: value });
  }

  saveProduct() {
    let data = {
      id: this.state.lastId + 1,
      descripcion: this.state.descripcion,
      stock: parseInt(this.state.stock, 10),
      marca: this.state.marca,
      precio_dolar: parseInt(this.state.precioDolar, 10),
      precio_costo: parseInt(this.state.precioCosto, 10),
      precio_contado: parseInt(this.state.precioContado, 10),
      precio_credito_1_cuota: parseInt(this.state.precio_credito_1_cuota, 10),
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
      id: 0,
      descripcion: "",
      marca: "Sin marca",
      precioDolar: 0,
      precioCosto: 0,
      precioContado: 0,
      precio_credito_1_cuota: 0,
      stock: 0,
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
              href="/dental/product-list"
              role="button"
            >
              Listado
            </a>
          </div>
        ) : (
          <div className="form-container">
            <Typography component="h1" variant="h5">
              Nuevo Producto
            </Typography>
            <div className="login-container">
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    required
                    fullWidth
                    className="default__textfield"
                    id="descripcion"
                    label="Descripción"
                    value={this.state.descripcion}
                    name="descripcion"
                    onChange={this.onChangeValues}
                  />
                </Grid>
                <Grid item xs={12}>
                  <InputLabel>Marca</InputLabel>
                  <Select
                    onChange={this.onChangeValues}
                    value={this.state.marca}
                    className="select__form"
                    name="marca"
                    fullWidth
                  >
                    {this.state.marcas.map((marca) => (
                      <MenuItem key={marca.id} value={marca.nombre}>
                        {marca.nombre}
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
                    id="precioDolar"
                    label="Precio Dolar"
                    value={this.state.precioDolar}
                    name="precioDolar"
                    onChange={this.onChangeValues}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    required
                    fullWidth
                    className="default__textfield"
                    id="precioCosto"
                    label="Precio Costo"
                    value={this.state.precioCosto}
                    name="precioCosto"
                    onChange={this.onChangeValues}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    required
                    fullWidth
                    className="default__textfield"
                    id="precioContado"
                    label="Precio Contado"
                    value={this.state.precioContado}
                    name="precioContado"
                    onChange={this.onChangeValues}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    fullWidth
                    className="default__textfield"
                    id="precio_credito_1_cuota"
                    label="Precio Tarjeta 1 cuota"
                    value={this.state.precio_credito_1_cuota}
                    name="precio_credito_1_cuota"
                    onChange={this.onChangeValues}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    required
                    fullWidth
                    className="default__textfield"
                    id="stock"
                    label="Stock"
                    value={this.state.stock}
                    name="stock"
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
