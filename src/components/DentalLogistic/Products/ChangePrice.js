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

export default class ChangePrice extends Component {
  constructor(props) {
    super(props);
    this.onChangePorcentaje = this.onChangePorcentaje.bind(this);
    this.onChangeMarca = this.onChangeMarca.bind(this);
    this.onDataChange = this.onDataChange.bind(this);
    this.updateProduct = this.updateProduct.bind(this);
    this.onDataChangeMarca = this.onDataChangeMarca.bind(this);

    this.state = {
      products: [],
      submitted: false,
      porcentaje: 0,
      marca: 'Sin marca',
      marcas: [],
    };
  }

  componentDidMount() {
    ProductosDataService.getAll()
      .orderByChild("id")
      .once("value", this.onDataChange);
    MarcasDataService.getAll()
      .orderByChild("id")
      .on("value", this.onDataChangeMarca);
  }

  onDataChangeMarca(items) {
    this.setState({ marcas: Object.values(items.val()) });
  }

  onDataChange(items) {
    const products = [];
    items.forEach((item) => {
      let key = item.key;
      let data = item.val();
      products.push({
        key,
        id: data.id,
        descripcion: data.descripcion,
        precio_dolar: data.precio_dolar,
        marca: data.marca,
        stock: data.stock,
        precio_costo: data.precio_costo,
        precio_contado: data.precio_contado,
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
        precio_costo:  parseInt(product.precio_costo, 10) + (porcentaje * parseInt(product.precio_costo, 10)) / 100,
        precio_contado:  parseInt(product.precio_contado, 10) + (porcentaje * parseInt(product.precio_contado, 10)) / 100
      }
      promises.push(data)
    })
    if (porcentaje > 0) {
      promises.forEach(promise => {
        const data = {
          precio_costo: promise.precio_costo,
          precio_contado: promise.precio_contado,
        }
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
          </div>
        ) : (
          <div className="form-container change-price">
            <div className="login-container">
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    type="number"
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
                    {this.state.marcas?.map((marca) => (
                      <MenuItem key={marca.id} value={marca.nombre}>
                        {marca.nombre}
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
