import React, { Component } from 'react';
import {
  Box, Typography, Paper, Grid, Select, MenuItem,
  FormControl, InputLabel, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Divider, Chip
} from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import PeopleIcon from '@mui/icons-material/People';
import { getSmartService } from '../../../utils/routeHelper';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Parsea fecha "DD-MM-YYYY hh:mm" o "DD-MM-YYYY"
function parseFecha(fechaStr) {
  if (!fechaStr) return null;
  const [datePart] = fechaStr.split(' ');
  const [day, month, year] = datePart.split('-');
  if (!day || !month || !year) return null;
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
}

function formatMoney(amount) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount || 0);
}

class Estadisticas extends Component {
  constructor(props) {
    super(props);
    const now = new Date();
    this.state = {
      pedidos: [],
      selectedYear: now.getFullYear(),
      selectedMonth: now.getMonth() + 1, // 1-12
      availableYears: [],
    };
  }

  componentDidMount() {
    const pedidosService = getSmartService('pedidos');
    if (!pedidosService) return;

    pedidosService.getAll().on('value', (snapshot) => {
      const data = snapshot.val();
      if (!data) { this.setState({ pedidos: [] }); return; }

      const pedidos = Object.entries(data).map(([key, val]) => ({ ...val, key }));
      const years = [...new Set(pedidos.map(p => {
        const d = parseFecha(p.fecha);
        return d ? d.getFullYear() : null;
      }).filter(Boolean))].sort((a, b) => b - a);

      this.setState({ pedidos, availableYears: years });
    });
  }

  componentWillUnmount() {
    const pedidosService = getSmartService('pedidos');
    if (pedidosService) pedidosService.getAll().off();
  }

  getFilteredPedidos() {
    const { pedidos, selectedYear, selectedMonth } = this.state;
    return pedidos.filter(p => {
      const d = parseFecha(p.fecha);
      if (!d) return false;
      return d.getFullYear() === selectedYear && (d.getMonth() + 1) === selectedMonth;
    });
  }

  computeProductStats(filtered) {
    const productMap = {};
    filtered.forEach(pedido => {
      if (!pedido.productos) return;
      pedido.productos.forEach(prod => {
        const key = prod.codigo || prod.descripcion;
        if (!productMap[key]) {
          productMap[key] = { codigo: prod.codigo, descripcion: prod.descripcion, cantidad: 0, total: 0 };
        }
        productMap[key].cantidad += Number(prod.cantidad) || 0;
        productMap[key].total += Number(prod.subtotal) || 0;
      });
    });
    const sorted = Object.values(productMap).sort((a, b) => b.cantidad - a.cantidad);
    return {
      top10: sorted.slice(0, 10),
      bottom10: sorted.slice(-10).reverse(),
    };
  }

  computeClientStats(filtered) {
    const clientMap = {};
    filtered.forEach(pedido => {
      const key = pedido.idCliente || pedido.clienteName;
      if (!key) return;
      if (!clientMap[key]) {
        clientMap[key] = { nombre: pedido.clienteName || `Cliente ${key}`, cantPedidos: 0, total: 0 };
      }
      clientMap[key].cantPedidos += 1;
      clientMap[key].total += Number(pedido.total) || 0;
    });
    const sorted = Object.values(clientMap).sort((a, b) => b.cantPedidos - a.cantPedidos);
    return {
      top10: sorted.slice(0, 10),
      bottom10: sorted.slice(-10).reverse(),
    };
  }

  computeMonthSummary(filtered) {
    if (filtered.length === 0) return { totalVentas: 0, promedioVenta: 0, cantPedidos: 0, totalCosto: 0, ganancia: 0 };
    const totalVentas = filtered.reduce((acc, p) => acc + (Number(p.total) || 0), 0);
    const totalCosto = filtered.reduce((acc, p) => acc + (Number(p.totalCosto) || 0), 0);
    return {
      totalVentas,
      promedioVenta: totalVentas / filtered.length,
      cantPedidos: filtered.length,
      totalCosto,
      ganancia: totalVentas - totalCosto,
    };
  }

