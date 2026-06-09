import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Button,
  TextField,
  Typography,
  Grid,
  Container,
} from "@mui/material";
import { getSmartService, generateSmartRoute } from "../../../utils/routeHelper";

const EditMarca = () => {
  const { id } = useParams();
  const [currentMarca, setCurrentMarca] = useState({
    key: null,
    id: 0,
    nombre: "",
  });

  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const idParsed = parseInt(id, 10);
    const MarcasService = getSmartService('marcas');
    MarcasService.getAll()
      .orderByChild("id")
      .equalTo(idParsed)
      .once("value", (items) => {
        const key = Object.keys(items.val())[0];
        const data = items.val()[key];
        setCurrentMarca({ ...data, key });
      });
  }, [id]);

  const onChangeValues = (e) => {
    const { name, value } = e.target;
    setCurrentMarca((prev) => ({ ...prev, [name]: value }));
  };

  const updateMarca = () => {
    const {
      key,
      id,
      nombre,
    } = currentMarca;

    const data = {
      id,
      nombre,
    };

    const MarcasService = getSmartService('marcas');
    MarcasService.update(key, data)
      .then(() => setSubmitted(true))
      .catch((e) => console.log(e));
  };

  return (
    <Container component="main" maxWidth="xs">
      {submitted ? (
        <div>
          <h4>Marca editada correctamente!</h4>
          <a className="btn btn-primary go-listado" href={generateSmartRoute("/marca")}>
            Nuevo
          </a>
          <a
            className="btn btn-primary go-listado"
            href={generateSmartRoute("/list-marcas")}
          >
            Listado
          </a>
        </div>
      ) : (
        <div className="form-container">
          <Typography component="h1" variant="h5">
            Editar Marca
          </Typography>
          <div className="login-container">
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  name="id"
                  variant="outlined"
                  disabled
                  fullWidth
                  id="id"
                  label="ID"
                  value={currentMarca.id}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="nombre"
                  variant="outlined"
                  required
                  fullWidth
                  id="nombre"
                  label="Nombre"
                  value={currentMarca.nombre}
                  onChange={onChangeValues}
                />
              </Grid>
            </Grid>
            <Button
              type="button"
              fullWidth
              variant="contained"
              color="primary"
              className="button__save"
              onClick={updateMarca}
            >
              Aceptar
            </Button>
          </div>
        </div>
      )}
    </Container>
  );
};

export default EditMarca;
