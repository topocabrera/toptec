import React, { Component } from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
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
import EditPedidoWrapper from "./components/Logistic/Pedido/EditPedidoWrapper";
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

//Dental
import AddClientDental from "./components/DentalLogistic/Clients/addClient";
import EditClientDental from "./components/DentalLogistic/Clients/editClient";
import ListClientDental from "./components/DentalLogistic/Clients/ListClient";
import AddProductDental from "./components/DentalLogistic/Products/addProduct";
import ListProductDental from "./components/DentalLogistic/Products/ListProduct";
import EditProductDental from "./components/DentalLogistic/Products/editProduct";
import ListMarcas from "./components/DentalLogistic/Marcas/ListMarcas";
import AddMarca from "./components/DentalLogistic/Marcas/AddMarca";
import EditMarca from "./components/DentalLogistic/Marcas/EditMarca";
import PedidoDental from "./components/DentalLogistic/Pedido/pedido";

//Seguros
import AddClientsSeguros from "./components/Seguros/Clients/AddClients";
import ListClientsSeguros from "./components/Seguros/Clients/ListClients";
import EditClientsSeguros from "./components/Seguros/Clients/EditClients";

// MP
// import AddClient from "./components/Logistic/Clients/addClient";
// import EditClient from "./components/Logistic/Clients/editClient";
import ListVisit from "./components/Paddle/Products/listProduct";
import AddItem from "./components/Paddle/Products/addProduct";
// import ListProduct from "./components/Paddle/Products/listProduct";
// import EditProduct from "./components/Paddle/Products/editProduct";
// import ChangePriceProduct from "./components/Logistic/Products/changePrice";
import AddTurno from "./components/Paddle/Turnos/addTurno";
import TurnoList from "./components/Paddle/Turnos/pedidoList";
// import Pedido from "./components/Paddle/Pedido/pedido";
// import PedidoList from "./components/Paddle/Pedido/pedidoList";
// import EditPedido from "./components/Paddle/Pedido/editPedido";
// import Factura from "./components/Paddle/Pedido/facturaTemplate";

import NavBar from "./components/NavBar/NavBar";

import FooterView from "./components/FooterView";
import PedidoWrapper from "./components/Logistic/Pedido/PedidoWrapper";
import PedidoListWrapper from "./components/Logistic/Pedido/PedidoListWrapper";
import ClientPedidos from "./components/Logistic/Clients/clientPedidos";
import ComprasList from "./components/Logistic/Compras/comprasList";
import AddCompra from "./components/Logistic/Compras/addCompra";

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
        {(currentUser?.rol === "windy" || currentUser?.rol === "admin" || currentUser?.rol === "seguros")
          ? (
            <NavBar />
          ) : (
            <nav
              className="navbar navbar-expand-md navbar-dark bg-dark"
              role="navigation"
            >
              <div className="container-fluid">
                <a className="navbar-brand" href="/">
                  {currentUser && currentUser?.rol === "gym" ? "FactoryGYM" : "TopTec"}
                  {currentUser && currentUser?.rol === "paddle" && "Mundo Padel"}
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
                    {(currentUser?.rol === "windy" ||
                      currentUser?.rol === "admin") && (
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
                    {(currentUser?.rol === "forest" ||
                      currentUser?.rol === "admin") && (
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
                    {(currentUser?.rol === "gym" ||
                      currentUser?.rol === "admin") && (
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
                    {(currentUser?.rol === "paddle" ||
                      currentUser?.rol === "admin") && (
                        <div className="dropdown-container">
                          <ul className="navbar-nav">
                            <li className="nav-item">
                              <Link to={"/mp/clients"} className="nav-link">
                                Clientes
                              </Link>
                            </li>
                            <li className="nav-item">
                              <Link to={"/mp/products"} className="nav-link">
                                Productos
                              </Link>
                            </li>
                            <li className="nav-item">
                              <Link to={"/mp/turno-list"} className="nav-link">
                                Turnos
                              </Link>
                            </li>
                          </ul>
                        </div>
                      )}
                    {(currentUser?.rol === "forest" ||
                      currentUser?.rol === "admin") && (
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
          )}

        <div className="container mt-3">
          <Routes>
            {/* // Login */}

            <Route path="/login" element={<SignIn />} />
            <Route path="/register" element={<SignUp />} />

            {/* // Gym */}

            {(currentUser?.rol === "dental" ||
              currentUser?.rol === "admin") && (
                <>
                  <Route path="/member-list" element={<ListMember />} />
                  <Route path="/members" element={<ValidateMember />} />
                  {currentUser && (currentUser?.rol === "admin" || currentUser.userName === 'lucasnovach') &&
                    <Route path="/members/:id" element={<EditMember />} />
                  }
                  <Route path="/add-member" element={<AddMembers />} />
                </>
              )}

            {/* // Windy */}
            {(currentUser?.rol === "windy" ||
              currentUser?.rol === "admin") && (
                <React.Fragment>
                  <Route
                    path={
                      currentUser && (currentUser?.rol === "windy" ||
                        currentUser?.rol === "admin")
                      && "/"
                    }
                    element={<ListClient />}
                  />
                  <Route path="/logistic/list-client" element={<ListClient />} />
                  <Route path="/logistic/client" element={<AddClient />} />
                  <Route path="/logistic/client/:id" element={<EditClient />} />
                  <Route path="/logistic/list-products" element={<ListProduct />} />
                  <Route path="/logistic/products" element={<AddProduct />} />
                  <Route path="/logistic/product/:id" element={<EditProduct />} />
                  <Route path="/logistic/imprimir/:id" element={<Factura />} />
                  <Route path="/logistic/change-price" element={<ChangePriceProduct />} />
                  <Route path="/logistic/new-visit" element={<Visita />} />
                  <Route path="/logistic/list-pedidos" element={<PedidoListWrapper />} />
                  <Route path="/logistic/pedido/:id" element={<PedidoWrapper />} />
                  <Route path="/logistic/edit-pedido/:id" element={<EditPedidoWrapper />} />
                  <Route path="/logistic/client-pedidos/:id" element={<ClientPedidos />} />
                  <Route path="/logistic/compras-list" element={<ComprasList />} />
                  <Route path="/logistic/compra" element={<AddCompra />} />
                </React.Fragment>
              )}

            {/* // Seguros */}
            {(currentUser?.rol === "seguros" ||
              currentUser?.rol === "admin") && (
                <React.Fragment>
                  <Route
                    path={
                      currentUser && (currentUser?.rol === "seguros" ||
                        currentUser?.rol === "admin")
                      && "/"
                    }
                    element={<ListClientsSeguros />}
                  />
                  <Route path="/cseguros/list-clients" element={<ListClientsSeguros />} />
                  <Route path="/cseguros/create" element={<AddClientsSeguros />} />
                  <Route path="/cseguros/client/:id" element={<EditClientsSeguros />} />

                </React.Fragment>
              )}
          </Routes>
        </div>
        {/* <FooterView /> */}
      </div>
    );
  }
}

export default App;
