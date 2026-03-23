import React, { Component } from "react";
import { Toast } from "antd-mobile";
import {
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Card,
    CardContent,
    Typography,
    InputAdornment,
    Divider,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Autocomplete
} from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import moment from "moment";
import 'moment/locale/es'; // Importar locale español
import { getSmartService, generateSmartRoute } from "../../../utils/routeHelper";

// Configurar moment en español
moment.locale('es');

export default class AddCompra extends Component {
    constructor(props) {
        super(props);
        this.onDataChange = this.onDataChange.bind(this);
        this.onChangeProveedor = this.onChangeProveedor.bind(this);
        this.onChangeFactura = this.onChangeFactura.bind(this);
        this.onChangeFecha = this.onChangeFecha.bind(this);
        this.addProducto = this.addProducto.bind(this);
        this.removeProducto = this.removeProducto.bind(this);
        this.onChangeProductoItem = this.onChangeProductoItem.bind(this);
        this.calcularTotal = this.calcularTotal.bind(this);
        this.saveCompra = this.saveCompra.bind(this);
        this.updateProductStock = this.updateProductStock.bind(this);
        this.newCompra = this.newCompra.bind(this);
        this.getLastId = this.getLastId.bind(this);

        this.state = {
            productos: [],
            compra: {
                id: 0,
                fecha: moment(new Date().getTime()).format("DD-MM-YYYY"),
                proveedor: "",
                factura: "",
                tipoCompra: "producto",
                productos: [], // Array de productos
                total: 0
            },
            submitted: false,
            lastId: 0,
            loading: false
        };
    }

    componentDidMount() {
        // Obtener el último ID de compras
        const ComprasService = getSmartService('compras');
        ComprasService.getAll()
            .orderByChild("id")
            .limitToLast(1)
            .once("child_added", this.getLastId);

        // Obtener todos los productos para el desplegable
        const ProductosService = getSmartService('productos');
        ProductosService.getAll()
            .orderByChild("descripcion")
            .once("value", this.onDataChange);
    }

    componentWillUnmount() {
        const ProductosService = getSmartService('productos');
        const ComprasService = getSmartService('compras');
        ProductosService.getAll().off("value", this.onDataChange);
        ComprasService.getAll().off("child_added", this.getLastId);
    }

    getLastId(items) {
        this.setState({
            lastId: items.val().id || 0,
            compra: {
                ...this.state.compra,
                id: (items.val().id || 0) + 1
            }
        });
    }

    onDataChange(items) {
        const productos = [];
        items.forEach((item) => {
            let data = item.val();
            productos.push({
                id: data.id,
                codigo: data.codigo,
                descripcion: data.descripcion,
                marca: data.marca,
                precio: data.precio,
                precioCosto: data.precioCosto,
                stock: data.stock || 0
            });
        });
        this.setState({ productos });
    }

    onChangeFecha(e) {
        const dateFormat = e.format("DD-MM-YYYY");
        this.setState({
            compra: {
                ...this.state.compra,
                fecha: dateFormat
            }
        });
    }

    onChangeProveedor(e) {
        this.setState({
            compra: {
                ...this.state.compra,
                proveedor: e.target.value
            }
        });
    }

    onChangeFactura(e) {
        this.setState({
            compra: {
                ...this.state.compra,
                factura: e.target.value
            }
        });
    }

    addProducto() {
        const newProducto = {
            productoId: "",
            productoNombre: "",
            precio: "",
            unidades: "",
            descuentoFinanciero: 0,
            subtotal: 0
        };

        this.setState({
            compra: {
                ...this.state.compra,
                productos: [...this.state.compra.productos, newProducto]
            }
        });
    }

    removeProducto(index) {
        const productos = [...this.state.compra.productos];
        productos.splice(index, 1);
        this.setState({
            compra: {
                ...this.state.compra,
                productos: productos
            }
        }, this.calcularTotal);
    }

    onChangeProductoItem(index, field, value) {
        const productos = [...this.state.compra.productos];
        
        if (field === 'productoId') {
            const selectedProduct = this.state.productos.find(p => p.id === value);
            productos[index] = {
                ...productos[index],
                productoId: value,
                productoNombre: selectedProduct ? selectedProduct.descripcion : ""
            };
        } else {
            productos[index] = {
                ...productos[index],
                [field]: value
            };
        }

        // Calcular subtotal para este producto
        if (productos[index].precio && productos[index].unidades) {
            const precio = parseFloat(productos[index].precio) || 0;
            const unidades = parseFloat(productos[index].unidades) || 0;
            const descuento = parseFloat(productos[index].descuentoFinanciero) || 0;
            productos[index].subtotal = precio * unidades * (1 - descuento / 100);
        } else {
            productos[index].subtotal = 0;
        }

        this.setState({
            compra: {
                ...this.state.compra,
                productos: productos
            }
        }, this.calcularTotal);
    }

