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
} from "@mui/material";
import ProductosDataService from "../../../services/productos.service";
import { marcasLogistic } from "../../../utils/default";

export default class AddProduct extends Component {
  constructor(props) {
    super(props);
    this.onChangeCodigo = this.onChangeCodigo.bind(this);
    this.onChangeDescripcion = this.onChangeDescripcion.bind(this);
    this.onChangeMarca = this.onChangeMarca.bind(this);
    this.onChangeStock = this.onChangeStock.bind(this);
    this.onChangePrecio = this.onChangePrecio.bind(this);
    this.onDataChange = this.onDataChange.bind(this);
    this.saveProduct = this.saveProduct.bind(this);
    this.newProduct = this.newProduct.bind(this);
    this.onChangeValues = this.onChangeValues.bind(this);

    this.state = {
      codigo: "",
      descripcion: "",
      marca: "Windy",
      precio: "",
      precioCosto: "",
      precioMayorista: "",
      stock: 0,
      lastId: 0,
      peso: 1,

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
  }

  onChangeCodigo(e) {
    this.setState({
      codigo: e.target.value,
    });
  }

  onChangeDescripcion(e) {
    this.setState({
      descripcion: e.target.value,
    });
  }

  onChangeMarca(e) {
    this.setState({ marca: e.target.value });
  }

  onChangePrecio(e) {
    const value = e.target.value;
    const name = e.target.name;
    this.setState({ [name]: value });
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

  saveProduct() {
    let data = {
      id: this.state.lastId + 1,
      codigo: this.state.codigo,
      descripcion: this.state.descripcion,
      stock: parseInt(this.state.stock, 10),
      marca: this.state.marca,
      precioCosto: this.state.precioCosto,
      precio: this.state.precio,
      precioMayorista: this.state.precioMayorista,
      peso: this.state.peso,
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
      codigo: "",
      descripcion: "",
      stock: 0,
      marca: "Windy",
      precio: "",
      precioCosto: "",
      precioMayorista: "",
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
              href="/logistic/list-products"
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
                    id="codigo"
                    label="Código"
                    value={this.state.codigo}
                    name="codigo"
                    onChange={this.onChangeCodigo}
                  />
                </Grid>
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
                    onChange={this.onChangeDescripcion}
                  />
                </Grid>
                <Grid item xs={12}>
                  <InputLabel>Marca</InputLabel>
                  <Select
                    onChange={this.onChangeMarca}
                    value={this.state.marca}
                    className="select__form"
                    fullWidth
                  >
                    {marcasLogistic.map((marca) => (
                      <MenuItem key={marca} value={marca}>
                        {marca}
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
                    id="peso"
                    label="Peso (Kg)"
                    value={this.state.peso}
                    name="peso"
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
                    onChange={this.onChangePrecio}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    required
                    fullWidth
                    className="default__textfield"
                    id="precio"
                    label="Precio Venta Minorista"
                    value={this.state.precio}
                    name="precio"
                    onChange={this.onChangePrecio}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    required
                    fullWidth
                    className="default__textfield"
                    id="precioMayorista"
                    label="Precio Venta Mayorista"
                    value={this.state.precioMayorista}
                    name="precioMayorista"
                    onChange={this.onChangePrecio}
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
                    onChange={this.onChangeStock}
                  />
                </Grid>
              </Grid>
              <Button
                type="button"
                fullWidth
                variant="contained"
                color="primary"
                className="button__save"
                disabled={this.state.codigo === ""}
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
