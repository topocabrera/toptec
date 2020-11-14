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
  Checkbox,
  FormControlLabel,
} from "@material-ui/core";
import LockOutlinedIcon from "@material-ui/icons/LockOutlined";
import LoginService from "../../services/users.service";
import { passKey } from "../../utils/default";

export default class SignIn extends Component {
  constructor(props) {
    super(props);

    this.state = {
      email: "",
      password: "",
      error: false,
    };
    this.getUser = this.getUser.bind(this);
    this.verifyLogin = this.verifyLogin.bind(this);
    this.onChangeValues = this.onChangeValues.bind(this);
  }

  componentDidMount() {
    localStorage.removeItem('currentUser');
  }

  onChangeValues(e) {
    const name = e.target.name;
    const value = e.target.value;
    this.setState({ 
      [name]: value,
      error: false,
    });
  }

  getUser() {
    LoginService.getAll()
      .orderByChild("email")
      .equalTo(this.state.email)
      .once("child_added", this.verifyLogin)
      .catch(this.setState({error:true}))
  }

  verifyLogin(user) {
    const pass = user.val().password;
    const actualPass = this.state.password;
    const bytes = CryptoJS.AES.decrypt(pass, passKey);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    if (actualPass === originalText) {
      this.setState({error:false})
      const data = {
        userName: user.val().userName,
        email: user.val().email,
        rol: user.val().rol,
      }
      localStorage.setItem('currentUser', JSON.stringify(data));
      window.location = "/";
    } else {
      this.setState({ error: true });
    }
  }

  render() {
    return (
      <Container component="main" maxWidth="xs">
        <div className="form-container">
          <Avatar className="avatar">
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Iniciar Sesión
          </Typography>
          {this.state.error && (
            <div className="alert alert-danger" role="alert">
              El usuario o la contraseña son incorrectos
            </div>
          )}
          <div className="login-container">
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  variant="outlined"
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
                  fullWidth
                  name="password"
                  label="Contraseña"
                  type="password"
                  id="password"
                  autoComplete="current-password"
                  onChange={this.onChangeValues}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Checkbox value="remember" color="primary" />}
                  label="Recordarme"
                />
              </Grid>
            </Grid>
            <Button
              type="button"
              fullWidth
              variant="contained"
              color="primary"
              className="button__save"
              onClick={this.getUser}
            >
              Iniciar Sesión
            </Button>
            <Grid container justify="center">
              <Grid item>
                <Link href="/register" variant="body2">
                  No tienes una cuenta? Regístrate
                </Link>
              </Grid>
            </Grid>
          </div>
        </div>
        <Box mt={5}>
          <Typography variant="body2" color="textSecondary" align="center">
            {"Copyright © "}
            <Link color="inherit">
              TopTec
            </Link>{" "}
            {new Date().getFullYear()}
            {"."}
          </Typography>
        </Box>
      </Container>
    );
  }
}
