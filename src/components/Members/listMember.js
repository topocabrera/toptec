import React, { Component } from 'react';
import MemberDataService from '../../services/member.service';
import { Toast, Modal } from 'antd-mobile';
import { IconButton } from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import moment from 'moment';

const alert = Modal.alert;

export default class listMember extends Component {
  constructor(props) {
    super(props);
    this.refreshList = this.refreshList.bind(this);
    this.setActiveProduct = this.setActiveProduct.bind(this);
    this.onDataChange = this.onDataChange.bind(this);
    this.onChangeDate = this.onChangeDate.bind(this);
    this.onChangeTurno = this.onChangeTurno.bind(this);
    this.searchTitle = this.searchTitle.bind(this);
    this.onChangeSearchTitle = this.onChangeSearchTitle.bind(this);
    this.deleteMember = this.deleteMember.bind(this);

    this.state = {
      members: [],
      currentMember: null,
      currentIndex: -1,
      memberFilter: [],
      searchTitle: '',
    };
  }

  componentDidMount() {
    MemberDataService.getAll()
      .orderByChild('id')
      .on('value', this.onDataChange);
  }

  componentWillUnmount() {
    MemberDataService.getAll().off('value', this.onDataChange);
  }

  onDataChange(items) {
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
        date: data.date,
        dateVenc: data.dateVenc,
        contacto: data.contacto,
        actividad: data.actividad,
      });
    });

    this.setState({ members });
  }

  onChangeSearchTitle(e) {
    const searchTitle = e.target.value;

    this.setState({
      searchTitle: searchTitle,
    });
  }

  searchTitle(e) {
    const { members } = this.state;
    clearTimeout(this.timer);
    const value = e.target.value;
    this.timer = setTimeout(() => {
      if (value) {
        const filter = members.filter(
          (data) =>
            data.nombre.toLowerCase().match(value.toLowerCase()) ||
            data.dni.toLowerCase().match(value.toLowerCase())
        );
        this.setState({ memberFilter: filter, searchTitle: value });
      } else {
        this.setState({ searchTitle: '' });
      }
    }, 500);
  }

  onChangeDate(e) {
    const dateFormat = e.format('DD-MM-YYYY');
    this.setState({ date: dateFormat });
    // this.filterReservations(dateFormat, "");
  }

  onChangeTurno(e) {
    this.setState({ turno: e.target.value });

    // this.filterReservations("", e.target.value);
  }

  refreshList() {
    this.setState({
      currentMember: null,
      currentIndex: -1,
    });
  }

  setActiveProduct(product, index) {
    this.setState({
      currentMember: product,
      currentIndex: index,
    });
  }

  deleteMember(key) {
    MemberDataService.delete(key)
      .then(() => {
        Toast.success('Eliminado correctamente!!', 1);
      })
      .catch((e) => {
        Toast.fail('Ocurrió un error', 1);
      });
  }

  render() {
    const { members, searchTitle, memberFilter } = this.state;
    const displayTable = searchTitle !== '' ? memberFilter : members;
    const isNotEmptySearch = searchTitle !== '' && memberFilter.length > 0;
    const statusMember =
      isNotEmptySearch &&
      moment(memberFilter[0].dateVenc, 'DD-MM-YYYY').format('DD-MM-YYYY') <
        moment(new Date().getTime()).format('DD-MM-YYYY')
        ? 'Vencido'
        : 'Habilitado';
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    return (
      <div className="list row">
        <div className="col-md-6">
          <div className="new-reservation">
            <a className="btn btn-primary" href="/add-member" role="button">
              Nuevo socio
            </a>
          </div>
          <div className="col-md-8">
            <div className="input-group mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por DNI o Nombre"
                onChange={this.searchTitle}
              />

              <div className="input-group-append">
                <button
                  className="btn btn-outline-secondary search-button"
                  type="button"
                >
                  <SearchIcon color="action" />
                </button>
                {/* <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() =>
                    alert(`Validar Socio ${searchTitle}`, statusMember, [
                      { text: 'Aceptar' },
                    ])
                  }
                >
                  Validar
                </button> */}
              </div>
            </div>
          </div>
          <h4>Listado de Socios</h4>
          <div className="table-container">
            <table className="table">
              <thead className="thead-dark">
                <tr>
                  <th scope="col">Nombre</th>
                  <th scope="col">DNI</th>
                  <th scope="col">Actividad</th>
                  <th scope="col">Teléfono</th>
                  <th scope="col">Fecha inicio</th>
                  <th scope="col">Vencimiento</th>
                  <th scope="col">Contacto</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {members &&
                  displayTable.map((member, index) => {
                    const actualDate = new Date();
                    const dateMember = new Date(
                      moment(member.dateVenc, 'DD-MM-YYYY')
                    );
                    const isVencido =
                      dateMember.getTime() < actualDate.getTime();
                    return (
                      <tr key={index}>
                        <td>{member.nombre}</td>
                        <td>{member.dni}</td>
                        <td>{member.actividad || ''}</td>
                        <td>{member.telefono}</td>
                        <td>{member.date}</td>
                        <td>{member.dateVenc}</td>
                        <td>{member.contacto}</td>
                        <td
                          className={`color__status ${
                            isVencido ? 'vencido' : 'habilitado'
                          }`}
                        >
                          {isVencido ? 'Vencido' : 'Habilitado'}
                        </td>
                        <td>
                          {currentUser &&
                            (currentUser.rol === 'admin' ||
                              currentUser.userName === 'lucasnovach') && (
                              <IconButton
                                aria-label="delete"
                                className="action__link"
                                href={`/members/${member.id}`}
                                role="button"
                              >
                                <EditIcon />
                              </IconButton>
                            )}
                          <IconButton
                            aria-label="delete"
                            type="button"
                            className="action__button"
                            onClick={() =>
                              alert('Eliminar', 'Estás seguro???', [
                                { text: 'Cancelar' },
                                {
                                  text: 'Ok',
                                  onPress: () => this.deleteMember(member.key),
                                },
                              ])
                            }
                          >
                            <DeleteIcon color="secondary" />
                          </IconButton>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}