    calcularTotal() {
        const total = this.state.compra.productos.reduce((sum, producto) => {
            return sum + (producto.subtotal || 0);
        }, 0);

        this.setState({
            compra: {
                ...this.state.compra,
                total: total
            }
        });
    }

    saveCompra() {
        const { compra } = this.state;

        // Validaciones
        if (!compra.proveedor) {
            Toast.fail("El proveedor es obligatorio", 2);
            return;
        }
        if (!compra.factura) {
            Toast.fail("El número de factura es obligatorio", 2);
            return;
        }
        if (compra.productos.length === 0) {
            Toast.fail("Debe agregar al menos un producto", 2);
            return;
        }

        // Validar cada producto
        for (let i = 0; i < compra.productos.length; i++) {
            const producto = compra.productos[i];
            if (producto.productoId === null || producto.productoId === undefined || producto.productoId === '') {
                Toast.fail(`Debe seleccionar el producto en la fila ${i + 1}`, 2);
                return;
            }
            if (!producto.precio || parseFloat(producto.precio) <= 0) {
                Toast.fail(`El precio debe ser mayor a 0 en la fila ${i + 1}`, 2);
                return;
            }
            if (!producto.unidades || parseFloat(producto.unidades) <= 0) {
                Toast.fail(`Las unidades deben ser mayor a 0 en la fila ${i + 1}`, 2);
                return;
            }
        }

        const compraData = {
            ...compra,
            productos: compra.productos.map(p => ({
                ...p,
                precio: parseFloat(p.precio),
                unidades: parseFloat(p.unidades),
                descuentoFinanciero: parseFloat(p.descuentoFinanciero) || 0,
                subtotal: p.subtotal
            }))
        };

        this.setState({ loading: true });

        const ComprasService = getSmartService('compras');
        ComprasService.create(compraData)
            .then(() => {
                // Actualizar el stock de todos los productos
                this.updateProductStock();

                this.setState({
                    submitted: true
                });
                Toast.success("Compra registrada correctamente!", 2);
            })
            .catch((e) => {
                console.log(e);
                Toast.fail("Error al guardar la compra", 2);
            })
            .finally(() => {
                this.setState({ loading: false });
            });
    }

    updateProductStock() {
        const { compra } = this.state;

        // Obtener todos los productos de la base de datos
        const ProductosService = getSmartService('productos');
        ProductosService.getAll()
            .once("value", (snapshot) => {
                const productosDB = {};
                const productosKeys = {};

                // Crear un mapa de productos por ID
                snapshot.forEach((childSnapshot) => {
                    const producto = childSnapshot.val();
                    const key = childSnapshot.key;
                    productosDB[producto.id] = producto;
                    productosKeys[producto.id] = key;
                });

                // Actualizar el stock de cada producto en la compra
                const updatePromises = compra.productos.map(productoCompra => {
                    const productoActual = productosDB[productoCompra.productoId];
                    const productoKey = productosKeys[productoCompra.productoId];

                    if (productoActual && productoKey) {
                        const stockActual = parseFloat(productoActual.stock) || 0;
                        const unidadesCompradas = parseFloat(productoCompra.unidades);
                        const nuevoStock = stockActual + unidadesCompradas;

                        const ProductosUpdateService = getSmartService('productos');
                        return ProductosUpdateService.update(productoKey, {
                            stock: nuevoStock
                        }).then(() => {
                            console.log(`Stock actualizado para ${productoCompra.productoNombre}: ${stockActual} -> ${nuevoStock}`);
                        });
                    } else {
                        console.warn(`Producto no encontrado: ID ${productoCompra.productoId}`);
                        return Promise.resolve();
                    }
                });

                Promise.all(updatePromises)
                    .catch((error) => {
                        console.error("Error actualizando stocks:", error);
                        Toast.fail("Error actualizando algunos stocks de productos", 2);
                    });
            })
            .catch((error) => {
                console.error("Error obteniendo productos para actualizar stock:", error);
                Toast.fail("Error actualizando el stock de los productos", 2);
            });
    }

    newCompra() {
        this.setState({
            compra: {
                id: this.state.lastId + 1,
                fecha: moment(new Date().getTime()).format("DD-MM-YYYY"),
                proveedor: "",
                factura: "",
                tipoCompra: "producto",
                productos: [],
                total: 0
            },
            submitted: false
        });
    }

