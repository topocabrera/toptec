import React, { useState, useEffect } from "react";
import ProductosDataService from "../../../services/marcas.service";
import { Toast, Modal } from "antd-mobile";
import SearchIcon from "@mui/icons-material/Search";
import Container from '@mui/material/Container';
import Snackbar from '@mui/material/Snackbar';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import { StyledTableCell, StyledTableRow } from '../../../utils/styled'
import { Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";

const alert = Modal.alert;

function ListMarcas() {
  const [state, setState] = useState({
    products: [],
    currentProduct: null,
    currentIndex: -1,
    productoFilter: [],
    searchTitle: "",
  });


  useEffect(() => {
    ProductosDataService.getAll()
      .orderByChild("id")
      .on("value", onDataChange);
  }, []);

  const onDataChange = (items) => {
    const products = [];

    items.forEach((item) => {
      let key = item.key;
      let data = item.val();
      products.push({
        key,
        id: data?.id,
        nombre: data?.nombre,
        descripcion: data?.descripcion,
        porcentaje: data?.porcentaje || '',
      });
    });

    setState(prevState => ({ ...prevState, products }));
  }

  const updatePrices = (e) => {
    console.log(e);
  }

  const searchByTitle = (e) => {
    const { products } = state;
    const value = e.target.value;
    setTimeout(() => {
      if (value) {
        const filter = products.filter(
          (prod) =>
            prod.descripcion.toLowerCase().match(value.toLowerCase()) ||
            prod.nombre.toLowerCase().match(value.toLowerCase())
        );
        setState(prevState => ({ ...prevState, productoFilter: filter, searchTitle: value }));
      } else {
        setState(prevState => ({ ...prevState, searchTitle: "" }));
      }
    }, 500);
  }

  const deleteProduct = (key) => {
    ProductosDataService.delete(key)
      .then(() => {
        Toast.success("Eliminado correctamente!!", 1);
      })
      .catch((e) => {
        Toast.fail("Ocurrió un error", 1);
      });
  }

  const { products, searchTitle, productoFilter } = state;
  const displayTable = searchTitle !== "" ? productoFilter : products;
  return (
    <Container component="main" maxWidth="xl">
      <Typography variant="h5" sx={{ textAlign: 'center', marginBottom: '20px' }}>Listado de Marcas</Typography>
      <div className="col-md-6">
        <div className="new-reservation">
          <Button variant="contained" href="/dental/marca" role="button">
            Nueva marca
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
              <button
                className="btn btn-outline-secondary search-button"
                type="button"
              >
                <SearchIcon color="action" />
              </button>
            </div>
          </div>
        </div>
        <TableContainer>
          <Table aria-label="simple table">
            <TableHead className="thead-dark">
              <TableRow>
                <StyledTableCell scope="col">Código</StyledTableCell>
                <StyledTableCell scope="col">Nombre</StyledTableCell>
                <StyledTableCell scope="col">Descripción</StyledTableCell>
                <StyledTableCell scope="col">% Ganancia</StyledTableCell>
                <StyledTableCell scope="col">Acciones</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products &&
                displayTable.map((producto, index) => {
                  return (
                    <StyledTableRow key={index}>
                      <StyledTableCell>{producto.id}</StyledTableCell>
                      <StyledTableCell>{producto.nombre}</StyledTableCell>
                      <StyledTableCell>{producto.descripcion}</StyledTableCell>
                      <StyledTableCell>{producto.porcentaje}</StyledTableCell>
                      <StyledTableCell className="column-actions" sx={{ display: 'inline-flex', border: 'none' }}>
                        <IconButton
                          className="btn btn-light"
                          href={`/dental/marca/${producto.id}`}
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
                                  deleteProduct(producto.key),
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

export default ListMarcas;
