import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ProductosDataService from "../../../services/productos.service";
import { marcasLogistic as marcas } from "../../../utils/default";
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
    stock: 0,
    peso: 1,
  });

  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const productId = parseInt(id, 10);
    ProductosDataService.getAll()
      .orderByChild("id")
      .equalTo(productId)
      .once("value", onDataChange);
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
      peso: currentProduct.peso,
    };

    ProductosDataService.update(currentProduct.key, data)
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
            href="/logistic/list-products"
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
              <Grid item xs={12}>
                <TextField
                  variant="outlined"
                  required
                  fullWidth
                  className="default__textfield"
                  id="precio"
                  label="Precio Venta Minorista"
                  value={currentProduct.precio}
                  name="precio"
                  onChange={handleChange}
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
                  value={currentProduct.precioMayorista}
                  name="precioMayorista"
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