  render() {
    const { selectedYear, selectedMonth, availableYears } = this.state;
    const filtered = this.getFilteredPedidos();
    const { top10: topProd, bottom10: bottomProd } = this.computeProductStats(filtered);
    const { top10: topClients, bottom10: bottomClients } = this.computeClientStats(filtered);
    const summary = this.computeMonthSummary(filtered);

    const currentYear = new Date().getFullYear();
    const yearsToShow = availableYears.length > 0 ? availableYears : [currentYear];

    return (
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
          <BarChartIcon sx={{ fontSize: 32, color: '#1976d2' }} />
          <Typography variant="h5" fontWeight="bold">Estadísticas</Typography>
        </Box>

        {/* Filtros */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={6} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Año</InputLabel>
                <Select
                  value={selectedYear}
                  label="Año"
                  onChange={e => this.setState({ selectedYear: e.target.value })}
                >
                  {yearsToShow.map(y => (
                    <MenuItem key={y} value={y}>{y}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Mes</InputLabel>
                <Select
                  value={selectedMonth}
                  label="Mes"
                  onChange={e => this.setState({ selectedMonth: e.target.value })}
                >
                  {MONTH_NAMES.map((name, i) => (
                    <MenuItem key={i + 1} value={i + 1}>{name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Chip
                label={`${MONTH_NAMES[selectedMonth - 1]} ${selectedYear} — ${filtered.length} pedidos`}
                color="primary"
                variant="outlined"
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Resumen del mes */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Total ventas', value: formatMoney(summary.totalVentas), color: '#1976d2' },
            { label: 'Promedio por pedido', value: formatMoney(summary.promedioVenta), color: '#388e3c' },
            { label: 'Total costo', value: formatMoney(summary.totalCosto), color: '#f57c00' },
            { label: 'Ganancia', value: formatMoney(summary.ganancia), color: '#7b1fa2' },
            { label: 'Cant. pedidos', value: summary.cantPedidos, color: '#0288d1' },
          ].map(card => (
            <Grid item xs={6} sm={4} md={2.4} key={card.label}>
              <Paper sx={{ p: 2, textAlign: 'center', borderTop: `4px solid ${card.color}` }}>
                <Typography variant="body2" color="text.secondary">{card.label}</Typography>
                <Typography variant="h6" fontWeight="bold" sx={{ color: card.color }}>{card.value}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Productos más y menos pedidos */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TrendingUpIcon color="success" />
                <Typography variant="subtitle1" fontWeight="bold">Top 10 productos más pedidos</Typography>
              </Box>
              <Divider sx={{ mb: 1 }} />
              {topProd.length === 0 ? (
                <Typography color="text.secondary" variant="body2">Sin datos</Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Código</TableCell>
                        <TableCell>Descripción</TableCell>
                        <TableCell align="right">Cant.</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topProd.map((p, i) => (
                        <TableRow key={i} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f5f5f5' } }}>
                          <TableCell sx={{ color: '#388e3c', fontWeight: 'bold' }}>{i + 1}</TableCell>
                          <TableCell>{p.codigo}</TableCell>
                          <TableCell sx={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.descripcion}</TableCell>
                          <TableCell align="right"><b>{p.cantidad}</b></TableCell>
                          <TableCell align="right">{formatMoney(p.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TrendingDownIcon color="error" />
                <Typography variant="subtitle1" fontWeight="bold">Top 10 productos menos pedidos</Typography>
              </Box>
              <Divider sx={{ mb: 1 }} />
              {bottomProd.length === 0 ? (
                <Typography color="text.secondary" variant="body2">Sin datos</Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Código</TableCell>
                        <TableCell>Descripción</TableCell>
                        <TableCell align="right">Cant.</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bottomProd.map((p, i) => (
                        <TableRow key={i} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f5f5f5' } }}>
                          <TableCell sx={{ color: '#d32f2f', fontWeight: 'bold' }}>{i + 1}</TableCell>
                          <TableCell>{p.codigo}</TableCell>
                          <TableCell sx={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.descripcion}</TableCell>
                          <TableCell align="right"><b>{p.cantidad}</b></TableCell>
                          <TableCell align="right">{formatMoney(p.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Clientes */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <PeopleIcon color="primary" />
                <Typography variant="subtitle1" fontWeight="bold">Top 10 clientes con mas pedidos</Typography>
              </Box>
              <Divider sx={{ mb: 1 }} />
              {topClients.length === 0 ? (
                <Typography color="text.secondary" variant="body2">Sin datos</Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Cliente</TableCell>
                        <TableCell align="right">Pedidos</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topClients.map((c, i) => (
                        <TableRow key={i} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f5f5f5' } }}>
                          <TableCell sx={{ color: '#1976d2', fontWeight: 'bold' }}>{i + 1}</TableCell>
                          <TableCell sx={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nombre}</TableCell>
                          <TableCell align="right">{c.cantPedidos}</TableCell>
                          <TableCell align="right"><b>{formatMoney(c.total)}</b></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <PeopleIcon color="warning" />
                <Typography variant="subtitle1" fontWeight="bold">Top 10 clientes con menos pedidos</Typography>
              </Box>
              <Divider sx={{ mb: 1 }} />
              {bottomClients.length === 0 ? (
                <Typography color="text.secondary" variant="body2">Sin datos</Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Cliente</TableCell>
                        <TableCell align="right">Pedidos</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bottomClients.map((c, i) => (
                        <TableRow key={i} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f5f5f5' } }}>
                          <TableCell sx={{ color: '#f57c00', fontWeight: 'bold' }}>{i + 1}</TableCell>
                          <TableCell sx={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nombre}</TableCell>
                          <TableCell align="right">{c.cantPedidos}</TableCell>
                          <TableCell align="right"><b>{formatMoney(c.total)}</b></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  }
}

export default Estadisticas;
