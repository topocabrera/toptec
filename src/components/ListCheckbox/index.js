import React from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import moment from "moment";
import { lighten, makeStyles } from "@material-ui/core/styles";
import { Toast } from "antd-mobile";
import {
  Button,
  Tooltip,
  IconButton,
  Checkbox,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Toolbar,
} from "@material-ui/core";
import { esES } from "@material-ui/core/locale";
import { green, purple } from "@material-ui/core/colors";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";
import DeleteIcon from "@material-ui/icons/Delete";
import FilterListIcon from "@material-ui/icons/FilterList";
import SaveIcon from "@material-ui/icons/Save";
import DoneOutlineRoundedIcon from "@material-ui/icons/DoneOutlineRounded";
import PedidoService from "../../services/pedidos.service";

function createData(codigo, peso, cantidad, descripcion, marca, subtotal) {
  return { codigo, peso, cantidad, descripcion, marca, subtotal };
}

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

const headCells = [
  { id: "codigo", numeric: false, disablePadding: true, label: "Código" },
  { id: "peso", numeric: false, disablePadding: true, label: "Peso" },
  { id: "cantidad", numeric: false, disablePadding: false, label: "Cantidad" },
  {
    id: "descripcion",
    numeric: false,
    disablePadding: false,
    label: "Descripción",
  },
  { id: "marca", numeric: false, disablePadding: false, label: "Marca" },
  { id: "subtotal", numeric: true, disablePadding: false, label: "Subtotal" },
];

function EnhancedTableHead(props) {
  const {
    classes,
    onSelectAllClick,
    order,
    orderBy,
    numSelected,
    rowCount,
    onRequestSort,
    pedido,
  } = props;
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };
  return (
    <TableHead>
      <TableRow>
        <TableCell padding="checkbox">
          <Checkbox
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={rowCount > 0 && numSelected === rowCount}
            onChange={onSelectAllClick}
            inputProps={{ "aria-label": "select all desserts" }}
            disabled={pedido.status === "Confirmado"}
          />
        </TableCell>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? "right" : "left"}
            padding={headCell.disablePadding ? "none" : "default"}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : "asc"}
              onClick={createSortHandler(headCell.id)}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <span className={classes.visuallyHidden}>
                  {order === "desc" ? "sorted descending" : "sorted ascending"}
                </span>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

EnhancedTableHead.propTypes = {
  classes: PropTypes.object.isRequired,
  numSelected: PropTypes.number.isRequired,
  onRequestSort: PropTypes.func.isRequired,
  onSelectAllClick: PropTypes.func.isRequired,
  order: PropTypes.oneOf(["asc", "desc"]).isRequired,
  orderBy: PropTypes.string.isRequired,
  rowCount: PropTypes.number.isRequired,
};

const useToolbarStyles = makeStyles(
  (theme) => ({
    root: {
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(1),
    },
    highlight:
      theme.palette.type === "light"
        ? {
            color: theme.palette.secondary.main,
            backgroundColor: lighten(theme.palette.secondary.light, 0.85),
          }
        : {
            color: theme.palette.text.primary,
            backgroundColor: theme.palette.secondary.dark,
          },
    title: {
      flex: "1 1 100%",
    },
    button: {
      color: "#fff",
      backgroundColor: "#388e3c",
      "&:hover": {
        backgroundColor: "#008000",
      },
    },
  }),
  esES
);

const EnhancedTableToolbar = (props) => {
  const classes = useToolbarStyles();
  const { numSelected, onChangeClick, updatePedido, pedido } = props;
  return (
    <Toolbar
      className={clsx(classes.root, {
        [classes.highlight]: numSelected > 0,
      })}
    >
      {numSelected > 0 ? (
        <Typography
          className={classes.title}
          color="inherit"
          variant="subtitle1"
          component="div"
        >
          {numSelected} seleccionado
        </Typography>
      ) : (
        <Typography
          className={classes.title}
          variant="h6"
          id="tableTitle"
          component="div"
        >
          Detalle de pedido
        </Typography>
      )}

      {numSelected > 0 ? (
        <IconButton
          aria-label="delete"
          onClick={onChangeClick}
          disabled={pedido.status === "Confirmado"}
        >
          <DeleteIcon />
        </IconButton>
      ) : (
        <Button
          variant="contained"
          // color="primary"
          // size="small"
          disabled={pedido.status === "Confirmado"}
          onClick={updatePedido}
          className={classes.button}
          endIcon={<DoneOutlineRoundedIcon />}
        >
          Confirmar
        </Button>
      )}
    </Toolbar>
  );
};

EnhancedTableToolbar.propTypes = {
  numSelected: PropTypes.number.isRequired,
};

