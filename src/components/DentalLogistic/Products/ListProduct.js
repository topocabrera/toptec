import React, { useState, useEffect } from "react";
import ProductosDataService from "../../../services/productos.service";
import { Toast, Modal } from "antd-mobile";
import SearchIcon from "@material-ui/icons/Search";
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
import ChangePrice from "./ChangePrice";

const alert = Modal.alert;

function ListProduct() {
  const [state, setState] = useState({
    products: [],
    currentProduct: null,
    currentIndex: -1,
    productoFilter: [],
    searchTitle: "",
  });
  const [openChangePriceModal, setOpenChangePriceModal] = useState(false);


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
        id: data.id,
        descripcion: data.descripcion,
        precio_dolar: data.precio_dolar,
        marca: data.marca,
        stock: data.stock,
        precio_costo: data.precio_costo,
        precio_contado: data.precio_contado,
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
            prod.marca.toLowerCase().match(value.toLowerCase())
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
      <Typography variant="h5" sx={{ textAlign: 'center', marginBottom: '20px' }}>Listado de productos</Typography>
      <div className="col-md-6">
        <div className="new-reservation">
          <Button variant="contained" href="/dental/products" role="button">
            Nuevo producto
          </Button>
          <Button
            variant="contained"
            className="btn btn-primary change-price-button"
            onClick={() => setOpenChangePriceModal(true)}
            role="button"
            sx={{ marginLeft: '20px' }}
          >
            Cambiar precios masivamente
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
                <StyledTableCell scope="col">Marca</StyledTableCell>
                <StyledTableCell scope="col">Descripción</StyledTableCell>
                <StyledTableCell scope="col">Precio Dolar</StyledTableCell>
                <StyledTableCell scope="col">Precio Costo</StyledTableCell>
                <StyledTableCell scope="col">Precio Contado</StyledTableCell>
                <StyledTableCell scope="col">Precio Tarjeta</StyledTableCell>
                <StyledTableCell scope="col">Stock</StyledTableCell>
                <StyledTableCell scope="col">Acciones</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products &&
                displayTable.map((producto, index) => {
                  const precioTarjeta = parseInt(producto.precio_contado, 10) + parseInt(producto.precio_contado, 10) * 0.2;
                  return (
                    <StyledTableRow key={index}>
                      <StyledTableCell>{producto.id}</StyledTableCell>
                      <StyledTableCell>{producto.marca}</StyledTableCell>
                      <StyledTableCell>{producto.descripcion}</StyledTableCell>
                      <StyledTableCell>${producto.precio_dolar}</StyledTableCell>
                      <StyledTableCell>${producto.precio_costo}</StyledTableCell>
                      <StyledTableCell>${producto.precio_contado}</StyledTableCell>
                      <StyledTableCell>${precioTarjeta}</StyledTableCell>
                      <StyledTableCell>{producto.stock}</StyledTableCell>
                      <StyledTableCell className="column-actions" sx={{ display: 'inline-flex', border: 'none' }}>
                        <IconButton
                          className="btn btn-light"
                          href={`/dental/product/${producto.id}`}
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
      <Dialog
        open={openChangePriceModal}
        onClose={() => setOpenChangePriceModal(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Editar precios masivamente"}
          <IconButton
            aria-label="close"
            onClick={() => setOpenChangePriceModal(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <ChangePrice />
        </DialogContent>
        {/* <DialogActions>
          <Button onClick={() => setOpenChangePriceModal(false)}>Cerrar</Button>
          <Button onClick={updatePrices}>
            Aceptar
          </Button>
        </DialogActions> */}
      </Dialog>
    </Container>
  );
}

export default ListProduct;