import React, { Component } from "react";
import moment from "moment";
import { Button } from "@material-ui/core";
import PrintOutlinedIcon from "@material-ui/icons/PrintOutlined";
import PedidosDataService from "../../../services/pedidos.service";
import ClientesDataService from "../../../services/clients.service";

export default class Pedido extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pedido: {
        id: 0,
        idCliente: 0,
        clienteName: "",
        clienteDomicilio: "",
        productos: [],
        fecha: moment(new Date().getTime()).format("DD-MM-YYYY hh:mm"),
        total: 0,
        status: "Creado",
        fechaEntrega: moment(new Date().getTime())
          .add(1, "days")
          .format("DD-MM-YYYY"),
      },
      currentClient: [],
    };
    this.getPedido = this.getPedido.bind(this);
    this.print = this.print.bind(this);
    this.getClient = this.getClient.bind(this);
  }

  componentDidMount() {
    const id = parseInt(this.props.match.params.id, 10);
    PedidosDataService.getAll()
      .orderByChild("id")
      .equalTo(id)
      .once("child_added", this.getPedido);
  }

  componentWillUnmount() {
    PedidosDataService.getAll().off("child_added", this.getPedido);
    ClientesDataService.getAll().off("value", this.getClient);
  }

  getPedido(item) {
    this.setState({
      pedido: item.val(),
    });
    ClientesDataService.getAll()
    .orderByChild("id")
    .equalTo(item.val().idCliente)
    .once("value", this.getClient);
  }

  getClient(items) {
    let key = Object.keys(items.val());
    let data = items.val();
    const currentClient = data[key];
    currentClient.key = key[0];
    this.setState({ currentClient });
  }

  print() {
    var printContents = document.getElementById("printContent").innerHTML;
    var originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;

    window.print();

    document.body.innerHTML = originalContents;
  }

  render() {
    const { pedido, currentClient } = this.state;
    // console.log(pedido)
    return (
      <div id="printContent">
        {/* <div className="control-bar">
          <div className="container">
            <div className="row">
              <div className="col-2-4">
                <div className="slogan">Facturación </div>

                <label for="config_tax">
                  IVA:
                  <input type="checkbox" id="config_tax" />
                </label>
                <label for="config_tax_rate" className="taxrelated">
                  Tasa:
                  <input type="text" id="config_tax_rate" value="13" />%
                </label>
                <label for="config_note">
                  Nota:
                  <input type="checkbox" id="config_note" />
                </label>
              </div>
            </div>
          </div>
        </div> */}
        <div className="col-12 text-center">
          {/* <a href="javascript:window.print()">Imprimir</a> */}
          <Button
            variant="contained"
            color="default"
            onClick={this.print}
            endIcon={<PrintOutlinedIcon />}
            className="button-print"
          >
            Imprimir
          </Button>
        </div>

        <div className="factura__container">
          {/* <header className="row">
            <div className="me">
              <p>
                <strong>Sistema Web S.A. de C.V.</strong>
                <br />
                234/90, New York Street
                <br />
                United States.
                <br />
              </p>
            </div>

            <div className="info">
              <p>
                Web: <a href="http://volkerotto.net">www.sistemasweb.la</a>
                <br />
                E-mail:{" "}
                <a href="mailto:info@obedalvarado.pw">info@obedalvarado.pw</a>
                <br /> 
                Tel: +456-345-908-559
                 <br />
                Twitter: @alvarado_obed *
              </p>
            </div>
             <div className="bank">
            <p contenteditable>
              Datos bacarios: <br />
              Titular de la cuenta: <br />
              IBAN: <br />
              BIC:
            </p>
          </div> 
          </header> */}

          <div className="row section">
            {/* <div className="col-6">
              <h1 contenteditable>Factura</h1>
            </div> */}
            <div className="col-6">
              <span className="client">
                <strong>
                  Cliente: {pedido.idCliente.toString().padStart(5, "0")} - {pedido.clienteName}
                </strong>
                <br />
                <p className="client-detail">Domicilio: {pedido.clienteDomicilio}</p>
                <br />
                <p className="client-cuit">CUIT: {currentClient.dni}</p>
                <p className="client-detail right">Condición IVA: {currentClient.condicionIva}</p>
              </span>
              <p className="vendedor">
                <strong>Vendedor</strong>
                <br />
                {pedido.user}
              </p>
            </div>

            <div className="col-4 details">
              <p>
                Fecha: {moment(pedido.fecha, "DD-MM-YYYY hh:mm").format("DD/MM/YYYY")}
                <br />
                Factura #: 001 - {pedido.id.toString().padStart(5, "0")}
                <br />
                {pedido.condPago ? `Cond. de pago: ${pedido.condPago}` : ''}
              </p>
            </div>

            {/* <div className="col-2">
            <p contenteditable className="client">
              <strong>Enviar a</strong>
              <br />
              [Nombre cliente]
              <br />
              [Nombre emmpresa]
              <br />
              [Dirección empresa]
              <br />
              [Tel empresa]
            </p>
          </div> */}
          </div>

          {/* <div className="row section">
          <div className="col-1">
            <table>
              <thead contenteditable>
                <tr className="invoice_detail">
                  <th width="25%">Vendedor</th>
                  <th width="25%">Orden de compra </th>
                  <th width="20%">Enviar por</th>
                  <th width="30%">Términos y condiciones</th>
                </tr>
              </thead>
              <tbody contenteditable>
                <tr className="invoice_detail">
                  <td width="25%">John Doe</td>
                  <td width="25%">#PO-2020 </td>
                  <td width="20%">DHL</td>
                  <td width="30%">Pago al contado</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div> */}

          <div className="invoicelist-body">
            <table className="table-container">
              <thead>
                <tr>
                  <th width="5%">Código</th>
                  <th width="60%">Descripción</th>

                  <th width="10%">Cant.</th>
                  <th width="10%">Peso</th>
                  <th width="15%">Precio</th>
                  <th>Bonif.</th>
                  <th width="10%">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {pedido.productos.map((prod, index) => (
                  <tr key={index}>
                    <td width="5%">
                      <span>{prod.codigo}</span>
                    </td>
                    <td width="60%">
                      <span>{prod.descripcion}</span>
                    </td>
                    <td className="amount">
                      <span>{prod.cantidad}</span>
                    </td>
                    <td className="amount">
                      <span>{prod.peso}</span>
                    </td>
                    <td className="rate">
                      <span>{prod.precio}</span>
                    </td>
                    <td>
                      <span>
                        {prod.descuento !== ""
                          ? `${parseInt(prod.descuento, 10).toFixed(2)}%`
                          : "0.00%"}
                      </span>
                    </td>
                    <td className="rate">
                      <span>{prod.subtotal.toFixed(2)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="invoicelist-footer">
            <table>
              {/* <tr className="taxrelated">
              <td>IVA:</td>
              <td id="total_tax"></td>
            </tr> */}
              <tbody>
                <tr>
                  <td>
                    <strong>Total:</strong>
                  </td>
                  <td className="total_price" id="total_price">
                    {pedido.total.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* <div className="note" contenteditable>
          <h2>Nota:</h2>
        </div> */}

          {/* <footer className="row">
          <div className="col-1 text-center">
            <p className="notaxrelated" contenteditable>
              El monto de la factura no incluye el impuesto sobre las ventas.
            </p>
          </div>
        </footer> */}
        </div>

        <div className="factura__container">
          <div className="row section">
            <div className="col-6">
              <span className="client">
                <strong>
                  Cliente: {pedido.idCliente.toString().padStart(5, "0")} - {pedido.clienteName}
                </strong>
                <br />
                <p className="client-detail">Domicilio: {pedido.clienteDomicilio}</p>
                <br />
                <p className="client-cuit">CUIT: {currentClient.dni}</p>
                <p className="client-detail right">Condición IVA: {currentClient.condicionIva}</p>
              </span>
              <p className="vendedor">
                <strong>Vendedor</strong>
                <br />
                {pedido.user}
              </p>
            </div>

            <div className="col-4 details">
              <p>
                Fecha: {moment(pedido.fecha, "DD-MM-YYYY hh:mm").format("DD/MM/YYYY")}
                <br />
                Factura #: 001 - {pedido.id.toString().padStart(5, "0")}
                <br />
                {pedido.condPago ? `Cond. de pago: ${pedido.condPago}` : ''}
              </p>
            </div>
          </div>

          <div className="invoicelist-body">
            <table className="table-container">
              <thead>
                <tr>
                  <th width="5%">Código</th>
                  <th width="60%">Descripción</th>

                  <th width="10%">Cant.</th>
                  <th width="10%">Peso</th>
                  <th width="15%">Precio</th>
                  <th>Bonif.</th>
                  <th width="10%">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {pedido.productos.map((prod, index) => (
                  <tr key={index}>
                    <td width="5%">
                      <span>{prod.codigo}</span>
                    </td>
                    <td width="60%">
                      <span>{prod.descripcion}</span>
                    </td>
                    <td className="amount">
                      <span>{prod.cantidad}</span>
                    </td>
                    <td className="amount">
                      <span>{prod.peso}</span>
                    </td>
                    <td className="rate">
                      <span>{prod.precio}</span>
                    </td>
                    <td>
                      <span>
                        {prod.descuento !== ""
                          ? `${parseInt(prod.descuento, 10).toFixed(2)}%`
                          : "0.00%"}
                      </span>
                    </td>
                    <td className="rate">
                      <span>{prod.subtotal.toFixed(2)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="invoicelist-footer">
            <table>
              <tbody>
                <tr>
                  <td>
                    <strong>Total:</strong>
                  </td>
                  <td className="total_price" id="total_price">
                    {pedido.total.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}
