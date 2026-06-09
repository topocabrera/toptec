import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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
import { getSmartService, generateSmartRoute, getPriceLabels, isNicoRole } from "../../../utils/routeHelper";

const EditProduct = () => {
  const { id } = useParams();
  const [currentProduct, setCurrentProduct] = useState({
    key: null,
    id: 0,
    codigo: "",
    descripcion: "",
    marca: "",
    precio: "",
    precioCosto: "",
    precioMayorista: "",
    precioAlternativo: "",
    codigoBarras: "",
    stock: 0,
    unidadesPorBulto: "",
    peso: 1,
  });

  const [submitted, setSubmitted] = useState(false);
  const [marcas, setMarcas] = useState([]);

  useEffect(() => {
    const productId = parseInt(id, 10);
    const ProductosService = getSmartService('productos');
    ProductosService.getAll()
      .orderByChild("id")
      .equalTo(productId)
      .once("value", onDataChange);

    const MarcasService = getSmartService('marcas');
    MarcasService.getAll()
      .orderByChild("id")
      .once("value", (items) => {
        const marcasArray = [];
        items.forEach((item) => {
          marcasArray.push(item.val().nombre);
        });
        setMarcas(marcasArray);
      });
  }, [id]);

  const onDataChange = (items) => {
    const key = Object.keys(items.val())[0];
    const data = items.val()[key];
    setCurrentProduct({ ...data, key });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentProduct((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const updateProduct = () => {
    const data = {
      id: currentProduct.id,
      codigo: currentProduct.codigo,
      descripcion: currentProduct.descripcion,
      stock: parseInt(currentProduct.stock, 10),
      marca: currentProduct.marca,
      precio: currentProduct.precio,
      precioCosto: currentProduct.precioCosto,
      precioMayorista: currentProduct.precioMayorista,
      precioAlternativo: currentProduct.precioAlternativo ?? "",
      codigoBarras: currentProduct.codigoBarras ?? "",
      peso: currentProduct.peso,
      ...(isNicoRole() && { unidadesPorBulto: currentProduct.unidadesPorBulto ?? "" }),
    };

    const ProductosService = getSmartService('productos');
    ProductosService.update(currentProduct.key, data)
      .then(() => {
        setSubmitted(true);
      })
      .catch((e) => {
        console.log(e);
      });
  };

  return (
    <Container component="main" maxWidth="xs">
      {submitted ? (
        <div>
          <h4>Producto editado correctamente!</h4>
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
                  value={currentProduct.codigo}
                  name="codigo"
                  onChange={handleChange}
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
                  value={currentProduct.descripcion}
                  name="descripcion"
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <InputLabel>Marca</InputLabel>
                <Select
                  onChange={handleChange}
                  value={currentProduct.marca}
                  className="select__form"
                  name="marca"
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
                  label="Peso (Kg)"
                  value={currentProduct.peso}
                  name="peso"
                  onChange={handleChange}
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
                  value={currentProduct.precioCosto}
                  name="precioCosto"
                  onChange={handleChange}
                />
              </Grid>
              {!isNicoRole() && (
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    required
                    fullWidth
                    className="default__textfield"
                    id="precioMayorista"
                    label={getPriceLabels().mayorista}
                    value={currentProduct.precioMayorista}
                    name="precioMayorista"
                    onChange={handleChange}
                  />
                </Grid>
              )}
              <Grid item xs={12}>
                <TextField
                  variant="outlined"
                  required
                  fullWidth
                  className="default__textfield"
                  id="precio"
                  label={getPriceLabels().minorista}
                  value={currentProduct.precio}
                  name="precio"
                  onChange={handleChange}
                />
              </Grid>
              {!isNicoRole() && (
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    fullWidth
                    className="default__textfield"
                    id="precioAlternativo"
                    label={`${getPriceLabels().alternativo} (Opcional)`}
                    value={currentProduct.precioAlternativo}
                    name="precioAlternativo"
                    onChange={handleChange}
                  />
                </Grid>
              )}
              <Grid item xs={12}>
                <TextField
                  variant="outlined"
                  fullWidth
                  className="default__textfield"
                  id="codigoBarras"
                  label="Código de Barras (Opcional)"
                  value={currentProduct.codigoBarras}
                  name="codigoBarras"
                  onChange={handleChange}
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
                  value={currentProduct.stock}
                  name="stock"
                  onChange={handleChange}
                />
              </Grid>
              {isNicoRole() && (
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    fullWidth
                    className="default__textfield"
                    id="unidadesPorBulto"
                    label="Unidades por bulto"
                    type="number"
                    value={currentProduct.unidadesPorBulto ?? ""}
                    name="unidadesPorBulto"
                    onChange={handleChange}
                  />
                </Grid>
              )}
            </Grid>
            <Button
              type="button"
              fullWidth
              variant="contained"
              color="primary"
              className="button__save"
              onClick={updateProduct}
            >
              Aceptar
            </Button>
          </div>
        </div>
      )}
    </Container>
  );
};

export default EditProduct;
