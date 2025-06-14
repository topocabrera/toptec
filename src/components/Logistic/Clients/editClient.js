import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Button,
  TextField,
  Typography,
  Grid,
  Container,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import ClientService from "../../../services/clients.service";
import { dias } from "../../../utils/default";

const EditClient = () => {
  const { id } = useParams();
  const [currentClient, setCurrentClient] = useState({
    key: null,
    id: 0,
    barrio: "",
    domicilio: "",
    dni: "",
    formato_comercial: "",
    razon_social: "",
    telefono: "",
    dia: 1,
    motivo: "",
    estado: "",
    condicionIva: "",
  });

  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const idParsed = parseInt(id, 10);
    ClientService.getAll()
      .orderByChild("id")
      .equalTo(idParsed)
      .once("value", (items) => {
        const key = Object.keys(items.val())[0];
        const data = items.val()[key];
        setCurrentClient({ ...data, key });
      });
  }, [id]);

  const onChangeValues = (e) => {
    const { name, value } = e.target;
    setCurrentClient((prev) => ({ ...prev, [name]: value }));
  };

  const onChangeDay = (e) => {
    setCurrentClient((prev) => ({ ...prev, dia: e.target.value }));
  };

  const updateClient = () => {
    const {
      key,
      id,
      barrio,
      domicilio,
      dni,
      formato_comercial,
      razon_social,
      telefono,
      dia,
      motivo,
      estado,
      condicionIva,
    } = currentClient;

    const data = {
      id,
      barrio,
      domicilio,
      dni,
      formato_comercial,
      razon_social,
      telefono,
      dia,
      motivo,
      estado,
      condicionIva,
    };

    ClientService.update(key, data)
      .then(() => setSubmitted(true))
      .catch((e) => console.log(e));
  };

  return (
    <Container component="main" maxWidth="xs">
      {submitted ? (
        <div>
          <h4>Cliente editado correctamente!</h4>
          <a className="btn btn-primary go-listado" href="/logistic/client">
            Nuevo
          </a>
          <a
            className="btn btn-primary go-listado"
            href="/logistic/list-client"
          >
            Listado
          </a>
        </div>
      ) : (
        <div className="form-container">
          <Typography component="h1" variant="h5">
            Editar Cliente
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
                  value={currentClient.id}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="razon_social"
                  variant="outlined"
                  required
                  fullWidth
                  id="razon_social"
                  label="Razón social"
                  value={currentClient.razon_social}
                  onChange={onChangeValues}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="dni"
                  variant="outlined"
                  required
                  fullWidth
                  id="dni"
                  label="DNI/CUIT"
                  value={currentClient.dni}
                  onChange={onChangeValues}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  variant="outlined"
                  required
                  fullWidth
                  id="domicilio"
                  label="Domicilio"
                  name="domicilio"
                  value={currentClient.domicilio}
                  onChange={onChangeValues}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  variant="outlined"
                  required
                  fullWidth
                  id="barrio"
                  label="Barrio"
                  name="barrio"
                  value={currentClient.barrio}
                  onChange={onChangeValues}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  variant="outlined"
                  required
                  fullWidth
                  id="formato_comercial"
                  label="Formato comercial"
                  name="formato_comercial"
                  value={currentClient.formato_comercial}
                  onChange={onChangeValues}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  variant="outlined"
                  required
                  fullWidth
                  id="telefono"
                  label="Teléfono"
                  name="telefono"
                  value={currentClient.telefono}
                  onChange={onChangeValues}
                />
              </Grid>
              <Grid item xs={12}>
                <InputLabel>Día</InputLabel>
                <Select
                  onChange={onChangeDay}
                  value={currentClient.dia}
                  className="select__form"
                  fullWidth
                >
                  {dias.map((dia) => (
                    <MenuItem key={dia.value} value={dia.value}>
                      {dia.name}
                    </MenuItem>
                  ))}
                </Select>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  variant="outlined"
                  fullWidth
                  id="condicionIva"
                  label="Condición IVA"
                  name="condicionIva"
                  value={currentClient.condicionIva}
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
              onClick={updateClient}
            >
              Aceptar
            </Button>
          </div>
        </div>
      )}
    </Container>
  );
};

export default EditClient;
