import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import moment from 'moment';
import { Button, Box, Typography } from '@mui/material';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import { getSmartService } from '../../../utils/routeHelper';
import EmitirFacturaModal from './EmitirFacturaModal';

const currentUser = JSON.parse(localStorage.getItem('currentUser'));
const isWindy = currentUser?.rol === 'windy';

const Factura = () => {
  const { id } = useParams();
  const [pedido, setPedido] = useState({
    id: 0,
    idCliente: 0,
    clienteName: '',
    clienteDomicilio: '',
    productos: [],
    fecha: moment(new Date().getTime()).format('DD-MM-YYYY hh:mm'),
    total: 0,
    status: 'Creado',
    fechaEntrega: moment(new Date().getTime()).add(1, 'days').format('DD-MM-YYYY'),
  });
  const [currentClient, setCurrentClient] = useState({});
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const PedidosService = getSmartService('pedidos');
    const pedidoRef = PedidosService.getAll()
      .orderByChild('id')
      .equalTo(parseInt(id, 10));

    const handlePedido = (snapshot) => {
      const pedidoData = snapshot.val();
      if (pedidoData) {
        setPedido({ ...pedidoData, key: snapshot.key });

        const ClientesService = getSmartService('clientes');
        const clienteRef = ClientesService.getAll()
          .orderByChild('id')
          .equalTo(pedidoData.idCliente);

        clienteRef.once('value', (clientSnap) => {
          const key = Object.keys(clientSnap.val() || {});
          const data = clientSnap.val() || {};
          const client = data[key[0]] || {};
          client.key = key[0];
          setCurrentClient(client);
        });
      }
    };

    pedidoRef.once('child_added', handlePedido);

    return () => {
      pedidoRef.off('child_added', handlePedido);
      const ClientesServiceCleanup = getSmartService('clientes');
      ClientesServiceCleanup.getAll().off('value');
    };
  }, [id]);

  const print = () => {
    const printContents = document.getElementById('printContent').innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
  };

  let totalSinDto = 0;

  return (
    <div id="printContent">
      <div className="col-12 text-center">
        <Button
          variant="contained"
          onClick={print}
          endIcon={<PrintOutlinedIcon />}
          className="button-print"
          sx={{ marginBottom: '20px' }}
        >
          Imprimir
        </Button>
      </div>

      {/* AFIP Status Banner - Emitted */}
      {isWindy && pedido.afipStatus === 'EMITTED' && (
        <Box
          sx={{
            mx: 'auto',
            maxWidth: 800,
            mb: 1,
            p: 1.5,
            bgcolor: '#e8f5e9',
            borderRadius: 1,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box>
            <Typography variant="body2" sx={{ color: '#2e7d32' }}>
              <strong>AFIP: EMITIDA</strong> — CAE: {pedido.afipCae} — Vto: {pedido.afipCaeVto}
            </Typography>
          </Box>
          {pedido.afipPdfUrl && (
            <Button
              size="small"
              variant="outlined"
              color="success"
              href={pedido.afipPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              PDF
            </Button>
          )}
        </Box>
      )}

      {/* AFIP Status Banner - Failed */}
      {isWindy && pedido.afipStatus === 'EMIT_FAILED' && (
        <Box
          sx={{
            mx: 'auto',
            maxWidth: 800,
            mb: 1,
            p: 1.5,
            bgcolor: '#ffebee',
            borderRadius: 1,
          }}
        >
          <Typography variant="body2" sx={{ color: '#c62828' }}>
            <strong>AFIP: FALLIDA</strong> — Reintente desde el botón "Emitir a AFIP"
            {pedido.afipLastEmitError && (
              <>
                <br />
                <strong>Detalle del error:</strong> {pedido.afipLastEmitError}
              </>
            )}
          </Typography>
        </Box>
      )}

      {/* Emitir a AFIP Button - only if not yet emitted */}
      {isWindy && pedido.afipStatus !== 'EMITTED' && (
        <div className="col-12 text-center">
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => setModalOpen(true)}
            sx={{ mb: 1 }}
          >
            Emitir a AFIP
          </Button>
        </div>
      )}

      <div className="factura__container">
        <div className="row section">
          <div className="col-6">
            <span className="client">
              <strong>
                Cliente: {pedido.idCliente.toString().padStart(5, '0')} - {pedido.clienteName}
              </strong>
              <br />
              <p className="client-detail">Domicilio: {pedido.clienteDomicilio}</p>
              <br />
              <p className="client-cuit">CUIT: {currentClient.dni}</p>
              <p className="client-detail right">
                Condición IVA: {currentClient.condicionIva || '-'}
              </p>
            </span>
            <p className="vendedor">
              <strong>Vendedor</strong>
              <br />
              {pedido.user}
            </p>
          </div>

          <div className="col-4 details">
            <p>
              Fecha: {moment(pedido.fecha, 'DD-MM-YYYY hh:mm').format('DD/MM/YYYY')}
              <br />
              Factura #: 001 - {pedido.id.toString().padStart(5, '0')}
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
                <th width="70%">Descripción</th>
                <th width="10%">Cant.</th>
                <th width="15%">Precio</th>
                <th>Bonif.</th>
                <th width="10%">Importe</th>
              </tr>
            </thead>
            <tbody>
              {pedido.productos.map((prod, index) => {
                totalSinDto += prod.cantidad * prod.precio;
                return (
                  <tr key={index}>
                    <td><span>{prod.codigo}</span></td>
                    <td><span>{prod.descripcion}</span></td>
                    <td className="amount"><span>{prod.cantidad}</span></td>
                    <td className="rate"><span>{prod.precio}</span></td>
                    <td>
                      <span>
                        {prod.descuento !== ''
                          ? `${parseInt(prod.descuento, 10).toFixed(2)}%`
                          : '0.00%'}
                      </span>
                    </td>
                    <td className="rate"><span>{prod.subtotal.toFixed(2)}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="invoicelist-footer">
          <table>
            <tbody>
              <tr>
                <td><span>Subtotal:</span></td>
                <td className="subtotal_price">{totalSinDto.toFixed(2)}</td>
              </tr>
              <tr>
                <td><span>Descuentos:</span></td>
                <td className="subtotal_price">{totalSinDto < pedido.total ? 0 :(totalSinDto - pedido.total).toFixed(2)}</td>
              </tr>
              <tr>
                <td><strong>Total:</strong></td>
                <td className="total_price" id="total_price">
                  {totalSinDto < pedido.total ? totalSinDto.toFixed(2) : pedido.total.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* EmitirFacturaModal */}
      <EmitirFacturaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        pedido={pedido}
        pedidoKey={pedido.key}
        currentClient={currentClient}
      />
    </div>
  );
};

export default Factura;
