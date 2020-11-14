import React, { Component } from "react";
import {
  Button,
  TextField,
  Typography,
  RadioGroup,
  Container,
  Paper,
  Radio,
  Select,
} from "@material-ui/core";
import PronosticDataService from "../../services/pronostic.service";
// import marcas from "../../../utils/default";

const currentUser = JSON.parse(localStorage.getItem("currentUser"));

export default class Pronostic extends Component {
  constructor(props) {
    super(props);
    this.getFechas = this.getFechas.bind(this);
    // this.onChangeDescripcion = this.onChangeDescripcion.bind(this);
    // this.onChangeMarca = this.onChangeMarca.bind(this);
    // this.onChangeStock = this.onChangeStock.bind(this);
    // this.onChangePrecio = this.onChangePrecio.bind(this);
    this.onDataChange = this.onDataChange.bind(this);
    this.saveProduct = this.saveProduct.bind(this);
    this.handleChange = this.handleChange.bind(this);

    this.state = {
      pronostico: {
        userId: "",
        fecha: "",
        pronosticos: {},
      },
      competencia: 'lpf',
      lastId: 0,
      equipos: [],
      fechas: [],

      submitted: false,
    };
  }

  componentDidMount() {
    PronosticDataService.getEquipos()
      .orderByChild("id")
      .once("value", this.onDataChange);
    PronosticDataService.getFechas()
      // .orderByChild("id")
      .once("child_added", this.getFechas);
  }

  componentWillUnmount() {
    PronosticDataService.getEquipos().off("child_added", this.onDataChange);
  }

  onDataChange(items) {
    let equipos = [];
    items.forEach((item) => {
      let data = item.val();
      equipos.push({
        id: data.id,
        equipo: data.equipo,
      });
    });

    this.setState({ equipos });
  }

  getFechas(items) {
    let fechas = [];
    let data = items.val().cruces;
    data.forEach((item) => {
      //   let data = item.val().cruces;
      fechas.push({
        cruce: item.cruce,
      });
    });

    this.setState({ fechas });
  }

  handleChange(e, index) {
    const { pronostico } = this.state;
    console.log(e.target.value);
    const value = e.target.value;
    const numberCruce = `cruce${index}`;
    pronostico.pronosticos[numberCruce] = value;
    const pronos = pronostico.pronosticos;
    console.log("pronosss", pronos);
    this.setState({
      pronostico: {
        ...pronostico,
        pronosticos: pronos,
      },
    });
  }

  saveProduct() {
    let data = {
      id: 1,
      fecha: "fecha1",
      userName: currentUser.userName,
      pronosticos: this.state.pronostico.pronosticos,
    };
    console.log(data);
    // let data = {
    //   id: this.state.lastId + 1,
    //   codigo: this.state.codigo,
    //   descripcion: this.state.descripcion,
    //   stock: parseInt(this.state.stock, 10),
    //   marca: this.state.marca,
    //   precio: this.state.precio,
    // };

    PronosticDataService.create(data)
      .then(() => {
        this.setState({
          submitted: true,
          lastId: this.state.lastId + 1,
        });
      })
      .catch((e) => {
        console.log(e);
      });
  }

  render() {
    const { fechas, equipos } = this.state;

    // console.log('fechas', this.state.fechas);
    // console.log('equipos', this.state.equipos);
    return (
      <Container component="main" maxWidth="xs">
        {this.state.submitted ? (
          <div>
            <h4>Pronóstico creado correctamente!</h4>
            <a
              className="btn btn-primary go-listado"
              href="/positions"
              role="button"
            >
              Tabla de posiciones
            </a>
          </div>
        ) : (
          <div className="form-container">
            <Typography component="h1" variant="h5">
              Pronóstico
            </Typography>
            {fechas.map((cruce, index) => {
              const splitCruce = cruce.cruce.split(",");
              const cruce1 = parseInt(splitCruce[0], 10);
              const cruce2 = parseInt(splitCruce[1], 10);
              return (
                <Paper className="container__cruce" key={index}>
                  <div>
                    <span className="title-results">
                      L
                    </span>
                    <span className="title-results">
                      E
                    </span>
                    <span className="title-results">
                      V
                    </span>
                  </div>
                  {/* <img className="image-logo" alt="logo" src={process.env.PUBLIC_URL + `/${cruce1}.png`} /> */}
                  <div className="first-cruce">
                    {/* <img src="https://2.bp.blogspot.com/-q4h7P57sRxQ/WkAcvKMJqJI/AAAAAAAAHK0/iOPrHux6szwq3OtOmatPWWD314tUUd0CQCLcBGAs/s1600/escudo_Talleres.png" /> */}
                    <span>
                      {equipos.filter((a) => a.id === cruce1)[0].equipo}
                    </span>
                  </div>
                  <div className="buttons-select">
                    <RadioGroup
                      row
                      aria-label="position"
                      name="position"
                      defaultValue="top"
                    >
                      <Radio
                        // checked={selectedValue === 'a'}
                        onChange={(e) => this.handleChange(e, index)}
                        className="radio-option"
                        color="primary"
                        value="L"
                        name="radio-button-demo"
                        inputProps={{ "aria-label": "A" }}
                      />
                      <Radio
                        // checked={selectedValue === 'b'}
                        onChange={(e) => this.handleChange(e, index)}
                        color="primary"
                        value="E"
                        className="radio-option"
                        name="radio-button-demo"
                        inputProps={{ "aria-label": "B" }}
                      />
                      <Radio
                        // checked={selectedValue === 'd'}
                        onChange={(e) => this.handleChange(e, index)}
                        value="V"
                        color="primary"
                        className="radio-option"
                        name="radio-button-demo"
                        inputProps={{ "aria-label": "D" }}
                      />
                    </RadioGroup>
                  </div>
                  {/* <img className="image-logo" alt="logo" src={process.env.PUBLIC_URL + `/${cruce2}.png`} /> */}
                  <div className="second-cruce">
                    <span>
                      {equipos.filter((a) => a.id === cruce2)[0].equipo}
                    </span>
                  </div>
                </Paper>
              );
            })}
            <div className="login-container">
              <Button
                type="button"
                fullWidth
                variant="contained"
                color="primary"
                className="button__save"
                onClick={this.saveProduct}
              >
                Aceptar
              </Button>
            </div>
          </div>
        )}
      </Container>
    );
  }
}
