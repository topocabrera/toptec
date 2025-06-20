import React, { Component } from "react";
import ProductosDataService from "../../../services/productos.service";
import MarcasDataService from "../../../services/marcas.service";
import {
  Button,
  TextField,
  Typography,
  Grid,
  Container,
  InputLabel,
  MenuItem,
  Select,
  InputAdornment,
} from "@mui/material";

export default class EditProduct extends Component {
  constructor(props) {
    super(props);
    this.onChangeCodigo = this.onChangeCodigo.bind(this);
    this.onChangeDescripcion = this.onChangeDescripcion.bind(this);
    this.onChangeMarca = this.onChangeMarca.bind(this);
    this.onDataChange = this.onDataChange.bind(this);
    this.updateProduct = this.updateProduct.bind(this);
    this.onChangeValues = this.onChangeValues.bind(this);
    this.onDataChangeMarca = this.onDataChangeMarca.bind(this);

    this.state = {
      currentProduct: {
        key: null,
        id: 0,
        descripcion: "",
        marca: "Sin marca",
        precio_dolar: 0,
        precio_costo: 0,
        precio_contado: 0,
        precio_credito_1_cuota: 0,
        stock: 0,
      },
      marcas: [],
      submitted: false,
    };
  }

  componentDidMount() {
    const id = parseInt(this.props.match.params.id, 10);
    MarcasDataService.getAll()
      .orderByChild("id")
      .on("value", this.onDataChangeMarca);
    ProductosDataService.getAll()
      .orderByChild("id")
      .equalTo(id)
      .once("value", this.onDataChange);
  }

  onDataChange(items) {
    let key = Object.keys(items.val());
    let data = items.val();
    const currentProduct = data[key];
    currentProduct.key = key[0];
    const porcentajeMarca = this.state.marcas.filter(marca => marca.nombre === currentProduct.marca)[0]?.porcentaje;
    currentProduct.porcentaje = currentProduct.porcentaje || porcentajeMarca || 0
    this.setState({ currentProduct });
  }

  onDataChangeMarca(items) {
    this.setState({ marcas: Object.values(items.val()) });
  }

  onChangeCodigo(e) {
    this.setState({
      currentProduct: {
        ...this.state.currentProduct,
        codigo: e.target.value,
      },
    });
  }

  onChangeDescripcion(e) {
    this.setState({
      currentProduct: {
        ...this.state.currentProduct,
        descripcion: e.target.value,
      },
    });
  }

  onChangeMarca(e) {
    this.setState({
      currentProduct: {
        ...this.state.currentProduct,
        marca: e.target.value,
      },
    });
  }

  onChangeValues(e) {
    const name = e.target.name;
    const value = e.target.value;
    this.setState({
      currentProduct: {
        ...this.state.currentProduct,
        [name]: value,
      },
    });
  }

  updateProduct() {
    const data = {
      id: this.state.currentProduct.id,
      descripcion: this.state.currentProduct.descripcion,
      stock: parseInt(this.state.currentProduct.stock, 10),
      marca: this.state.currentProduct.marca,
      porcentaje: this.state.currentProduct.porcentaje,
      precio_dolar: this.state.currentProduct.precio_dolar,
      precio_costo: this.state.currentProduct.precio_costo,
      precio_contado: this.state.currentProduct.precio_contado,
    };

    ProductosDataService.update(this.state.currentProduct.key, data)
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
            <h4>Producto editado correctamente!</h4>
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
              Editar producto
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
                    value={this.state.currentProduct.descripcion}
                    name="descripcion"
                    onChange={this.onChangeDescripcion}
                  />
                </Grid>
                <Grid item xs={12}>
                  <InputLabel>Marca</InputLabel>
                  <Select
                    onChange={this.onChangeMarca}
                    value={this.state.currentProduct.marca}
                    className="select__form"
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
                    id="precio_dolar"
                    label="Precio Dolar"
                    value={this.state.currentProduct.precio_dolar}
                    name="precio_dolar"
                    onChange={this.onChangeValues}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    required
                    fullWidth
                    className="default__textfield"
                    id="precio_costo"
                    label="Precio Costo"
                    value={this.state.currentProduct.precio_costo}
                    name="precio_costo"
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
                    value={this.state.currentProduct.stock}
                    name="stock"
                    onChange={this.onChangeValues}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    required
                    fullWidth
                    className="default__textfield"
                    id="porcentaje"
                    label="% ganancia"
                    value={this.state.currentProduct.porcentaje}
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
                {/* <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    fullWidth
                    className="default__textfield"
                    id="precio_credito_1_cuota"
                    label="Precio Tarjeta 1 cuota"
                    value={this.state.currentProduct.precio_credito_1_cuota}
                    name="precio_credito_1_cuota"
                    onChange={this.onChangeValues}
                  />
                </Grid> */}
              </Grid>
              <Button
                type="button"
                fullWidth
                variant="contained"
                color="primary"
                className="button__save"
                onClick={this.updateProduct}
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
