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
import 'moment/locale/es'; // Importar locale español
import { getSmartService, generateSmartRoute } from "../../../utils/routeHelper";

// Configurar moment en español
moment.locale('es');

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
        const ComprasService = getSmartService('compras');
        ComprasService.getAll()
            .orderByChild("fecha")
            .on("value", this.onDataChange);
    }

    componentWillUnmount() {
        const ComprasService = getSmartService('compras');
        ComprasService.getAll().off("value", this.onDataChange);
    }

    onDataChange(items) {
        let compras = [];
        items.forEach((item) => {
            let data = item.val();
            let key = item.key;
            
            // Detectar si es formato nuevo (con array de productos) o formato antiguo
            if (data.productos && Array.isArray(data.productos)) {
                // Formato nuevo: múltiples productos
                compras.push({
                    key,
                    id: data.id,
                    fecha: data.fecha,
                    proveedor: data.proveedor,
                    factura: data.factura,
                    productos: data.productos,
                    total: data.total,
                    tipoCompra: 'multiple'
                });
            } else {
                // Formato antiguo: un solo producto (retrocompatibilidad)
                compras.push({
                    key,
                    id: data.id,
                    fecha: data.fecha,
                    proveedor: data.proveedor,
                    factura: data.factura,
                    productos: [{
                        productoId: data.productoId,
                        productoNombre: data.productoNombre,
                        precio: data.precio,
                        unidades: data.unidades,
                        descuentoFinanciero: data.descuentoFinanciero,
                        subtotal: data.total
                    }],
                    total: data.total,
                    tipoCompra: 'single'
                });
            }
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
            filtered = filtered.filter((compra) => {
                const searchInProducts = compra.productos.some(producto => 
                    producto.productoNombre && producto.productoNombre.toLowerCase().includes(searchTerm.toLowerCase())
                );
                
                return compra.proveedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       compra.factura.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       searchInProducts;
            });
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
        const ComprasService = getSmartService('compras');
        ComprasService.delete(key)
            .then(() => {
                // Actualizar el estado local removiendo la compra eliminada
                const updatedCompras = this.state.compras.filter(compra => compra.key !== key);
                const updatedComprasFilter = this.state.comprasFilter.filter(compra => compra.key !== key);
                
                this.setState({
                    compras: updatedCompras,
                    comprasFilter: updatedComprasFilter
                });
                
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
                label: month.format("MMMM YYYY").replace(/^\w/, c => c.toUpperCase()) // Capitalizar primera letra
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
                            href={generateSmartRoute("/compra")}
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
                                Resumen de {moment(selectedMonth).format("MMMM YYYY").replace(/^\w/, c => c.toUpperCase())}
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
                                    href={generateSmartRoute("/compra")}
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
                                        <TableCell><strong>Productos</strong></TableCell>
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
                                                    {compra.productos.length === 1 ? (
                                                        // Mostrar producto único
                                                        <Box>
                                                            <Typography variant="body2" fontWeight="medium">
                                                                {compra.productos[0].productoNombre}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                ${compra.productos[0].precio?.toFixed(2)} × {compra.productos[0].unidades} 
                                                                {compra.productos[0].descuentoFinanciero > 0 && ` (-${compra.productos[0].descuentoFinanciero}%)`}
                                                            </Typography>
                                                        </Box>
                                                    ) : (
                                                        // Mostrar múltiples productos
                                                        <Box>
                                                            <Typography variant="body2" fontWeight="medium" color="primary">
                                                                {compra.productos.length} productos
                                                            </Typography>
                                                            <Box sx={{ mt: 0.5 }}>
                                                                {compra.productos.map((producto, prodIndex) => (
                                                                    <Box key={prodIndex} sx={{ mb: 0.5 }}>
                                                                        <Typography variant="caption" display="block">
                                                                            • {producto.productoNombre}
                                                                        </Typography>
                                                                        <Typography variant="caption" color="text.secondary">
                                                                            ${producto.precio?.toFixed(2)} × {producto.unidades}
                                                                            {producto.descuentoFinanciero > 0 && ` (-${producto.descuentoFinanciero}%)`}
                                                                            {" = $" + (producto.subtotal?.toFixed(2) || "0.00")}
                                                                        </Typography>
                                                                    </Box>
                                                                ))}
                                                            </Box>
                                                        </Box>
                                                    )}
                                                </Box>
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
