import React, { Component } from "react";
import { Toast } from "antd-mobile";
import {
    TextField,
    Button,
    Box,
    Card,
    CardContent,
    Typography,
    InputAdornment,
    Autocomplete,
    CircularProgress,
    FormControlLabel,
    Checkbox,
    Select,
    MenuItem,
    FormControl,
    InputLabel
} from "@mui/material";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import moment from "moment";
import 'moment/locale/es';
import { getSmartService, generateSmartRoute } from "../../../utils/routeHelper";

moment.locale('es');

const TIPOS_GASTO = [
    'NAFTA', 'PEAJE', 'A&B', 'MATERIAL OFI', 'LIMPIEZA', 'VARIOS',
    'MANTENIM.', 'ALQUILER', 'LUZ', 'AGUA', 'INTERNET', 'CONTADOR',
    'IMPUESTOS', 'VEP', 'ING BRUT', 'SEGUROS', 'COMISIONES', 'VEHICULOS', 'MOBILIARIO'
];

export default class AddGasto extends Component {
    constructor(props) {
        super(props);
        this.state = {
            gasto: {
                fecha: moment().format("DD-MM-YYYY"),
                tipo: "",
                monto: "",
                observaciones: ""
            },
            pagarConBanco: false,
            cuentasBancarias: [],
            selectedCuentaId: "",
            submitted: false,
            loading: false
        };
    }

    componentDidMount() {
        const CuentasBancoService = getSmartService('cuentasBanco');
        if (CuentasBancoService) {
            CuentasBancoService.getAll().once("value", (snapshot) => {
                const list = [];
                snapshot.forEach((item) => {
                    list.push({ key: item.key, ...item.val() });
                });
                this.setState({
                    cuentasBancarias: list,
                    selectedCuentaId: list.length > 0 ? list[0].key : "",
                    pagarConBanco: list.length > 0 ? true : false
                });
            });
        }
    }

    onChangePagarConBanco = (e) => {
        this.setState({ pagarConBanco: e.target.checked });
    };

    onChangeFecha = (momentValue) => {
        this.setState({
            gasto: { ...this.state.gasto, fecha: momentValue.format("DD-MM-YYYY") }
        });
    };

    onChangeTipo = (_, newValue) => {
        this.setState({
            gasto: { ...this.state.gasto, tipo: newValue || "" }
        });
    };

    onChangeMonto = (e) => {
        this.setState({
            gasto: { ...this.state.gasto, monto: e.target.value }
        });
    };

    onChangeObservaciones = (e) => {
        this.setState({
            gasto: { ...this.state.gasto, observaciones: e.target.value }
        });
    };

    saveGasto = () => {
        const { gasto, pagarConBanco, selectedCuentaId, cuentasBancarias } = this.state;

        if (!gasto.tipo) {
            Toast.fail("El tipo de gasto es obligatorio", 2);
            return;
        }
        if (!gasto.monto || parseFloat(gasto.monto) <= 0) {
            Toast.fail("El monto debe ser mayor a 0", 2);
            return;
        }

        const gastoData = {
            fecha: gasto.fecha,
            tipo: gasto.tipo,
            monto: parseFloat(gasto.monto),
            observaciones: gasto.observaciones || ""
        };

        this.setState({ loading: true });
        const GastosService = getSmartService('gastos');
        GastosService.create(gastoData)
            .then((res) => {
                const gastoKey = res.key;
                if (pagarConBanco && selectedCuentaId) {
                    const LibroBancoService = getSmartService('libroBanco');
                    const CuentasBancoService = getSmartService('cuentasBanco');
                    const cuentaSeleccionada = cuentasBancarias.find(c => c.key === selectedCuentaId);
                    if (cuentaSeleccionada) {
                        const nuevoSaldo = (cuentaSeleccionada.saldoActual || 0) - gastoData.monto;
                        const movimiento = {
                            fecha: gastoData.fecha,
                            concepto: `Gasto: ${gastoData.tipo}${gastoData.observaciones ? ' - ' + gastoData.observaciones : ''}`,
                            monto: -gastoData.monto,
                            estado: "vinculado",
                            tipoVinculo: "gasto",
                            idVinculo: gastoKey,
                            cuentaId: selectedCuentaId,
                            fechaCreacion: new Date().toISOString()
                        };
                        return Promise.all([
                            LibroBancoService.create(movimiento),
                            CuentasBancoService.update(selectedCuentaId, { saldoActual: nuevoSaldo })
                        ]);
                    }
                }
            })
            .then(() => {
                this.setState({ submitted: true });
                Toast.success("Gasto registrado correctamente!", 2);
            })
            .catch((e) => {
                console.error("Error al registrar gasto:", e);
                Toast.fail("Error al guardar el gasto", 2);
            })
            .finally(() => {
                this.setState({ loading: false });
            });
    };

