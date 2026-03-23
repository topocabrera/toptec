import React, { Component } from "react";
import { Toast, Modal } from "antd-mobile";
import SearchIcon from "@mui/icons-material/Search";
import { IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { getSmartService, generateSmartRoute, hasPermission } from "../../../../utils/routeHelper";
import { NICO_PRODUCT_LABELS } from "../../../../utils/productNicoLabels";

const alert = Modal.alert;

export default class ListProductNico extends Component {
  constructor(props) {
    super(props);
    this.onDataChange = this.onDataChange.bind(this);
    this.searchTitle = this.searchTitle.bind(this);
    this.deleteProduct = this.deleteProduct.bind(this);
    this.deleteSelected = this.deleteSelected.bind(this);
    this.toggleSelectAll = this.toggleSelectAll.bind(this);
    this.toggleSelect = this.toggleSelect.bind(this);

    this.state = {
      products: [],
      productoFilter: [],
      searchTitle: "",
      selectedKeys: [],
    };
  }

  componentDidMount() {
    const ProductosService = getSmartService("productos");
    ProductosService.getAll()
      .orderByChild("id")
      .on("value", this.onDataChange);
  }

  componentWillUnmount() {
    const ProductosService = getSmartService("productos");
    ProductosService.getAll().off("value", this.onDataChange);
  }

  onDataChange(items) {
    const products = [];
    items.forEach((item) => {
      const key = item.key;
      const data = item.val();
      products.push({
        key,
        id: data.id,
        codigo: data.codigo,
        descripcion: data.descripcion,
        familia: data.familia,
        ean: data.ean,
        uxb: data.uxb,
        precioListaSIVA: data.precioListaSIVA,
        precioSugeridoCIVA: data.precioSugeridoCIVA,
      });
    });
    this.setState({ products });
  }

  searchTitle(e) {
    const value = e.target.value;
    const { products } = this.state;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      if (value) {
        const v = value.toLowerCase();
        const filter = products.filter(
          (p) =>
            (p.descripcion && p.descripcion.toLowerCase().includes(v)) ||
            (p.codigo && String(p.codigo).toLowerCase().includes(v)) ||
            (p.familia && p.familia.toLowerCase().includes(v)) ||
            (p.ean && String(p.ean).includes(v))
        );
        this.setState({ productoFilter: filter, searchTitle: value });
      } else {
        this.setState({ searchTitle: "", productoFilter: [] });
      }
    }, 300);
  }

  deleteProduct(key) {
    const ProductosService = getSmartService("productos");
    ProductosService.delete(key)
      .then(() => Toast.success("Eliminado correctamente!!", 1))
      .catch(() => Toast.fail("Ocurrió un error", 1));
  }

  toggleSelectAll(e) {
    const displayTable = this.state.searchTitle !== "" ? this.state.productoFilter : this.state.products;
    if (e.target.checked) {
      this.setState({ selectedKeys: displayTable.map((p) => p.key) });
    } else {
      this.setState({ selectedKeys: [] });
    }
  }

  toggleSelect(key) {
    this.setState((prev) => {
      const set = new Set(prev.selectedKeys);
      if (set.has(key)) set.delete(key);
      else set.add(key);
      return { selectedKeys: Array.from(set) };
    });
  }

  deleteSelected() {
    const { selectedKeys } = this.state;
    if (selectedKeys.length === 0) {
      Toast.fail("Seleccioná al menos un producto", 1);
      return;
    }
    alert(
      "Eliminar productos",
      `¿Eliminar ${selectedKeys.length} producto(s) seleccionado(s)?`,
      [
        { text: "Cancelar" },
        {
          text: "Eliminar",
          onPress: () => {
            const ProductosService = getSmartService("productos");
            let done = 0;
            const total = selectedKeys.length;
            selectedKeys.forEach((key) => {
              ProductosService.delete(key)
                .then(() => {
                  done++;
                  if (done === total) Toast.success("Eliminados correctamente", 1);
                })
                .catch(() => Toast.fail("Error al eliminar", 1));
            });
            this.setState({ selectedKeys: [] });
          },
        },
      ]
    );
  }

  formatValue(val) {
    if (val == null || val === "") return "-";
    if (typeof val === "number" && !Number.isInteger(val)) return val.toFixed(2);
    return String(val);
  }

  formatPrecio(val) {
    if (val == null || val === "") return "-";
    const n = parseFloat(val);
    if (isNaN(n)) return "-";
    return `$${n.toFixed(2)}`;
  }

  render() {
    const { products, searchTitle, productoFilter, selectedKeys } = this.state;
    const displayTable = searchTitle !== "" ? productoFilter : products;
    const labels = NICO_PRODUCT_LABELS;
    const canEdit = hasPermission("edit_products");

    return (
      <div className="list row">
        <div className="col-md-6">
          <div className="new-reservation">
            {canEdit && (
              <>
                <a className="btn btn-primary" href={generateSmartRoute("/products")} role="button">
                  Nuevo producto
                </a>
                <a className="btn btn-primary ml-2" href={generateSmartRoute("/products-bulk")} role="button">
                  Carga masiva (Excel/CSV)
                </a>
              </>
            )}
          </div>
          <div className="col-md-8">
            <div className="input-group mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por código, descripción, familia, EAN..."
                onChange={this.searchTitle}
              />
              <div className="input-group-append">
                <button className="btn btn-outline-secondary search-button" type="button">
                  <SearchIcon color="action" />
                </button>
              </div>
            </div>
          </div>
          {canEdit && selectedKeys.length > 0 && (
            <div className="mb-2">
              <button type="button" className="btn btn-danger" onClick={this.deleteSelected}>
                Eliminar seleccionados ({selectedKeys.length})
              </button>
            </div>
          )}
          <h4>Listado de productos (Nico)</h4>
          <div className="table-container">
            <table className="table">
              <thead className="thead-dark">
                <tr>
                  {canEdit && (
                    <th scope="col">
                      <input
                        type="checkbox"
                        onChange={this.toggleSelectAll}
                        checked={displayTable.length > 0 && selectedKeys.length === displayTable.length}
                      />
                    </th>
                  )}
                  <th scope="col">{labels.codigo}</th>
                  <th scope="col">{labels.descripcion}</th>
                  <th scope="col">{labels.familia}</th>
                  <th scope="col">{labels.ean}</th>
                  <th scope="col">{labels.uxb}</th>
                  <th scope="col">{labels.precioListaSIVA}</th>
                  <th scope="col">{labels.precioSugeridoCIVA}</th>
                  {canEdit && <th scope="col">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {displayTable.map((p, index) => (
                  <tr key={p.key || index}>
                    {canEdit && (
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedKeys.includes(p.key)}
                          onChange={() => this.toggleSelect(p.key)}
                        />
                      </td>
                    )}
                    <td>{this.formatValue(p.codigo)}</td>
                    <td>{this.formatValue(p.descripcion)}</td>
                    <td>{this.formatValue(p.familia)}</td>
                    <td>{this.formatValue(p.ean)}</td>
                    <td>{this.formatValue(p.uxb)}</td>
                    <td>{this.formatPrecio(p.precioListaSIVA)}</td>
                    <td>{this.formatPrecio(p.precioSugeridoCIVA)}</td>
                    {canEdit && (
                      <td className="column-actions">
                        <IconButton
                          className="action__link"
                          href={generateSmartRoute(`/product/${p.id}`)}
                          role="button"
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          type="button"
                          className="action__button"
                          size="small"
                          onClick={() =>
                            alert("Eliminar", "¿Estás seguro?", [
                              { text: "Cancelar" },
                              { text: "Ok", onPress: () => this.deleteProduct(p.key) },
                            ])
                          }
                        >
                          <DeleteIcon sx={{ color: "red" }} />
                        </IconButton>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}
