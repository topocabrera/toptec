import React, { Component } from "react";
import { Switch, Route, Link, Redirect } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-datetime/css/react-datetime.css";
import "./App.scss";
import "antd-mobile/dist/antd-mobile.css";

import AddTutorial from "./components/add-tutorial.component";
import TutorialsList from "./components/tutorials-list.component";
import DeleteReservas from "./components/admin/adminReservations";

//Login
import SignIn from "./components/Login/SignIn";
import SignUp from "./components/Login/SignUp";
import Profile from "./components/Login/Profile";
// Forest
import ReservasList from "./components/Reservation/reservaList";
import Reservation from "./components/Reservation/add-reservation";
import EditReserva from "./components/Reservation/editReserva";
import AddMesa from "./components/Reservation/addMesa";
import MesasMap from "./components/Reservation/mesasMap";
// Windy
import AddClient from "./components/Logistic/Clients/addClient";
import EditClient from "./components/Logistic/Clients/editClient";
import ListClient from "./components/Logistic/Clients/listClient";
import AddProduct from "./components/Logistic/Products/addProduct";
import ListProduct from "./components/Logistic/Products/listProduct";
import EditProduct from "./components/Logistic/Products/editProduct";
import ChangePriceProduct from "./components/Logistic/Products/changePrice";
import Pedido from "./components/Logistic/Pedido/pedido";
import PedidoList from "./components/Logistic/Pedido/pedidoList";
import EditPedido from "./components/Logistic/Pedido/editPedido";
import Factura from "./components/Logistic/Pedido/facturaTemplate";
import Visita from "./components/Logistic/Pedido/visita";
//Prode
import Pronostic from "./components/Prode/addPronostic";
import Positions from "./components/Prode/positions";

//Gym
import AddMembers from "./components/Members/addMember";
import ListMember from "./components/Members/listMember";
import ValidateMember from "./components/Members/validateMember";
import EditMember from "./components/Members/editMember";

import FooterView from "./components/FooterView";

