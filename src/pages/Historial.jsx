import React, { useEffect, useMemo, useState } from 'react';
import { Container, Card, Row, Col, Badge, Button, Offcanvas, ListGroup, Spinner, Form } from 'react-bootstrap';
import { FileText, DollarSign, CheckCircle, Calendar, RefreshCw, X, ShoppingBag, ArrowDownCircle } from 'lucide-react';
import { getHistorialVentas } from '../services/pedidos';
import { getExtracciones } from '../services/caja';

// Normaliza la fecha (YYYY-MM-DD) para comparar días sin hora
const formatearFecha = (isoString) => {
  if (!isoString) return '';
  return new Date(isoString).toISOString().split('T')[0];
};

const hoyISO = () => new Date().toISOString().split('T')[0];

const Historial = () => {
  const [ventas, setVentas] = useState([]);
  const [extracciones, setExtracciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);

  // 1. DEFINIMOS LA FUNCIÓN PRIMERO (Para evitar errores de referencia)
  const cargarHistorial = async () => {
    setLoading(true);
    try {
      const [ventasData, extraccionesData] = await Promise.all([
        getHistorialVentas(),
        getExtracciones()
      ]);
      setVentas(ventasData || []);
      setExtracciones(extraccionesData || []);
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
    const fechas = [
      ...ventas.map((venta) => formatearFecha(venta.created_at)),
      ...extracciones.map((ext) => formatearFecha(ext.created_at))
    ];
    return [...new Set(fechas)];
  }, [ventas, extracciones]);

  const ventasFiltradas = useMemo(() => {
    if (!fechaSeleccionada) return ventas;
    return ventas.filter((venta) => formatearFecha(venta.created_at) === fechaSeleccionada);
  }, [ventas, fechaSeleccionada]);

  const extraccionesFiltradas = useMemo(() => {
    if (!fechaSeleccionada) return extracciones;
    return extracciones.filter((ext) => formatearFecha(ext.created_at) === fechaSeleccionada);
  }, [extracciones, fechaSeleccionada]);

  // Calculamos el total vendido para el día seleccionado
  const totalVentas = ventasFiltradas.reduce((acc, curr) => acc + curr.total, 0);
  const totalMesas = ventasFiltradas.length;
  const totalExtracciones = extraccionesFiltradas.reduce((acc, curr) => acc + Number(curr.monto || 0), 0);
  const netoDia = totalVentas - totalExtracciones;

  const timeline = useMemo(() => {
    const ventasItems = ventasFiltradas.map((v) => ({ ...v, tipo: 'venta' }));
    const extItems = extraccionesFiltradas.map((e) => ({ ...e, tipo: 'extraccion', total: Number(e.monto || 0) }));
    return [...ventasItems, ...extItems].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [ventasFiltradas, extraccionesFiltradas]);

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
        <Col xs={12} sm={6} md={3}>
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
        <Col xs={12} sm={6} md={3}>
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
        <Col xs={12} sm={6} md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 small">Extracciones</p>
                  <h3 className="mb-0 fw-bold text-danger fs-5">-${totalExtracciones.toLocaleString('es-AR')}</h3>
                </div>
                <div className="bg-danger bg-opacity-10 rounded p-2 p-md-3">
                  <ArrowDownCircle size={20} className="text-danger" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 small">Neto del Día</p>
                  <h3 className="mb-0 fw-bold text-primary fs-5">${netoDia.toLocaleString('es-AR')}</h3>
                </div>
                <div className="bg-primary bg-opacity-10 rounded p-2 p-md-3">
                  <DollarSign size={20} className="text-primary" />
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
                {loading && timeline.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-5">Cargando datos...</td></tr>
                ) : timeline.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5">
                      <FileText size={48} className="mb-3 opacity-50 text-muted" />
                      <p className="text-muted">No hay movimientos registrados aún</p>
                    </td>
                  </tr>
                ) : (
                  timeline.map((item) => (
                    <tr 
                      key={`${item.tipo}-${item.id}`} 
                      style={{ 
                        borderBottom: '1px solid #f0f0f0',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleVerDetalle(item)}
                      className="hover-row"
                    >
                      <td className="px-2 px-md-4 py-2 py-md-3 d-none d-md-table-cell">
                        <span className="text-muted small">{item.tipo === 'venta' ? `#${item.id}` : `EXT-${item.id}`}</span>
                      </td>
                      <td className="px-2 px-md-4 py-2 py-md-3">
                        <div>
                          <div className="fw-semibold text-dark small">
                            {new Date(item.created_at).toLocaleDateString('es-AR', { 
                              day: '2-digit',
                              month: '2-digit'
                            })}
                          </div>
                          <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                            {new Date(item.created_at).toLocaleTimeString('es-AR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </small>
                        </div>
                      </td>
                      <td className="px-2 px-md-4 py-2 py-md-3">
                        {item.tipo === 'venta' ? (
                          <Badge 
                            bg="secondary" 
                            className="px-2 py-1"
                            style={{ fontWeight: '500', fontSize: '0.75rem' }}
                          >
                            {item.mesas?.numero_mesa}
                          </Badge>
                        ) : (
                          <Badge 
                            bg="dark" 
                            className="px-2 py-1"
                            style={{ fontWeight: '500', fontSize: '0.75rem' }}
                          >
                            Caja
                          </Badge>
                        )}
                      </td>
                      <td className="px-2 px-md-4 py-2 py-md-3 d-none d-lg-table-cell">
                        {item.tipo === 'venta' ? (
                          <span className="small text-muted text-capitalize">{item.metodo_pago || 'Sin datos'}</span>
                        ) : (
                          <span className="small text-danger">Extracción</span>
                        )}
                      </td>
                      <td className="px-2 px-md-4 py-2 py-md-3 d-none d-sm-table-cell">
                        {item.tipo === 'venta' ? (
                          <Badge 
                            bg="success" 
                            className="px-2 py-1"
                            style={{ fontWeight: '500', fontSize: '0.7rem' }}
                          >
                            <CheckCircle size={12} className="me-1" />
                            Cobrado
                          </Badge>
                        ) : (
                          <Badge 
                            bg="danger" 
                            className="px-2 py-1"
                            style={{ fontWeight: '500', fontSize: '0.7rem' }}
                          >
                            <ArrowDownCircle size={12} className="me-1" />
                            Extracción
                          </Badge>
                        )}
                      </td>
                      <td className="px-2 px-md-4 py-2 py-md-3 text-end">
                        {item.tipo === 'venta' ? (
                          <span className="fw-semibold text-success small">
                            ${item.total.toLocaleString('es-AR')}
                          </span>
                        ) : (
                          <span className="fw-semibold text-danger small">
                            -${Number(item.total).toLocaleString('es-AR')}
                          </span>
                        )}
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
            {pedidoSeleccionado?.tipo === 'venta' ? (
              <>
                <ShoppingBag size={24} className="me-2" />
                Detalle del Pedido #{pedidoSeleccionado?.id}
              </>
            ) : (
              <>
                <ArrowDownCircle size={24} className="me-2" />
                Extracción de Caja
              </>
            )}
          </Offcanvas.Title>
          <Button variant="link" className="text-white" onClick={handleCerrarSidebar}>
            <X size={24} />
          </Button>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {pedidoSeleccionado && (
            <>
              {pedidoSeleccionado.tipo === 'venta' ? (
                <>
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
              ) : (
                <>
                  <Card className="mb-3 border-0 shadow-sm">
                    <Card.Body>
                      <Row className="mb-2">
                        <Col xs={12}>
                          <small className="text-muted">Motivo</small>
                          <div className="fw-bold">{pedidoSeleccionado.motivo || 'Extracción de caja'}</div>
                        </Col>
                      </Row>
                      <Row className="mb-2">
                        <Col xs={12}>
                          <small className="text-muted">Registrado</small>
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

                  <Card className="bg-light border-0">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Monto Extraído</h5>
                        <h4 className="mb-0 text-danger fw-bold">
                          -${Number(pedidoSeleccionado.total).toLocaleString('es-AR')}
                        </h4>
                      </div>
                    </Card.Body>
                  </Card>
                </>
              )}
            </>
          )}
        </Offcanvas.Body>
      </Offcanvas>
    </Container>
  );
};

export default Historial;