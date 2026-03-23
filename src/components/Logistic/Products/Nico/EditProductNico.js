import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Button,
  TextField,
  Typography,
  Grid,
  Container,
} from "@mui/material";
import { getSmartService, generateSmartRoute } from "../../../../utils/routeHelper";
import { NICO_PRODUCT_LABELS } from "../../../../utils/productNicoLabels";

const EditProductNico = () => {
  const { id } = useParams();
  const [currentProduct, setCurrentProduct] = useState({
    key: null,
    id: 0,
    codigo: "",
    descripcion: "",
    familia: "",
    ean: "",
    uxb: "",
    precioListaSIVA: "",
    precioSugeridoCIVA: "",
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const productId = parseInt(id, 10);
    const ProductosService = getSmartService("productos");
    ProductosService.getAll()
      .orderByChild("id")
      .equalTo(productId)
      .once("value", (snap) => {
        const val = snap.val();
        if (val && typeof val === "object") {
          const keys = Object.keys(val);
          if (keys.length > 0) {
            const key = keys[0];
            setCurrentProduct({ ...val[key], key });
          }
        }
      });
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentProduct((prev) => ({ ...prev, [name]: value }));
  };

  const updateProduct = () => {
    const parseNum = (v) => {
      if (v === "" || v == null) return null;
      const n = parseFloat(String(v).replace(",", "."));
      return isNaN(n) ? null : n;
    };

    const data = {
      id: currentProduct.id,
      codigo: currentProduct.codigo?.trim() || null,
      descripcion: currentProduct.descripcion?.trim() || null,
      familia: currentProduct.familia?.trim() || null,
      ean: currentProduct.ean?.trim() || null,
      uxb: currentProduct.uxb !== "" ? parseNum(currentProduct.uxb) ?? currentProduct.uxb : null,
      precioListaSIVA: parseNum(currentProduct.precioListaSIVA),
      precioSugeridoCIVA: parseNum(currentProduct.precioSugeridoCIVA),
    };

    const ProductosService = getSmartService("productos");
    ProductosService.update(currentProduct.key, data)
      .then(() => setSubmitted(true))
      .catch((e) => console.error(e));
  };

  const labels = NICO_PRODUCT_LABELS;

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
            Editar producto (Nico)
          </Typography>
          <div className="login-container">
            <Grid container spacing={2}>
              {["codigo", "descripcion", "familia", "ean", "uxb", "precioListaSIVA", "precioSugeridoCIVA"].map((field) => (
                <Grid item xs={12} key={field}>
                  <TextField
                    variant="outlined"
                    fullWidth
                    id={field}
                    label={labels[field]}
                    value={currentProduct[field] ?? ""}
                    name={field}
                    onChange={handleChange}
                  />
                </Grid>
              ))}
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

export default EditProductNico;