// const [setAnchorEl] = React.useState(null);
class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      show: false,
      toggle: false,
    };
    this.handleClick = this.handleClick.bind(this);
    this.toggleButton = this.toggleButton.bind(this);
  }

  handleClick(event) {
    this.setState({ show: !this.state.show });
  }

  toggleButton() {
    this.setState({ toggle: !this.state.toggle });
  }

  render() {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;

    return (
      <div>
        {/* <nav className="navbar navbar-expand-md navbar-dark bg-dark">
  <div className="container-fluid">
    <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
      <span className="navbar-toggler-icon"></span>
    </button>
    <div className="collapse navbar-collapse" id="navbarSupportedContent">
      <ul className="navbar-nav">
        <li className="nav-item">
          <a className="nav-link" href="#">Link</a>
        </li>
        <li className="nav-item dropdown">
          <a className="nav-link dropdown-toggle" href="#" id="navbarDropdown2" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          Dropdown
          </a>
          <div className="dropdown-menu" aria-labelledby="navbarDropdown2">
            <a className="dropdown-item" href="#">Action</a>
            <a className="dropdown-item" href="#">Another action</a>
            <div className="dropdown-divider"></div>
            <a className="dropdown-item" href="#">Something else here</a>
          </div>
        </li>
        <li className="nav-item dropdown">
          <a className="nav-link dropdown-toggle" href="#" id="navbarDropdown3" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          Dropdown
          </a>
          <div className="dropdown-menu" aria-labelledby="navbarDropdown3">
            <a className="dropdown-item" href="#">Action</a>
            <a className="dropdown-item" href="#">Another action</a>
            <div className="dropdown-divider"></div>
            <a className="dropdown-item" href="#">Something else here</a>
          </div>
        </li>
        <li className="nav-item">
          <a className="nav-link" href="#">Link</a>
        </li>
      </ul>
    </div>
  </div>
</nav> */}
        <nav
          className="navbar navbar-expand-md navbar-dark bg-dark"
          role="navigation"
        >
          <div className="container-fluid">
            <a className="navbar-brand" href="/">
            {currentUser.rol === "gym" ? "FactoryGYM" : "TopTec"}
            </a>
            {currentUser && (
              <button
                className="navbar-toggler"
                type="button"
                data-toggle="collapse"
                data-target="#navbarSupportedContent"
                aria-controls="navbarSupportedContent"
                aria-expanded="false"
                aria-label="Toggle navigation"
                onClick={this.toggleButton}
              >
                <span className="navbar-toggler-icon"></span>
              </button>
            )}
            {currentUser && (
              <div
                className={
                  this.state.toggle
                    ? "collapse navbar-collapse show"
                    : "collapse navbar-collapse"
                }
                id="navbarSupportedContent"
              >
                {(currentUser.rol === "windy" ||
                  currentUser.rol === "admin") && (
                  <div className="dropdown-container">
                    <ul className="navbar-nav">
                      <li className="nav-item">
                        <Link to={"/list-client"} className="nav-link">
                          Clientes
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link to={"/list-products"} className="nav-link">
                          Productos
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link to={"/list-pedidos"} className="nav-link">
                          Pedidos
                        </Link>
                      </li>
                    </ul>
                  </div>
                )}
                {(currentUser.rol === "forest" ||
                  currentUser.rol === "admin") && (
                  <div className="dropdown-container">
                    <ul className="navbar-nav">
                      <li className="nav-item">
                        <Link to={"/forest/reservas"} className="nav-link">
                          Listado de reservas
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link to={"/forest/reservation"} className="nav-link">
                          Nueva reserva
                        </Link>
                      </li>
                    </ul>
                  </div>
                )}
                {(currentUser.rol === "gym" ||
                  currentUser.rol === "admin") && (
                  <div className="dropdown-container">
                    <ul className="navbar-nav">
                      <li className="nav-item">
                        <Link to={"/members"} className="nav-link">
                          Inicio
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link to={"/add-member"} className="nav-link">
                          Nuevo Socio
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link to={"/member-list"} className="nav-link">
                          Listado de Socios
                        </Link>
                      </li>
                    </ul>
                  </div>
                )}
                {(currentUser.rol === "forest" ||
                currentUser.rol === "admin") && (
                  <div className="dropdown-container">
                    <ul className="navbar-nav">
                      <li className="nav-item">
                        <Link to={"/delete-reservas"} className="nav-link">
                          Eliminar reservas
                        </Link>
                      </li>
                    </ul>
                  </div>
                )}
                <div className="dropdown-container left">
                  <ul className="navbar-nav">
                    <li className="nav-item">
                      <a className="nav-link" href="/login">
                        Salir
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </nav>

        <div className="container mt-3">
          <Switch>
            <Route exact path={["/tutorials"]} component={TutorialsList} />

            <Route
              exact
              path={!currentUser ? ["/", "/login"] : "/login"}
              component={SignIn}
            />
            <Route exact path="/register" component={SignUp} />
            <Route exact path="/profile" component={Profile} />

            {currentUser ? (
              <React.Fragment>
                {/* // Forest */}
                {(currentUser.rol === "forest" ||
                  currentUser.rol === "admin") && (
                  <React.Fragment>
                    <Route
                      exact
                      path={
                        currentUser && currentUser.rol === "forest"
                          ? ["/", "/forest/reservas"]
                          : "/forest/reservas"
                      }
                      component={ReservasList}
                    />
                    <Route
                      exact
                      path="/forest/reservation"
                      component={Reservation}
                    />
                    <Route
                      exact
                      path="/forest/reserva/:id"
                      component={EditReserva}
                    />
                    <Route exact path="/forest/mesa/:id" component={AddMesa} />
                    <Route exact path="/forest/mesas" component={MesasMap} />
                  </React.Fragment>
                )}

                {/* // Windy */}
                {(currentUser.rol === "windy" ||
                  currentUser.rol === "admin") && (
                  <React.Fragment>
                    <Route
                      exact
                      path={
                        currentUser && currentUser.rol === "windy"
                          ? ["/", "/list-pedidos"]
                          : "/list-pedidos"
                      }
                      component={PedidoList}
                    />
                    <Route exact path="/pedido/:id" component={Pedido} />
                    <Route
                      exact
                      path="/edit-pedido/:id"
                      component={EditPedido}
                    />
                    <Route exact path="/list-client" component={ListClient} />
                    <Route exact path="/client" component={AddClient} />
                    <Route exact path="/client/:id" component={EditClient} />
                    <Route exact path="/products" component={AddProduct} />
                    <Route exact path="/product/:id" component={EditProduct} />
                    <Route
                      exact
                      path="/list-products"
                      component={ListProduct}
                    />
                    <Route
                      exact
                      path="/change-price"
                      component={ChangePriceProduct}
                    />
                    <Route exact path="/imprimir/:id" component={Factura} />
                    <Route exact path="/new-visit" component={Visita} />
                  </React.Fragment>
                )}
                {/* // Prode */}

                <Route
                  exact
                  path={
                    currentUser && currentUser.rol === "prode"
                      ? ["/", "/pronostico"]
                      : "/pronostico"
                  }
                  component={Pronostic}
                />
                <Route exact path="/positions" component={Positions} />

                 {/* // Gym */}

                 <Route
                  exact
                  path={
                    currentUser && currentUser.rol === "gym"
                      ? ["/", "/members"]
                      : "/members"
                  }
                  component={ValidateMember}
                />
                <Route exact path="/member-list" component={ListMember} />
                {currentUser && (currentUser.rol === "admin" || currentUser.userName === 'lucasnovach') &&
                 <Route exact path="/members/:id" component={EditMember} />
                }
                <Route exact path="/add-member" component={AddMembers} />


                {/* // Admin */}
                {currentUser.rol === "admin" && (
                  <React.Fragment>
                    <Route
                      exact
                      path={
                        currentUser && currentUser.rol === "admin"
                          ? ["/", "/add"]
                          : "add"
                      }
                      component={AddTutorial}
                    />
                    <Route
                      exact
                      path="/delete-reservas"
                      component={DeleteReservas}
                    />
                  </React.Fragment>
                )}
              </React.Fragment>
            ) : (
              <Redirect to="/login" />
            )}
          </Switch>
        </div>
        {/* <FooterView /> */}
      </div>
    );
  }
}

export default App;
