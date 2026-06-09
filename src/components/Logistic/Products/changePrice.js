import React, { Component } from "react";
import { getSmartService, generateSmartRoute, getPriceLabels, isNicoRole } from "../../../utils/routeHelper";
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
  Checkbox,
  FormGroup,
  FormControlLabel,
} from "@mui/material";

export default class EditProduct extends Component {
  constructor(props) {
    super(props);
    this.onChangePorcentaje = this.onChangePorcentaje.bind(this);
    this.onChangeMarca = this.onChangeMarca.bind(this);
    this.onDataChange = this.onDataChange.bind(this);
    this.onMarcasChange = this.onMarcasChange.bind(this);
    this.updateProduct = this.updateProduct.bind(this);
    this.onCheckPrice = this.onCheckPrice.bind(this);

    this.state = {
      products: [],
      submitted: false,
      porcentaje: 0,
      precio: true,
      precioMayorista: true,
      precioCosto: true,
      marca: '',
      marcas: [],
    };
  }

  componentDidMount() {
    const ProductosService = getSmartService('productos');
    ProductosService.getAll()
      .orderByChild("id")
      .once("value", this.onDataChange);

    const MarcasService = getSmartService('marcas');
    MarcasService.getAll()
      .orderByChild("id")
      .once("value", this.onMarcasChange);
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
        precioMayorista: data.precioMayorista,
        precioCosto: data.precioCosto,
      });
    });

    this.setState({ products });
  }

  onMarcasChange(items) {
    const marcas = [];
    items.forEach((item) => {
      marcas.push(item.val().nombre);
    });
    this.setState({ marcas });
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

    const applyIncrement = (base) => {
      const parsed = parseInt(base, 10);
      if (Number.isNaN(parsed)) return null;
      return parsed + (porcentaje * parsed) / 100;
    };

    const buildUpdate = (product) => {
      const data = {};
      if (this.state.precio) {
        const v = applyIncrement(product.precio);
        if (v !== null) data.precio = v;
      }
      if (this.state.precioMayorista) {
        const v = applyIncrement(product.precioMayorista);
        if (v !== null) data.precioMayorista = v;
      }
      if (this.state.precioCosto) {
        const v = applyIncrement(product.precioCosto);
        if (v !== null) data.precioCosto = v;
      }
      return data;
    };

    if (porcentaje <= 0) return;

    const prodFilter = products.filter(prod => prod.marca === marca);
    prodFilter.forEach(product => {
      const data = buildUpdate(product);
      if (Object.keys(data).length === 0) return;
      const ProductosService = getSmartService('productos');
      ProductosService.update(product.key, data)
        .then(() => {
          this.setState({
            submitted: true,
          });
        })
        .catch((e) => {
          console.log(e);
        });
    });
  }

  onCheckPrice(e, type) {
    const check = e.target.checked;
    this.setState({
      [type]: check,
    });
  }

  render() {
    return (
      <Container component="main" maxWidth="xs">
        {this.state.submitted ? (
          <div>
            <h4>Precios editados correctamente!</h4>
            <a
              className="btn btn-primary go-listado"
              href={generateSmartRoute("/list-products")}
              role="button"
            >
              Listado
            </a>
            <a
              className="btn btn-primary go-listado"
              href={generateSmartRoute("/change-price")}
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
                    {this.state.marcas.map((marca) => (
                      <MenuItem key={marca} value={marca}>
                        {marca}
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>
                <Grid item xs={12}>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox defaultChecked value={this.state.precioCosto} onChange={(e) => this.onCheckPrice(e, 'precioCosto')} />
                      }
                      label="Precio Costo" />
                    {!isNicoRole() && (
                      <FormControlLabel
                        control={
                          <Checkbox defaultChecked value={this.state.precioMayorista} onChange={(e) => this.onCheckPrice(e, 'precioMayorista')} />
                        }
                        label={getPriceLabels().mayorista} />
                    )}
                    <FormControlLabel
                      control={
                        <Checkbox defaultChecked value={this.state.precio} onChange={(e) => this.onCheckPrice(e, 'precio')} />
                      }
                      label={getPriceLabels().minorista} />
                  </FormGroup>
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