const useStyles = makeStyles(
  (theme) => ({
    root: {
      width: "100%",
    },
    paper: {
      width: "100%",
      marginBottom: theme.spacing(2),
    },
    table: {
      minWidth: 750,
    },
    visuallyHidden: {
      border: 0,
      clip: "rect(0 0 0 0)",
      height: 1,
      margin: -1,
      overflow: "hidden",
      padding: 0,
      position: "absolute",
      top: 20,
      width: 1,
    },
  }),
  esES
);

export default function EnhancedTable(props) {
  const classes = useStyles();
  const [products, setProducts] = React.useState(props.productos);
  const [pedido, setPedido] = React.useState(props.pedido);
  const [order, setOrder] = React.useState("asc");
  const [orderBy, setOrderBy] = React.useState("calories");
  const [selected, setSelected] = React.useState([]);
  const [page, setPage] = React.useState(0);
  const [dense, setDense] = React.useState(true);
  const [rowsPerPage, setRowsPerPage] = React.useState(props.productos.length);

  const rows = [];
  products.forEach((prd) =>
    rows.push(
      createData(
        prd.codigo,
        prd.peso,
        prd.cantidad,
        prd.descripcion,
        prd.marca,
        prd.subtotal
      )
    )
  );

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = rows.map((n) => n.codigo);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, name) => {
    let newSelected = [];
    const selectedIndex = selected.indexOf(name);

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, name);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }
    setSelected(newSelected);
  };

  const deleteProduct = () => {
    selected.forEach((cod) => {
      var index = products.findIndex((prd) => prd.codigo === cod);
      products.splice(index, 1);
    });

    setProducts(products);
    setSelected([]);
  };

  const updatePedido = () => {
    let newTotal = 0;
    const statusPrd = products.length === 0 ? 'Rechazado' : 'Confirmado';
    products.forEach((prd) => {
      newTotal += prd.subtotal;
    });
    const data = {
      id: pedido.id,
      clienteName: pedido.clienteName,
      idCliente: pedido.idCliente,
      fecha: pedido.fecha,
      status: statusPrd,
      productos: products,
      fechaConfirm: moment(new Date().getTime()).format("DD-MM-YYYY hh:mm"),
      total: newTotal,
    };

    PedidoService.update(pedido.key, data)
      .then(() => {
        Toast.success("Actualizado correctamente!!", 1, () => {
          window.location.reload(false);
        });
      })
      .catch((e) => {
        Toast.fail("Ocurrió un error !!!", 1);
      });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleChangeDense = (event) => {
    setDense(event.target.checked);
  };

  const isSelected = (name) => selected.indexOf(name) !== -1;

  const emptyRows =
    rowsPerPage - Math.min(rowsPerPage, rows.length - page * rowsPerPage);
  return (
    <div className={classes.root}>
      <Paper className={classes.paper}>
        <EnhancedTableToolbar
          onChangeClick={deleteProduct}
          numSelected={selected.length}
          updatePedido={updatePedido}
          pedido={pedido}
        />
        <TableContainer>
          <Table
            className={classes.table}
            aria-labelledby="tableTitle"
            size={dense ? "small" : "medium"}
            aria-label="enhanced table"
          >
            <EnhancedTableHead
              classes={classes}
              numSelected={selected.length}
              order={order}
              orderBy={orderBy}
              onSelectAllClick={handleSelectAllClick}
              onRequestSort={handleRequestSort}
              rowCount={rows.length}
              pedido={pedido}
            />
            <TableBody>
              {stableSort(rows, getComparator(order, orderBy))
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row, index) => {
                  const isItemSelected = isSelected(row.codigo);
                  const labelId = `enhanced-table-checkbox-${index}`;

                  return (
                    <TableRow
                      hover
                      onClick={(event) => handleClick(event, row.codigo)}
                      role="checkbox"
                      aria-checked={isItemSelected}
                      tabIndex={-1}
                      key={row.codigo}
                      selected={isItemSelected}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isItemSelected}
                          inputProps={{ "aria-labelledby": labelId }}
                          disabled={pedido.status === "Confirmado"}
                        />
                      </TableCell>
                      <TableCell
                        component="th"
                        id={labelId}
                        scope="row"
                        padding="none"
                      >
                        {row.codigo}
                      </TableCell>
                      <TableCell>{row.peso}</TableCell>
                      <TableCell>{row.cantidad}</TableCell>
                      <TableCell>{row.descripcion}</TableCell>
                      <TableCell>{row.marca}</TableCell>
                      <TableCell align="right">
                        ${row.subtotal.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              {emptyRows > 0 && (
                <TableRow style={{ height: (dense ? 33 : 53) * emptyRows }}>
                  <TableCell colSpan={6} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {/* <TablePagination
          rowsPerPageOptions={[1, 2, 3, 4, 5, 10, 25]}
          component="div"
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onChangePage={handleChangePage}
          onChangeRowsPerPage={handleChangeRowsPerPage}
        /> */}
      </Paper>
    </div>
  );
}
