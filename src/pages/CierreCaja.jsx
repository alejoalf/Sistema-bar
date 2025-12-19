import React, { useEffect, useState, useMemo } from 'react';
import { Container, Table, Badge, Card, Row, Col, ListGroup, Button, Spinner } from 'react-bootstrap';
import { Calendar, DollarSign, ShoppingBag, TrendingUp, RefreshCw } from 'lucide-react';
import { getHistorialVentas } from '../services/pedidos';

// Helper de fecha
function formatearFecha(isoString) {
  if (!isoString) return '';
  return isoString.split('T')[0];
}

const CierreCaja = () => {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);

  async function cargarDatos() {
    setLoading(true);
    try {
      const data = await getHistorialVentas();
      setVentas(data);

      // Auto-seleccionar hoy si hay datos
      if (data && data.length > 0) {
        const primeraFecha = formatearFecha(data[0].created_at);
        setFechaSeleccionada(primeraFecha);
      }
    } catch (error) {
      console.error('Error al cargar cierre:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  // --- LÓGICA DE CÁLCULO ---
  const fechasDisponibles = useMemo(() => {
    const fechas = ventas.map(v => formatearFecha(v.created_at));
    return [...new Set(fechas)];
  }, [ventas]);

  const ventasDelDia = useMemo(() => {
    if (!fechaSeleccionada) return [];
    return ventas.filter(v => formatearFecha(v.created_at) === fechaSeleccionada);
  }, [ventas, fechaSeleccionada]);

  const estadisticasDia = useMemo(() => {
    const totalDinero = ventasDelDia.reduce((sum, v) => sum + v.total, 0);
    const totalPedidos = ventasDelDia.length;

    const productosMap = {};
    ventasDelDia.forEach(venta => {
      if (venta.detalle_pedidos) {
        venta.detalle_pedidos.forEach(detalle => {
          const nombre = detalle.productos?.nombre || 'Producto Eliminado';
          if (!productosMap[nombre]) {
            productosMap[nombre] = { cantidad: 0, recaudado: 0 };
          }
          productosMap[nombre].cantidad += detalle.cantidad;
          productosMap[nombre].recaudado += detalle.cantidad * detalle.precio_unitario;
        });
      }
    });

    const rankingProductos = Object.entries(productosMap)
      .map(([nombre, datos]) => ({ nombre, ...datos }))
      .sort((a, b) => b.cantidad - a.cantidad);

    return { totalDinero, totalPedidos, rankingProductos };
  }, [ventasDelDia]);

  return (
    <Container fluid className="py-3 py-md-4 px-2 px-md-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <style>{`
        .hover-row:hover {
          background-color: #f8f9fa !important;
          transition: background-color 0.2s ease;
        }
        @media (max-width: 767px) {
          .table-responsive {
            font-size: 0.85rem;
          }
        }
      `}</style>

      {/* Header (igual a Historial) */}
      <div className="mb-3 mb-md-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start mb-2">
          <div className="mb-3 mb-md-0">
            <h2 className="mb-1 fw-bold fs-4 fs-md-2" style={{ color: '#2d3748' }}>
              <DollarSign size={24} className="me-2 d-none d-md-inline" />
              Cierre de Caja
            </h2>
            <p className="text-muted mb-0 small">Resumen de ingresos y tickets por día</p>
          </div>
          <Button
            variant="outline-secondary"
            onClick={cargarDatos}
            disabled={loading}
          >
            {loading ? <Spinner animation="border" size="sm" className="me-1" /> : <RefreshCw size={18} className="me-1" />}
            {loading ? 'Cargando...' : 'Actualizar'}
          </Button>
        </div>
      </div>

      <Row>
        {/* COLUMNA IZQUIERDA: FECHAS */}
        <Col md={3} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-dark text-white">
              <Calendar size={18} /> Fechas Disponibles
            </Card.Header>
            <ListGroup variant="flush" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {fechasDisponibles.map(fecha => (
                <ListGroup.Item
                  key={fecha}
                  action
                  active={fecha === fechaSeleccionada}
                  onClick={() => setFechaSeleccionada(fecha)}
                  className="d-flex justify-content-between"
                >
                  <span>{fecha}</span>
                  {fecha === formatearFecha(new Date().toISOString()) && <Badge bg="success">HOY</Badge>}
                </ListGroup.Item>
              ))}
              {fechasDisponibles.length === 0 && <div className="p-3 text-muted">No hay registros de ventas.</div>}
            </ListGroup>
          </Card>
        </Col>

        {/* COLUMNA DERECHA: REPORTE */}
        <Col md={9}>
          {fechaSeleccionada ? (
            <>
              {/* TARJETAS RESUMEN */}
              <Row className="mb-4">
                <Col sm={6}>
                  <Card className="bg-primary text-white shadow-sm mb-3">
                    <Card.Body className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="opacity-75">Total Facturado</h6>
                        <h3>${estadisticasDia.totalDinero.toLocaleString()}</h3>
                      </div>
                      <DollarSign size={32} className="opacity-50" />
                    </Card.Body>
                  </Card>
                </Col>
                <Col sm={6}>
                  <Card className="bg-white border-start border-5 border-success shadow-sm mb-3">
                    <Card.Body className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="text-muted">Tickets Emitidos</h6>
                        <h3>{estadisticasDia.totalPedidos}</h3>
                      </div>
                      <ShoppingBag size={32} className="text-success opacity-50" />
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Row>
                {/* RANKING */}
                <Col lg={6} className="mb-4">
                  <Card className="shadow-sm h-100">
                    <Card.Header className="bg-light fw-bold">
                      <TrendingUp size={18} /> Top Productos
                    </Card.Header>
                    <Table hover responsive size="sm" className="mb-0">
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th className="text-center">Cant.</th>
                          <th className="text-end">$ Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {estadisticasDia.rankingProductos.map((prod, i) => (
                          <tr key={i} className="hover-row">
                            <td>{prod.nombre}</td>
                            <td className="text-center fw-bold">{prod.cantidad}</td>
                            <td className="text-end text-muted">${prod.recaudado}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card>
                </Col>

                {/* DETALLE TICKETS */}
                <Col lg={6} className="mb-4">
                  <Card className="shadow-sm h-100">
                    <Card.Header className="bg-light fw-bold">🧾 Tickets del Día</Card.Header>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      <Table hover responsive size="sm" className="mb-0">
                        <thead>
                          <tr>
                            <th>Hora</th>
                            <th>Mesa</th>
                            <th className="text-end">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ventasDelDia.map(v => (
                            <tr key={v.id} className="hover-row">
                              <td>{new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                              <td>
                                <Badge bg="secondary">Mesa {v.mesas?.numero_mesa}</Badge>
                              </td>
                              <td className="text-end fw-bold">${v.total}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </Card>
                </Col>
              </Row>
            </>
          ) : (
            <div className="text-center py-5 text-muted">Selecciona una fecha para ver el detalle.</div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default CierreCaja;