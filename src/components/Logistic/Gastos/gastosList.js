import React, { Component } from "react";
import { Toast, Modal } from "antd-mobile";
import {
    Box,
    TextField,
    Table,
    TableBody,
    TableContainer,
    TableCell,
    Button,
    Paper,
    TableHead,
    TableRow,
    Tooltip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Card,
    CardContent,
    Typography,
    IconButton,
    Chip
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import moment from "moment";
import * as XLSX from 'xlsx';
import 'moment/locale/es';
import { getSmartService, generateSmartRoute } from "../../../utils/routeHelper";

moment.locale('es');

const alert = Modal.alert;

const ars = (num) =>
    (parseFloat(num) || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });

export default class GastosList extends Component {
    constructor(props) {
        super(props);
        this.onDataChange = this.onDataChange.bind(this);
        this.filterByMonth = this.filterByMonth.bind(this);
        this.deleteGasto = this.deleteGasto.bind(this);
        this.searchGasto = this.searchGasto.bind(this);
        this.onChangeMonth = this.onChangeMonth.bind(this);
        this.descargarPlanilla = this.descargarPlanilla.bind(this);

        this.state = {
            gastos: [],
            gastosFilter: [],
            selectedMonth: moment().format("YYYY-MM"),
            searchTerm: "",
            loading: true
        };
    }

    componentDidMount() {
        const GastosService = getSmartService('gastos');
        GastosService.getAll()
            .orderByChild("fecha")
            .on("value", this.onDataChange);
    }

    componentWillUnmount() {
        const GastosService = getSmartService('gastos');
        GastosService.getAll().off("value", this.onDataChange);
    }

    onDataChange(items) {
        const gastos = [];
        items.forEach((item) => {
            const data = item.val();
            gastos.push({
                key: item.key,
                fecha: data.fecha,
                tipo: data.tipo,
                monto: data.monto,
                observaciones: data.observaciones || ""
            });
        });

        gastos.sort((a, b) => {
            return moment(b.fecha, "DD-MM-YYYY") - moment(a.fecha, "DD-MM-YYYY");
        });

        this.setState({ gastos, loading: false }, this.filterByMonth);
    }

    filterByMonth() {
        const { gastos, selectedMonth, searchTerm } = this.state;

        let filtered = gastos.filter((g) => {
            const month = moment(g.fecha, "DD-MM-YYYY").format("YYYY-MM");
            return month === selectedMonth;
        });

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter((g) =>
                g.tipo.toLowerCase().includes(term) ||
                g.observaciones.toLowerCase().includes(term)
            );
        }