    newGasto = () => {
        this.setState({
            gasto: {
                fecha: moment().format("DD-MM-YYYY"),
                tipo: "",
                monto: "",
                observaciones: ""
            },
            pagarConBanco: this.state.bankConfig ? true : false,
            submitted: false
        });
    };

    render() {
        const { gasto, submitted, loading } = this.state;

        if (submitted) {
            return (
                <div className="submit-form">
                    <Card sx={{ maxWidth: 500, mx: 'auto', mt: 4 }}>
                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="h5" color="success.main" gutterBottom>
                                ¡Gasto registrado correctamente!
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mt: 2 }}>
                                <Button variant="contained" onClick={this.newGasto}>
                                    Agregar Otro Gasto
                                </Button>
                                <Button variant="outlined" href={generateSmartRoute("/gastos-list")}>
                                    Ver Listado
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return (
            <div className="submit-form">
                <Card sx={{ maxWidth: 600, mx: 'auto', mt: 2 }}>
                    <CardContent>
                        <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
                            Registrar Gasto
                        </Typography>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <LocalizationProvider dateAdapter={AdapterMoment}>
                                <DatePicker
                                    label="Fecha"
                                    value={moment(gasto.fecha, "DD-MM-YYYY")}
                                    onChange={this.onChangeFecha}
                                    inputFormat="DD-MM-YYYY"
                                    renderInput={(params) => <TextField {...params} fullWidth />}
                                />
                            </LocalizationProvider>

                            <Autocomplete
                                options={TIPOS_GASTO}
                                value={gasto.tipo || null}
                                onChange={this.onChangeTipo}
                                renderInput={(params) => (
                                    <TextField {...params} label="Tipo de Gasto" required />
                                )}
                                noOptionsText="No encontrado"
                            />

                            <TextField
                                required
                                fullWidth
                                label="Monto"
                                type="number"
                                value={gasto.monto}
                                onChange={this.onChangeMonto}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                                }}
                            />

                            <TextField
                                fullWidth
                                label="Observaciones"
                                multiline
                                rows={3}
                                value={gasto.observaciones}
                                onChange={this.onChangeObservaciones}
                            />

                             {this.state.cuentasBancarias.length > 0 && (
                                <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
                                    <InputLabel id="select-cuenta-pago-label">Pagar con Cuenta Bancaria</InputLabel>
                                    <Select
                                        labelId="select-cuenta-pago-label"
                                        value={this.state.selectedCuentaId}
                                        onChange={(e) => {
                                            this.setState({
                                                selectedCuentaId: e.target.value,
                                                pagarConBanco: e.target.value !== ""
                                            });
                                        }}
                                        label="Pagar con Cuenta Bancaria"
                                    >
                                        <MenuItem value="">-- No pagar con Banco (Solo registrar Gasto) --</MenuItem>
                                        {this.state.cuentasBancarias.map((c) => (
                                            <MenuItem key={c.key} value={c.key}>
                                                {c.bancoNombre} ({c.nroCuenta || "Sin número"}) - Saldo: ${c.saldoActual?.toFixed(2)}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}

                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 1 }}>
                                <Button variant="outlined" href={generateSmartRoute("/gastos-list")}>
                                    Cancelar
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={this.saveGasto}
                                    disabled={loading}
                                    startIcon={loading && <CircularProgress size={20} />}
                                >
                                    {loading ? "Guardando..." : "Guardar Gasto"}
                                </Button>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            </div>
        );
    }
}
