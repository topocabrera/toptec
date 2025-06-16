import React, { useState, useEffect, useRef } from "react";
import { Toast } from "antd-mobile";
import { useParams } from "react-router-dom";
import PedidosDataService from "../../../services/pedidos.service";
import ClientsDataService from "../../../services/clients.service";
import { Modal } from "antd-mobile";
import SearchIcon from "@mui/icons-material/Search";
import { IconButton, Tooltip, Collapse, Box } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import moment from "moment";

const alert = Modal.alert;

const ClientPedidos = ({ match }) => {
    const [pedidos, setPedidos] = useState([]);
    const [pedidosFilter, setPedidosFilter] = useState([]);
    const [client, setClient] = useState({});
    const [searchTitle, setSearchTitle] = useState("");
    const [loading, setLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState(null);

    const { id: clientId } = useParams();
    const timerRef = useRef(null);

    const onDataChange = (items) => {
        let newPedidos = [];
        items.forEach((item) => {
            let data = item.val();
            console.log('items', data);
            let key = item.key;
            newPedidos.push({
                key,
                id: data.id,
                fecha: data.fecha,
                fechaEntrega: data.fechaEntrega,
                idCliente: data.idCliente,
                clienteName: data.clienteName,
                clienteDomicilio: data.clienteDomicilio,
                productos: data.productos,
                status: data.status,
                condPago: data.condPago || "",
                total: data.total,
            });
        });

        // Ordenar por fecha más reciente
        newPedidos.sort((a, b) => {
            const fechaA = moment(a.fecha, "DD-MM-YYYY");
            const fechaB = moment(b.fecha, "DD-MM-YYYY");
            return fechaB - fechaA;
        });

        setPedidos(newPedidos);
        setPedidosFilter(newPedidos);
    };

    const getClientData = () => {
        ClientsDataService.getAll()
            .orderByChild("id")
            .equalTo(parseInt(clientId, 10))
            .on("value", (items) => {
                let clientData = {};
                items.forEach((item) => {
                    let data = item.val();
                    clientData = {
                        id: data.id,
                        razonSocial: data.razon_social,
                        domicilio: data.domicilio,
                        dni: data.dni,
                        telefono: data.telefono,
                    };
                });
                setClient(clientData);
                setLoading(false);
            });
    };

    useEffect(() => {
        getClientData();
        PedidosDataService.getAll()
            .orderByChild("idCliente")
            .equalTo(parseInt(clientId, 10))
            .on("value", onDataChange);

        // Cleanup function
        return () => {
            PedidosDataService.getAll().off("value", onDataChange);
            ClientsDataService.getAll().off("value", getClientData);
        };
    }, [clientId]);

    const searchPedido = (e) => {
        clearTimeout(timerRef.current);
        const value = e.target.value;
        timerRef.current = setTimeout(() => {
            if (value) {
                const filter = pedidos.filter(
                    (pedido) =>
                        pedido.id.toString().includes(value) ||
                        (pedido.fecha && pedido.fecha.includes(value)) ||
                        (pedido.status && pedido.status.toLowerCase().includes(value.toLowerCase()))
                );
                setPedidosFilter(filter);
                setSearchTitle(value);
            } else {
                setPedidosFilter(pedidos);
                setSearchTitle("");
            }
        }, 500);
    };

    const refreshList = () => {
        setSearchTitle("");
        setPedidosFilter(pedidos);
    };

    const deletePedido = (key) => {
        PedidosDataService.delete(key)
            .then(() => {
                Toast.success("Pedido eliminado correctamente!", 1);
            })
            .catch((e) => {
                Toast.fail("Ocurrió un error", 1);
            });
    };

    const formatTotal = (total) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS'
        }).format(total || 0);
    };

    const toggleRowExpansion = (pedidoId) => {
        setExpandedRow(expandedRow === pedidoId ? null : pedidoId);
    };

    const ProductDetailRow = ({ pedido }) => {
        if (!pedido.productos || pedido.productos.length === 0) {
            return (
                <div className="p-3 text-center text-muted">
                    <em>No hay productos registrados para este pedido</em>
                </div>
            );
        }

        return (
            <Box sx={{ margin: 1 }}>
                <div className="table-responsive">
                    <table className="table table-sm table-bordered">
                        <thead className="table-light">
                            <tr>
                                <th>Código</th>
                                <th>Descripción</th>
                                <th>Marca</th>
                                <th className="text-end">Cantidad</th>
                                <th className="text-end">Precio Unit.</th>
                                <th className="text-end">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pedido.productos.map((producto, index) => (
                                <tr key={index}>
                                    <td>
                                        <code>{producto.codigo || '-'}</code>
                                    </td>
                                    <td>
                                        <strong>{producto.descripcion || 'Sin descripción'}</strong>
                                    </td>
                                    <td>
                                        <span className="badge badge-outline-secondary">
                                            {producto.marca || 'Sin marca'}
                                        </span>
                                    </td>
                                    <td className="text-end">
                                        <span className="badge badge-primary">
                                            {producto.cantidad || 0}
                                        </span>
                                    </td>
                                    <td className="text-end">
                                        {formatTotal(producto.precio || 0)}
                                    </td>
                                    <td className="text-end">
                                        <strong>
                                            {formatTotal((producto.cantidad || 0) * (producto.precio || 0))}
                                        </strong>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="table-light">
                            <tr>
                                <td colSpan="5" className="text-end">
                                    <strong>Total del Pedido:</strong>
                                </td>
                                <td className="text-end">
                                    <strong className="text-success">
                                        {formatTotal(pedido.total)}
                                    </strong>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </Box>
        );
    };

    return (
        <div className="list row">
            <div className="col-md-12">
                {/* Header con información del cliente */}
                <div className="client-header mb-4">
                    <div className="d-flex align-items-center mb-3">
                        <IconButton
                            href="/logistic/list-client"
                            className="me-2"
                            title="Volver al listado de clientes"
                        >
                            <ArrowBackIcon />
                        </IconButton>
                        <h3 className="mb-0">Pedidos de {client.razonSocial}</h3>
                    </div>
                    <div className="client-info bg-light p-3 rounded">
                        <div className="row">
                            <div className="col-md-3">
                                <strong>Cliente ID:</strong> {client.id}
                            </div>
                            <div className="col-md-3">
                                <strong>DNI/CUIT:</strong> {client.dni}
                            </div>
                            <div className="col-md-3">
                                <strong>Teléfono:</strong> {client.telefono}
                            </div>
                            <div className="col-md-3">
                                <strong>Dirección:</strong> {client.domicilio}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Botón nuevo pedido */}
                <div className="new-pedido mb-3">
                    <a
                        className="btn btn-primary"
                        href={`/logistic/pedido/${client.id}`}
                        role="button"
                    >
                        Nuevo Pedido
                    </a>
                </div>

                {/* Buscador */}
                <div className="col-md-6 mb-3" style={{ paddingLeft: '0px' }}>
                    <div className="input-group">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Buscar por ID, fecha o estado..."
                            onChange={searchPedido}
                            value={searchTitle}
                        />
                        <div className="input-group-append">
                            <button className="btn btn-outline-secondary" type="button">
                                <SearchIcon color="action" />
                            </button>
                        </div>
                    </div>
                </div>

                <h4>Historial de Pedidos ({pedidosFilter.length})</h4>

                {pedidosFilter.length === 0 ? (
                    <div className="no-pedidos text-center p-4">
                        <p>No hay pedidos registrados para este cliente.</p>
                        <a
                            className="btn btn-success"
                            href={`/logistic/pedido/${client.id}`}
                        >
                            Crear Primer Pedido
                        </a>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="table table-striped">
                            <thead className="thead-dark">
                                <tr>
                                    <th scope="col" style={{ width: '50px' }}>
                                        <Tooltip title="Expandir para ver productos">
                                            <span>Detalle</span>
                                        </Tooltip>
                                    </th>
                                    <th scope="col">ID Pedido</th>
                                    <th scope="col">Fecha</th>
                                    <th scope="col">Fecha Entrega</th>
                                    <th scope="col">Estado</th>
                                    <th scope="col">Condición Pago</th>
                                    <th scope="col">Total</th>
                                    {/* <th scope="col">Acciones</th> */}
                                </tr>
                            </thead>
                            <tbody>
                                {pedidosFilter.map((pedido, index) => {
                                    const fechaFormateada = pedido.fecha ? pedido.fecha : "-";
                                    const fechaEntregaFormateada = pedido.fechaEntrega ? pedido.fechaEntrega : "-";
                                    const isExpanded = expandedRow === pedido.id;

                                    return (
                                        <React.Fragment key={index}>
                                            <tr>
                                                <td>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => toggleRowExpansion(pedido.id)}
                                                        disabled={!pedido.productos || pedido.productos.length === 0}
                                                        title={pedido.productos && pedido.productos.length > 0 ?
                                                            'Ver detalle de productos' : 'Sin productos'}
                                                    >
                                                        {pedido.productos && pedido.productos.length > 0 ? (
                                                            isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />
                                                        ) : (
                                                            <span style={{ fontSize: '12px', color: '#ccc' }}>--</span>
                                                        )}
                                                    </IconButton>
                                                </td>
                                                <td>
                                                    <strong>#{pedido.id}</strong>
                                                </td>
                                                <td>{fechaFormateada}</td>
                                                <td>{fechaEntregaFormateada}</td>
                                                <td>
                                                    <span
                                                        className={`badge ${pedido.status === 'completado' ? 'badge-success' :
                                                            pedido.status === 'pendiente' ? 'badge-warning' :
                                                                pedido.status === 'cancelado' ? 'badge-danger' :
                                                                    'badge-secondary'
                                                            }`}
                                                    >
                                                        {pedido.status || 'Sin estado'}
                                                    </span>
                                                </td>
                                                <td>{pedido.condPago || '-'}</td>
                                                <td>
                                                    <strong>{formatTotal(pedido.total)}</strong>
                                                </td>
                                                {/* <td className="column-actions">
                                                    <Tooltip title="Ver Factura">
                                                        <IconButton
                                                            className="action__link"
                                                            href={`/logistic/factura/${pedido.id}`}
                                                            role="button"
                                                        >
                                                            <ReceiptIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Editar Pedido">
                                                        <IconButton
                                                            className="action__link"
                                                            href={`/logistic/edit-pedido/${pedido.id}`}
                                                            role="button"
                                                        >
                                                            <EditIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Eliminar Pedido">
                                                        <IconButton
                                                            type="button"
                                                            className="action__button"
                                                            onClick={() =>
                                                                alert("Eliminar Pedido", "¿Estás seguro de eliminar este pedido?", [
                                                                    { text: "Cancelar" },
                                                                    {
                                                                        text: "Eliminar",
                                                                        onPress: () => deletePedido(pedido.key),
                                                                    },
                                                                ])
                                                            }
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                </td> */}
                                            </tr>
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan="7" style={{ padding: 0, backgroundColor: '#f8f9fa' }}>
                                                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                                            <ProductDetailRow pedido={pedido} />
                                                        </Collapse>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientPedidos;
