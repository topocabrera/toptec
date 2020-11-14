import React, { Component } from "react";
import PronosticDataService from "../../services/pronostic.service";

export default class listProduct extends Component {
  constructor(props) {
    super(props);
    this.onDataChange = this.onDataChange.bind(this);

    this.state = {
      products: [],
      currentProduct: null,
      currentIndex: -1,
      productoFilter: [],
      searchTitle: "",
    };
  }

  componentDidMount() {
    // PronosticDataService.getAll()
    //   .orderByChild("id")
    //   .on("value", this.onDataChange);
  }

  componentWillUnmount() {
    // PronosticDataService.getAll().off("value", this.onDataChange);
  }

  onDataChange(items) {
    const products = [];
    items.forEach((item) => {
      let key = item.key;
      let data = item.val();
      products.push({
        key,
        id: data.id,
        codigo: data.codigo,
        descripcion: data.descripcion,
        marca: data.marca,
        stock: data.stock,
        precio: data.precio,
      });
    });

    this.setState({ products });
  }

  render() {
    // const { products, searchTitle, productoFilter } = this.state;
    return (
      <div className="list row">
        <div className="col-md-6">
          <h4>Tabla de posiciones</h4>
          <div className="table-container">
            <table className="table">
              <thead className="thead-dark">
                <tr>
                  <th scope="col">Nombre</th>
                  <th scope="col">Puntaje</th>
                 
                </tr>
              </thead>
              <tbody>
                {/* {products &&
                  displayTable.map((producto, index) => {
                    return ( */}
                      <tr key={1}>
                        <td>{'jcabrera'}</td>
                        <td>{15}</td>
                      </tr>
                    {/* ); */}
                  {/* })} */}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}
