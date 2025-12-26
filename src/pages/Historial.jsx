import React, { useEffect, useMemo, useState } from 'react';
import { Container, Card, Row, Col, Badge, Button, Offcanvas, ListGroup, Spinner, Form } from 'react-bootstrap';
import { FileText, DollarSign, CheckCircle, Calendar, RefreshCw, X, ShoppingBag } from 'lucide-react';
import { getHistorialVentas } from '../services/pedidos';

// Normaliza la fecha (YYYY-MM-DD) para comparar días sin hora
const formatearFecha = (isoString) => {
  if (!isoString) return '';
  return new Date(isoString).toISOString().split('T')[0];
};

const hoyISO = () => new Date().toISOString().split('T')[0];

const Historial = () => {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);

  // 1. DEFINIMOS LA FUNCIÓN PRIMERO (Para evitar errores de referencia)
  const cargarHistorial = async () => {
    setLoading(true);
    try {
      const data = await getHistorialVentas();
      setVentas(data);
      setFechaSeleccionada(hoyISO());
    } catch (error) {
      console.error("Error al cargar historial:", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. LUEGO USAMOS EL EFECTO
  useEffect(() => {
    cargarHistorial();
  }, []);

  const handleVerDetalle = (pedido) => {
    setPedidoSeleccionado(pedido);
    setShowSidebar(true);
  };

  const handleCerrarSidebar = () => {
    setShowSidebar(false);
    setTimeout(() => setPedidoSeleccionado(null), 300);
  };

  const fechasDisponibles = useMemo(() => {
    const fechas = ventas.map((venta) => formatearFecha(venta.created_at));
    return [...new Set(fechas)];
  }, [ventas]);

  const ventasFiltradas = useMemo(() => {
    if (!fechaSeleccionada) return ventas;
    return ventas.filter((venta) => formatearFecha(venta.created_at) === fechaSeleccionada);
  }, [ventas, fechaSeleccionada]);

  // Calculamos el total vendido para el día seleccionado
  const totalVentas = ventasFiltradas.reduce((acc, curr) => acc + curr.total, 0);
  const totalMesas = ventasFiltradas.length;

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
      
      {/* Header */}
      <div className="mb-3 mb-md-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start mb-2">
            <div className="mb-3 mb-md-0">
              <h2 className="mb-1 fw-bold fs-4 fs-md-2" style={{ color: '#2d3748' }}>
                <FileText size={24} className="me-2 d-none d-md-inline" />
                Historial de Ventas
              </h2>
              <p className="text-muted mb-0 small">Visualiza las ventas por día</p>
            </div>
            <div className="d-flex flex-column flex-md-row gap-2 align-items-start align-items-md-center">
              <Form.Select
                size="sm"
                value={fechaSeleccionada || ''}
                onChange={(e) => setFechaSeleccionada(e.target.value || null)}
                style={{ minWidth: '170px' }}
              >
                <option value="">Todas las fechas</option>
                {fechasDisponibles.map((fecha) => (
                  <option key={fecha} value={fecha}>{fecha}</option>
                ))}
              </Form.Select>
              <Button 
                variant="outline-secondary"
                onClick={cargarHistorial}
                disabled={loading}
                className="w-100 w-md-auto"
              >
                {loading ? <Spinner animation="border" size="sm" className="me-1"/> : <RefreshCw size={18} className="me-1" />}
                {loading ? 'Cargando...' : 'Actualizar'}
              </Button>
            </div>
          </div>
      </div>

      {/* Cards de Estadísticas */}
      <Row className="mb-3 mb-md-4 g-2 g-md-3">
        <Col xs={12} sm={6} md={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 small">Total Recaudado</p>
                  <h3 className="mb-0 fw-bold text-success fs-5">${totalVentas.toLocaleString('es-AR')}</h3>
                </div>
                <div className="bg-success bg-opacity-10 rounded p-2 p-md-3">
                  <DollarSign size={20} className="text-success" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 small">Mesas Cerradas</p>
                  <h3 className="mb-0 fw-bold text-primary fs-5">{totalMesas}</h3>
                </div>
                <div className="bg-primary bg-opacity-10 rounded p-2 p-md-3">
                  <CheckCircle size={20} className="text-primary" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={12} md={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 small">Promedio por Mesa</p>
                  <h3 className="mb-0 fw-bold text-info fs-5">
                    ${totalMesas > 0 ? Math.round(totalVentas / totalMesas).toLocaleString('es-AR') : 0}
                  </h3>
                </div>
                <div className="bg-info bg-opacity-10 rounded p-2 p-md-3">
                  <Calendar size={20} className="text-info" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tabla de Ventas */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          {fechaSeleccionada && (
            <div className="px-3 pt-3 text-muted small">
              Mostrando ventas de {fechaSeleccionada}
            </div>
          )}
          <div className="table-responsive">
            <table className="table table-hover mb-0" style={{ fontSize: '0.95rem' }}>
              <thead style={{ backgroundColor: '#f7fafc', borderBottom: '2px solid #e2e8f0' }}>
                <tr>
                  <th className="px-2 px-md-4 py-2 py-md-3 text-uppercase small text-muted fw-semibold d-none d-md-table-cell">ID Pedido</th>
                  <th className="px-2 px-md-4 py-2 py-md-3 text-uppercase small text-muted fw-semibold">Fecha y Hora</th>
                  <th className="px-2 px-md-4 py-2 py-md-3 text-uppercase small text-muted fw-semibold">Mesa</th>
                  <th className="px-2 px-md-4 py-2 py-md-3 text-uppercase small text-muted fw-semibold d-none d-lg-table-cell">Pago</th>
                  <th className="px-2 px-md-4 py-2 py-md-3 text-uppercase small text-muted fw-semibold d-none d-sm-table-cell">Estado</th>
                  <th className="px-2 px-md-4 py-2 py-md-3 text-uppercase small text-muted fw-semibold text-end">Total</th>
                </tr>
              </thead>
              <tbody>
                {loading && ventasFiltradas.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-5">Cargando datos...</td></tr>
                ) : ventasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5">
                      <FileText size={48} className="mb-3 opacity-50 text-muted" />
                      <p className="text-muted">No hay ventas registradas aún</p>
                    </td>
                  </tr>
                ) : (
                  ventasFiltradas.map((venta) => (
                    <tr 
                      key={venta.id} 
                      style={{ 
                        borderBottom: '1px solid #f0f0f0',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleVerDetalle(venta)}
                      className="hover-row"
                    >
                      <td className="px-2 px-md-4 py-2 py-md-3 d-none d-md-table-cell">
                        <span className="text-muted small">#{venta.id}</span>
                      </td>
                      <td className="px-2 px-md-4 py-2 py-md-3">
                        <div>
                          <div className="fw-semibold text-dark small">
                            {new Date(venta.created_at).toLocaleDateString('es-AR', { 
                              day: '2-digit',
                              month: '2-digit'
                            })}
                          </div>
                          <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                            {new Date(venta.created_at).toLocaleTimeString('es-AR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </small>
                        </div>
                      </td>
                      <td className="px-2 px-md-4 py-2 py-md-3">
                        <Badge 
                          bg="secondary" 
                          className="px-2 py-1"
                          style={{ fontWeight: '500', fontSize: '0.75rem' }}
                        >
                          {venta.mesas?.numero_mesa}
                        </Badge>
                      </td>
                      <td className="px-2 px-md-4 py-2 py-md-3 d-none d-lg-table-cell">
                        <span className="small text-muted text-capitalize">{venta.metodo_pago || 'Sin datos'}</span>
                      </td>
                      <td className="px-2 px-md-4 py-2 py-md-3 d-none d-sm-table-cell">
                        <Badge 
                          bg="success" 
                          className="px-2 py-1"
                          style={{ fontWeight: '500', fontSize: '0.7rem' }}
                        >
                          <CheckCircle size={12} className="me-1" />
                          Cobrado
                        </Badge>
                      </td>
                      <td className="px-2 px-md-4 py-2 py-md-3 text-end">
                        <span className="fw-semibold text-success small">
                          ${venta.total.toLocaleString('es-AR')}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card.Body>
      </Card>

      {/* Sidebar de Detalle del Pedido */}
      <Offcanvas show={showSidebar} onHide={handleCerrarSidebar} placement="end" style={{ width: '450px' }}>
        <Offcanvas.Header className="bg-dark text-white">
          <Offcanvas.Title className="d-flex align-items-center">
            <ShoppingBag size={24} className="me-2" />
            Detalle del Pedido #{pedidoSeleccionado?.id}
          </Offcanvas.Title>
          <Button variant="link" className="text-white" onClick={handleCerrarSidebar}>
            <X size={24} />
          </Button>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {pedidoSeleccionado && (
            <>
              {/* Información General */}
              <Card className="mb-3 border-0 shadow-sm">
                <Card.Body>
                  <Row className="mb-2">
                    <Col xs={6}>
                      <small className="text-muted">Mesa</small>
                      <div className="fw-bold">Mesa {pedidoSeleccionado.mesas?.numero_mesa}</div>
                    </Col>
                    <Col xs={6}>
                      <small className="text-muted">Estado</small>
                      <div>
                        <Badge bg="success" className="mt-1">
                          <CheckCircle size={14} className="me-1" />
                          Cobrado
                        </Badge>
                      </div>
                    </Col>
                  </Row>
                  <Row className="mb-2">
                    <Col xs={12}>
                      <small className="text-muted">Forma de Pago</small>
                      <div className="fw-semibold text-capitalize">
                        {pedidoSeleccionado.metodo_pago || 'Sin datos'}
                      </div>
                    </Col>
                  </Row>
                  <Row>
                    <Col xs={12}>
                      <small className="text-muted">Fecha y Hora</small>
                      <div className="fw-semibold">
                        {new Date(pedidoSeleccionado.created_at).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                      <small className="text-muted">
                        {new Date(pedidoSeleccionado.created_at).toLocaleTimeString('es-AR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </small>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Productos del Pedido */}
              <div className="mb-3">
                <h6 className="text-muted text-uppercase mb-3" style={{ fontSize: '0.85rem', letterSpacing: '0.5px' }}>
                  Productos Consumidos
                </h6>
                <ListGroup variant="flush">
                  {pedidoSeleccionado.detalle_pedidos?.map((detalle) => (
                    <ListGroup.Item 
                      key={detalle.id} 
                      className="d-flex justify-content-between align-items-start px-0 py-3"
                    >
                      <div className="flex-grow-1">
                        <div className="fw-semibold text-dark mb-1">
                          {detalle.productos?.nombre}
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <Badge 
                            bg="light" 
                            text="dark" 
                            className="text-capitalize"
                          >
                            {detalle.productos?.categoria}
                          </Badge>
                          <small className="text-muted">
                            ${detalle.precio_unitario.toLocaleString('es-AR')} × {detalle.cantidad}
                          </small>
                        </div>
                      </div>
                      <div className="text-end">
                        <div className="fw-bold text-dark">
                          ${(detalle.precio_unitario * detalle.cantidad).toLocaleString('es-AR')}
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </div>

              {/* Total */}
              <Card className="bg-light border-0">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Total Cobrado</h5>
                    <h4 className="mb-0 text-success fw-bold">
                      ${pedidoSeleccionado.total.toLocaleString('es-AR')}
                    </h4>
                  </div>
                </Card.Body>
              </Card>
            </>
          )}
        </Offcanvas.Body>
      </Offcanvas>
    </Container>
  );
};

export default Historial;