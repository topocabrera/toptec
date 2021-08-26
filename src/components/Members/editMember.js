import React, { Component } from 'react';
import CryptoJS from 'crypto-js';
import {
  Button,
  TextField,
  Typography,
  Grid,
  Container,
  InputLabel,
  Select,
  MenuItem,
} from '@material-ui/core';
import Datetime from 'react-datetime';
import MemberService from '../../services/member.service';
import LoginService from '../../services/users.service';
import moment from 'moment';
import { passKey } from '../../utils/default';

export default class editMember extends Component {
  constructor(props) {
    super(props);

    this.state = {
      currentMember: {
        key: null,
        id: 0,
        nombre: '',
        dni: '',
        actividad: '',
        contacto: '',
        telefono: '',
        date: moment(new Date().getTime()).format('DD-MM-YYYY'),
        dateVenc: moment(new Date().getTime())
          .add(1, 'month')
          .format('DD-MM-YYYY'),
      },
      password: '',
      submitted: false,
      allowUser: false,
      error: false,
    };
    this.updateClient = this.updateClient.bind(this);
    this.onChangeValues = this.onChangeValues.bind(this);
    this.onDataChange = this.onDataChange.bind(this);
    this.onChangeDate = this.onChangeDate.bind(this);
    this.changePass = this.changePass.bind(this);
    this.getUser = this.getUser.bind(this);
  }

  componentDidMount() {
    const id = parseInt(this.props.match.params.id, 10);
    MemberService.getAll()
      .orderByChild('id')
      .equalTo(id)
      .once('value', this.onDataChange);
  }

  onDataChange(items) {
    let key = Object.keys(items.val());
    let data = items.val();
    const currentMember = data[key];
    currentMember.key = key[0];
    this.setState({ currentMember });
  }

  onChangeValues(e) {
    const name = e.target.name;
    const value = e.target.value;
    this.setState({
      currentMember: {
        ...this.state.currentMember,
        [name]: value,
      },
    });
  }

  onChangeDate(e) {
    const dateFormat = e.format('DD-MM-YYYY');
    this.setState({
      currentMember: { ...this.state.currentMember, dateVenc: dateFormat },
    });
  }

  changePass(e) {
    this.setState({ password: e.target.value });
  }

  // getUser() {
  //   LoginService.getAll()
  //     .orderByChild('email')
  //     .equalTo('lucasn_t@hotmail.com')
  //     .once('child_added', this.verifyLogin)
  //     .catch(this.setState({ error: true }));
  // }

  // verifyLogin(user) {
  //   const pass = user.val().password;
  //   const actualPass = this.state.password;
  //   const bytes = CryptoJS.AES.decrypt(pass, passKey);
  //   const originalText = bytes.toString(CryptoJS.enc.Utf8);
  //   if (actualPass === originalText) {
  //     this.setState({ error: false, allowUser: true });
  //   } else {
  //     this.setState({ error: true });
  //   }
  // }

  getUser() {
    if (this.state.password === 'factorygym') {
      this.setState({ allowUser: true });
    } else {
      this.setState({ error: true });
    }
  }

  updateClient() {
    const data = {
      id: this.state.currentMember.id,
      nombre: this.state.currentMember.nombre,
      telefono: this.state.currentMember.telefono,
      dni: this.state.currentMember.dni,
      date: this.state.currentMember.date,
      dateVenc: this.state.currentMember.dateVenc,
      contacto: this.state.currentMember.contacto,
      actividad: this.state.currentMember.actividad,
    };

    MemberService.update(this.state.currentMember.key, data)
      .then(() => {
        this.setState({
          submitted: true,
        });
      })
      .catch((e) => {
        console.log(e);
      });
  }

  render() {
    return (
      <>
        {this.state.allowUser ? (
          <Container component="main" maxWidth="xs">
            {this.state.submitted ? (
              <div>
                <h4>Socio editado correctamente!</h4>
                <a
                  className="btn btn-primary go-listado"
                  href="/members"
                  role="button"
                >
                  Inicio
                </a>
                <a
                  className="btn btn-primary go-listado"
                  href="/add-member"
                  role="button"
                >
                  Nuevo
                </a>
                <a
                  className="btn btn-primary go-listado"
                  href="/member-list"
                  role="button"
                >
                  Listado
                </a>
              </div>
            ) : (
              <div className="form-container">
                <Typography component="h1" variant="h5">
                  Editar Socio
                </Typography>
                <div className="login-container">
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        variant="outlined"
                        required
                        fullWidth
                        className="default__textfield"
                        id="nombre"
                        label="Nombre y Apellido"
                        value={this.state.currentMember.nombre}
                        name="nombre"
                        onChange={this.onChangeValues}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        name="dni"
                        required
                        className="default__textfield"
                        variant="outlined"
                        fullWidth
                        id="dni"
                        value={this.state.currentMember.dni}
                        label="DNI"
                        onChange={this.onChangeValues}
                      />
                    </Grid>
                    {/* <Grid item xs={12}>
                    <InputLabel>Fecha inicio</InputLabel>
                    <Datetime
                      className="post-input  post-input__event"
                      dateFormat="DD-MM-YYYY"
                      timeFormat={false}
                      name="date"
                      utc
                      closeOnSelect
                      disabled
                      value={this.state.currentMember.date}
                      onChange={this.onChangeDate}
                    />
                  </Grid> */}
                    <Grid item xs={12}>
                      <InputLabel>Fecha Vencimiento</InputLabel>
                      <Datetime
                        className="post-input  post-input__event"
                        dateFormat="DD-MM-YYYY"
                        timeFormat={false}
                        name="datevenc"
                        utc
                        closeOnSelect
                        value={this.state.currentMember.dateVenc}
                        onChange={this.onChangeDate}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        variant="outlined"
                        required
                        fullWidth
                        className="default__textfield"
                        id="telefono"
                        label="Teléfono"
                        name="telefono"
                        value={this.state.currentMember.telefono}
                        onChange={this.onChangeValues}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        variant="outlined"
                        className="default__textfield"
                        fullWidth
                        id="actividad"
                        label="Actividad"
                        value={this.state.currentMember.actividad}
                        name="actividad"
                        onChange={this.onChangeValues}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        variant="outlined"
                        className="default__textfield"
                        fullWidth
                        id="contacto"
                        label="Contacto de emergencia"
                        value={this.state.currentMember.contacto}
                        name="contacto"
                        onChange={this.onChangeValues}
                      />
                    </Grid>
                  </Grid>
                  <Button
                    type="button"
                    fullWidth
                    variant="contained"
                    color="primary"
                    className="button__save"
                    onClick={this.updateClient}
                  >
                    Aceptar
                  </Button>
                </div>
              </div>
            )}
          </Container>
        ) : (
          <Container maxWidth="xs">
            {this.state.error && (
              <div className="alert alert-danger" role="alert">
                La contraseña es incorrecta
              </div>
            )}
            <div className="col-md-6">
              <Typography component="h1" variant="h5">
                Ingrese contraseña para editar
              </Typography>
              <form className="form">
                <TextField
                  label="Contraseña"
                  variant="outlined"
                  fullWidth
                  onChange={this.changePass}
                  type="password"
                />

                <Button
                  type="submit"
                  color="primary"
                  variant="contained"
                  fullWidth
                  className="button__save"
                  onClick={this.getUser}
                >
                  Aceptar
                </Button>
              </form>
            </div>
          </Container>
        )}
      </>
    );
  }
}
