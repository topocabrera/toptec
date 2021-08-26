import React, { Component } from 'react';
import MemberDataService from '../../services/member.service';
import { Modal } from 'antd-mobile';
import {
  Container,
  Breadcrumbs,
  Link,
  Button,
  TextField,
  Grid,
  Input,
} from '@material-ui/core';
import HomeIcon from '@material-ui/icons/Home';
import moment from 'moment';

const alert = Modal.alert;

export default class validateMember extends Component {
  constructor(props) {
    super(props);
    this.refreshList = this.refreshList.bind(this);
    this.onDataChange = this.onDataChange.bind(this);
    this.searchTitle = this.searchTitle.bind(this);
    this.onChangeSearchTitle = this.onChangeSearchTitle.bind(this);
    this.onSubmit = this.onSubmit.bind(this);

    this.state = {
      members: [],
      currentMember: null,
      currentIndex: -1,
      memberFilter: [],
      searchTitle: '',
      statusMember: '',
      submitted: false,
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
        this.setState({
          memberFilter: filter,
          searchTitle: value,
        });
      } else {
        this.setState({ searchTitle: '' });
      }
    }, 500);
  }

  onSubmit() {
    const { memberFilter, searchTitle } = this.state;
    const isNotEmptySearch = searchTitle !== '' && memberFilter.length > 0;
    var actualDate = new Date();
    var dateMember = isNotEmptySearch && new Date(moment(memberFilter[0].dateVenc, 'DD-MM-YYYY'));
    const statusMember =
      isNotEmptySearch && dateMember.getTime() < actualDate.getTime()
        ? 'Vencido'
        : 'Habilitado';
    this.setState({
      statusMember,
      submitted: true,
    });
  }

  refreshList() {
    this.setState({
      currentMember: null,
      currentIndex: -1,
      memberFilter: [],
      statusMember: '',
      submitted: false,
    });
  }

  render() {
    const { members, searchTitle, memberFilter, submitted, statusMember } =
      this.state;
    const displayTable = searchTitle !== '' ? memberFilter : members;

    return (
      <Container component="main" maxWidth="xs">
        {submitted ? (
          <div className="col-md-12">
            <Breadcrumbs aria-label="breadcrumb">
              <Link color="inherit" href="#" onClick={this.refreshList}>
                <HomeIcon fontSize="small" />
                Inicio
              </Link>
            </Breadcrumbs>
            <div className="col-md-6">
              <ul className="cards">
                <li 
                className={memberFilter.length !== 0 ? `card ${statusMember.toLowerCase()}` : 'card'}>
                  {memberFilter.length !== 0 ? (
                    <>
                      <h1 className="card__name">
                        {displayTable[0].nombre.toUpperCase()}
                      </h1>
                      <p className="card__dni">DNI: {displayTable[0].dni}</p>
                      <p className="status">{statusMember}</p>
                      <p className="card__vigencia">
                        Actividad: {displayTable[0].actividad || ''}
                      </p>
                      <p className="card__vigencia">
                        Vencimiento: {displayTable[0].dateVenc}
                      </p>
                    </>
                  ) : (
                    <p className="empty-message">
                      No se encontraron resultados
                    </p>
                  )}
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="col-md-12">
            <div className="image-container">
              <img className="img-logo" src={require('./factory.jpeg')} />
            </div>
            <div className="col-md-6">
              <form className="form">
                <TextField
                  label="Ingrese DNI"
                  variant="outlined"
                  fullWidth
                  id="dni"
                  onChange={this.searchTitle}
                  type="text"
                />

                <Button
                  type="submit"
                  color="primary"
                  fullWidth
                  variant="contained"
                  className="button__save"
                  onClick={this.onSubmit}
                  // disabled={searchTitle === ''}
                >
                  Validar
                </Button>
              </form>
            </div>
          </div>
        )}
      </Container>
    );
  }
}
