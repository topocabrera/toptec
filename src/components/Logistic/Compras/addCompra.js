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
    Divider
} from "@mui/material";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import moment from "moment";
import ComprasDataService from "../../../services/compras.service";
import ProductosDataService from "../../../services/productos.service";

export default class AddCompra extends Component {
    constructor(props) {
        super(props);
        this.onDataChange = this.onDataChange.bind(this);
        this.onChangeProveedor = this.onChangeProveedor.bind(this);
        this.onChangeFactura = this.onChangeFactura.bind(this);
        this.onChangeProducto = this.onChangeProducto.bind(this);
        this.onChangePrecio = this.onChangePrecio.bind(this);
        this.onChangeUnidades = this.onChangeUnidades.bind(this);
        this.onChangeDescuento = this.onChangeDescuento.bind(this);
        this.onChangeFecha = this.onChangeFecha.bind(this);
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
                tipoCompra: "producto", // "producto" o "gasto_general"
                productoId: "",
                productoNombre: "",
                descripcionGasto: "", // Para gastos generales
                precio: "",
                unidades: "",
                descuentoFinanciero: "",
                total: 0
            },
            submitted: false,
            lastId: 0
        };
    }

    componentDidMount() {
        // Obtener el último ID de compras
        ComprasDataService.getAll()
            .orderByChild("id")
            .limitToLast(1)
            .once("child_added", this.getLastId);

        // Obtener todos los productos para el desplegable
        ProductosDataService.getAll()
            .orderByChild("descripcion")
            .once("value", this.onDataChange);
    }

    componentWillUnmount() {
        ProductosDataService.getAll().off("value", this.onDataChange);
        ComprasDataService.getAll().off("child_added", this.getLastId);
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
                precioCosto: data.precioCosto
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
        }, this.calcularTotal);
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

    onChangeProducto(e) {
        const selectedProduct = this.state.productos.find(p => p.id === e.target.value);
        this.setState({
            compra: {
                ...this.state.compra,
                productoId: e.target.value,
                productoNombre: selectedProduct ? selectedProduct.descripcion : ""
            }
        }, this.calcularTotal);
    }

    onChangePrecio(e) {
        this.setState({
            compra: {
                ...this.state.compra,
                precio: e.target.value
            }
        }, this.calcularTotal);
    }

    onChangeUnidades(e) {
        this.setState({
            compra: {
                ...this.state.compra,
                unidades: e.target.value
            }
        }, this.calcularTotal);
    }

    onChangeDescuento(e) {
        this.setState({
            compra: {
                ...this.state.compra,
                descuentoFinanciero: e.target.value
            }
        }, this.calcularTotal);
    }

    calcularTotal() {
        const { precio, unidades, descuentoFinanciero } = this.state.compra;

        if (precio && unidades) {
            const precioFloat = parseFloat(precio) || 0;
            const unidadesFloat = parseFloat(unidades) || 0;
            const descuentoFloat = parseFloat(descuentoFinanciero) || 0;

            // Fórmula: precio * unidades * (1 - descuento/100)
            const total = precioFloat * unidadesFloat * (1 - descuentoFloat / 100);

            this.setState({
                compra: {
                    ...this.state.compra,
                    total: total
                }
            });
        } else {
            this.setState({
                compra: {
                    ...this.state.compra,
                    total: 0
                }
            });
        }
    }

    saveCompra() {
        const { compra } = this.state;

        // Validaciones
        if (!compra.proveedor) {
            Toast.fail("El proveedor es obligatorio", 2);
            return;
        }
        // if (!compra.factura) {
        //     Toast.fail("El número de factura es obligatorio", 2);
        //     return;
        // }
        // Validación condicional basada en el tipo de compra
        if (compra.tipoCompra === "producto" && !compra.productoId) {
            Toast.fail("Debe seleccionar un producto", 2);
            return;
        }
        if (compra.tipoCompra === "gasto_general" && !compra.descripcionGasto) {
            Toast.fail("Debe especificar la descripción del gasto", 2);
            return;
        }
        if (!compra.precio || parseFloat(compra.precio) <= 0) {
            Toast.fail("El precio debe ser mayor a 0", 2);
            return;
        }
        if (!compra.unidades || parseFloat(compra.unidades) <= 0) {
            Toast.fail("Las unidades deben ser mayor a 0", 2);
            return;
        }

        const compraData = {
            ...compra,
            fecha: compra.fecha,
            precio: parseFloat(compra.precio),
            unidades: parseFloat(compra.unidades),
            descuentoFinanciero: parseFloat(compra.descuentoFinanciero) || 0,
            total: compra.total
        };

        ComprasDataService.create(compraData)
            .then(() => {
                // Actualizar el stock del producto después de registrar la compra exitosamente
                if (compra?.productoId) {
                    this.updateProductStock();
                }

                this.setState({
                    submitted: true
                });
                Toast.success("Compra registrada correctamente!", 2);
            })
            .catch((e) => {
                console.log(e);
                Toast.fail("Error al guardar la compra", 2);
            });
    }

    updateProductStock() {
        const { compra } = this.state;

        // Obtener todos los productos de la base de datos para encontrar el producto específico
        ProductosDataService.getAll()
            .once("value", (snapshot) => {
                let productoKey = null;
                let productoActual = null;

                // Buscar el producto por ID
                snapshot.forEach((childSnapshot) => {
                    const producto = childSnapshot.val();
                    const key = childSnapshot.key;

                    if (producto.id === compra.productoId) {
                        productoKey = key;
                        productoActual = producto;
                    }
                });

                if (productoActual && productoKey) {
                    // Calcular el nuevo stock sumando las unidades compradas
                    const stockActual = parseFloat(productoActual.stock) || 0;
                    const unidadesCompradas = parseFloat(compra.unidades);
                    const nuevoStock = stockActual + unidadesCompradas;

                    // Actualizar el producto con el nuevo stock
                    const datosActualizacion = {
                        stock: nuevoStock
                    };

                    ProductosDataService.update(productoKey, datosActualizacion)
                        .then(() => {
                            console.log(`Stock actualizado para producto ${compra.productoNombre}: ${stockActual} -> ${nuevoStock}`);
                        })
                        .catch((error) => {
                            console.error(`Error actualizando stock del producto ${compra.productoNombre}:`, error);
                            Toast.fail(`Error actualizando stock del producto`, 2);
                        });
                } else {
                    console.warn(`Producto no encontrado en la base de datos: ID ${compra.productoId}`);
                    Toast.fail("Error: Producto no encontrado para actualizar stock", 2);
                }
            })
            .catch((error) => {
                console.error("Error obteniendo productos para actualizar stock:", error);
                Toast.fail("Error actualizando el stock del producto", 2);
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
                productoId: "",
                productoNombre: "",
                descripcionGasto: "",
                precio: "",
                unidades: "",
                descuentoFinanciero: "",
                total: 0
            },
            submitted: false
        });
    }

    render() {
        const { compra, productos, submitted } = this.state;

        if (submitted) {
            return (
                <div className="submit-form">
                    <Card sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="h5" color="success.main" gutterBottom>
                                ¡Compra registrada correctamente!
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 3 }}>
                                La compra ha sido guardada en el sistema.
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
                                    href="/logistic/compras-list"
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
                <Card sx={{ maxWidth: 800, mx: 'auto', mt: 2 }}>
                    <CardContent>
                        <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
                            Registrar Nueva Compra
                        </Typography>

                        <Box component="form" sx={{ '& .MuiTextField-root': { mb: 2 } }}>
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

                            {/* Producto */}
                            <FormControl required fullWidth sx={{ mb: 2 }}>
                                <InputLabel>Producto</InputLabel>
                                <Select
                                    value={compra.productoId}
                                    label="Producto"
                                    onChange={this.onChangeProducto}
                                >
                                    {productos.map((producto) => (
                                        <MenuItem key={producto.id} value={producto.id}>
                                            {producto.codigo} - {producto.descripcion} ({producto.marca})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
                                {/* Precio */}
                                <TextField
                                    required
                                    label="Precio Unitario"
                                    type="number"
                                    value={compra.precio}
                                    onChange={this.onChangePrecio}
                                    variant="outlined"
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                    }}
                                />

                                {/* Unidades */}
                                <TextField
                                    required
                                    label="Unidades"
                                    type="number"
                                    value={compra.unidades}
                                    onChange={this.onChangeUnidades}
                                    variant="outlined"
                                />
                            </Box>

                            {/* Descuento Financiero */}
                            <TextField
                                fullWidth
                                label="% Descuento Financiero"
                                type="number"
                                value={compra.descuentoFinanciero}
                                onChange={this.onChangeDescuento}
                                variant="outlined"
                                InputProps={{
                                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                }}
                                sx={{ mb: 3 }}
                            />

                            <Divider sx={{ my: 2 }} />

                            {/* Total Calculado */}
                            <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1, mb: 3 }}>
                                <Typography variant="h6" color="primary">
                                    Total: ${compra.total.toFixed(2)}
                                </Typography>
                            </Box>

                            {/* Botones */}
                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                                <Button
                                    variant="outlined"
                                    href="/logistic/compras-list"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={this.saveCompra}
                                    disabled={compra.total === 0}
                                >
                                    Guardar Compra
                                </Button>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            </div>
        );
    }
}
