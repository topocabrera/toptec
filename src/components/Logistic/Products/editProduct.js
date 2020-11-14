import React, { Component } from "react";
import ProductosDataService from "../../../services/productos.service";
import marcas from "../../../utils/default";
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

export default class EditProduct extends Component {
  constructor(props) {
    super(props);
    this.onChangeCodigo = this.onChangeCodigo.bind(this);
    this.onChangeDescripcion = this.onChangeDescripcion.bind(this);
    this.onChangeMarca = this.onChangeMarca.bind(this);
    this.onChangeStock = this.onChangeStock.bind(this);
    this.onChangePrecio = this.onChangePrecio.bind(this);
    this.onDataChange = this.onDataChange.bind(this);
    this.updateProduct = this.updateProduct.bind(this);
    this.onChangeValues = this.onChangeValues.bind(this);
    
    this.state = {
      currentProduct: {
        key: null,
        id: 0,
        codigo: "",
        descripcion: "",
        marca: "",
        precio: "",
        stock: 0,
        peso: 1,
      },

      submitted: false,
    };
  }

  componentDidMount() {
    const id = parseInt(this.props.match.params.id, 10);
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
    this.setState({ currentProduct });
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

  onChangePrecio(e) {
    this.setState({
      currentProduct: {
        ...this.state.currentProduct,
        precio: e.target.value,
      },
    });
  }

  onChangeStock(e) {
    this.setState({
      currentProduct: {
        ...this.state.currentProduct,
        stock: e.target.value,
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
      codigo: this.state.currentProduct.codigo,
      descripcion: this.state.currentProduct.descripcion,
      stock: parseInt(this.state.currentProduct.stock, 10),
      marca: this.state.currentProduct.marca,
      precio: this.state.currentProduct.precio,
      peso: parseInt(this.state.currentProduct.peso, 10),
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
              href="/list-products"
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
                    id="codigo"
                    label="Código"
                    value={this.state.currentProduct.codigo}
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
                    {marcas.map((marca) => (
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
                    label="Peso"
                    value={this.state.currentProduct.peso}
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
                    id="precio"
                    label="Precio"
                    value={this.state.currentProduct.precio}
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
                    id="stock"
                    label="Stock"
                    value={this.state.currentProduct.stock}
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