        this.setState({ gastosFilter: filtered });
    }

    onChangeMonth(e) {
        this.setState({ selectedMonth: e.target.value }, this.filterByMonth);
    }

    searchGasto(e) {
        clearTimeout(this.timer);
        const value = e.target.value;
        this.timer = setTimeout(() => {
            this.setState({ searchTerm: value }, this.filterByMonth);
        }, 500);
    }

    deleteGasto(key) {
        const GastosService = getSmartService('gastos');
        GastosService.delete(key)
            .then(() => {
                this.setState({
                    gastos: this.state.gastos.filter(g => g.key !== key),
                    gastosFilter: this.state.gastosFilter.filter(g => g.key !== key)
                });
                Toast.success("Gasto eliminado correctamente!", 1);
            })
            .catch(() => {
                Toast.fail("Ocurrió un error al eliminar", 1);
            });
    }

    generateMonthOptions() {
        const months = [];
        for (let i = 0; i < 12; i++) {
            const month = moment().subtract(i, 'months');
            months.push({
                value: month.format("YYYY-MM"),
                label: month.format("MMMM YYYY").replace(/^\w/, c => c.toUpperCase())
            });
        }
        return months;
    }

    calcularTotales() {
        const { gastosFilter } = this.state;
        const totalMes = gastosFilter.reduce((sum, g) => sum + (parseFloat(g.monto) || 0), 0);
        return { totalMes, cantidadGastos: gastosFilter.length };
    }

    descargarPlanilla() {
        const { gastosFilter, gastos, selectedMonth } = this.state;

        const GastosService = getSmartService('gastos');
        const ComprasService = getSmartService('compras');

        // Fetch compras for the selected month
        ComprasService.getAll()
            .orderByChild("fecha")
            .once("value", (snapshot) => {
                const comprasMes = [];
                snapshot.forEach((item) => {
                    const data = item.val();
                    const compraMonth = moment(data.fecha, "DD-MM-YYYY").format("YYYY-MM");
                    if (compraMonth === selectedMonth) {
                        comprasMes.push({
                            fecha: data.fecha,
                            proveedor: data.proveedor || "",
                            factura: data.factura || "",
                            productos: data.productos || [],
                            total: parseFloat(data.total) || 0
                        });
                    }
                });

                comprasMes.sort((a, b) => moment(a.fecha, "DD-MM-YYYY") - moment(b.fecha, "DD-MM-YYYY"));

                const wb = XLSX.utils.book_new();
                const mes = moment(selectedMonth).format('MM-YYYY');

                // --- Sheet 1: Compras ---
                const comprasRows = [
                    ['FECHA', 'PROVEEDOR', 'FACTURA', 'COD ART', 'DESCRIPCION', 'PRECIO', 'UNIDADES', 'DTO FINANCIERO', 'COSTO MERCADERIA']
                ];
                let totalCompras = 0;
                comprasMes.forEach((compra) => {
                    (compra.productos || []).forEach((prod, idx) => {
                        const subtotal = parseFloat(prod.subtotal) || 0;
                        totalCompras += subtotal;
                        comprasRows.push([
                            idx === 0 ? compra.fecha : '',
                            idx === 0 ? compra.proveedor : '',
                            idx === 0 ? (compra.factura || '') : '',
                            prod.productoId || '',
                            prod.productoNombre || '',
                            ars(prod.precio),
                            prod.unidades || '',
                            prod.descuentoFinanciero > 0 ? `${prod.descuentoFinanciero} %` : '',
                            ars(subtotal)
                        ]);
                    });
                });
                comprasRows.push(['', '', '', '', '', '', '', 'TOTAL', ars(totalCompras)]);

                const wsCompras = XLSX.utils.aoa_to_sheet(comprasRows);
                wsCompras['!cols'] = [
                    { wch: 13 }, { wch: 20 }, { wch: 12 }, { wch: 10 },
                    { wch: 35 }, { wch: 16 }, { wch: 12 }, { wch: 16 }, { wch: 18 }
                ];
                XLSX.utils.book_append_sheet(wb, wsCompras, 'Compras');

                // --- Sheet 2: Gastos ---
                const gastosDelMes = gastos.filter(g =>
                    moment(g.fecha, "DD-MM-YYYY").format("YYYY-MM") === selectedMonth
                ).sort((a, b) => moment(a.fecha, "DD-MM-YYYY") - moment(b.fecha, "DD-MM-YYYY"));

                const gastosRows = [['FECHA', 'TIPO', 'MONTO', 'OBSERVACIONES']];
                let totalGastos = 0;
                gastosDelMes.forEach((g) => {
                    totalGastos += parseFloat(g.monto) || 0;
                    gastosRows.push([
                        moment(g.fecha, "DD-MM-YYYY").format("DD/MM/YYYY"),
                        g.tipo,
                        ars(g.monto),
                        g.observaciones || ''
                    ]);
                });
                gastosRows.push(['', 'TOTAL', ars(totalGastos), '']);

                const wsGastos = XLSX.utils.aoa_to_sheet(gastosRows);
                wsGastos['!cols'] = [{ wch: 13 }, { wch: 18 }, { wch: 16 }, { wch: 35 }];
                XLSX.utils.book_append_sheet(wb, wsGastos, 'Gastos');

                // --- Sheet 3: Resumen diario ---
                const daysInMonth = moment(selectedMonth, "YYYY-MM").daysInMonth();
                const resumenRows = [['FECHA', 'COMPRAS', 'GASTOS', 'DIFERENCIA']];

                let totalResCompras = 0;
                let totalResGastos = 0;

                for (let d = 1; d <= daysInMonth; d++) {
                    const fechaDia = moment(selectedMonth, "YYYY-MM").date(d).format("DD-MM-YYYY");
                    const comprasDelDia = comprasMes
                        .filter(c => c.fecha === fechaDia)
                        .reduce((sum, c) => sum + (parseFloat(c.total) || 0), 0);
                    const gastosDelDia = gastosDelMes
                        .filter(g => g.fecha === fechaDia)
                        .reduce((sum, g) => sum + (parseFloat(g.monto) || 0), 0);

                    totalResCompras += comprasDelDia;
                    totalResGastos += gastosDelDia;

                    resumenRows.push([
                        moment(fechaDia, "DD-MM-YYYY").format("DD/MM/YYYY"),
                        comprasDelDia > 0 ? ars(comprasDelDia) : '-',
                        gastosDelDia > 0 ? ars(gastosDelDia) : '-',
                        comprasDelDia > 0 || gastosDelDia > 0 ? ars(comprasDelDia - gastosDelDia) : '-'
                    ]);
                }
                resumenRows.push(['TOTAL', ars(totalResCompras), ars(totalResGastos), ars(totalResCompras - totalResGastos)]);

                const wsResumen = XLSX.utils.aoa_to_sheet(resumenRows);
                wsResumen['!cols'] = [{ wch: 13 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
                XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

                XLSX.writeFile(wb, `gastos_${mes}.xlsx`);
                Toast.success("Planilla descargada!", 1);
            });
    }

    render() {
        const { gastosFilter, selectedMonth, loading } = this.state;
        const { totalMes, cantidadGastos } = this.calcularTotales();
        const monthOptions = this.generateMonthOptions();

        if (loading) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Typography>Cargando gastos...</Typography>
                </Box>
            );
        }

        return (
            <div className="list row">
                <div className="col-md-12">
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h4" component="h1" gutterBottom>
                            Listado de Gastos
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<AddIcon />}
                                href={generateSmartRoute("/gasto")}
                            >
                                Nuevo Gasto
                            </Button>
                            <Button
                                variant="outlined"
                                color="success"
                                startIcon={<FileDownloadIcon />}
                                onClick={this.descargarPlanilla}
                            >
                                Descargar planilla
                            </Button>
                        </Box>
                    </Box>

                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Filtrar por mes</InputLabel>
                                    <Select
                                        value={selectedMonth}
                                        label="Filtrar por mes"
                                        onChange={this.onChangeMonth}
                                    >
                                        {monthOptions.map((month) => (
                                            <MenuItem key={month.value} value={month.value}>
                                                {month.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <TextField
                                    fullWidth
                                    label="Buscar"
                                    placeholder="Buscar por tipo u observaciones..."
                                    onChange={this.searchGasto}
                                    sx={{ marginTop: "0 !important" }}
                                    InputProps={{ endAdornment: <SearchIcon color="action" /> }}
                                />
                            </Box>
                        </CardContent>
                    </Card>

                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Resumen de {moment(selectedMonth).format("MMMM YYYY").replace(/^\w/, c => c.toUpperCase())}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                <Chip
                                    label={`${cantidadGastos} Gastos`}
                                    color="primary"
                                    variant="outlined"
                                />
                                <Chip
                                    label={`Total: ${ars(totalMes)}`}
                                    color="error"
                                    variant="filled"
                                />
                            </Box>
                        </CardContent>
                    </Card>

                    {gastosFilter.length === 0 ? (
                        <Card>
                            <CardContent sx={{ textAlign: 'center', py: 4 }}>
                                <Typography variant="h6" color="text.secondary">
                                    No hay gastos registrados para este mes
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Seleccioná otro mes o registrá un nuevo gasto
                                </Typography>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    href={generateSmartRoute("/gasto")}
                                >
                                    Registrar Primer Gasto
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <TableContainer component={Paper}>
                            <Table size="small" aria-label="gastos table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell><strong>Fecha</strong></TableCell>
                                        <TableCell><strong>Tipo</strong></TableCell>
                                        <TableCell align="right"><strong>Monto</strong></TableCell>
                                        <TableCell><strong>Observaciones</strong></TableCell>
                                        <TableCell align="center"><strong>Acciones</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {gastosFilter.map((gasto, index) => (
                                        <TableRow key={index} hover>
                                            <TableCell>
                                                {moment(gasto.fecha, "DD-MM-YYYY").format("DD/MM/YYYY")}
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={gasto.tipo} size="small" variant="outlined" />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" fontWeight="bold" color="error.main">
                                                    {ars(gasto.monto)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary">
                                                    {gasto.observaciones || "—"}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Tooltip title="Eliminar">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() =>
                                                            alert("Eliminar Gasto", "¿Estás seguro de eliminar este gasto?", [
                                                                { text: "Cancelar" },
                                                                { text: "Eliminar", onPress: () => this.deleteGasto(gasto.key) }
                                                            ])
                                                        }
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </div>
            </div>
        );
    }
}
