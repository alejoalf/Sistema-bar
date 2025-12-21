import React, { useEffect, useState, useMemo } from 'react';
import { Container, Table, Badge, Card, Row, Col, Button, Spinner, Form } from 'react-bootstrap';
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

  const mesasCerradasDia = useMemo(() => {
    const set = new Set();
    ventasDelDia.forEach((venta) => {
      if (venta.mesas?.numero_mesa) {
        set.add(venta.mesas.numero_mesa);
      } else {
        set.add(`Barra-${venta.cliente || venta.id}`);
      }
    });
    return set.size;
  }, [ventasDelDia]);

  const promedioPorMesa = mesasCerradasDia > 0 ? estadisticasDia.totalDinero / mesasCerradasDia : 0;

  const metricCards = [
    {
      titulo: 'Total Recaudado',
      valor: `$${estadisticasDia.totalDinero.toLocaleString()}`,
      icon: <DollarSign size={24} />,
      accent: 'success',
      iconBg: 'rgba(34,197,94,0.12)'
    },
    {
      titulo: 'Mesas Cerradas',
      valor: mesasCerradasDia,
      icon: <Calendar size={24} />,
      accent: 'primary',
      iconBg: 'rgba(59,130,246,0.12)'
    },
    {
      titulo: 'Promedio por Mesa',
      valor: `$${promedioPorMesa.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      icon: <ShoppingBag size={24} />,
      accent: 'info',
      iconBg: 'rgba(6,182,212,0.12)'
    }
  ];

  return (
    <Container fluid className="py-4" style={{ backgroundColor: '#f4f6fb', minHeight: '100vh' }}>
      <style>{`
        .hover-row:hover {
          background-color: #f1f5ff !important;
          transition: background-color 0.2s ease;
        }
        .metric-card-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="mb-1 d-flex align-items-center" style={{ color: '#1f2937' }}>
            <DollarSign size={26} className="me-2 text-primary" />
            Cierre de Caja
          </h2>
          <p className="text-muted mb-0">Resumen completo de las transacciones cobradas</p>
        </div>
        <div className="d-flex flex-wrap gap-2 align-items-center">
          <Form.Select
            size="sm"
            style={{ minWidth: '180px' }}
            value={fechaSeleccionada || ''}
            onChange={(e) => setFechaSeleccionada(e.target.value || null)}
          >
            <option value="">Seleccionar fecha</option>
            {fechasDisponibles.map((fecha) => (
              <option value={fecha} key={fecha}>{fecha}</option>
            ))}
          </Form.Select>
          <Button
            variant="outline-secondary"
            onClick={cargarDatos}
            disabled={loading}
            size="sm"
            className="d-flex align-items-center"
          >
            {loading ? <Spinner animation="border" size="sm" className="me-2" /> : <RefreshCw size={16} className="me-2" />}
            {loading ? 'Actualizando...' : 'Actualizar'}
          </Button>
        </div>
      </div>

      {fechaSeleccionada ? (
        <>
          <Row className="g-3 mb-4">
            {metricCards.map((card, index) => (
              <Col md={4} key={index}>
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted text-uppercase small mb-2">{card.titulo}</p>
                      <h3 className={`mb-0 text-${card.accent}`}>{card.valor}</h3>
                    </div>
                    <div className="metric-card-icon" style={{ backgroundColor: card.iconBg }}>
                      <span className={`text-${card.accent}`}>{card.icon}</span>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          <Row className="g-4">
            <Col xl={4}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-white fw-semibold d-flex align-items-center gap-2" style={{ borderBottom: '1px solid #eef1f7' }}>
                  <TrendingUp size={18} className="text-primary" />
                  Top Productos
                </Card.Header>
                <Table hover responsive size="sm" className="mb-0">
                  <thead className="text-muted small">
                    <tr>
                      <th>Producto</th>
                      <th className="text-center">Cant.</th>
                      <th className="text-end">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estadisticasDia.rankingProductos.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center text-muted py-4">Sin ventas registradas.</td>
                      </tr>
                    ) : (
                      estadisticasDia.rankingProductos.map((prod, i) => (
                        <tr key={i} className="hover-row">
                          <td>{prod.nombre}</td>
                          <td className="text-center fw-bold">{prod.cantidad}</td>
                          <td className="text-end text-muted">${prod.recaudado.toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </Card>
            </Col>

            <Col xl={8}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-white fw-semibold d-flex align-items-center gap-2" style={{ borderBottom: '1px solid #eef1f7' }}>
                  <Calendar size={18} className="text-primary" />
                  Tickets del Día
                </Card.Header>
                <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
                  <Table hover responsive size="sm" className="mb-0">
                    <thead className="text-muted small">
                      <tr>
                        <th>Hora</th>
                        <th>Mesa</th>
                        <th className="text-end">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ventasDelDia.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="text-center text-muted py-4">No hay tickets para esta fecha.</td>
                        </tr>
                      ) : (
                        ventasDelDia.map((v) => (
                          <tr key={v.id} className="hover-row">
                            <td>{new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                            <td>
                              {v.mesas?.numero_mesa ? (
                                <Badge bg="secondary">Mesa {v.mesas.numero_mesa}</Badge>
                              ) : (
                                <Badge bg="info" className="text-dark">Barra</Badge>
                              )}
                            </td>
                            <td className="text-end fw-semibold">${v.total.toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>
              </Card>
            </Col>
          </Row>
        </>
      ) : (
        <Card className="border-0 shadow-sm">
          <Card.Body className="py-5 text-center text-muted">
            Selecciona una fecha para ver el detalle del cierre.
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default CierreCaja;