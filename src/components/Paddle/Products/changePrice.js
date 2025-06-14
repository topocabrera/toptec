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
  InputAdornment,
} from "@mui/material";

export default class EditProduct extends Component {
  constructor(props) {
    super(props);
    this.onChangePorcentaje = this.onChangePorcentaje.bind(this);
    this.onChangeMarca = this.onChangeMarca.bind(this);
    this.onDataChange = this.onDataChange.bind(this);
    this.updateProduct = this.updateProduct.bind(this);

    this.state = {
      products: [],
      submitted: false,
      porcentaje: 0,
      marca: '',
    };
  }

  componentDidMount() {
    ProductosDataService.getAll()
      .orderByChild("id")
      .once("value", this.onDataChange);
  }

  onDataChange(items) {
    const products = [];
    items.forEach((item) => {
      let key = item.key;
      let data = item.val();
      products.push({
        key,
        id: data.id,
        codigo: data.codigo,
        descripcion: data.descripcion,
        marca: data.marca,
        stock: data.stock,
        precio: data.precio,
      });
    });

    this.setState({ products });
  }

  onChangePorcentaje(e) {
    this.setState({
      porcentaje: e.target.value
    });
  }

  onChangeMarca(e) {
    this.setState({
        marca: e.target.value,
    });
  }

  updateProduct() {
    const { products, porcentaje, marca } = this.state

    const promises = [];
    const prodFilter = products.filter(prod => prod.marca === marca);
    prodFilter.forEach(product => {
      let data = {
        key: product.key,
        precio:  parseInt(product.precio, 10) + (porcentaje * parseInt(product.precio, 10)) / 100
      }
      promises.push(data)
    })
    if (porcentaje > 0) {
      promises.forEach(promise => {
        const data = { precio: promise.precio }
        ProductosDataService.update(promise.key, data)
        .then(() => {
          this.setState({
            submitted: true,
          });
        })
        .catch((e) => {
          console.log(e);
        });
      })
    }
  }

  render() {
    return (
      <Container component="main" maxWidth="xs">
        {this.state.submitted ? (
          <div>
            <h4>Precios editados correctamente!</h4>
            <a
              className="btn btn-primary go-listado"
              href="/list-products"
              role="button"
            >
              Listado
            </a>
            <a
              className="btn btn-primary go-listado"
              href="/change-price"
              role="button"
            >
              Editar nuevamente
            </a>
          </div>
        ) : (
          <div className="form-container">
            <Typography component="h1" variant="h5">
              Editar precio
            </Typography>
            <div className="login-container">
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    required
                    fullWidth
                    className="default__textfield"
                    id="porcentaje"
                    label="Porcentaje"
                    value={this.state.porcentaje}
                    name="porcentaje"
                    onChange={this.onChangePorcentaje}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          %
                        </InputAdornment>
                      ),
                    }}
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
                    {marcas.map((marca) => (
                      <MenuItem key={marca} value={marca}>
                        {marca}
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>
              </Grid>
              <Button
                type="button"
                fullWidth
                variant="contained"
                color="primary"
                className="button__save"
                onClick={this.updateProduct}
                disabled={this.state.porcentaje <= 0}
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
