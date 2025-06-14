import React, { useState, useEffect } from "react";
import TextField from '@mui/material/TextField';
import { Box, Checkbox, FormControl, FormControlLabel, FormGroup, Grid, Stack } from "@mui/material";


export default function DetailsInputs({ onChangeVehiculoDetail, index, detail }) {
    return (
        <Grid container spacing={2} columns={9} sx={{ margin: '1px 5px' }}>
            <Grid item xs={1}>
                <TextField
                    id="outlined-number"
                    size="small"
                    label="Marca"
                    className="text-form__serial"
                    value={detail?.marca}
                    onChange={(e) => onChangeVehiculoDetail(e, index)}
                    name="marca"
                    InputLabelProps={{
                        shrink: true,
                    }}
                    sx={{ flexBasis: '11%', margin: '2px 5px 2px 0' }}
                />
            </Grid>
            <Grid item xs={1}>
                <TextField
                    id="outlined-number"
                    size="small"
                    label="Modelo"
                    className="text-form__serial"
                    onChange={(e) => onChangeVehiculoDetail(e, index)}
                    value={detail?.modelo}
                    name="modelo"
                    InputLabelProps={{
                        shrink: true,
                    }}
                    sx={{ flexBasis: '11%', margin: '2px 5px 2px 0' }}
                />
            </Grid>
            <Grid item xs={1}>
                <TextField
                    id="outlined-number"
                    size="small"
                    label="Patente"
                    className="text-form__serial"
                    onChange={(e) => onChangeVehiculoDetail(e, index)}
                    value={detail?.patente}
                    name="patente"
                    InputLabelProps={{
                        shrink: true,
                    }}
                    sx={{ flexBasis: '11%', margin: '2px 5px 2px 0' }}
                />
            </Grid>
            <Grid item xs={1}>
                <TextField
                    id="outlined-number"
                    size="small"
                    label="Tipo Vehiculo"
                    className="text-form__serial"
                    onChange={(e) => onChangeVehiculoDetail(e, index)}
                    value={detail?.tipoVehiculo}
                    name="tipoVehiculo"
                    InputLabelProps={{
                        shrink: true,
                    }}
                    sx={{ flexBasis: '11%', margin: '2px 5px 2px 0' }}
                />
            </Grid>
            <Grid item xs={1}>
                <TextField
                    id="outlined-number"
                    size="small"
                    label="Nro Motor"
                    className="text-form__serial"
                    onChange={(e) => onChangeVehiculoDetail(e, index)}
                    name="nroMotor"
                    value={detail?.nroMotor}
                    InputLabelProps={{
                        shrink: true,
                    }}
                    sx={{ flexBasis: '11%', margin: '2px 5px 2px 0' }}
                />
            </Grid>
            <Grid item xs={1}>
                <TextField
                    id="outlined-number"
                    size="small"
                    label="Nro Chasis"
                    className="text-form__serial"
                    onChange={(e) => onChangeVehiculoDetail(e, index)}
                    name="nroChasis"
                    value={detail?.nroChasis}
                    InputLabelProps={{
                        shrink: true,
                    }}
                    sx={{ flexBasis: '11%', margin: '2px 5px 2px 0' }}
                />
            </Grid>
            <Grid item xs={1}>
                <TextField
                    id="outlined-number"
                    size="small"
                    label="Año"
                    type="number"
                    className="text-form__serial"
                    onChange={(e) => onChangeVehiculoDetail(e, index)}
                    value={detail?.año}
                    name="año"
                    InputLabelProps={{
                        shrink: true,
                    }}
                    sx={{ flexBasis: '11%', margin: '2px 5px 2px 0' }}
                />
            </Grid>
            <Grid item xs={1}>
                <TextField
                    id="outlined-number"
                    size="small"
                    label="Uso"
                    className="text-form__serial"
                    onChange={(e) => onChangeVehiculoDetail(e, index)}
                    name="uso"
                    value={detail?.uso}
                    InputLabelProps={{
                        shrink: true,
                    }}
                    sx={{ flexBasis: '11%', margin: '2px 5px 2px 0' }}
                />
            </Grid>
            <Grid item xs={1}>
                <FormControlLabel
                    control={
                        <Checkbox
                            name="gnc"
                            onChange={(e) => onChangeVehiculoDetail(e, index)}
                            sx={{ flexBasis: '11%', margin: '2px 5px 2px 0' }}
                        />
                    }
                    label="GNC" />
            </Grid>
        </Grid>






    );
}
