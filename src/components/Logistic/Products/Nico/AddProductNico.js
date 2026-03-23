import React, { Component } from "react";
import {
  Button,
  TextField,
  Typography,
  Grid,
  Container,
} from "@mui/material";
import { getSmartService, generateSmartRoute } from "../../../../utils/routeHelper";
import { NICO_PRODUCT_LABELS } from "../../../../utils/productNicoLabels";

export default class AddProductNico extends Component {
  constructor(props) {
    super(props);
    this.onDataChange = this.onDataChange.bind(this);
    this.saveProduct = this.saveProduct.bind(this);
    this.newProduct = this.newProduct.bind(this);
    this.handleChange = this.handleChange.bind(this);

    this.state = {
      codigo: "",
      descripcion: "",
      familia: "",
      ean: "",
      uxb: "",
      precioListaSIVA: "",
      precioSugeridoCIVA: "",
      lastId: 0,
      submitted: false,
    };
  }

  componentDidMount() {
    const ProductosService = getSmartService("productos");
    ProductosService.getAll()
      .orderByChild("id")
      .limitToLast(1)
      .once("child_added", this.onDataChange);
  }

  onDataChange(items) {
    const val = items.val();
    this.setState({ lastId: val?.id ?? 0 });
  }

  handleChange(e) {
    const { name, value } = e.target;
    this.setState({ [name]: value });
  }

  saveProduct() {
    const parseNum = (v) => {
      if (v === "" || v == null) return null;
      const n = parseFloat(String(v).replace(",", "."));
      return isNaN(n) ? null : n;
    };

    const data = {
      id: this.state.lastId + 1,
      codigo: this.state.codigo.trim() || null,
      descripcion: this.state.descripcion.trim() || null,
      familia: this.state.familia.trim() || null,
      ean: this.state.ean.trim() || null,
      uxb: this.state.uxb !== "" ? parseNum(this.state.uxb) ?? this.state.uxb : null,
      precioListaSIVA: parseNum(this.state.precioListaSIVA),
      precioSugeridoCIVA: parseNum(this.state.precioSugeridoCIVA),
    };

    const ProductosService = getSmartService("productos");
    ProductosService.create(data)
      .then(() => {
        this.setState({
          submitted: true,
          lastId: this.state.lastId + 1,
        });
      })
      .catch((e) => {
        console.error(e);
      });
  }

  newProduct() {
    this.setState({
      codigo: "",
      descripcion: "",
      familia: "",
      ean: "",
      uxb: "",
      precioListaSIVA: "",
      precioSugeridoCIVA: "",
      submitted: false,
    });
  }

  render() {
    const labels = NICO_PRODUCT_LABELS;
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
              href={generateSmartRoute("/list-products")}
              role="button"
            >
              Listado
            </a>
          </div>
        ) : (
          <div className="form-container">
            <Typography component="h1" variant="h5">
              Nuevo Producto (Nico)
            </Typography>
            <div className="login-container">
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    fullWidth
                    id="codigo"
                    label={labels.codigo}
                    value={this.state.codigo}
                    name="codigo"
                    onChange={this.handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    fullWidth
                    id="descripcion"
                    label={labels.descripcion}
                    value={this.state.descripcion}
                    name="descripcion"
                    onChange={this.handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    fullWidth
                    id="familia"
                    label={labels.familia}
                    value={this.state.familia}
                    name="familia"
                    onChange={this.handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    fullWidth
                    id="ean"
                    label={labels.ean}
                    value={this.state.ean}
                    name="ean"
                    onChange={this.handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    fullWidth
                    id="uxb"
                    label={labels.uxb}
                    value={this.state.uxb}
                    name="uxb"
                    onChange={this.handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    fullWidth
                    id="precioListaSIVA"
                    label={labels.precioListaSIVA}
                    value={this.state.precioListaSIVA}
                    name="precioListaSIVA"
                    onChange={this.handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    fullWidth
                    id="precioSugeridoCIVA"
                    label={labels.precioSugeridoCIVA}
                    value={this.state.precioSugeridoCIVA}
                    name="precioSugeridoCIVA"
                    onChange={this.handleChange}
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
