import React, { Component } from "react";
import { Toast } from "antd-mobile";
import { Button, Container, Typography } from "@mui/material";
import { getSmartService, generateSmartRoute } from "../../../../utils/routeHelper";
import { NICO_PRODUCT_LABELS } from "../../../../utils/productNicoLabels";
import { parseNicoWorkbook, parseNicoCSVText } from "../../../../utils/parseNicoExcel";

const XLSX = require("xlsx");

export default class BulkUploadNico extends Component {
  constructor(props) {
    super(props);
    this.handleFile = this.handleFile.bind(this);
    this.importAll = this.importAll.bind(this);
    this.state = {
      products: [],
      errors: [],
      loading: false,
      lastId: 0,
    };
  }

  componentDidMount() {
    const ProductosService = getSmartService("productos");
    ProductosService.getAll()
      .orderByChild("id")
      .limitToLast(1)
      .once("child_added", (snap) => {
        const val = snap.val();
        this.setState({ lastId: val?.id ?? 0 });
      });
  }

  handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = (file.name || "").toLowerCase();
    const isCsv = fileName.endsWith(".csv");

    if (isCsv) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const text = ev.target?.result || "";
          const { products, errors } = parseNicoCSVText(text);
          this.setState({ products, errors });
          if (products.length) Toast.success(`Se leyeron ${products.length} filas`, 1);
          if (errors.length) Toast.fail(errors[0], 2);
        } catch (err) {
          Toast.fail("Error al leer el CSV", 2);
          this.setState({ products: [], errors: [err.message] });
        }
      };
      reader.readAsText(file, "UTF-8");
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = new Uint8Array(ev.target?.result);
          const workbook = XLSX.read(data, { type: "array" });
          const { products, errors } = parseNicoWorkbook(workbook);
          this.setState({ products, errors });
          if (products.length) Toast.success(`Se leyeron ${products.length} filas`, 1);
          if (errors.length) Toast.fail(errors[0], 2);
        } catch (err) {
          Toast.fail("Error al leer el Excel", 2);
          this.setState({ products: [], errors: [err.message] });
        }
      };
      reader.readAsArrayBuffer(file);
    }
    e.target.value = "";
  }

  importAll() {
    const { products, lastId } = this.state;
    if (products.length === 0) {
      Toast.fail("No hay productos para importar. Cargá un Excel o CSV primero.", 2);
      return;
    }

    this.setState({ loading: true });
    const ProductosService = getSmartService("productos");
    let nextId = lastId + 1;
    let done = 0;
    const total = products.length;

    const createNext = (index) => {
      if (index >= products.length) {
        this.setState({ loading: false, products: [], lastId: nextId - 1 });
        Toast.success(`Importados ${total} productos correctamente`, 2);
        window.location.href = generateSmartRoute("/list-products");
        return;
      }

      const p = products[index];
      const data = {
        id: nextId++,
        codigo: p.codigo ?? null,
        descripcion: p.descripcion ?? null,
        familia: p.familia ?? null,
        ean: p.ean ?? null,
        uxb: p.uxb ?? null,
        precioListaSIVA: p.precioListaSIVA ?? null,
        precioSugeridoCIVA: p.precioSugeridoCIVA ?? null,
      };

      ProductosService.create(data)
        .then(() => {
          done++;
          if (done === total) {
            this.setState({ loading: false, products: [], lastId: nextId - 1 });
            Toast.success(`Importados ${total} productos correctamente`, 2);
            window.location.href = generateSmartRoute("/list-products");
          } else {
            createNext(index + 1);
          }
        })
        .catch((err) => {
          Toast.fail("Error al importar: " + (err.message || "Error"), 2);
          this.setState({ loading: false });
        });
    };

    createNext(0);
  }

  formatVal(v) {
    if (v == null || v === "") return "-";
    if (typeof v === "number" && !Number.isInteger(v)) return v.toFixed(2);
    return String(v);
  }

  render() {
    const { products, errors, loading } = this.state;
    const labels = NICO_PRODUCT_LABELS;

    return (
      <Container component="main" maxWidth="lg">
        <Typography component="h1" variant="h5" style={{ marginBottom: 16 }}>
          Carga masiva de productos (Nico)
        </Typography>
        <p>
          Subí un archivo Excel (.xlsx) o CSV con el formato TRADI: {Object.values(labels).join(", ")}.
        </p>
        <div className="mb-3">
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={this.handleFile}
            disabled={loading}
          />
        </div>
        {errors.length > 0 && (
          <div className="alert alert-warning">
            {errors.map((e, i) => (
              <div key={i}>{e}</div>
            ))}
          </div>
        )}
        {products.length > 0 && (
          <>
            <p>
              <strong>{products.length}</strong> producto(s) listos para importar.
            </p>
            <Button
              variant="contained"
              color="primary"
              onClick={this.importAll}
              disabled={loading}
              className="mb-3"
            >
              {loading ? "Importando..." : "Importar todos"}
            </Button>
            <a
              className="btn btn-secondary ml-2"
              href={generateSmartRoute("/list-products")}
              role="button"
            >
              Volver al listado
            </a>
            <div className="table-container" style={{ maxHeight: 400, overflow: "auto" }}>
              <table className="table table-sm">
                <thead className="thead-dark">
                  <tr>
                    <th>{labels.codigo}</th>
                    <th>{labels.descripcion}</th>
                    <th>{labels.familia}</th>
                    <th>{labels.ean}</th>
                    <th>{labels.uxb}</th>
                    <th>{labels.precioListaSIVA}</th>
                    <th>{labels.precioSugeridoCIVA}</th>
                  </tr>
                </thead>
                <tbody>
                  {products.slice(0, 50).map((p, i) => (
                    <tr key={i}>
                      <td>{this.formatVal(p.codigo)}</td>
                      <td>{this.formatVal(p.descripcion)}</td>
                      <td>{this.formatVal(p.familia)}</td>
                      <td>{this.formatVal(p.ean)}</td>
                      <td>{this.formatVal(p.uxb)}</td>
                      <td>{this.formatVal(p.precioListaSIVA)}</td>
                      <td>{this.formatVal(p.precioSugeridoCIVA)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {products.length > 50 && (
                <p className="text-muted">Mostrando los primeros 50 de {products.length}.</p>
              )}
            </div>
          </>
        )}
        {!products.length && !loading && (
          <a className="btn btn-outline-secondary" href={generateSmartRoute("/list-products")} role="button">
            Volver al listado
          </a>
        )}
      </Container>
    );
  }
}
