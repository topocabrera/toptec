import React, { Component } from "react";
import CryptoJS from "crypto-js";
import { Toast } from "antd-mobile";
import {
  Avatar,
  Button,
  TextField,
  Box,
  Typography,
  Link,
  Grid,
  Container,
} from "@material-ui/core";
import LockOutlinedIcon from "@material-ui/icons/LockOutlined";
import LoginService from "../../services/users.service";
import { passKey } from "../../utils/default";

export default class SignUp extends Component {
  constructor(props) {
    super(props);

    this.state = {
      userName: "",
      password: "",
      email: "",
      rol: "windy",
    };
    this.onSaveUser = this.onSaveUser.bind(this);
    this.onChangeValues = this.onChangeValues.bind(this);
  }

  onChangeValues(e) {
    const name = e.target.name;
    const value = e.target.value;
    this.setState({ [name]: value });
  }

  onSaveUser() {
    var ciphertext = CryptoJS.AES.encrypt(
      this.state.password,
      passKey
    ).toString();
    let data = {
      userName: this.state.userName,
      password: ciphertext,
      email: this.state.email,
      rol: this.state.rol,
    };

    LoginService.create(data)
      .then(() => {
        Toast.success("Cargado correctamente!!", 1, () => {
          window.location = "/login";
        });
      })
      .catch((e) => {
        console.log(e);
      });
  }
  render() {
    return (
      <Container component="main" maxWidth="xs">
        <div className="form-container">
          <Avatar className="avatar">
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Registro
          </Typography>
          <div className="login-container">
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  autoComplete="fname"
                  name="userName"
                  variant="outlined"
                  required
                  fullWidth
                  id="userName"
                  label="Nombre de usuario"
                  autoFocus
                  onChange={this.onChangeValues}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  variant="outlined"
                  required
                  fullWidth
                  id="email"
                  label="Email"
                  name="email"
                  autoComplete="email"
                  onChange={this.onChangeValues}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  variant="outlined"
                  required
                  fullWidth
                  name="password"
                  label="Contraseña"
                  type="password"
                  id="password"
                  autoComplete="current-password"
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
              onClick={this.onSaveUser}
            >
              Registrar
            </Button>
            <Grid container justify="center">
              <Grid item>
                <Link href="/login" variant="body2">
                  Ya tienes una cuenta? Iniciar sesión
                </Link>
              </Grid>
            </Grid>
          </div>
        </div>
        <Box mt={5}>
          <Typography variant="body2" color="textSecondary" align="center">
            {"Copyright © "}
            <Link color="inherit">TopTec</Link> {new Date().getFullYear()}
            {"."}
          </Typography>
        </Box>
      </Container>
    );
  }
}
