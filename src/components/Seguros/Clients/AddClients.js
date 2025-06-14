import React, { useState, useEffect } from "react";
import ClientsDataService from "../../../services/clients.service";
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Box, Divider, FormControl, IconButton, OutlinedInput, Tooltip } from "@mui/material";
import DetailsInputs from "../Components/DetailsInputs";
import moment from "moment";

function AddClients() {
    const [state, setState] = useState({
        lastId: -1,
        nombre: "",
        apellido: "",
        domicilio: "",
        localidad: "",
        dni: "",
        email: "",
        fechaNac: null,
        telefonoCel: "",
        telefonoFijo: "",
        cbu: "",
        observaciones: "",
        // vehiculos: [{
        //     marca: '', modelo: '', patente: '', tipoVehiculo: '', nroMotor: '', nroChasis: '', año: '', gnc: false, uso: ''
        // }],
        submitted: false,
    });
    const [vehiculos, setVehiculos] = useState(
        [
            { marca: '', modelo: '', patente: '', tipoVehiculo: '', nroMotor: '', nroChasis: '', año: '', gnc: false, uso: '' }
        ]
    );
    const [keyPrice, setKeyPrice] = useState('');
    const detailsObject = { marca: '', modelo: '', patente: '', tipoVehiculo: '', nroMotor: '', nroChasis: '', año: '', gnc: false, uso: '' }

    useEffect(() => {
        ClientsDataService.getSeguros()
            .orderByChild("id")
            .limitToLast(1)
            .once("child_added", onDataChange);
    }, []);

    const onDataChange = (items) => {
        setState(prevState => ({ ...prevState, lastId: items.val().id || -1 }));
    }

    const onChangeValues = (e) => {
        const name = e.target.name;
        const value = e.target.value;
        setState(prevState => ({ ...prevState, [name]: value }));
    };

    const saveClient = () => {
        let data = {
            id: state.lastId + 1,
            nombre: state.nombre,
            apellido: state.apellido,
            domicilio: state.domicilio,
            localidad: state.localidad,
            dni: state.dni,
            email: state.email,
            fechaNac: moment(state.fechaNac).format("DD/MM/YYYY"),
            telefonoCel: state.telefonoCel,
            telefonoFijo: state.telefonoFijo,
            cbu: state.cbu,
            observaciones: state.observaciones,
            vehiculos
        };

        ClientsDataService.createClientSeguro(data)
            .then(() => {
                setState({
                    submitted: true,
                });
            })
            .catch((e) => {
                console.log(e);
            });

        // set(ref(database, 'clients_seguros/' + state.id), data)
        //     .then(() => {
        //         setState({
        //             submitted: true,
        //         });
        //     })
        //     .catch((e) => {
        //         console.log(e);
        //     });
    }

    const onChangeDate = (value) => {
        setState(prevState => ({ ...prevState, fechaNac: value }));
    };

    const onAddBtnClick = () => {
        const newArrayVehiculos = vehiculos
        newArrayVehiculos.push(detailsObject)
        const updatedVehiculo = JSON.parse(JSON.stringify(newArrayVehiculos));
        setVehiculos(updatedVehiculo);
    }

    const onChangeVehiculoDetail = (event, indexDetail) => {
        const name = event.target.name;
        const value = name === 'gnc' ? event.target.checked : event.target.value;
        const updatedVehiculo = JSON.parse(JSON.stringify(vehiculos));
        updatedVehiculo[indexDetail][name] = value;

        setVehiculos(updatedVehiculo);
    }

    return (
        <Container component="main" maxWidth="lg">
            {state.submitted ? (
                <div>
                    <Typography variant="h4">Cliente guardado correctamente!</Typography>
                    <Button href="/cseguros/list-clients">
                        Ir a listado
                    </Button>
                </div>
            ) : (
                <div className="form-container">
                    <Typography component="h1" variant="h5">
                        Nuevo Cliente
                    </Typography>
                    <div className="order-container">
                        <Grid container spacing={2} columns={3}>
                            <Grid item xs={1}>
                                <TextField
                                    name="nombre"
                                    variant="outlined"
                                    fullWidth
                                    id="nombre"
                                    value={state.nombre}
                                    label="Nombre y Apellido"
                                    onChange={onChangeValues}
                                />
                            </Grid>
                            {/* <Grid item xs={1}>
                                <TextField
                                    name="apellido"
                                    variant="outlined"
                                    fullWidth
                                    id="apellido"
                                    value={state.apellido}
                                    label="Apellido"
                                    onChange={onChangeValues}
                                />
                            </Grid> */}
                            <Grid item xs={1}>
                                <TextField
                                    name="dni"
                                    variant="outlined"
                                    fullWidth
                                    id="dni"
                                    value={state.dni}
                                    label="DNI"
                                    onChange={onChangeValues}
                                />
                            </Grid>
                            <Grid item xs={1}>
                                <TextField
                                    variant="outlined"
                                    required
                                    fullWidth
                                    id="domicilio"
                                    label="Domicilio"
                                    value={state.domicilio}
                                    name="domicilio"
                                    onChange={onChangeValues}
                                />
                            </Grid>
                            <Grid item xs={1}>
                                <TextField
                                    variant="outlined"
                                    fullWidth
                                    id="localidad"
                                    label="Localidad"
                                    value={state.localidad}
                                    name="localidad"
                                    onChange={onChangeValues}
                                />
                            </Grid>
                            <Grid item xs={1}>
                                <TextField
                                    variant="outlined"
                                    fullWidth
                                    id="email"
                                    label="Email"
                                    value={state.email}
                                    name="email"
                                    onChange={onChangeValues}
                                />
                            </Grid>
                            <Grid item xs={1}>
                                <TextField
                                    variant="outlined"
                                    required
                                    type="number"
                                    fullWidth
                                    id="telefonoCel"
                                    label="Teléfono Celular"
                                    name="telefonoCel"
                                    value={state.telefonoCel}
                                    onChange={onChangeValues}
                                />
                            </Grid>
                            {/* <Grid item xs={1}>
                                <TextField
                                    variant="outlined"
                                    fullWidth
                                    type="number"
                                    id="telefonoFijo"
                                    label="Teléfono Fijo"
                                    name="telefonoFijo"
                                    value={state.telefonoFijo}
                                    onChange={onChangeValues}
                                />
                            </Grid> */}
                            <Grid item xs={1}>
                                <LocalizationProvider dateAdapter={AdapterMoment} sx={{ maxWidth: '100%' }}>
                                    <DatePicker
                                         sx={{ maxWidth: '100%' }}
                                         width={370}
                                        className="date-selector"
                                        label="Fecha de nacimiento"
                                        inputFormat="DD/MM/YYYY"
                                        value={state.fechaNac}
                                        onChange={onChangeDate}
                                        renderInput={(params) => <TextField {...params} />}
                                    />
                                </LocalizationProvider>
                            </Grid>
                            <Grid item xs={1}>
                                <TextField
                                    variant="outlined"
                                    fullWidth
                                    type="number"
                                    id="cbu"
                                    label="CBU"
                                    name="cbu"
                                    value={state.cbu}
                                    onChange={onChangeValues}
                                />
                            </Grid>
                            <Grid item xs={1}>
                                <TextField
                                    variant="outlined"
                                    fullWidth
                                    id="observaciones"
                                    label="Observaciones"
                                    name="observaciones"
                                    value={state.observaciones}
                                    onChange={onChangeValues}
                                />
                            </Grid>
                            <Typography variant="body1" gutterBottom sx={{ flexBasis: '20%', margin: '30px 0 30px 13px' }}>
                                Detalles de vehículos
                            </Typography>
                            <Tooltip title="añadir otro vehículo">
                                <IconButton aria-label="add" onClick={onAddBtnClick}>
                                    <AddCircleOutlinedIcon />
                                </IconButton>
                            </Tooltip>
                            {/* <Divider orientation="vertical" variant="middle" flexItem sx={{ margin: '5px' }} /> */}
                            <Box sx={{ display: 'flex', flexDirection: 'initial', marginBottom: "11px" }} className="box-container">
                                <Grid container spacing={1}>
                                    {vehiculos.map((detail, indexDetail) => (
                                        <DetailsInputs
                                            index={indexDetail}
                                            detail={detail}
                                            onChangeVehiculoDetail={onChangeVehiculoDetail}
                                        />
                                    ))}
                                </Grid>
                            </Box>
                        </Grid>
                        <Button
                            type="button"
                            size="large"
                            variant="contained"
                            color="primary"
                            className="button__save"
                            onClick={saveClient}
                            sx={{ width: '300px' }}
                        >
                            Aceptar
                        </Button>
                    </div>
                </div>
            )}
        </Container>
    );
}

export default AddClients;
