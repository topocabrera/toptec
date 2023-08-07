import React, { useState, useEffect } from "react";
import { Toast } from "antd-mobile";
import ClientsDataService from "../../../services/clients.service";
import { Modal } from "antd-mobile";
import SearchIcon from "@material-ui/icons/Search";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Button, Typography, Container, TableBody, TableContainer, Table, TableHead, TableRow, IconButton } from "@mui/material";
import { StyledTableCell, StyledTableRow } from '../../../utils/styled'

const alert = Modal.alert;

function ListClient() {
  const [state, setState] = useState({
    clients: [],
    currentTutorial: null,
    currentIndex: -1,
    nombre: "",
    domicilio: "",
    dni: 0,
    clientFilter: [],
    searchTitle: "",
  });


  useEffect(() => {
    ClientsDataService.getAll()
      .orderByChild("id")
      .on("value", onDataChange);
  }, []);

  const onDataChange = (items) => {
    let clients = [];
    items.forEach((item) => {
      let data = item.val();
      let key = item.key;
      clients.push({
        key,
        id: data.id,
        razonSocial: data.razon_social,
        domicilio: data.domicilio,
        dni: data.dni,
        telefono: data.telefono,
      });
    });

     setState(prevState => ({ ...prevState, clients }));
  }

  const searchByTitle = (e) => {
    const { clients } = state;
    const value = e.target.value;
    setTimeout(() => {
      if (value) {
        clients.forEach((a) => a.domicilio.toLowerCase());
        const filter = clients.filter(
          (client) =>
            client.razonSocial.toLowerCase().match(value.toLowerCase()) ||
            client.domicilio.toLowerCase().match(value.toLowerCase())
        );
         setState(prevState => ({ ...prevState, clientFilter: filter, searchTitle: value }));
      } else {
         setState(prevState => ({ ...prevState, searchTitle: "" }));
      }
    }, 500);
  }

  const deleteClient = (key) => {
    ClientsDataService.delete(key)
      .then(() => {
        Toast.success("Eliminado correctamente!!", 1);
      })
      .catch((e) => {
        Toast.fail("Ocurrió un error", 1);
      });
  }

  const { clients, searchTitle, clientFilter } = state;
  const displayTable = searchTitle !== "" ? clientFilter : clients;
  return (
    <Container component="main" maxWidth="xl">
      <Typography variant="h5" sx={{ textAlign: 'center', marginBottom: '20px' }}>Listado de clientes</Typography>
      <div className="col-md-6">
        <div className="new-reservation">
          <Button variant="contained" className="btn btn-primary" href="/dental/clients">
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
        <TableContainer>
          <Table className="table">
            <TableHead>
              <TableRow>
                <StyledTableCell scope="col">ID</StyledTableCell>
                <StyledTableCell scope="col">Nombre</StyledTableCell>
                <StyledTableCell scope="col">Dirección</StyledTableCell>
                <StyledTableCell scope="col">DNI/CUIT</StyledTableCell>
                <StyledTableCell scope="col">Teléfono</StyledTableCell>
                <StyledTableCell scope="col">Acciones</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clients &&
                displayTable.map((cliente, index) => {
                  return (
                    <StyledTableRow key={index}>
                      <StyledTableCell>{cliente.id}</StyledTableCell>
                      <StyledTableCell>
                        {/* <a href={`/dental/pedido/${cliente.id}`}> */}
                          {cliente.razonSocial}
                        {/* </a> */}
                      </StyledTableCell>
                      <StyledTableCell>{cliente.domicilio}</StyledTableCell>
                      <StyledTableCell>{cliente.dni}</StyledTableCell>
                      <StyledTableCell>{cliente.telefono}</StyledTableCell>
                      <StyledTableCell className="column-actions">
                        <IconButton
                          className="btn btn-light"
                          href={`/dental/client/${cliente.id}`}
                          role="button"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          type="button"
                          className="btn btn-danger"
                          onClick={() =>
                            alert("Eliminar", "Estás seguro???", [
                              { text: "Cancelar" },
                              {
                                text: "Ok",
                                onPress: () =>
                                  deleteClient(cliente.key),
                              },
                            ])
                          }
                        >
                          <DeleteIcon sx={{ color: 'red' }} />
                        </IconButton>
                      </StyledTableCell>
                    </StyledTableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    </Container>
  );
}

export default ListClient;