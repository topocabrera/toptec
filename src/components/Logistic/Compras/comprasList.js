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
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import moment from "moment";
import ComprasDataService from "../../../services/compras.service";

const alert = Modal.alert;

export default class ComprasList extends Component {
    constructor(props) {
        super(props);
        this.onDataChange = this.onDataChange.bind(this);
        this.filterByMonth = this.filterByMonth.bind(this);
        this.deleteCompra = this.deleteCompra.bind(this);
        this.searchCompra = this.searchCompra.bind(this);
        this.onChangeMonth = this.onChangeMonth.bind(this);

        this.state = {
            compras: [],
            comprasFilter: [],
            selectedMonth: moment().format("YYYY-MM"),
            searchTerm: "",
            loading: true
        };
    }

    componentDidMount() {
        ComprasDataService.getAll()
            .orderByChild("fecha")
            .on("value", this.onDataChange);
    }

    componentWillUnmount() {
        ComprasDataService.getAll().off("value", this.onDataChange);
    }

    onDataChange(items) {
        let compras = [];
        items.forEach((item) => {
            let data = item.val();
            let key = item.key;
            compras.push({
                key,
                id: data.id,
                fecha: data.fecha,
                proveedor: data.proveedor,
                factura: data.factura,
                productoId: data.productoId,
                productoNombre: data.productoNombre,
                precio: data.precio,
                unidades: data.unidades,
                descuentoFinanciero: data.descuentoFinanciero,
                total: data.total
            });
        });

        // Ordenar por fecha más reciente
        compras.sort((a, b) => {
            const fechaA = moment(a.fecha, "DD-MM-YYYY");
            const fechaB = moment(b.fecha, "DD-MM-YYYY");
            return fechaB - fechaA;
        });

        this.setState({ compras, loading: false });
        this.filterByMonth();
    }

    filterByMonth() {
        const { compras, selectedMonth, searchTerm } = this.state;

        let filtered = compras.filter((compra) => {
            const compraDate = moment(compra.fecha, "DD-MM-YYYY");
            const compraMonth = compraDate.format("YYYY-MM");
            return compraMonth === selectedMonth;
        });

        // Aplicar filtro de búsqueda si existe
        if (searchTerm) {
            filtered = filtered.filter((compra) =>
                compra.proveedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                compra.factura.toLowerCase().includes(searchTerm.toLowerCase()) ||
                compra.productoNombre.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        this.setState({ comprasFilter: filtered });
    }

    onChangeMonth(e) {
        this.setState({ selectedMonth: e.target.value }, this.filterByMonth);
    }

    searchCompra(e) {
        clearTimeout(this.timer);
        const value = e.target.value;
        this.timer = setTimeout(() => {
            this.setState({ searchTerm: value }, this.filterByMonth);
        }, 500);
    }

    deleteCompra(key) {
        ComprasDataService.delete(key)
            .then(() => {
                Toast.success("Compra eliminada correctamente!", 1);
            })
            .catch((e) => {
                Toast.fail("Ocurrió un error al eliminar", 1);
            });
    }

    // Generar opciones de meses (últimos 12 meses)
    generateMonthOptions() {
        const months = [];
        for (let i = 0; i < 12; i++) {
            const month = moment().subtract(i, 'months');
            months.push({
                value: month.format("YYYY-MM"),
                label: month.format("MMMM YYYY")
            });
        }
        return months;
    }

    // Calcular totales del mes
    calcularTotales() {
        const { comprasFilter } = this.state;
        const totalMes = comprasFilter.reduce((sum, compra) => sum + (compra.total || 0), 0);
        const cantidadCompras = comprasFilter.length;

        return { totalMes, cantidadCompras };
    }

    render() {
        const { comprasFilter, selectedMonth, loading } = this.state;
        const { totalMes, cantidadCompras } = this.calcularTotales();
        const monthOptions = this.generateMonthOptions();

        if (loading) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Typography>Cargando compras...</Typography>
                </Box>
            );
        }

        return (
            <div className="list row">
                <div className="col-md-12">
                    {/* Header */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h4" component="h1" gutterBottom>
                            Listado de Compras
                        </Typography>

                        {/* Botón Nueva Compra */}
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AddIcon />}
                            href="/logistic/compra"
                            sx={{ mb: 2 }}
                        >
                            Nueva Compra
                        </Button>
                    </Box>

                    {/* Filtros */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                                {/* Filtro por mes */}
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

                                {/* Buscador */}
                                <TextField
                                    fullWidth
                                    label="Buscar"
                                    placeholder="Buscar por proveedor, factura o producto..."
                                    onChange={this.searchCompra}
                                    InputProps={{
                                        endAdornment: <SearchIcon color="action" />
                                    }}
                                />
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Resumen del mes */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Resumen de {moment(selectedMonth).format("MMMM YYYY")}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                <Chip
                                    label={`${cantidadCompras} Compras`}
                                    color="primary"
                                    variant="outlined"
                                />
                                <Chip
                                    label={`Total: $${totalMes.toFixed(2)}`}
                                    color="success"
                                    variant="filled"
                                />
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Tabla de compras */}
                    {comprasFilter.length === 0 ? (
                        <Card>
                            <CardContent sx={{ textAlign: 'center', py: 4 }}>
                                <Typography variant="h6" color="text.secondary">
                                    No hay compras registradas para este mes
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Selecciona otro mes o registra una nueva compra
                                </Typography>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    href="/logistic/compra"
                                >
                                    Registrar Primera Compra
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <TableContainer component={Paper}>
                            <Table size="small" aria-label="compras table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell><strong>Fecha</strong></TableCell>
                                        <TableCell><strong>Proveedor</strong></TableCell>
                                        <TableCell><strong>Factura</strong></TableCell>
                                        <TableCell><strong>Producto</strong></TableCell>
                                        <TableCell align="right"><strong>Precio Unit.</strong></TableCell>
                                        <TableCell align="center"><strong>Unidades</strong></TableCell>
                                        <TableCell align="center"><strong>% Desc.</strong></TableCell>
                                        <TableCell align="right"><strong>Total</strong></TableCell>
                                        <TableCell align="center"><strong>Acciones</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {comprasFilter.map((compra, index) => (
                                        <TableRow key={index} hover>
                                            <TableCell>
                                                {moment(compra.fecha, "DD-MM-YYYY").format("DD/MM/YYYY")}
                                            </TableCell>
                                            <TableCell>{compra.proveedor}</TableCell>
                                            <TableCell>{compra.factura}</TableCell>
                                            <TableCell>
                                                <Box>
                                                    <Typography variant="body2" fontWeight="medium">
                                                        {compra.productoNombre}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="right">
                                                ${compra.precio?.toFixed(2)}
                                            </TableCell>
                                            <TableCell align="center">
                                                {compra.unidades}
                                            </TableCell>
                                            <TableCell align="center">
                                                {compra.descuentoFinanciero || 0}%
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" fontWeight="bold" color="success.main">
                                                    ${compra.total?.toFixed(2)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                    <Tooltip title="Eliminar">
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() =>
                                                                alert("Eliminar Compra", "¿Estás seguro de eliminar esta compra?", [
                                                                    { text: "Cancelar" },
                                                                    {
                                                                        text: "Eliminar",
                                                                        onPress: () => this.deleteCompra(compra.key),
                                                                    },
                                                                ])
                                                            }
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
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
