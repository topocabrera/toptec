import React, { Component } from 'react';
import MemberDataService from '../../services/member.service';
import { Modal } from 'antd-mobile';
import {
  Container,
  Breadcrumbs,
  Link,
  Button,
  TextField,
  IconButton,
  Input,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import moment from 'moment';
import SearchIcon from '@mui/icons-material/Search';

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
      memberSearch: '',
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
    // clearTimeout(this.timer);
    const value = e.target.value;
    this.setState({
      memberSearch: value,
    });

    // this.timer = setTimeout(() => {
    //   if (value) {
    //     const filter = members.filter(
    //       (data) =>
    //         data.nombre.toLowerCase().match(value.toLowerCase()) ||
    //         data.dni.toLowerCase().match(value.toLowerCase())
    //     );
    //     this.setState({
    //       memberFilter: filter,
    //       searchTitle: value,
    //     });
    //   } else {
    //     this.setState({ searchTitle: '' });
    //   }
    // }, 500);
  }

  onSubmit(e) {
    e.preventDefault();
    const { memberFilter, searchTitle, memberSearch, members } = this.state;
    let filter = [];
    if (memberSearch) {
      filter = members.filter(
        (data) =>
          data.nombre.toLowerCase().match(memberSearch.toLowerCase()) ||
          data.dni.toLowerCase().match(memberSearch.toLowerCase())
      );
      this.setState({
        memberFilter: filter,
        searchTitle: memberSearch,
      });
    } else {
      this.setState({ searchTitle: '' });
    }
    const isNotEmptySearch = memberSearch !== '' && filter.length > 0;
    var actualDate = new Date();
    var dateMember = isNotEmptySearch ?
      new Date(moment(filter[0].dateVenc, 'DD-MM-YYYY')) : actualDate;
      const statusMember =
      isNotEmptySearch && moment(dateMember, "DD-MM-YYYY").isSameOrBefore(moment(actualDate, "DD-MM-YYYY"))
      ? 'Vencido'
      : 'Habilitado';
    this.setState({
      statusMember,
      submitted: true,
      memberSearch: '',
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
      <Container component="main" maxWidth="md">
        {submitted ? (
          <div className="col-md-12">
            <Breadcrumbs aria-label="breadcrumb">
              <Link color="inherit" href="#" onClick={this.refreshList}>
                <HomeIcon fontSize="small" />
                Inicio
              </Link>
            </Breadcrumbs>
            <div className="col-md-6 medium-width">
              <form className="form">
                <TextField
                  label="Ingrese DNI"
                  variant="outlined"
                  fullWidth
                  id="dni"
                  onChange={this.searchTitle}
                  autoFocus
                  // type="text"
                  className="text__search"
                  autocomplete="off"
                  spellcheck="false"
                  value={this.state.memberSearch}
                />
                <IconButton
                  type="submit"
                  color="primary"
                  fullWidth
                  variant="contained"
                  className="button__search"
                  onClick={this.onSubmit}
                >
                  <SearchIcon />
                </IconButton>
              </form>
              <ul className="cards">
                <li
                  className={
                    memberFilter.length !== 0
                      ? `card ${statusMember.toLowerCase()}`
                      : 'card'
                  }
                >
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
              <img className="img-logo" src={require('./factory.jpg')} />
            </div>
            <div className="col-md-6 medium-width">
              <form className="form">
                <TextField
                  label="Ingrese DNI"
                  variant="outlined"
                  fullWidth
                  id="dni"
                  onChange={this.searchTitle}
                  type="text"
                  className="text__search"
                  autoFocus
                />
                <IconButton
                  type="submit"
                  color="primary"
                  fullWidth
                  variant="contained"
                  className="button__search"
                  onClick={this.onSubmit}
                >
                  <SearchIcon />
                </IconButton>
              </form>
            </div>
          </div>
        )}
      </Container>
    );
  }
}
