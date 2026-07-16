import React from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import moment from "moment";
// import { lighten, makeStyles } from "@mui/material/styles";
import { makeStyles } from '@mui/styles';
import { Toast, Modal } from "antd-mobile";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Box,
  InputAdornment,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import { esES } from "@mui/material/locale";
import { green, purple } from "@mui/material/colors";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import DeleteIcon from "@mui/icons-material/Delete";
import FilterListIcon from "@mui/icons-material/FilterList";
import SaveIcon from "@mui/icons-material/Save";
import DoneOutlineRoundedIcon from "@mui/icons-material/DoneOutlineRounded";
import { getSmartService } from "../../utils/routeHelper";
const alert = Modal.alert;

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
  // { id: "peso", numeric: false, disablePadding: true, label: "Peso" },
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
            disabled={isConfirmed(pedido.status)}
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

const useToolbarStyles = makeStyles((theme) => ({
  root: {
    paddingLeft: '16px',
    paddingRight: '8px',
  },
  highlight: {
    color: "#9c27b0",
    backgroundColor: "#f3e5f5",
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
}));

const isConfirmed = (status) => {
  return status && status !== "Creado";
};

const EnhancedTableToolbar = (props) => {
  const classes = useToolbarStyles();
  const { numSelected, onChangeClick, onConfirmClick, pedido } = props;
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
          disabled={isConfirmed(pedido.status)}
        >
          <DeleteIcon />
        </IconButton>
      ) : (
        <Button
          variant="contained"
          disabled={isConfirmed(pedido.status)}
          onClick={onConfirmClick}
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
      marginBottom: '16px',
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

  const [openConfirmDialog, setOpenConfirmDialog] = React.useState(false);
  const [confirmStatus, setConfirmStatus] = React.useState("Pagado / Entregado");
  const [montoPagadoVal, setMontoPagadoVal] = React.useState("");
  const [saldoPendienteVal, setSaldoPendienteVal] = React.useState("");
  const [cuentasBancarias, setCuentasBancarias] = React.useState([]);
  const [selectedCuentaId, setSelectedCuentaId] = React.useState("");
  const [depositarBanco, setDepositarBanco] = React.useState(false);

  React.useEffect(() => {
    const CuentasBancoService = getSmartService('cuentasBanco');
    if (CuentasBancoService) {
      CuentasBancoService.getAll().once("value", (snapshot) => {
        const list = [];
        snapshot.forEach((item) => {
          list.push({ key: item.key, ...item.val() });
        });
        setCuentasBancarias(list);
        if (list.length > 0) {
          setSelectedCuentaId(list[0].key);
          setDepositarBanco(true);
        }
      });
    }
  }, []);

  const getPedidoTotal = () => {
    return products.reduce((sum, prd) => sum + (parseFloat(prd.subtotal) || 0), 0);
  };

  const handleOpenConfirm = () => {
    const total = getPedidoTotal();
    setConfirmStatus("Pagado / Entregado");
    setMontoPagadoVal(total.toFixed(2));
    setSaldoPendienteVal("0.00");
    setOpenConfirmDialog(true);
  };

  const handleMontoPagadoChange = (val) => {
    setMontoPagadoVal(val);
    const total = getPedidoTotal();
    const numVal = parseFloat(val) || 0;
    const computedSaldo = Math.max(0, total - numVal);
    setSaldoPendienteVal(computedSaldo.toFixed(2));
  };

  const handleSaldoChange = (val) => {
    setSaldoPendienteVal(val);
    const total = getPedidoTotal();
    const numVal = parseFloat(val) || 0;
    const computedMonto = Math.max(0, total - numVal);
    setMontoPagadoVal(computedMonto.toFixed(2));
  };

  const handleSaveConfirm = () => {
    let finalStatus = confirmStatus;
    let finalMontoPagado = parseFloat(montoPagadoVal) || 0;
    let finalSaldo = parseFloat(saldoPendienteVal) || 0;

    if (finalStatus === "Pagado / Entregado") {
      finalMontoPagado = getPedidoTotal();
      finalSaldo = 0;
    } else if (finalStatus === "Rechazado") {
      finalMontoPagado = 0;
      finalSaldo = 0;
    }

    let newTotal = getPedidoTotal();
    const data = {
      id: pedido.id,
      clienteName: pedido.clienteName,
      idCliente: pedido.idCliente,
      fecha: pedido.fecha,
      status: finalStatus,
      productos: products,
      fechaConfirm: moment(new Date().getTime()).format("DD-MM-YYYY hh:mm"),
      total: newTotal,
      montoPagado: finalMontoPagado,
      saldoPendiente: finalSaldo,
    };

    const PedidoService = getSmartService('pedidos');
    PedidoService.update(pedido.key, data)
      .then(() => {
        if (depositarBanco && selectedCuentaId && finalMontoPagado > 0) {
          const LibroBancoService = getSmartService('libroBanco');
          const CuentasBancoService = getSmartService('cuentasBanco');
          const cuentaSeleccionada = cuentasBancarias.find(c => c.key === selectedCuentaId);
          if (cuentaSeleccionada) {
            const nuevoSaldo = (cuentaSeleccionada.saldoActual || 0) + finalMontoPagado;
            const movimiento = {
              fecha: moment().format("DD-MM-YYYY"),
              concepto: `Cobro Pedido #${pedido.id} - Cliente: ${pedido.clienteName}`,
              monto: finalMontoPagado,
              estado: "vinculado",
              tipoVinculo: "cliente",
              idVinculo: pedido.key,
              cuentaId: selectedCuentaId,
              referenciaAdicional: `Pedido #${pedido.id}`,
              fechaCreacion: new Date().toISOString()
            };
            return Promise.all([
              LibroBancoService.create(movimiento),
              CuentasBancoService.update(selectedCuentaId, { saldoActual: nuevoSaldo })
            ]);
          }
        }
      })
      .then(() => {
        Toast.success("Actualizado correctamente!!", 1, () => {
          window.location.reload(false);
        });
      })
      .catch((e) => {
        console.error("Error al confirmar pedido:", e);
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
          onConfirmClick={handleOpenConfirm}
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
                          disabled={isConfirmed(pedido.status)}
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
                      {/* <TableCell>{row.peso}</TableCell> */}
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

      {/* Dialogo de Confirmacion de Pedido */}
      <Dialog
        open={openConfirmDialog}
        onClose={() => setOpenConfirmDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
          Confirmar Pedido #{pedido.id}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              select
              label="Estado de Entrega"
              value={confirmStatus}
              onChange={(e) => {
                const status = e.target.value;
                setConfirmStatus(status);
                const total = getPedidoTotal();
                if (status === "Pagado / Entregado") {
                  setMontoPagadoVal(total.toFixed(2));
                  setSaldoPendienteVal("0.00");
                } else if (status === "Cta Corriente / Entregado") {
                  setMontoPagadoVal("0.00");
                  setSaldoPendienteVal(total.toFixed(2));
                } else {
                  setMontoPagadoVal("0.00");
                  setSaldoPendienteVal("0.00");
                }
              }}
              fullWidth
              variant="outlined"
            >
              <MenuItem value="Pagado / Entregado">Pagado / Entregado</MenuItem>
              <MenuItem value="Cta Corriente / Entregado">Cta Corriente / Entregado (Cta. Cte.)</MenuItem>
              <MenuItem value="Rechazado">Rechazado</MenuItem>
            </TextField>

            <Box sx={{ p: 1.5, bgcolor: '#e3f2fd', borderRadius: 1 }}>
              <strong>Total del Pedido:</strong> ${getPedidoTotal().toFixed(2)}
            </Box>

            {confirmStatus === "Cta Corriente / Entregado" && (
              <>
                <TextField
                  label="Monto Pagado / Entrega"
                  type="number"
                  value={montoPagadoVal}
                  onChange={(e) => handleMontoPagadoChange(e.target.value)}
                  fullWidth
                  variant="outlined"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
                <TextField
                  label="Saldo Pendiente"
                  type="number"
                  value={saldoPendienteVal}
                  onChange={(e) => handleSaldoChange(e.target.value)}
                  fullWidth
                  variant="outlined"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </>
            )}

            {cuentasBancarias.length > 0 && (confirmStatus === "Pagado / Entregado" || (confirmStatus === "Cta Corriente / Entregado" && parseFloat(montoPagadoVal) > 0)) && (
              <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
                <InputLabel id="select-cuenta-deposito-label">Depositar en Cuenta Bancaria</InputLabel>
                <Select
                  labelId="select-cuenta-deposito-label"
                  value={selectedCuentaId}
                  onChange={(e) => {
                    setSelectedCuentaId(e.target.value);
                    setDepositarBanco(e.target.value !== "");
                  }}
                  label="Depositar en Cuenta Bancaria"
                >
                  <MenuItem value="">-- No depositar en Banco --</MenuItem>
                  {cuentasBancarias.map((c) => (
                    <MenuItem key={c.key} value={c.key}>
                      {c.bancoNombre} ({c.nroCuenta || "Sin número"}) - Saldo: ${c.saldoActual?.toFixed(2)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenConfirmDialog(false)} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleSaveConfirm} variant="contained" color="success">
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