    render() {
        const { compra, productos, submitted, loading } = this.state;

        if (submitted) {
            return (
                <div className="submit-form">
                    <Card sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="h5" color="success.main" gutterBottom>
                                ¡Compra registrada correctamente!
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 3 }}>
                                La compra ha sido guardada en el sistema con {compra.productos.length} producto(s).
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={this.newCompra}
                                >
                                    Agregar Nueva Compra
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    href={generateSmartRoute("/compras-list")}
                                >
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
                <Card sx={{ maxWidth: 1200, mx: 'auto', mt: 2 }}>
                    <CardContent>
                        <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
                            Registrar Nueva Compra
                        </Typography>

                        <Box component="form" sx={{ '& .MuiTextField-root': { mb: 2 } }}>
                            {/* Información General */}
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                                    Información General
                                </Typography>
                                
                                {/* Fecha */}
                                <LocalizationProvider dateAdapter={AdapterMoment}>
                                    <DatePicker
                                        label="Fecha de Compra"
                                        value={moment(compra.fecha, "DD-MM-YYYY")}
                                        onChange={this.onChangeFecha}
                                        inputFormat="DD-MM-YYYY"
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                fullWidth
                                                margin="dense"
                                            />
                                        )}
                                    />
                                </LocalizationProvider>

                                {/* Proveedor */}
                                <TextField
                                    required
                                    fullWidth
                                    label="Proveedor"
                                    value={compra.proveedor}
                                    onChange={this.onChangeProveedor}
                                    variant="outlined"
                                />

                                {/* Factura */}
                                <TextField
                                    required
                                    fullWidth
                                    label="Número de Factura"
                                    value={compra.factura}
                                    onChange={this.onChangeFactura}
                                    variant="outlined"
                                />
                            </Box>

                            <Divider sx={{ my: 3 }} />

                            {/* Productos */}
                            <Box sx={{ mb: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6">
                                        Productos
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        startIcon={<Add />}
                                        onClick={this.addProducto}
                                        size="small"
                                        sx={{ minHeight: '32px', fontSize: '0.75rem' }}
                                    >
                                        Agregar Producto
                                    </Button>
                                </Box>

                                {compra.productos.length > 0 && (
                                    <TableContainer component={Paper} sx={{ mb: 2 }}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Producto</TableCell>
                                                    <TableCell>Precio Unit.</TableCell>
                                                    <TableCell>Unidades</TableCell>
                                                    <TableCell>% Desc.</TableCell>
                                                    <TableCell>Subtotal</TableCell>
                                                    <TableCell>Acciones</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {compra.productos.map((producto, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell sx={{ minWidth: 250 }}>
                                                            <Autocomplete
                                                                size="small"
                                                                options={productos}
                                                                value={productos.find(p => p.id === producto.productoId) || null}
                                                                onChange={(event, newValue) => {
                                                                    this.onChangeProductoItem(index, 'productoId', newValue ? newValue.id : '');
                                                                }}
                                                                getOptionLabel={(option) => `${option.codigo} - ${option.descripcion} (${option.marca})`}
                                                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                                                renderInput={(params) => (
                                                                    <TextField
                                                                        {...params}
                                                                        placeholder="Buscar producto..."
                                                                    />
                                                                )}
                                                                noOptionsText="No se encontraron productos"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <TextField
                                                                size="small"
                                                                type="number"
                                                                value={producto.precio}
                                                                onChange={(e) => this.onChangeProductoItem(index, 'precio', e.target.value)}
                                                                InputProps={{
                                                                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                                                }}
                                                                sx={{ width: 100 }}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <TextField
                                                                size="small"
                                                                type="number"
                                                                value={producto.unidades}
                                                                onChange={(e) => this.onChangeProductoItem(index, 'unidades', e.target.value)}
                                                                sx={{ width: 80 }}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <TextField
                                                                size="small"
                                                                type="number"
                                                                value={producto.descuentoFinanciero}
                                                                onChange={(e) => this.onChangeProductoItem(index, 'descuentoFinanciero', e.target.value)}
                                                                InputProps={{
                                                                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                                                }}
                                                                sx={{ width: 80 }}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" fontWeight="bold">
                                                                ${(producto.subtotal || 0).toFixed(2)}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <IconButton
                                                                color="error"
                                                                onClick={() => this.removeProducto(index)}
                                                            >
                                                                <Delete />
                                                            </IconButton>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}

                                {compra.productos.length === 0 && (
                                    <Box sx={{ textAlign: 'center', py: 4, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            No hay productos agregados. Haz clic en "Agregar Producto" para comenzar.
                                        </Typography>
                                    </Box>
                                )}
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            {/* Total */}
                            <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1, mb: 3 }}>
                                <Typography variant="h6" color="primary">
                                    Total de la Compra: ${compra.total.toFixed(2)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {compra.productos.length} producto(s) agregado(s)
                                </Typography>
                            </Box>

                            {/* Botones */}
                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                                <Button
                                    variant="outlined"
                                    href={generateSmartRoute("/compras-list")}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={this.saveCompra}
                                    disabled={compra.productos.length === 0 || loading}
                                    startIcon={loading && <CircularProgress size={20} />}
                                >
                                    {loading ? "Guardando..." : "Guardar Compra"}
                                </Button>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            </div>
        );
    }
}
