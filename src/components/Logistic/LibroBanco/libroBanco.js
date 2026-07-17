import React, { useState, useEffect } from "react";
import { Toast, Modal as AntdModal } from "antd-mobile";
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  Chip,
  Collapse
} from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import SettingsIcon from "@mui/icons-material/Settings";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import AddIcon from "@mui/icons-material/Add";
import PaymentIcon from "@mui/icons-material/Payment";
import SearchIcon from "@mui/icons-material/Search";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import RefreshIcon from "@mui/icons-material/Refresh";
import DeleteIcon from "@mui/icons-material/Delete";
import LinkIcon from "@mui/icons-material/Link";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import WarningIcon from "@mui/icons-material/Warning";
import moment from "moment";
import * as XLSX from "xlsx";
import { getSmartService, generateSmartRoute, getCurrentUser } from "../../../utils/routeHelper";
import firebase from "../../../firebase";

const alert = AntdModal.alert;

const formatArs = (num) =>
  (parseFloat(num) || 0).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2
  });

const LibroBanco = () => {
  const currentUser = getCurrentUser();

  const [tabValue, setTabValue] = useState(0);
  const [cuentasBancarias, setCuentasBancarias] = useState([]);
  const [selectedCuentaId, setSelectedCuentaId] = useState("");
  const [bankConfig, setBankConfig] = useState(null);
  const [movements, setMovements] = useState([]);
  const [movementsFilter, setMovementsFilter] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros de movements
  const [searchTitle, setSearchTitle] = useState("");
  const [filterState, setFilterState] = useState("todos"); // todos | pendiente | vinculado
  const [filterMonth, setFilterMonth] = useState(moment().format("YYYY-MM"));

  // Modales
  const [openConfigDialog, setOpenConfigDialog] = useState(false);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openMovementDialog, setOpenMovementDialog] = useState(false);
  const [openImportDialog, setOpenImportDialog] = useState(false);
  const [openVincularDialog, setOpenVincularDialog] = useState(false);

  // Estado para la configuración del banco (Edición)
  const [configForm, setConfigForm] = useState({
    bancoNombre: "",
    nroCuenta: "",
    cbu: "",
    saldoInicial: 0
  });

  // Estado para la creación de cuenta
  const [createForm, setCreateForm] = useState({
    bancoNombre: "",
    nroCuenta: "",
    cbu: "",
    saldoInicial: 0
  });

  // Estado para un nuevo movimiento manual
  const [movementForm, setMovementForm] = useState({
    fecha: moment().format("YYYY-MM-DD"),
    concepto: "",
    monto: "",
    tipo: "ingreso", // ingreso | egreso
    referenciaAdicional: ""
  });

  // Estado para la importación
  const [pastedText, setPastedText] = useState("");
  const [importedMovements, setImportedMovements] = useState([]);

  // Estado para vinculación
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [vincularOption, setVincularOption] = useState("gasto"); // cliente | proveedor | gasto | ajuste
  
  // Datos auxiliares de la BD para la vinculación
  const [clientesDeuda, setClientesDeuda] = useState([]);
  const [selectedClienteKey, setSelectedClienteKey] = useState("");
  const [proveedoresDeuda, setProveedoresDeuda] = useState([]);
  const [selectedProveedorName, setSelectedProveedorName] = useState("");
  const [gastosTipos] = useState([
    "NAFTA", "PEAJE", "A&B", "MATERIAL OFI", "LIMPIEZA", "VARIOS",
    "MANTENIM.", "ALQUILER", "LUZ", "AGUA", "INTERNET", "CONTADOR",
    "IMPUESTOS", "VEP", "ING BRUT", "SEGUROS", "COMISIONES", "VEHICULOS", "MOBILIARIO"
  ]);
  const [selectedGastoTipo, setSelectedGastoTipo] = useState("");
  const [gastoObs, setGastoObs] = useState("");
  const [ajusteObs, setAjusteObs] = useState("");

  // Estado para Cuenta Corriente de Proveedores
  const [proveedoresCtaCte, setProveedoresCtaCte] = useState([]);
  const [proveedoresFilter, setProveedoresFilter] = useState([]);
  const [searchProveedor, setSearchProveedor] = useState("");
  const [expandedProveedor, setExpandedProveedor] = useState(null);
  const [openPagoProveedorDialog, setOpenPagoProveedorDialog] = useState(false);
  const [pagoProveedorForm, setPagoProveedorForm] = useState({
    proveedor: "",
    monto: "",
    fecha: moment().format("YYYY-MM-DD"),
    comentarios: "",
    cuentaId: "",
    extraerBanco: false
  });

  const fetchBankData = () => {
    setLoading(true);
    const CuentasBancoService = getSmartService("cuentasBanco");
    const LibroBancoService = getSmartService("libroBanco");

    if (!CuentasBancoService || !LibroBancoService) {
      setLoading(false);
      return;
    }

    // Cargar config de banco
    CuentasBancoService.getAll().on("value", (snapshot) => {
      const list = [];
      snapshot.forEach((item) => {
        list.push({ key: item.key, ...item.val() });
      });
      setCuentasBancarias(list);
    });

    // Cargar movimientos
    LibroBancoService.getAll().on("value", (snapshot) => {
      const list = [];
      snapshot.forEach((item) => {
        list.push({
          key: item.key,
          ...item.val()
        });
      });
      // Ordenar por fecha desc y luego por creacion desc
      list.sort((a, b) => {
        const dateA = moment(a.fecha, "DD-MM-YYYY");
        const dateB = moment(b.fecha, "DD-MM-YYYY");
        if (dateB.isBefore(dateA)) return -1;
        if (dateA.isBefore(dateB)) return 1;
        return (b.fechaCreacion || "").localeCompare(a.fechaCreacion || "");
      });
      setMovements(list);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchBankData();
    return () => {
      const CuentasBancoService = getSmartService("cuentasBanco");
      const LibroBancoService = getSmartService("libroBanco");
      if (CuentasBancoService) CuentasBancoService.getAll().off("value");
      if (LibroBancoService) LibroBancoService.getAll().off("value");
    };
  }, []);

  useEffect(() => {
    if (cuentasBancarias.length > 0 && !selectedCuentaId) {
      setSelectedCuentaId(cuentasBancarias[0].key);
    }
  }, [cuentasBancarias, selectedCuentaId]);

  useEffect(() => {
    if (selectedCuentaId) {
      const active = cuentasBancarias.find((c) => c.key === selectedCuentaId);
      setBankConfig(active || null);
      if (active) {
        setConfigForm({
          bancoNombre: active.bancoNombre || "",
          nroCuenta: active.nroCuenta || "",
          cbu: active.cbu || "",
          saldoInicial: active.saldoInicial || 0
        });
      }
    } else {
      setBankConfig(null);
    }
  }, [selectedCuentaId, cuentasBancarias]);

  // Auto-migración de cuenta única antigua a multi-cuenta
  useEffect(() => {
    if (loading) return;
    
    if (cuentasBancarias.length === 0) {
      let oldPath = "/cuentaBancoConfig";
      if (currentUser?.rol === "nico") {
        oldPath = "/cuentaBancoConfig-nico";
      } else if (currentUser?.rol === "max") {
        oldPath = "/cuentaBancoConfig-max";
      }
      
      const oldConfigRef = firebase.ref(oldPath);
      oldConfigRef.once("value", (snapshot) => {
        const oldConfig = snapshot.val();
        if (oldConfig && oldConfig.bancoNombre) {
          console.log("Migrando cuenta única antigua a multi-cuenta...", oldConfig);
          const CuentasBancoService = getSmartService("cuentasBanco");
          const LibroBancoService = getSmartService("libroBanco");
          
          const newAccountData = {
            bancoNombre: oldConfig.bancoNombre,
            nroCuenta: oldConfig.nroCuenta || "",
            cbu: oldConfig.cbu || "",
            saldoInicial: parseFloat(oldConfig.saldoInicial) || 0,
            saldoActual: parseFloat(oldConfig.saldoActual) || 0
          };
          
          CuentasBancoService.create(newAccountData)
            .then((res) => {
              const newKey = res.key;
              console.log("Cuenta migrada con éxito. Nueva key:", newKey);
              
              // Vincular todos los movimientos sin cuentaId
              return LibroBancoService.getAll().once("value", (snapshotMovs) => {
                const updates = [];
                snapshotMovs.forEach((item) => {
                  const m = item.val();
                  if (!m.cuentaId) {
                    updates.push(LibroBancoService.get(item.key).update({ cuentaId: newKey }));
                  }
                });
                if (updates.length > 0) {
                  console.log(`Migrando ${updates.length} movimientos al ID de cuenta:`, newKey);
                  return Promise.all(updates);
                }
              });
            })
            .then(() => {
              console.log("Migración completada con éxito.");
              setSelectedCuentaId("");
              return oldConfigRef.remove();
            })
            .catch((err) => {
              console.error("Error en la migración de cuenta:", err);
            });
        }
      });
    }
  }, [cuentasBancarias, loading, currentUser]);

  // Recargar datos para Cuenta Corriente de Proveedores y de Clientes al cambiar pestaña
  useEffect(() => {
    if (tabValue === 1) {
      loadProveedoresCtaCte();
    }
  }, [tabValue]);

  // Filtrado de movimientos del Libro Diario
  useEffect(() => {
    let filtered = [...movements];

    // Filtrar por cuenta bancaria seleccionada
    if (selectedCuentaId) {
      filtered = filtered.filter((m) => m.cuentaId === selectedCuentaId);
    } else {
      filtered = [];
    }

    // Filtrar por mes
    if (filterMonth) {
      filtered = filtered.filter((m) => {
        const mMonth = moment(m.fecha, "DD-MM-YYYY").format("YYYY-MM");
        return mMonth === filterMonth;
      });
    }

    // Filtrar por estado
    if (filterState !== "todos") {
      filtered = filtered.filter((m) => m.estado === filterState);
    }

    // Filtrar por buscador
    if (searchTitle.trim()) {
      const query = searchTitle.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          (m.concepto || "").toLowerCase().includes(query) ||
          (m.referenciaAdicional || "").toLowerCase().includes(query)
      );
    }

    setMovementsFilter(filtered);
  }, [movements, filterMonth, filterState, searchTitle, selectedCuentaId]);

  // Cargar Cta. Cte. de Proveedores agrupando por compras
  const loadProveedoresCtaCte = () => {
    const ComprasService = getSmartService("compras");
    if (!ComprasService) return;

    ComprasService.getAll().once("value", (snapshot) => {
      const purchases = [];
      snapshot.forEach((item) => {
        purchases.push({
          key: item.key,
          ...item.val()
        });
      });

      // Filtrar compras a plazo con saldo pendiente
      const pendingPurchases = purchases.filter(
        (c) => c.condPago === "Cta Corriente" && (parseFloat(c.saldoPendiente) || 0) > 0
      );

      // Agrupar por Proveedor
      const grouped = {};
      pendingPurchases.forEach((c) => {
        const provName = (c.proveedor || "").trim() || "Proveedor Sin Nombre";
        const provKey = provName.toUpperCase();

        if (!grouped[provKey]) {
          grouped[provKey] = {
            proveedorName: provName,
            compras: [],
            saldoTotal: 0
          };
        }
        grouped[provKey].compras.push(c);
        grouped[provKey].saldoTotal += parseFloat(c.saldoPendiente) || 0;
      });

      const list = Object.values(grouped);
      list.sort((a, b) => a.proveedorName.localeCompare(b.proveedorName));
      setProveedoresCtaCte(list);
      setProveedoresFilter(list);
    });
  };

  // Filtrado de proveedores
  useEffect(() => {
    if (searchProveedor.trim()) {
      const query = searchProveedor.toLowerCase();
      setProveedoresFilter(
        proveedoresCtaCte.filter((p) => p.proveedorName.toLowerCase().includes(query))
      );
    } else {
      setProveedoresFilter(proveedoresCtaCte);
    }
  }, [searchProveedor, proveedoresCtaCte]);

  if (currentUser?.rol !== "windy" && currentUser?.rol !== "admin") {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error" gutterBottom>
          Acceso Denegado
        </Typography>
        <Typography variant="body1" color="text.secondary">
          No tiene permisos suficientes para acceder al módulo de Libro de Banco.
        </Typography>
      </Box>
    );
  }

  // Guardar configuración de cuenta bancaria seleccionada (Edición)
  const handleSaveConfig = () => {
    if (!configForm.bancoNombre.trim()) {
      Toast.fail("El nombre del banco es obligatorio", 2);
      return;
    }

    if (!selectedCuentaId) return;

    const CuentasBancoService = getSmartService("cuentasBanco");
    const data = {
      bancoNombre: configForm.bancoNombre,
      nroCuenta: configForm.nroCuenta,
      cbu: configForm.cbu,
      saldoInicial: parseFloat(configForm.saldoInicial) || 0,
      saldoActual: bankConfig ? bankConfig.saldoActual : (parseFloat(configForm.saldoInicial) || 0)
    };

    CuentasBancoService.update(selectedCuentaId, data)
      .then(() => {
        Toast.success("Cuenta bancaria actualizada con éxito", 2);
        setOpenConfigDialog(false);
      })
      .catch((e) => {
        console.error(e);
        Toast.fail("Error al guardar la configuración", 2);
      });
  };

  // Crear nueva cuenta bancaria
  const handleCreateAccount = () => {
    if (!createForm.bancoNombre.trim()) {
      Toast.fail("El nombre del banco es obligatorio", 2);
      return;
    }

    const CuentasBancoService = getSmartService("cuentasBanco");
    const data = {
      bancoNombre: createForm.bancoNombre,
      nroCuenta: createForm.nroCuenta,
      cbu: createForm.cbu,
      saldoInicial: parseFloat(createForm.saldoInicial) || 0,
      saldoActual: parseFloat(createForm.saldoInicial) || 0
    };

    CuentasBancoService.create(data)
      .then((res) => {
        Toast.success("Cuenta bancaria creada con éxito", 2);
        setOpenCreateDialog(false);
        setSelectedCuentaId(res.key);
        setCreateForm({
          bancoNombre: "",
          nroCuenta: "",
          cbu: "",
          saldoInicial: 0
        });
      })
      .catch((e) => {
        console.error(e);
        Toast.fail("Error al crear la cuenta", 2);
      });
  };

  // Eliminar cuenta bancaria
  const handleDeleteAccount = () => {
    if (!selectedCuentaId) return;
    AntdModal.alert(
      "Eliminar Cuenta",
      "¿Está seguro de eliminar esta cuenta bancaria? Todos los movimientos de la base de datos seguirán guardados.",
      [
        { text: "Cancelar" },
        {
          text: "Eliminar",
          onPress: () => {
            const CuentasBancoService = getSmartService("cuentasBanco");
            CuentasBancoService.delete(selectedCuentaId)
              .then(() => {
                Toast.success("Cuenta bancaria eliminada con éxito", 2);
                setSelectedCuentaId("");
              })
              .catch((e) => {
                console.error(e);
                Toast.fail("Error al eliminar la cuenta", 2);
              });
          }
        }
      ]
    );
  };

  // Guardar movimiento manual
  const handleSaveMovement = () => {
    if (!movementForm.concepto.trim()) {
      Toast.fail("El concepto es obligatorio", 2);
      return;
    }
    const montoNum = parseFloat(movementForm.monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      Toast.fail("El monto debe ser un número válido mayor a 0", 2);
      return;
    }

    if (!selectedCuentaId || !bankConfig) {
      Toast.fail("Seleccione o configure una cuenta bancaria primero", 2);
      return;
    }

    const CuentasBancoService = getSmartService("cuentasBanco");
    const LibroBancoService = getSmartService("libroBanco");

    const firmMonto = movementForm.tipo === "ingreso" ? montoNum : -montoNum;
    const nuevoSaldo = (bankConfig.saldoActual || 0) + firmMonto;

    const data = {
      fecha: moment(movementForm.fecha, "YYYY-MM-DD").format("DD-MM-YYYY"),
      concepto: movementForm.concepto.trim(),
      monto: firmMonto,
      estado: "vinculado", // manuales se consideran conciliados de forma directa
      tipoVinculo: "ajuste",
      cuentaId: selectedCuentaId,
      referenciaAdicional: movementForm.referenciaAdicional || "Movimiento manual",
      fechaCreacion: new Date().toISOString()
    };

    Promise.all([
      LibroBancoService.create(data),
      CuentasBancoService.update(selectedCuentaId, { saldoActual: nuevoSaldo })
    ])
      .then(() => {
        Toast.success("Movimiento registrado correctamente", 2);
        setOpenMovementDialog(false);
        setMovementForm({
          fecha: moment().format("YYYY-MM-DD"),
          concepto: "",
          monto: "",
          tipo: "ingreso",
          referenciaAdicional: ""
        });
      })
      .catch((e) => {
        console.error(e);
        Toast.fail("Error al guardar el movimiento", 2);
      });
  };

  // Parsear texto copiado del Homebanking
  const handleParsePastedText = () => {
    if (!pastedText.trim()) {
      Toast.fail("Pegue las filas de movimientos primero", 2);
      return;
    }

    const lines = pastedText.split("\n");
    const parsed = [];

    // Patrón robusto para detectar fecha (dd/mm/aaaa o dd-mm-aaaa)
    const dateRegex = /(\d{2})[/-](\d{2})[/-](\d{4})/;

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const dateMatch = trimmed.match(dateRegex);
      if (dateMatch) {
        const fecha = dateMatch[0];
        
        // Remover la fecha del texto para buscar importes
        const cleanLine = trimmed.replace(fecha, "").trim();

        // Buscar números al final de la línea o delimitados por tabs
        // Reemplazar comas de miles y formatear punto decimal para JavaScript
        const tokens = cleanLine.split(/[\t\s]+/);
        let monto = null;
        let conceptoTokens = [...tokens];

        // Buscar en los últimos tokens un valor numérico
        for (let i = tokens.length - 1; i >= 0; i--) {
          const t = tokens[i].trim();
          // Quitar caracteres no numéricos excepto signos, comas y puntos
          const cleanToken = t.replace(/[^0-9\-.,]/g, "");
          
          if (cleanToken) {
            // Intentar convertir
            let testVal = cleanToken;
            // Si tiene coma y punto, asumimos formato es-AR (1.234,56)
            if (cleanToken.includes(",") && cleanToken.includes(".")) {
              testVal = cleanToken.replace(/\./g, "").replace(",", ".");
            } else if (cleanToken.includes(",")) {
              // Si solo tiene coma, podría ser decimal (1234,56) o miles (1,234)
              // En homebanking en AR es decimal
              testVal = cleanToken.replace(",", ".");
            }
            
            const num = parseFloat(testVal);
            if (!isNaN(num) && num !== 0) {
              monto = num;
              // El concepto es todo lo anterior
              conceptoTokens = tokens.slice(0, i);
              break;
            }
          }
        }

        const concepto = conceptoTokens.join(" ").trim() || "Movimiento importado";

        if (fecha && monto !== null) {
          parsed.push({
            fecha: moment(fecha, "DD-MM-YYYY").format("DD-MM-YYYY"),
            concepto,
            monto
          });
        }
      }
    });

    if (parsed.length === 0) {
      Toast.fail("No se encontraron movimientos válidos. Verifique el formato.", 3);
    } else {
      setImportedMovements(parsed);
    }
  };

  // Manejar importación de Excel/CSV
  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const parsed = [];
        // Intentar mapear columnas buscando palabras claves en la primera fila
        let colFechaIdx = -1;
        let colConceptoIdx = -1;
        let colMontoIdx = -1;

        if (rows.length > 0) {
          const header = rows[0].map(h => (h || "").toString().toLowerCase());
          colFechaIdx = header.findIndex(h => h.includes("fecha") || h.includes("date"));
          colConceptoIdx = header.findIndex(h => h.includes("concepto") || h.includes("desc") || h.includes("detall"));
          colMontoIdx = header.findIndex(h => h.includes("monto") || h.includes("import") || h.includes("valor") || h.includes("total") || h.includes("movim"));
        }

        // Si no detectó por encabezado, usar índices por defecto 0, 1, 2
        if (colFechaIdx === -1) colFechaIdx = 0;
        if (colConceptoIdx === -1) colConceptoIdx = 1;
        if (colMontoIdx === -1) colMontoIdx = 2;

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          let rawFecha = row[colFechaIdx];
          let rawConcepto = row[colConceptoIdx] || "Movimiento importado";
          let rawMonto = row[colMontoIdx];

          if (!rawFecha) continue;

          // Si la fecha es un número serial de Excel
          let fechaStr = "";
          if (typeof rawFecha === "number") {
            fechaStr = moment(XLSX.SSF.parse_date_code(rawFecha)).format("DD-MM-YYYY");
          } else {
            fechaStr = moment(rawFecha.toString().trim(), ["DD/MM/YYYY", "DD-MM-YYYY", "YYYY-MM-DD"]).format("DD-MM-YYYY");
          }

          let montoVal = null;
          if (rawMonto !== undefined && rawMonto !== null) {
            const cleanM = rawMonto.toString().replace(/[^0-9\-.,]/g, "");
            let testVal = cleanM;
            if (cleanM.includes(",") && cleanM.includes(".")) {
              testVal = cleanM.replace(/\./g, "").replace(",", ".");
            } else if (cleanM.includes(",")) {
              testVal = cleanM.replace(",", ".");
            }
            montoVal = parseFloat(testVal);
          }

          if (fechaStr && !isNaN(montoVal)) {
            parsed.push({
              fecha: fechaStr,
              concepto: rawConcepto.toString().trim(),
              monto: montoVal
            });
          }
        }

        if (parsed.length === 0) {
          Toast.fail("No se leyeron movimientos del archivo.", 2);
        } else {
          setImportedMovements(parsed);
          Toast.success(`Se leyeron ${parsed.length} movimientos.`, 2);
        }
      } catch (err) {
        console.error(err);
        Toast.fail("Error al leer el archivo Excel/CSV", 2);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Confirmar la inserción de movimientos importados en Firebase
  const handleConfirmImport = () => {
    if (importedMovements.length === 0) return;

    if (!selectedCuentaId || !bankConfig) {
      Toast.fail("Seleccione o configure la cuenta bancaria primero", 2);
      return;
    }

    const CuentasBancoService = getSmartService("cuentasBanco");
    const LibroBancoService = getSmartService("libroBanco");

    // Sumar todos los importes al saldo actual
    const sumaImportes = importedMovements.reduce((sum, m) => sum + m.monto, 0);
    const nuevoSaldo = (bankConfig.saldoActual || 0) + sumaImportes;

    const promises = importedMovements.map((m) => {
      return LibroBancoService.create({
        fecha: m.fecha,
        concepto: m.concepto,
        monto: m.monto,
        estado: "pendiente", // entran como pendientes de vincular
        cuentaId: selectedCuentaId,
        fechaCreacion: new Date().toISOString()
      });
    });

    promises.push(CuentasBancoService.update(selectedCuentaId, { saldoActual: nuevoSaldo }));

    Promise.all(promises)
      .then(() => {
        Toast.success("Movimientos importados correctamente", 2);
        setOpenImportDialog(false);
        setImportedMovements([]);
        setPastedText("");
      })
      .catch((e) => {
        console.error(e);
        Toast.fail("Error al guardar la importación", 2);
      });
  };

  // Abrir asistente de vinculación para un movimiento
  const handleOpenVincular = (mov) => {
    setSelectedMovement(mov);
    setVincularOption(mov.monto > 0 ? "cliente" : "gasto");
    setSelectedClienteKey("");
    setSelectedProveedorName("");
    setSelectedGastoTipo("");
    setGastoObs("");
    setAjusteObs("");

    // Cargar clientes con deuda si el importe es positivo
    if (mov.monto > 0) {
      loadClientesDeuda();
    } else {
      // Cargar proveedores con deuda si es negativo
      loadProveedoresDeuda();
    }

    setOpenVincularDialog(true);
  };

  // Cargar clientes con saldo pendiente de cobro
  const loadClientesDeuda = () => {
    const PedidosService = getSmartService("pedidos");
    const ClientsService = getSmartService("clientes");

    if (!PedidosService || !ClientsService) return;

    Promise.all([
      ClientsService.getAll().once("value"),
      PedidosService.getAll().once("value")
    ]).then(([clientsSnapshot, pedidosSnapshot]) => {
      const clients = [];
      clientsSnapshot.forEach((item) => {
        clients.push({ key: item.key, ...item.val() });
      });

      const pedidos = [];
      pedidosSnapshot.forEach((item) => {
        const val = item.val();
        const total = isNaN(parseFloat(val.total)) ? 0 : parseFloat(val.total);
        const montoPagado = val.montoPagado !== undefined ? parseFloat(val.montoPagado) : (val.status === "Pagado / Entregado" ? total : 0);
        const saldoPendiente = val.status === "Cta Corriente / Entregado"
          ? Math.max(0, total - montoPagado)
          : (val.status === "Pagado / Entregado" ? 0 : (val.saldoPendiente !== undefined ? parseFloat(val.saldoPendiente) : 0));
        pedidos.push({
          key: item.key,
          ...val,
          total,
          montoPagado,
          saldoPendiente
        });
      });

      // Agrupar saldos de clientes
      const pendingPedidos = pedidos.filter(
        (p) => p.status === "Cta Corriente / Entregado" && p.saldoPendiente > 0
      );

      const grouped = {};
      pendingPedidos.forEach((p) => {
        const idCliente = p.idCliente;
        if (!grouped[idCliente]) {
          const cli = clients.find((c) => c.id === idCliente) || {};
          grouped[idCliente] = {
            idCliente,
            clienteKey: cli.key || "",
            clienteName: p.clienteName || cli.razonSocial || "Cliente Desconocido",
            saldoTotal: 0
          };
        }
        grouped[idCliente].saldoTotal += parseFloat(p.saldoPendiente) || 0;
      });

      setClientesDeuda(Object.values(grouped).sort((a, b) => a.clienteName.localeCompare(b.clienteName)));
    });
  };

  // Cargar proveedores con saldo pendiente
  const loadProveedoresDeuda = () => {
    const ComprasService = getSmartService("compras");
    if (!ComprasService) return;

    ComprasService.getAll().once("value", (snapshot) => {
      const purchases = [];
      snapshot.forEach((item) => {
        purchases.push({ key: item.key, ...item.val() });
      });

      const pendingPurchases = purchases.filter(
        (c) => c.condPago === "Cta Corriente" && (parseFloat(c.saldoPendiente) || 0) > 0
      );

      const grouped = {};
      pendingPurchases.forEach((c) => {
        const name = (c.proveedor || "").trim();
        if (!name) return;
        const key = name.toUpperCase();
        if (!grouped[key]) {
          grouped[key] = {
            proveedorName: name,
            saldoTotal: 0
          };
        }
        grouped[key].saldoTotal += parseFloat(c.saldoPendiente) || 0;
      });

      setProveedoresDeuda(Object.values(grouped).sort((a, b) => a.proveedorName.localeCompare(b.proveedorName)));
    });
  };

  // Guardar vinculación (conciliación)
  const handleSaveVincular = () => {
    if (!selectedMovement) return;

    const LibroBancoService = getSmartService("libroBanco");
    const montoAbs = Math.abs(selectedMovement.monto);

    if (vincularOption === "cliente") {
      if (!selectedClienteKey) {
        Toast.fail("Debe seleccionar un cliente", 2);
        return;
      }
      
      const cli = clientesDeuda.find((c) => c.idCliente === selectedClienteKey);
      
      // Aplicar el cobro a los pedidos pendientes de este cliente de forma secuencial
      const PedidosService = getSmartService("pedidos");
      PedidosService.getAll()
        .orderByChild("idCliente")
        .equalTo(selectedClienteKey)
        .once("value", (snapshot) => {
          const pedidos = [];
          snapshot.forEach((item) => {
            const val = item.val();
            const total = isNaN(parseFloat(val.total)) ? 0 : parseFloat(val.total);
            const montoPagado = val.montoPagado !== undefined ? parseFloat(val.montoPagado) : (val.status === "Pagado / Entregado" ? total : 0);
            const saldoPendiente = val.status === "Cta Corriente / Entregado"
              ? Math.max(0, total - montoPagado)
              : (val.status === "Pagado / Entregado" ? 0 : (val.saldoPendiente !== undefined ? parseFloat(val.saldoPendiente) : 0));

            if (val.status === "Cta Corriente / Entregado" && saldoPendiente > 0) {
              pedidos.push({
                key: item.key,
                ...val,
                total,
                montoPagado,
                saldoPendiente
              });
            }
          });

          // Ordenar pedidos de más antiguo a más nuevo
          pedidos.sort((a, b) => a.id - b.id);

          let montoRestante = montoAbs;
          const updates = [];

          for (let p of pedidos) {
            if (montoRestante <= 0) break;
            const abonoLocal = Math.min(montoRestante, p.saldoPendiente);
            const nuevoSaldo = Math.max(0, parseFloat((p.saldoPendiente - abonoLocal).toFixed(2)));
            const nuevoMontoPagado = (p.montoPagado || 0) + abonoLocal;

            const updateData = {
              montoPagado: nuevoMontoPagado,
              saldoPendiente: nuevoSaldo
            };
            if (nuevoSaldo === 0) {
              updateData.status = "Pagado / Entregado";
            }
            updates.push(PedidosService.update(p.key, updateData));
            montoRestante -= abonoLocal;
          }

          // Actualizar el movimiento de banco
          const updateMov = {
            estado: "vinculado",
            tipoVinculo: "cliente",
            idVinculo: selectedClienteKey,
            referenciaAdicional: `Vinculado a Cliente: ${cli.clienteName}`
          };
          updates.push(LibroBancoService.update(selectedMovement.key, updateMov));

          Promise.all(updates)
            .then(() => {
              Toast.success("Cobro de cliente vinculado correctamente", 2);
              setOpenVincularDialog(false);
            })
            .catch((err) => {
              console.error(err);
              Toast.fail("Error al conciliar", 2);
            });
        });

    } else if (vincularOption === "proveedor") {
      if (!selectedProveedorName) {
        Toast.fail("Debe seleccionar un proveedor", 2);
        return;
      }

      // Aplicar el pago a las compras pendientes del proveedor
      const ComprasService = getSmartService("compras");
      ComprasService.getAll().once("value", (snapshot) => {
        const compras = [];
        snapshot.forEach((item) => {
          const val = item.val();
          if (
            (val.proveedor || "").trim().toUpperCase() === selectedProveedorName.toUpperCase() &&
            val.condPago === "Cta Corriente" &&
            (val.saldoPendiente || 0) > 0
          ) {
            compras.push({ key: item.key, ...val });
          }
        });

        // Ordenar compras por fecha o ID (antiguo a nuevo)
        compras.sort((a, b) => a.id - b.id);

        let montoRestante = montoAbs;
        const updates = [];

        for (let c of compras) {
          if (montoRestante <= 0) break;
          const pagoLocal = Math.min(montoRestante, c.saldoPendiente);
          const nuevoSaldo = Math.max(0, parseFloat((c.saldoPendiente - pagoLocal).toFixed(2)));
          const nuevoMontoPagado = (c.montoPagado || 0) + pagoLocal;

          const updateData = {
            montoPagado: nuevoMontoPagado,
            saldoPendiente: nuevoSaldo
          };
          if (nuevoSaldo === 0) {
            updateData.status = "Pagado";
          }
          updates.push(ComprasService.update(c.key, updateData));
          montoRestante -= pagoLocal;
        }

        // Actualizar el movimiento de banco
        const updateMov = {
          estado: "vinculado",
          tipoVinculo: "proveedor",
          idVinculo: selectedProveedorName,
          referenciaAdicional: `Vinculado a Proveedor: ${selectedProveedorName}`
        };
        updates.push(LibroBancoService.update(selectedMovement.key, updateMov));

        Promise.all(updates)
          .then(() => {
            Toast.success("Pago a proveedor vinculado correctamente", 2);
            setOpenVincularDialog(false);
            loadProveedoresCtaCte();
          })
          .catch((err) => {
            console.error(err);
            Toast.fail("Error al conciliar", 2);
          });
      });

    } else if (vincularOption === "gasto") {
      if (!selectedGastoTipo) {
        Toast.fail("Debe seleccionar el tipo de gasto", 2);
        return;
      }

      // Crear el gasto automáticamente
      const GastosService = getSmartService("gastos");
      const gastoData = {
        fecha: selectedMovement.fecha,
        tipo: selectedGastoTipo,
        monto: montoAbs,
        observaciones: gastoObs.trim() || `Generado automáticamente desde banco: ${selectedMovement.concepto}`
      };

      GastosService.create(gastoData)
        .then((res) => {
          const gastoKey = res.key;
          const updateMov = {
            estado: "vinculado",
            tipoVinculo: "gasto",
            idVinculo: gastoKey,
            referenciaAdicional: `Gasto: ${selectedGastoTipo}`
          };
          return LibroBancoService.update(selectedMovement.key, updateMov);
        })
        .then(() => {
          Toast.success("Gasto creado y vinculado con éxito", 2);
          setOpenVincularDialog(false);
        })
        .catch((err) => {
          console.error(err);
          Toast.fail("Error al crear gasto", 2);
        });

    } else if (vincularOption === "ajuste") {
      const updateMov = {
        estado: "vinculado",
        tipoVinculo: "ajuste",
        referenciaAdicional: ajusteObs.trim() || "Ajuste/Comisión bancaria"
      };

      LibroBancoService.update(selectedMovement.key, updateMov)
        .then(() => {
          Toast.success("Movimiento marcado como Ajuste", 2);
          setOpenVincularDialog(false);
        })
        .catch((err) => {
          console.error(err);
          Toast.fail("Error al marcar ajuste", 2);
        });
    }
  };

  // Desvincular movimiento (devuelve a pendiente y revierte impacto si es posible)
  const handleDesvincular = (mov) => {
    alert(
      "Confirmar Desvinculación",
      "¿Está seguro de desvincular este movimiento bancario? Esto NO eliminará el cobro, pago o gasto generado en otros módulos, pero quitará el vínculo del banco.",
      [
        { text: "Cancelar" },
        {
          text: "Desvincular",
          onPress: () => {
            const LibroBancoService = getSmartService("libroBanco");
            const updateMov = {
              estado: "pendiente",
              tipoVinculo: null,
              idVinculo: null,
              referenciaAdicional: "Desvinculado"
            };
            LibroBancoService.update(mov.key, updateMov)
              .then(() => {
                Toast.success("Movimiento desvinculado", 2);
              })
              .catch((err) => {
                console.error(err);
                Toast.fail("Error al desvincular", 2);
              });
          }
        }
      ]
    );
  };

  // Eliminar movimiento (solo manuales o importados)
  const handleDeleteMovement = (mov) => {
    alert(
      "Confirmar Eliminación",
      "¿Desea eliminar este movimiento del banco? Esto revertirá su impacto en el saldo de la cuenta bancaria correspondiente.",
      [
        { text: "Cancelar" },
        {
          text: "Eliminar",
          onPress: () => {
            const LibroBancoService = getSmartService("libroBanco");
            const CuentasBancoService = getSmartService("cuentasBanco");

            const targetCuentaId = mov.cuentaId || selectedCuentaId;
            if (!targetCuentaId) {
              LibroBancoService.delete(mov.key)
                .then(() => {
                  Toast.success("Movimiento eliminado", 2);
                })
                .catch((err) => {
                  console.error(err);
                  Toast.fail("Error al eliminar", 2);
                });
              return;
            }

            CuentasBancoService.get(targetCuentaId).once("value", (snapshot) => {
              const account = snapshot.val();
              const currentSaldo = account ? (account.saldoActual || 0) : 0;
              const nuevoSaldo = currentSaldo - mov.monto;

              Promise.all([
                LibroBancoService.delete(mov.key),
                CuentasBancoService.update(targetCuentaId, { saldoActual: nuevoSaldo })
              ])
                .then(() => {
                  Toast.success("Movimiento eliminado", 2);
                })
                .catch((err) => {
                  console.error(err);
                  Toast.fail("Error al eliminar", 2);
                });
            });
          }
        }
      ]
    );
  };

  // Registrar pago manual a proveedor (Cta. Cte. de Proveedores)
  const handleOpenPagoProveedor = (prov) => {
    setPagoProveedorForm({
      proveedor: prov.proveedorName,
      monto: prov.saldoTotal.toFixed(2),
      fecha: moment().format("YYYY-MM-DD"),
      comentarios: "",
      cuentaId: selectedCuentaId,
      extraerBanco: selectedCuentaId !== ""
    });
    setOpenPagoProveedorDialog(true);
  };

  const handleSavePagoProveedor = () => {
    const { proveedor, monto, fecha, comentarios, extraerBanco, cuentaId } = pagoProveedorForm;
    const pagoMonto = parseFloat(monto);

    if (isNaN(pagoMonto) || pagoMonto <= 0) {
      Toast.fail("Monto inválido", 2);
      return;
    }

    const ComprasService = getSmartService("compras");
    if (!ComprasService) return;

    // Obtener compras pendientes del proveedor
    ComprasService.getAll().once("value", (snapshot) => {
      const compras = [];
      snapshot.forEach((item) => {
        const val = item.val();
        if (
          (val.proveedor || "").trim().toUpperCase() === proveedor.toUpperCase() &&
          val.condPago === "Cta Corriente" &&
          (val.saldoPendiente || 0) > 0
        ) {
          compras.push({ key: item.key, ...val });
        }
      });

      compras.sort((a, b) => a.id - b.id);

      let montoRestante = pagoMonto;
      const updates = [];

      for (let c of compras) {
        if (montoRestante <= 0) break;
        const pagoLocal = Math.min(montoRestante, c.saldoPendiente);
        const nuevoSaldo = Math.max(0, parseFloat((c.saldoPendiente - pagoLocal).toFixed(2)));
        const nuevoMontoPagado = (c.montoPagado || 0) + pagoLocal;

        const updateData = {
          montoPagado: nuevoMontoPagado,
          saldoPendiente: nuevoSaldo
        };
        if (nuevoSaldo === 0) {
          updateData.status = "Pagado";
        }
        updates.push(ComprasService.update(c.key, updateData));
        montoRestante -= pagoLocal;
      }

      // Si extrae de banco asociado, registrar egreso
      if (extraerBanco && cuentaId) {
        const LibroBancoService = getSmartService("libroBanco");
        const CuentasBancoService = getSmartService("cuentasBanco");
        const cuentaSeleccionada = cuentasBancarias.find(c => c.key === cuentaId);

        if (cuentaSeleccionada) {
          const nuevoSaldoBanco = (cuentaSeleccionada.saldoActual || 0) - pagoMonto;
          const movimiento = {
            fecha: moment(fecha, "YYYY-MM-DD").format("DD-MM-YYYY"),
            concepto: `Pago a Proveedor: ${proveedor}`,
            monto: -pagoMonto,
            estado: "vinculado",
            tipoVinculo: "proveedor",
            cuentaId: cuentaId,
            referenciaAdicional: comentarios.trim() || `Pago manual a proveedor`,
            fechaCreacion: new Date().toISOString()
          };

          updates.push(LibroBancoService.create(movimiento));
          updates.push(CuentasBancoService.update(cuentaId, { saldoActual: nuevoSaldoBanco }));
        }
      }

      Promise.all(updates)
        .then(() => {
          Toast.success("Pago a proveedor registrado correctamente", 2);
          setOpenPagoProveedorDialog(false);
          loadProveedoresCtaCte();
        })
        .catch((err) => {
          console.error(err);
          Toast.fail("Error al registrar el pago", 2);
        });
    });
  };

  // Exportar extracto bancario a Excel
  const handleExportLibroExcel = () => {
    if (movementsFilter.length === 0) {
      Toast.fail("No hay movimientos para exportar", 2);
      return;
    }

    const wb = XLSX.utils.book_new();
    const rows = [
      ["FECHA", "CONCEPTO", "INGRESO (+)", "EGRESO (-)", "ESTADO", "VINCULO / REFERENCIA"]
    ];

    movementsFilter.forEach((m) => {
      rows.push([
        m.fecha,
        m.concepto,
        m.monto > 0 ? formatArs(m.monto) : "",
        m.monto < 0 ? formatArs(Math.abs(m.monto)) : "",
        m.estado === "vinculado" ? "Conciliado" : "Pendiente",
        m.referenciaAdicional || ""
      ]);
    });

    // Añadir totales
    const totalIngresos = movementsFilter.filter(m => m.monto > 0).reduce((sum, m) => sum + m.monto, 0);
    const totalEgresos = movementsFilter.filter(m => m.monto < 0).reduce((sum, m) => sum + Math.abs(m.monto), 0);
    rows.push(["", "TOTALES", formatArs(totalIngresos), formatArs(totalEgresos), "", ""]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 13 }, { wch: 35 }, { wch: 18 }, { wch: 18 }, { wch: 15 }, { wch: 35 }];
    XLSX.utils.book_append_sheet(wb, ws, "Movimientos Banco");

    const mesStr = moment(filterMonth).format("MM-YYYY");
    XLSX.writeFile(wb, `Banco_${bankConfig?.bancoNombre || "Extracto"}_${mesStr}.xlsx`);
  };

  // Calcular métricas rápidas del mes
  const ingresosDelMes = movementsFilter.filter((m) => m.monto > 0).reduce((sum, m) => sum + m.monto, 0);
  const egresosDelMes = movementsFilter.filter((m) => m.monto < 0).reduce((sum, m) => sum + Math.abs(m.monto), 0);
  const movimientosVinculadosCount = movementsFilter.filter((m) => m.estado === "vinculado").length;
  const conciliacionPorcentaje = movementsFilter.length > 0 
    ? Math.round((movimientosVinculadosCount / movementsFilter.length) * 100) 
    : 0;

  const totalDeudaProveedores = proveedoresCtaCte.reduce((sum, p) => sum + p.saldoTotal, 0);

  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      {/* Encabezado */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: "bold", color: "#1976d2", display: "flex", alignItems: "center", gap: 1.5 }}>
            <AccountBalanceIcon fontSize="large" /> Libro de Banco
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Administración de movimientos bancarios y conciliación con clientes y proveedores.
          </Typography>
        </Box>

        {/* Acciones de Cuenta Bancaria */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          {cuentasBancarias.length > 0 && (
            <FormControl sx={{ minWidth: 200 }} size="small">
              <InputLabel id="select-active-bank-label">Cuenta Activa</InputLabel>
              <Select
                labelId="select-active-bank-label"
                value={selectedCuentaId}
                onChange={(e) => setSelectedCuentaId(e.target.value)}
                label="Cuenta Activa"
              >
                {cuentasBancarias.map((c) => (
                  <MenuItem key={c.key} value={c.key}>
                    {c.bancoNombre} ({c.nroCuenta || "Sin número"})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => {
              setCreateForm({ bancoNombre: "", nroCuenta: "", cbu: "", saldoInicial: 0 });
              setOpenCreateDialog(true);
            }}
            size="small"
          >
            Nueva Cuenta
          </Button>

          {bankConfig && (
            <>
              <Button
                variant="outlined"
                startIcon={<SettingsIcon />}
                onClick={() => setOpenConfigDialog(true)}
                size="small"
              >
                Editar Cuenta
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDeleteAccount}
                size="small"
              >
                Eliminar Cuenta
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* Resumen de Cuenta Bancaria / Empty State */}
      {!bankConfig ? (
        <Card sx={{ p: 4, textAlign: 'center', bgcolor: '#fffde7', border: '1px dashed #ffd54f', mb: 4 }}>
          <CardContent>
            <AccountBalanceIcon sx={{ fontSize: 60, color: '#fbc02d', mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
              No tienes ninguna cuenta bancaria creada o seleccionada
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Para registrar movimientos, importar extractos y conciliar pagos, primero debes crear una cuenta bancaria.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => {
                setCreateForm({ bancoNombre: "", nroCuenta: "", cbu: "", saldoInicial: 0 });
                setOpenCreateDialog(true);
              }}
            >
              Crear mi primera cuenta bancaria
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: "#e3f2fd", borderLeft: "5px solid #1e88e5", boxShadow: 3 }}>
              <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  BANCO ASOCIADO
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: "bold", color: "#1565c0" }}>
                  {bankConfig.bancoNombre}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Cuenta: {bankConfig.nroCuenta || "-"} | CBU: {bankConfig.cbu || "-"}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: "#e8f5e9", borderLeft: "5px solid #2e7d32", boxShadow: 3 }}>
              <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  SALDO EN SISTEMA
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: "#2e7d32" }}>
                  {formatArs(bankConfig.saldoActual)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Saldo Inicial: {formatArs(bankConfig.saldoInicial)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: "#fff3e0", borderLeft: "5px solid #ff9800", boxShadow: 3 }}>
              <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  DEUDA A PROVEEDORES (CTA. CTE.)
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: "#e65100" }}>
                  {formatArs(totalDeudaProveedores)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {proveedoresCtaCte.length} proveedores con facturas pendientes
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, val) => setTabValue(val)} aria-label="libro banco tabs">
          <Tab label="Libro Diario (Extracto)" />
          <Tab label="Cta. Cte. Proveedores" />
          <Tab label="Dashboard / Conciliación" />
        </Tabs>
      </Box>

      {/* PESTAÑA 0: LIBRO DIARIO */}
      {tabValue === 0 && (
        <Box>
          {/* Barra de Acciones y Filtros */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", flexGrow: 1 }}>
              <TextField
                label="Buscar concepto..."
                size="small"
                variant="outlined"
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
                sx={{ width: { xs: "100%", sm: "250px" } }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
              <FormControl size="small" sx={{ width: "160px" }}>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filterState}
                  onChange={(e) => setFilterState(e.target.value)}
                  label="Estado"
                >
                  <MenuItem value="todos">Todos</MenuItem>
                  <MenuItem value="pendiente">Sin Vincular</MenuItem>
                  <MenuItem value="vinculado">Vinculados</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Mes"
                type="month"
                size="small"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ width: "160px" }}
              />
            </Box>

            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<UploadFileIcon />}
                onClick={() => setOpenImportDialog(true)}
                disabled={!bankConfig}
              >
                Importar Extracto
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenMovementDialog(true)}
                disabled={!bankConfig}
              >
                Movimiento Manual
              </Button>
              <Button
                variant="outlined"
                onClick={handleExportLibroExcel}
                disabled={movementsFilter.length === 0}
              >
                Exportar Excel
              </Button>
            </Box>
          </Box>

          {/* Grilla de Movimientos */}
          <TableContainer component={Paper} sx={{ boxShadow: 2, maxHeight: "60vh" }}>
            <Table stickyHeader aria-label="movimientos banco">
              <TableHead>
                <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                  <TableCell sx={{ fontWeight: "bold" }}>Fecha</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Concepto / Detalle Banco</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }} align="right">Monto</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }} align="center">Estado</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Vinculación / Referencia</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }} align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                      Cargando movimientos...
                    </TableCell>
                  </TableRow>
                ) : movementsFilter.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                      No se encontraron movimientos para el mes seleccionado.
                    </TableCell>
                  </TableRow>
                ) : (
                  movementsFilter.map((m) => {
                    const isIngreso = m.monto > 0;
                    return (
                      <TableRow key={m.key} hover>
                        <TableCell>{m.fecha}</TableCell>
                        <TableCell sx={{ fontWeight: "medium" }}>{m.concepto}</TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            color: isIngreso ? "#2e7d32" : "#d32f2f",
                            fontWeight: "bold"
                          }}
                        >
                          {isIngreso ? "+" : ""}
                          {formatArs(m.monto)}
                        </TableCell>
                        <TableCell align="center">
                          {m.estado === "vinculado" ? (
                            <Chip
                              icon={<CheckCircleIcon />}
                              label="Conciliado"
                              color="success"
                              size="small"
                              variant="outlined"
                            />
                          ) : (
                            <Chip
                              icon={<WarningIcon />}
                              label="Sin Vincular"
                              color="warning"
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontStyle: "italic", color: "#555" }}>
                            {m.referenciaAdicional || "-"}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5 }}>
                            {m.estado === "pendiente" ? (
                              <Tooltip title="Vincular a Cliente/Proveedor/Gasto">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleOpenVincular(m)}
                                >
                                  <LinkIcon />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              m.tipoVinculo !== "ajuste" && (
                                <Tooltip title="Desvincular">
                                  <IconButton
                                    size="small"
                                    color="warning"
                                    onClick={() => handleDesvincular(m)}
                                  >
                                    <LinkOffIcon />
                                  </IconButton>
                                </Tooltip>
                              )
                            )}
                            <Tooltip title="Eliminar Movimiento">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteMovement(m)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* PESTAÑA 1: CTA CTE PROVEEDORES */}
      {tabValue === 1 && (
        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <TextField
              label="Buscar proveedor..."
              size="small"
              value={searchProveedor}
              onChange={(e) => setSearchProveedor(e.target.value)}
              sx={{ width: { xs: "100%", sm: "300px" } }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadProveedoresCtaCte}
              size="small"
            >
              Actualizar
            </Button>
          </Box>

          <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
            <Table aria-label="proveedores cta cte table">
              <TableHead sx={{ bgcolor: "#f5f5f5" }}>
                <TableRow>
                  <TableCell width="50" />
                  <TableCell sx={{ fontWeight: "bold" }}>Proveedor</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }} align="right">Facturas Pendientes</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }} align="right">Saldo Adeudado</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }} align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {proveedoresFilter.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      No hay compras a plazo o saldos pendientes con proveedores.
                    </TableCell>
                  </TableRow>
                ) : (
                  proveedoresFilter.map((prov) => {
                    const isExpanded = expandedProveedor === prov.proveedorName;
                    return (
                      <React.Fragment key={prov.proveedorName}>
                        <TableRow hover>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() =>
                                setExpandedProveedor(isExpanded ? null : prov.proveedorName)
                              }
                            >
                              {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                            </IconButton>
                          </TableCell>
                          <TableCell sx={{ fontWeight: "bold" }}>{prov.proveedorName}</TableCell>
                          <TableCell align="right">{prov.compras.length}</TableCell>
                          <TableCell align="right" sx={{ color: "#d32f2f", fontWeight: "bold" }}>
                            {formatArs(prov.saldoTotal)}
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              onClick={() => handleOpenPagoProveedor(prov)}
                            >
                              Registrar Pago
                            </Button>
                          </TableCell>
                        </TableRow>

                        {/* Fila expandible con detalle de compras */}
                        <TableRow>
                          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
                            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                              <Box sx={{ margin: 2, bgcolor: "#fafafa", p: 2, borderRadius: 1 }}>
                                <Typography variant="h6" gutterBottom component="div" sx={{ color: "#1976d2" }}>
                                  Facturas pendientes de {prov.proveedorName}
                                </Typography>
                                <Table size="small" aria-label="purchases">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: "bold" }}>Fecha</TableCell>
                                      <TableCell sx={{ fontWeight: "bold" }}>Factura / Ref</TableCell>
                                      <TableCell sx={{ fontWeight: "bold" }} align="right">Monto Factura</TableCell>
                                      <TableCell sx={{ fontWeight: "bold" }} align="right">Pagado</TableCell>
                                      <TableCell sx={{ fontWeight: "bold" }} align="right">Saldo Restante</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {prov.compras.map((compra) => (
                                      <TableRow key={compra.key}>
                                        <TableCell>{compra.fecha}</TableCell>
                                        <TableCell>{compra.factura || "-"}</TableCell>
                                        <TableCell align="right">{formatArs(compra.total)}</TableCell>
                                        <TableCell align="right">{formatArs(compra.montoPagado)}</TableCell>
                                        <TableCell align="right" sx={{ color: "#d32f2f", fontWeight: "bold" }}>
                                          {formatArs(compra.saldoPendiente)}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* PESTAÑA 2: DASHBOARD / CONCILIACION */}
      {tabValue === 2 && (
        <Box>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card sx={{ textAlign: "center", py: 3, boxShadow: 2 }}>
                <CardContent>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    CONCILIACIÓN BANCARIA
                  </Typography>
                  <Typography variant="h2" sx={{ fontWeight: "bold", color: "#1976d2" }}>
                    {conciliacionPorcentaje}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {movimientosVinculadosCount} de {movementsFilter.length} movimientos de este mes conciliados.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ bgcolor: "#e8f5e8", py: 3, boxShadow: 2 }}>
                <CardContent sx={{ textAlign: "center" }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    INGRESOS DEL MES
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: "bold", color: "#2e7d32", display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                    <ArrowUpwardIcon /> {formatArs(ingresosDelMes)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Recibido en cuenta bancaria.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ bgcolor: "#ffebee", py: 3, boxShadow: 2 }}>
                <CardContent sx={{ textAlign: "center" }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    EGRESOS DEL MES
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: "bold", color: "#c62828", display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                    <ArrowDownwardIcon /> {formatArs(egresosDelMes)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Retirado / Pagado de la cuenta bancaria.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card sx={{ mt: 4, p: 3, boxShadow: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
                Instrucciones del Módulo Bancario
              </Typography>
              <Typography variant="body1" paragraph>
                1. **Configurar el Banco**: Completa los datos en "Configuración Banco" para que el sistema reconozca tu cuenta.
              </Typography>
              <Typography variant="body1" paragraph>
                2. **Importar Movimientos**: Descarga el extracto desde tu Homebanking (Galicia, Santander, etc.) en Excel o copia las filas del banco directamente del navegador y pégalas en "Importar Extracto". El sistema leerá las fechas, conceptos e importes automáticamente y los colocará en estado **Sin Vincular**.
              </Typography>
              <Typography variant="body1" paragraph>
                3. **Conciliar (Vincular)**: Haz clic en el botón de enlace de cada fila pendiente. Podrás asignarlo a un cobro de cliente, pago a proveedor o registrar un gasto en el acto. Esto mantendrá todos tus módulos sincronizados con la realidad de tu cuenta bancaria.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* DIALOG: CONFIGURACIÓN BANCO */}
      <Dialog open={openConfigDialog} onClose={() => setOpenConfigDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AccountBalanceIcon color="primary" /> Configurar Cuenta Bancaria
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <TextField
              label="Nombre del Banco *"
              value={configForm.bancoNombre}
              onChange={(e) => setConfigForm({ ...configForm, bancoNombre: e.target.value })}
              fullWidth
              variant="outlined"
            />
            <TextField
              label="Número de Cuenta"
              value={configForm.nroCuenta}
              onChange={(e) => setConfigForm({ ...configForm, nroCuenta: e.target.value })}
              fullWidth
              variant="outlined"
            />
            <TextField
              label="CBU"
              value={configForm.cbu}
              onChange={(e) => setConfigForm({ ...configForm, cbu: e.target.value })}
              fullWidth
              variant="outlined"
            />
            <TextField
              label="Saldo Inicial (Físico en Banco) *"
              type="number"
              value={configForm.saldoInicial}
              onChange={(e) => setConfigForm({ ...configForm, saldoInicial: e.target.value })}
              disabled={bankConfig !== null}
              fullWidth
              variant="outlined"
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>
              }}
              helperText={bankConfig ? "El saldo inicial no se puede modificar una vez creado" : ""}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfigDialog(false)} color="secondary">
            Cancelar
          </Button>
          <Button onClick={handleSaveConfig} color="primary" variant="contained">
            Guardar Configuración
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG: CREAR NUEVA CUENTA BANCARIA */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AccountBalanceIcon color="primary" /> Crear Nueva Cuenta Bancaria
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <TextField
              label="Nombre del Banco *"
              value={createForm.bancoNombre}
              onChange={(e) => setCreateForm({ ...createForm, bancoNombre: e.target.value })}
              fullWidth
              variant="outlined"
            />
            <TextField
              label="Número de Cuenta"
              value={createForm.nroCuenta}
              onChange={(e) => setCreateForm({ ...createForm, nroCuenta: e.target.value })}
              fullWidth
              variant="outlined"
            />
            <TextField
              label="CBU"
              value={createForm.cbu}
              onChange={(e) => setCreateForm({ ...createForm, cbu: e.target.value })}
              fullWidth
              variant="outlined"
            />
            <TextField
              label="Saldo Inicial (Físico en Banco) *"
              type="number"
              value={createForm.saldoInicial}
              onChange={(e) => setCreateForm({ ...createForm, saldoInicial: e.target.value })}
              fullWidth
              variant="outlined"
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)} color="secondary">
            Cancelar
          </Button>
          <Button onClick={handleCreateAccount} color="primary" variant="contained">
            Crear Cuenta
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG: MOVIMIENTO MANUAL */}
      <Dialog open={openMovementDialog} onClose={() => setOpenMovementDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AddIcon color="primary" /> Registrar Movimiento Bancario Manual
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Movimiento</InputLabel>
              <Select
                value={movementForm.tipo}
                onChange={(e) => setMovementForm({ ...movementForm, tipo: e.target.value })}
                label="Tipo de Movimiento"
              >
                <MenuItem value="ingreso">Ingreso (Depósito / Acreditación)</MenuItem>
                <MenuItem value="egreso">Egreso (Retiro / Débito)</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Fecha"
              type="date"
              value={movementForm.fecha}
              onChange={(e) => setMovementForm({ ...movementForm, fecha: e.target.value })}
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Concepto *"
              value={movementForm.concepto}
              onChange={(e) => setMovementForm({ ...movementForm, concepto: e.target.value })}
              fullWidth
              variant="outlined"
              placeholder="Ej. Intereses ganados, extracción caja, etc."
            />

            <TextField
              label="Monto *"
              type="number"
              value={movementForm.monto}
              onChange={(e) => setMovementForm({ ...movementForm, monto: e.target.value })}
              fullWidth
              variant="outlined"
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>
              }}
            />

            <TextField
              label="Referencia Adicional (Opcional)"
              value={movementForm.referenciaAdicional}
              onChange={(e) => setMovementForm({ ...movementForm, referenciaAdicional: e.target.value })}
              fullWidth
              variant="outlined"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMovementDialog(false)} color="secondary">
            Cancelar
          </Button>
          <Button onClick={handleSaveMovement} color="primary" variant="contained">
            Registrar Movimiento
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG: IMPORTACIÓN DE EXTRACTO */}
      <Dialog open={openImportDialog} onClose={() => setOpenImportDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "#f5f5f5", borderBottom: "1px solid #e0e0e0" }}>
          <span>Cargar Extracto Bancario</span>
          <IconButton onClick={() => setOpenImportDialog(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={3}>
            {/* Carga por Archivo Excel/CSV */}
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column", border: "1px dashed #bdbdbd" }}>
                <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 2 }}>
                  Opción A: Archivo Excel o CSV
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Sube el archivo Excel o CSV exportado directamente de tu homebanking. Intentaremos leer la fecha, detalle e importes.
                </Typography>
                <Box sx={{ mt: "auto", display: "flex", justifyContent: "center" }}>
                  <Button
                    variant="contained"
                    component="label"
                    startIcon={<UploadFileIcon />}
                  >
                    Subir Archivo
                    <input
                      type="file"
                      hidden
                      accept=".xlsx, .xls, .csv"
                      onChange={handleExcelUpload}
                    />
                  </Button>
                </Box>
              </Card>
            </Grid>

            {/* Carga por Copia y Pega */}
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 2, border: "1px dashed #bdbdbd" }}>
                <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
                  Opción B: Copiar y Pegar Texto
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Copia los movimientos directamente de la página web de tu banco y pégalos aquí.
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  variant="outlined"
                  placeholder="Ej. Pegue filas de movimientos aquí..."
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  sx={{ mb: 1.5 }}
                />
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={handleParsePastedText}
                  disabled={!pastedText.trim()}
                >
                  Procesar Filas Pegadas
                </Button>
              </Card>
            </Grid>
          </Grid>

          {/* Listado de movimientos leídos a ser importados */}
          {importedMovements.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold", color: "#2e7d32" }}>
                Movimientos leídos ({importedMovements.length})
              </Typography>
              <TableContainer component={Paper} sx={{ maxHeight: "30vh", border: "1px solid #e0e0e0" }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: "bold" }}>Fecha</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Concepto</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }} align="right">Monto</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {importedMovements.map((m, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{m.fecha}</TableCell>
                        <TableCell>{m.concepto}</TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            color: m.monto > 0 ? "#2e7d32" : "#d32f2f",
                            fontWeight: "bold"
                          }}
                        >
                          {m.monto > 0 ? "+" : ""}
                          {formatArs(m.monto)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: "1px solid #e0e0e0" }}>
          <Button onClick={() => {
            setOpenImportDialog(false);
            setImportedMovements([]);
            setPastedText("");
          }} color="secondary">
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmImport}
            color="success"
            variant="contained"
            disabled={importedMovements.length === 0}
          >
            Importar al Libro de Banco
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG: VINCULACIÓN (CONCILIACIÓN) */}
      <Dialog open={openVincularDialog} onClose={() => setOpenVincularDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, bgcolor: "#e3f2fd" }}>
          <LinkIcon color="primary" /> Vincular Movimiento Bancario
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedMovement && (
            <Box>
              <Box sx={{ mb: 3, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  MOVIMIENTO SELECCIONADO:
                </Typography>
                <Typography variant="body1">
                  <strong>Concepto:</strong> {selectedMovement.concepto}
                </Typography>
                <Typography variant="body1">
                  <strong>Fecha:</strong> {selectedMovement.fecha}
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    color: selectedMovement.monto > 0 ? "#2e7d32" : "#d32f2f",
                    fontWeight: "bold"
                  }}
                >
                  {selectedMovement.monto > 0 ? "+" : ""}
                  {formatArs(selectedMovement.monto)}
                </Typography>
              </Box>

              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: "bold" }}>
                ¿A qué corresponde este movimiento?
              </Typography>
              <FormControl fullWidth variant="outlined" sx={{ mb: 3 }}>
                <InputLabel id="vincular-option-label">Destino del Fondo</InputLabel>
                <Select
                  labelId="vincular-option-label"
                  value={vincularOption}
                  onChange={(e) => setVincularOption(e.target.value)}
                  label="Destino del Fondo"
                >
                  {selectedMovement.monto > 0 ? (
                    <MenuItem value="cliente">Cobro a Cliente (Cuenta Corriente)</MenuItem>
                  ) : (
                    [
                      <MenuItem key="prov" value="proveedor">Pago a Proveedor (Facturas de Compra)</MenuItem>,
                      <MenuItem key="gast" value="gasto">Clasificar como Gasto (Combustible, LUZ, etc.)</MenuItem>
                    ]
                  )}
                  <MenuItem value="ajuste">Ajuste Manual / Movimiento del Banco</MenuItem>
                </Select>
              </FormControl>

              {/* OPCIÓN CLIENTE */}
              {vincularOption === "cliente" && (
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="select-cliente-label">Seleccionar Cliente</InputLabel>
                  <Select
                    labelId="select-cliente-label"
                    value={selectedClienteKey}
                    onChange={(e) => setSelectedClienteKey(e.target.value)}
                    label="Seleccionar Cliente"
                  >
                    {clientesDeuda.length === 0 ? (
                      <MenuItem disabled value="">No hay clientes con deuda pendiente</MenuItem>
                    ) : (
                      clientesDeuda.map((c) => (
                        <MenuItem key={c.idCliente} value={c.idCliente}>
                          {c.clienteName} (Deuda: {formatArs(c.saldoTotal)})
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              )}

              {/* OPCIÓN PROVEEDOR */}
              {vincularOption === "proveedor" && (
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="select-proveedor-label">Seleccionar Proveedor</InputLabel>
                  <Select
                    labelId="select-proveedor-label"
                    value={selectedProveedorName}
                    onChange={(e) => setSelectedProveedorName(e.target.value)}
                    label="Seleccionar Proveedor"
                  >
                    {proveedoresDeuda.length === 0 ? (
                      <MenuItem disabled value="">No hay proveedores con deuda pendiente</MenuItem>
                    ) : (
                      proveedoresDeuda.map((p) => (
                        <MenuItem key={p.proveedorName} value={p.proveedorName}>
                          {p.proveedorName} (Deuda: {formatArs(p.saldoTotal)})
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              )}

              {/* OPCIÓN GASTO */}
              {vincularOption === "gasto" && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel id="select-gasto-tipo-label">Clasificación Gasto</InputLabel>
                    <Select
                      labelId="select-gasto-tipo-label"
                      value={selectedGastoTipo}
                      onChange={(e) => setSelectedGastoTipo(e.target.value)}
                      label="Clasificación Gasto"
                    >
                      {gastosTipos.map((g) => (
                        <MenuItem key={g} value={g}>{g}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    label="Observaciones del Gasto"
                    fullWidth
                    variant="outlined"
                    value={gastoObs}
                    onChange={(e) => setGastoObs(e.target.value)}
                    placeholder="Ej. Combustible vehículo reparto..."
                  />
                </Box>
              )}

              {/* OPCIÓN AJUSTE */}
              {vincularOption === "ajuste" && (
                <TextField
                  label="Detalle del Ajuste"
                  fullWidth
                  variant="outlined"
                  value={ajusteObs}
                  onChange={(e) => setAjusteObs(e.target.value)}
                  placeholder="Ej. Impuesto Ley 25.413 / Mantenimiento Cuenta..."
                />
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenVincularDialog(false)} color="secondary">
            Cancelar
          </Button>
          <Button onClick={handleSaveVincular} color="primary" variant="contained">
            Vincular Movimiento
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG: REGISTRAR PAGO A PROVEEDOR */}
      <Dialog open={openPagoProveedorDialog} onClose={() => setOpenPagoProveedorDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, bgcolor: "#e8f5e9" }}>
          <PaymentIcon color="success" /> Registrar Pago a Proveedor
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <Typography variant="body1">
              <strong>Proveedor:</strong> {pagoProveedorForm.proveedor}
            </Typography>

            <TextField
              label="Fecha Pago"
              type="date"
              value={pagoProveedorForm.fecha}
              onChange={(e) => setPagoProveedorForm({ ...pagoProveedorForm, fecha: e.target.value })}
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Monto a Pagar"
              type="number"
              value={pagoProveedorForm.monto}
              onChange={(e) => setPagoProveedorForm({ ...pagoProveedorForm, monto: e.target.value })}
              fullWidth
              variant="outlined"
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>
              }}
            />

            <TextField
              label="Comentarios del Pago"
              value={pagoProveedorForm.comentarios}
              onChange={(e) => setPagoProveedorForm({ ...pagoProveedorForm, comentarios: e.target.value })}
              fullWidth
              variant="outlined"
            />

            {cuentasBancarias.length > 0 && (
              <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
                <InputLabel id="select-cuenta-pago-prov-label">Pagar desde Cuenta Bancaria</InputLabel>
                <Select
                  labelId="select-cuenta-pago-prov-label"
                  value={pagoProveedorForm.cuentaId || ""}
                  onChange={(e) => {
                    setPagoProveedorForm({
                      ...pagoProveedorForm,
                      cuentaId: e.target.value,
                      extraerBanco: e.target.value !== ""
                    });
                  }}
                  label="Pagar desde Cuenta Bancaria"
                >
                  <MenuItem value="">-- No extraer del Banco (Solo registrar Pago) --</MenuItem>
                  {cuentasBancarias.map((c) => (
                    <MenuItem key={c.key} value={c.key}>
                      {c.bancoNombre} ({c.nroCuenta || "Sin número"}) - Saldo: ${c.saldoActual?.toFixed(2)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenPagoProveedorDialog(false)} color="secondary">
            Cancelar
          </Button>
          <Button onClick={handleSavePagoProveedor} color="success" variant="contained">
            Registrar Pago
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LibroBanco;
