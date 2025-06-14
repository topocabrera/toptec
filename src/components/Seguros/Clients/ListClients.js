import React, { useState, useEffect } from "react";
import ClientsDataService from "../../../services/clients.service";
import Container from '@mui/material/Container';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MuiAlert from '@mui/material/Alert';
import { StyledTableCell, StyledTableRow } from '../../../utils/styled'
import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Snackbar, TableCell, Tooltip, Typography } from "@mui/material";
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListItem from '@mui/material/ListItem';
import Collapse from '@mui/material/Collapse';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

function ListClients() {
    const [clients, setClients] = useState([])
    const [clientFilter, setclientFilter] = useState([])
    const [searchTitle, setSearchTitle] = useState('')
    const [openModal, setOpenModal] = useState(false);
    const [openDeleteModal, setOpenDeleteModal] = useState(false);
    const [ordenToDelete, setOrdenToDelete] = useState(-1);
    const [snackbarInfo, setSnackbarInfo] = useState({ text: '', type: '', open: false });
    const [spinnerDelete, setSpinnerDelete] = useState(false);
    const [openVehiculos, setOpenVehiculos] = useState(false);
    const [detailsOrder, setDetailsOrder] = useState([]);

    useEffect(() => {
        ClientsDataService.getSeguros()
            .orderByChild('id')
            .on('value', onDataChange);
    }, []);

    const onDataChange = (items) => {
        const members = [];
        items.forEach((item) => {
            let key = item.key;
            let data = item.val();

            members.push({
                key,
                id: data.id,
                nombre: data.nombre,
                telefono: data.telefono,
                dni: data.dni,
                apellido: data.apellido,
                domicilio: data.domicilio,
                localidad: data.localidad,
                email: data.email,
                fechaNac: data.fechaNac,
                telefonoCel: data.telefonoCel,
                telefonoFijo: data.telefonoFijo,
                cbu: data.cbu,
                vehiculos: data.vehiculos,
                observaciones: data.observaciones
            });
        });

        setClients(members);
    }

    const handleClose = () => {
        setOpenDeleteModal(false);
        setOpenModal(false);
        setOrdenToDelete(-1)
    };

    const handleCloseSanckbar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        setSnackbarInfo({ text: '', type: 'info', open: false });
    };

    const deleteOrden = () => {
        //     remove(ref(database, 'proyectos/' + ordenToDelete))
        //         .then(() => {
        //             setSnackbarInfo({ text: 'Eliminado correctamente!', type: 'success', open: true })
        //             setOpenDeleteModal(false);
        //             setTimeout(() => {
        //                 window.location.reload();
        //               }, 2500);
        //         })
        //         .catch((error) => {
        //             setOpenDeleteModal(false)
        //             setSnackbarInfo({ text: 'Ocurrió un error', type: 'error', open: true })
        //         });
    }

    const handleDetails = (id) => {
        const filterInfo = clients.filter(orden => parseInt(orden.id, 10) === parseInt(id, 10))
        setDetailsOrder(filterInfo[0]);
        setOpenModal(true);
    }

    const searchByTitle = (e) => {
        const value = e.target.value;
        setTimeout(() => {
            if (value) {
                clients.forEach((a) => a.domicilio.toLowerCase());
                const filter = clients.filter(
                    (client) =>
                        client?.nombre.toLowerCase().match(value.toLowerCase()) ||
                        client?.dni?.toString()?.toLowerCase().match(value?.toString()?.toLowerCase()) ||
                        client?.domicilio.toLowerCase().match(value.toLowerCase())
                );
                setSearchTitle(value);
                setclientFilter(filter);
            } else {
                setSearchTitle('');
            }
        }, 500);
    }


    const displayTable = searchTitle !== "" ? clientFilter : clients;

    return (
        <Container component="main" maxWidth="xl">
            <Typography variant="h5" sx={{ textAlign: 'center', marginBottom: '20px' }}>Listado de clientes</Typography>
            <div className="col-md-6 list-clients">
                <div className="new-reservation">
                    <Button variant="contained" className="btn btn-primary" href="/cseguros/create">
                        Nuevo cliente
                    </Button>
                </div>
                <div className="col-md-8 search-container">
                    <div className="input-group mb-3">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Buscar"
                            onChange={searchByTitle}
                        />
                        <div className="input-group-append">
                            <button className="btn btn-outline-secondary" type="button">
                                <SearchIcon color="action" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <TableContainer>
                <Table aria-label="simple table">
                    <TableHead>
                        <TableRow>
                            <StyledTableCell>Id</StyledTableCell>
                            <StyledTableCell>Nombre y Apellido</StyledTableCell>
                            <StyledTableCell>DNI</StyledTableCell>
                            <StyledTableCell>Domicilio</StyledTableCell>
                            <StyledTableCell>Localidad</StyledTableCell>
                            <StyledTableCell>Email</StyledTableCell>
                            <StyledTableCell>Telefono</StyledTableCell>
                            <StyledTableCell>Fecha nacimiento</StyledTableCell>
                            <StyledTableCell>Acciones</StyledTableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {clients?.length > 0 ? (
                            displayTable.map((client, index) => (
                                <StyledTableRow key={index}>
                                    <StyledTableCell>{client.id}</StyledTableCell>
                                    <StyledTableCell>{client.nombre}</StyledTableCell>
                                    <StyledTableCell>{client.dni}</StyledTableCell>
                                    <StyledTableCell>{client.domicilio}</StyledTableCell>
                                    <StyledTableCell>{client.localidad}</StyledTableCell>
                                    <StyledTableCell>{client.email}</StyledTableCell>
                                    <StyledTableCell>{client.telefonoCel}</StyledTableCell>
                                    <StyledTableCell>{client.fechaNac}</StyledTableCell>

                                    <StyledTableCell className="column-actions" sx={{ display: 'inline-flex' }}>
                                        <Tooltip title="Ver detalles">
                                            <IconButton
                                                aria-label="see-more"
                                                className="action__link"
                                                onClick={(event) => {
                                                    event.preventDefault();
                                                    handleDetails(client.id);
                                                }}
                                                role="button"
                                            >
                                                <VisibilityIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <IconButton
                                            aria-label="delete"
                                            className="action__link"
                                            href={`/cseguros/client/${client.id}`}
                                            role="button"
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton
                                            aria-label="delete"
                                            type="button"
                                            className="action__button"
                                            onClick={() => {
                                                setOpenDeleteModal(true);
                                                setOrdenToDelete(client.id)
                                            }}
                                        >
                                            <DeleteIcon sx={{ color: 'red' }} />
                                        </IconButton>
                                    </StyledTableCell>
                                </StyledTableRow>
                            ))
                        ) : (
                            <StyledTableRow>
                                <StyledTableCell colSpan={9} align="center">
                                    <CircularProgress />
                                </StyledTableCell>
                            </StyledTableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <Dialog
                open={openDeleteModal}
                onClose={handleClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    {"Desea eliminar este cliente?"}
                </DialogTitle>
                <DialogContent>
                    {spinnerDelete ? (
                        <CircularProgress />
                    ) : (
                        <DialogContentText id="alert-dialog-description">
                            Los cambios serán permanentes.
                        </DialogContentText>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cerrar</Button>
                    <Button onClick={deleteOrden} autoFocus>
                        Aceptar
                    </Button>
                </DialogActions>
            </Dialog>
            <Dialog open={openModal} onClose={handleClose} maxWidth="xl" >
                <DialogTitle>Detalles</DialogTitle>
                <DialogContent sx={{ minWidth: '746px' }}>
                    <List
                        sx={{ width: '100%', bgcolor: 'background.paper' }}
                        component="nav"
                    >
                        <ListItemButton onClick={() => setOpenVehiculos(!openVehiculos)}>
                            <ListItemText primary="Vehículos" />
                            {openVehiculos ? <ExpandLess /> : <ExpandMore />}
                        </ListItemButton>
                        <Collapse in={openVehiculos} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding>
                                {detailsOrder && detailsOrder?.vehiculos?.map(vehiculo => (
                                    <ListItem sx={{ pl: 4 }}>
                                        <TableContainer>
                                            <Table sx={{ minWidth: 650 }} aria-label="simple table">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>Marca</TableCell>
                                                        <TableCell align="right">Modelo</TableCell>
                                                        <TableCell align="right">Año</TableCell>
                                                        <TableCell align="right">Patente</TableCell>
                                                        <TableCell align="right">Nro Chasis</TableCell>
                                                        <TableCell align="right">Nro Motor</TableCell>
                                                        <TableCell align="right">Uso</TableCell>
                                                        <TableCell align="right">GNC</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                        <TableCell align="right">{vehiculo?.marca}</TableCell>
                                                        <TableCell align="right">{vehiculo?.modelo}</TableCell>
                                                        <TableCell align="right">{vehiculo?.año}</TableCell>
                                                        <TableCell align="right">{vehiculo?.patente}</TableCell>
                                                        <TableCell align="right">{vehiculo?.nroChasis}</TableCell>
                                                        <TableCell align="right">{vehiculo?.nroMotor}</TableCell>
                                                        <TableCell align="right">{vehiculo?.uso}</TableCell>
                                                        <TableCell align="right">{vehiculo?.gnc === true ? 'SI' : 'NO'}</TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </ListItem>
                                )
                                )}
                            </List>
                        </Collapse>
                    </List>
                    <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                        <ListItem alignItems="flex-start">
                            <ListItemText
                                primary="CBU"
                                secondary={detailsOrder?.cbu}
                            />
                        </ListItem>
                    </List>
                    <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                        <ListItem alignItems="flex-start">
                            <ListItemText
                                primary="Observaciones"
                                secondary={detailsOrder?.observaciones}
                            />
                        </ListItem>
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cerrar</Button>
                </DialogActions>
            </Dialog>
            <Snackbar open={snackbarInfo.open} autoHideDuration={2000} onClose={handleCloseSanckbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={handleCloseSanckbar} severity={snackbarInfo.type} sx={{ width: '100%' }}>
                    {snackbarInfo.text}
                </Alert>
            </Snackbar>
        </Container>
    );
}

export default ListClients;
