import React, { Component } from 'react';
import { DatePicker as Datetime } from '@mui/x-date-pickers/DatePicker';
import { Toast, Modal } from 'antd-mobile';
import {
  Paper,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import moment from 'moment';
import ReservationDataService from '../../services/reservation.service';
import { turnos } from '../../utils/default';
import { mesasArray } from '../../utils/default';
const queryString = require('query-string');

const alert = Modal.alert;

export default class ReservaList extends Component {
  constructor(props) {
    super(props);
    this.refreshList = this.refreshList.bind(this);
    this.setActiveTutorial = this.setActiveTutorial.bind(this);
    this.onDataChange = this.onDataChange.bind(this);
    this.onChangeDate = this.onChangeDate.bind(this);
    this.onChangeTurno = this.onChangeTurno.bind(this);
    this.filterReservations = this.filterReservations.bind(this);
    this.deleteReserva = this.deleteReserva.bind(this);
    this.changeSelect = this.changeSelect.bind(this);
    this.handleOpenModal = this.handleOpenModal.bind(this);
    this.onChangeValueCant = this.onChangeValueCant.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.editCant = this.editCant.bind(this);
    this.changeTotal = this.changeTotal.bind(this);
    this.onGetTotales = this.onGetTotales.bind(this);

    this.state = {
      reservas: [],
      currentIndex: -1,
      date:
        queryString.parse(this.props.location.search).date ||
        moment(new Date().getTime()).format('DD-MM-YYYY'),
      turno: queryString.parse(this.props.location.search).turno || 'turno1',
      reservaFilter: [],
      cantAdentro: 0,
      cantAfuera: 0,
      cantTotal: 0,
      totalAsistentes: 0,
      reservation: {
        cantidad: '',
      },
      indexOpen: -1,
      contadorTotal: 0,
    };
  }

  componentDidMount() {
    let dateFormat = moment(new Date().getTime()).format('DD-MM-YYYY');
    if (!this.props.location.search) {
      window.location.href = `/forest/reservas?date=${dateFormat}&turno=turno1`;
    } else {
      const params = queryString.parse(this.props.location.search);
      dateFormat = params.date;
    }

    ReservationDataService.getTotal()
      .orderByChild('date')
      .equalTo(dateFormat)
      .on('child_added', this.onGetTotales);
    ReservationDataService.getAll()
      .orderByChild('date')
      .equalTo(dateFormat)
      .on('value', this.onDataChange);
  }

  componentWillUnmount() {
    ReservationDataService.getAll().off('value', this.onDataChange);
  }

  onDataChange(items) {
    let reservas = [];
    items.forEach((item) => {
      let data = item.val();
      let key = item.key;
      reservas.push({
        key,
        id: data.id,
        name: data.name,
        adentro: data.adentro,
        mesa: data.mesa,
        cantidad: data.cantidad,
        turno: data.turno,
        date: data.date,
        asistio: data.asistio || false,
      });
    });

    this.setState({
      reservas: reservas,
    });
    if (!this.state.currentTotal) {
      let data = {
        date: this.state.date,
        value: 0,
      };
      ReservationDataService.createTotal(data)
        .then((log) => {
          this.setState({
            currentTotal: {
              date: this.state.date,
              value: 0,
              key: log.key
            },
          });
        })
        .catch((e) => {
          Toast.fail('Ocurrió un error !!!', 2);
        });
    }
    this.filterReservations();
  }

  filterReservations(fecha, turnoParam) {
    const { reservas, turno, date } = this.state;
    // const dateEmpty = date === '' ? moment(new Date().getTime()).format("DD-MM-YYYY") : date;
    let reserva = [];
    let cantAdentro = 0;
    let cantAfuera = 0;
    let totalPersonas = 0;
    let totalAsistentes = 0;
    const turnoComp = turnoParam || turno;
    const fechaComp = fecha || date;
    reservas.forEach((item) => {
      if (item.date === fechaComp && item.turno === turnoComp) {
        reserva.push(item);
        cantAdentro = item.adentro ? cantAdentro + 1 : cantAdentro;
        cantAfuera = !item.adentro ? cantAfuera + 1 : cantAfuera;
        totalPersonas += parseInt(item.cantidad, 10);
        if (item.asistio) {
          totalAsistentes += parseInt(item.cantidad, 10);
        }
      }
    });

    // Order by mesa
    reserva = reserva.sort((a, b) => a.mesa - b.mesa);

    this.setState({
      reservaFilter: reserva,
      cantAdentro,
      cantAfuera,
      cantTotal: totalPersonas,
      totalAsistentes,
      date: fecha || date,
    });
  }

  onGetTotales(item) {
    let key = item.key;
    let data = item.val();
    const currentTotal = data;
    currentTotal.key = key;
    this.setState({ currentTotal, contadorTotal: data.value });
  }

  onChangeDate(e) {
    const dateFormat = e.format('DD-MM-YYYY');
    window.location.href = `/forest/reservas?date=${dateFormat}&turno=${this.state.turno}`;
  }

  onChangeTurno(e) {
    window.location.href = `/forest/reservas?date=${this.state.date}&turno=${e.target.value}`;
  }

  refreshList() {
    this.setState({
      currentTutorial: null,
      currentIndex: -1,
    });
  }

  setActiveTutorial(tutorial, index) {
    this.setState({
      currentTutorial: tutorial,
      currentIndex: index,
    });
  }

  deleteReserva(key) {
    ReservationDataService.delete(key)
      .then(() => {
        Toast.success('Eliminado correctamente!!', 1, () => {
          window.location.reload(false);
        });
      })
      .catch((e) => {
        Toast.fail('Ocurrió un error !!!', 2);
      });
  }

  changeSelect(reserva) {
    const data = {
      asistio: !reserva.asistio,
    };

    ReservationDataService.update(reserva.key, data)
      .then(() => {
        this.filterReservations();
      })
      .catch((e) => {
        console.log(e);
      });
  }

  handleOpenModal(index, reserva) {
    this.setState({
      // editProd: true,
      indexOpen: index,
      reservation: {
        cantidad: reserva.cantidad,
      },
    });
  }

  onChangeValueCant(e) {
    const name = e.target.name;
    const value = e.target.value;
    this.setState({
      reservation: {
        cantidad: value,
      },
    });
  }

  handleClose() {
    this.setState({
      indexOpen: -1,
    });
  }

  editCant(reserva) {
    const data = {
      cantidad: parseInt(this.state.reservation.cantidad, 10),
    };
    ReservationDataService.update(reserva.key, data)
      .then(() => {
        Toast.success('Actualizado correctamente...', 1, () => {
          window.location.reload();
        });
      })
      .catch((e) => {
        Toast.fail('Ocurrió un error !!!', 2);
      });
  }

  changeTotal(value) {
    const { currentTotal } = this.state;
    let data = {
      value:
        value === 'sum'
          ? this.state.contadorTotal + 1
          : this.state.contadorTotal - 1,
    };

    if (currentTotal) {
      ReservationDataService.updateTotal(this.state.currentTotal.key, data)
        .then()
        .catch((e) => {
          Toast.fail('Ocurrió un error !!!', 2);
        });
        this.setState({
          contadorTotal: data.value,
        });
    }
  }

  render() {
    const {
      reservaFilter,
      cantAdentro,
      contadorTotal,
      cantTotal,
      totalAsistentes,
      indexOpen,
      reservation,
    } = this.state;
    const totalMesas = mesasArray.length;
    const totalAfuera = 54;
    const totalAdentro = 19;
    const colorTotal = cantTotal > 150 ? 'red' : '';
    const colorMoment = totalAsistentes > 150 ? 'red' : '';
    return (
      <div className="list row">
        <div className="col-md-6">
          <div className="new-reservation">
            <a
              className="btn btn-primary"
              href="/forest/reservation"
              role="button"
            >
              Nueva reserva
            </a>
            <a
              className="btn btn-primary mesa__map"
              href={`/forest/mesas?date=${this.state.date}`}
              role="button"
            >
              Mapa mesas
            </a>
          </div>
          <h4>Listado de reservas</h4>
          <div className="form-group">
            <label htmlFor="fecha">Seleccione fecha de reserva</label>
            <Datetime
              className="post-input  post-input__event"
              dateFormat="DD-MM-YYYY"
              timeFormat={false}
              name="eventDate"
              utc
              closeOnSelect
              initialValue={moment(new Date().getTime()).format('DD-MM-YYYY')}
              value={this.state.date}
              onChange={this.onChangeDate}
            />
          </div>
          <div className="form-group">
            <InputLabel>Turno</InputLabel>
            <Select
              onChange={this.onChangeTurno}
              value={this.state.turno}
              className="select__form"
              fullWidth
            >
              {turnos.map((turno) => (
                <MenuItem key={turno.value} value={turno.value}>
                  {turno.name}
                </MenuItem>
              ))}
            </Select>
          </div>

          <Paper className="info__pedidos">
            <div className="list__reservas">
              <span className="total__title">
                Total reservas: {reservaFilter.length}{' '}
              </span>
              {/* <span>Adentro: {cantAdentro} </span>
              <span className="cant__afuera">Afuera: {cantAfuera} </span> */}
            </div>
            <div className="list__libres">
              <span className="total__title free">
                Mesas libres: {totalMesas - reservaFilter.length}
              </span>
              {/* <span>Adentro: {totalAdentro - cantAdentro} </span>
              <span className="cant__afuera">
                Afuera: {totalAfuera - cantAfuera}{" "}
              </span> */}
            </div>
            <span className={`cant__total ${colorTotal}`}>
              Personas previstas: {cantTotal}
            </span>
            <span className={`cant__total-asist ${colorMoment}`}>
              Personas que asistieron: {totalAsistentes}
            </span>
            <div className="total-personas__container">
              <span className="total__label">Contador de personas</span>
              <IconButton
                aria-label="delete"
                disabled={contadorTotal < 1}
                onClick={(e) => {
                  e.preventDefault();
                  this.changeTotal('res');
                }}
              >
                <RemoveIcon />
              </IconButton>
              <TextField
                value={contadorTotal}
                variant="outlined"
                className="total-personas"
                size="small"
                // onChange={}
              />
              <IconButton
                aria-label="add"
                onClick={(e) => {
                  e.preventDefault();
                  this.changeTotal('sum');
                }}
              >
                <AddIcon />
              </IconButton>
            </div>
          </Paper>
          <div className="table-container">
            <table className="table">
              <thead className="thead-dark">
                <tr>
                  <th scope="col">Asistió</th>
                  <th scope="col">Mesa</th>
                  <th scope="col">Nombre</th>
                  <th scope="col">Cantidad</th>
                  <th scope="col">Ubicación</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {reservaFilter &&
                  reservaFilter.map((reserva, index) => (
                    <tr key={index}>
                      <td>
                        <Checkbox
                          checked={reserva.asistio}
                          color="primary"
                          onChange={(e) => {
                            e.preventDefault();
                            this.changeSelect(reserva);
                          }}
                        />
                      </td>
                      <td>{reserva.mesa}</td>
                      <td>
                        <a href={`/forest/mesa/${reserva.id}`}>
                          {reserva.name}
                        </a>
                      </td>
                      {/* <td>
                        {reserva.name}
                      </td> */}
                      <td>
                        {reserva.cantidad}
                        <IconButton
                          className="action__link"
                          size="small"
                          onClick={(e) => {
                            e.preventDefault();
                            this.handleOpenModal(index, reserva);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                        <Dialog
                          open={indexOpen === index}
                          aria-labelledby="form-dialog-title"
                        >
                          <DialogTitle
                            id="form-dialog-title"
                            onClose={this.handleClose}
                          >
                            Editar cantidad de personas
                          </DialogTitle>
                          <DialogContent>
                            <TextField
                              className="prod-input"
                              autoFocus
                              fullWidth
                              margin="dense"
                              name="cantidad"
                              label="Cantidad pers."
                              type="number"
                              value={reservation.cantidad}
                              onChange={this.onChangeValueCant}
                            />
                          </DialogContent>
                          <DialogActions>
                            <Button color="primary" onClick={this.handleClose}>
                              Cancelar
                            </Button>
                            <Button
                              color="primary"
                              disabled={reservation.cantidad === ''}
                              onClick={(e) => {
                                e.preventDefault();
                                this.editCant(reserva);
                              }}
                            >
                              Aceptar
                            </Button>
                          </DialogActions>
                        </Dialog>
                      </td>
                      <td>{reserva.adentro ? 'Adentro' : 'Afuera'}</td>
                      <td>
                        <IconButton
                          aria-label="delete"
                          className="action__link"
                          href={`/forest/reserva/${reserva.id}`}
                          role="button"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          aria-label="delete"
                          type="button"
                          className="action__button"
                          onClick={() =>
                            alert('Eliminar', 'Estás seguro???', [
                              { text: 'Cancelar' },
                              {
                                text: 'Ok',
                                onPress: () => this.deleteReserva(reserva.key),
                              },
                            ])
                          }
                        >
                          <DeleteIcon color="secondary" />
                        </IconButton>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {reservaFilter.length === 0 && (
              <div className="empty__container">
                <span className="message-empty">No hay reservas aún</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}
