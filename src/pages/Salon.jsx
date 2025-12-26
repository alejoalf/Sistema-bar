import React, { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Spinner, Alert, Card, Button, Form, ListGroup, Modal } from 'react-bootstrap';
import MesaCard from '../components/mesas/MesaCard';
import PedidoModal from '../components/pedidos/PedidoModal';
import { getMesas, abrirMesa } from '../services/mesas';
import { getProductos } from '../services/productos';
import { crearPedido, cobrarMesa, cobrarPedidoBarra } from '../services/pedidos';
import PaymentMethodModal from '../components/common/PaymentMethodModal';
import { registrarExtraccion } from '../services/caja';

const Salon = () => {
  const [mesas, setMesas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Estados para gestionar creación del pedido
  const [selectedCategory, setSelectedCategory] = useState('');
  const [orderItems, setOrderItems] = useState([]);
  const [mesaAsignada, setMesaAsignada] = useState('barra');
  const [clienteNombre, setClienteNombre] = useState('');
  const [pagoInmediato, setPagoInmediato] = useState('despues');
  const [paymentContext, setPaymentContext] = useState(null);
  const [confirmingPayment, setConfirmingPayment] = useState(false);

  const [showExtraccionModal, setShowExtraccionModal] = useState(false);
  const [extraccionMonto, setExtraccionMonto] = useState('');
  const [extraccionMotivo, setExtraccionMotivo] = useState('');
  const [savingExtraccion, setSavingExtraccion] = useState(false);

  // Estados para controlar el Modal existente
  const [showModal, setShowModal] = useState(false);
  const [mesaActiva, setMesaActiva] = useState(null);
  const [pedidoBarra, setPedidoBarra] = useState(null);

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);
      const [mesasData, productosData] = await Promise.all([
        getMesas(),
        getProductos()
      ]);

      setMesas(mesasData || []);
      const disponibles = (productosData || []).filter(prod => prod.disponible !== false);
      setProductos(disponibles);

      if (disponibles.length > 0) {
        setSelectedCategory(disponibles[0].categoria || 'General');
      } else {
        setSelectedCategory('');
      }
    } catch (error) {
      console.error('Error cargando datos del salón:', error);
      setFeedback({ tipo: 'danger', mensaje: 'Error cargando datos del salón. Intenta nuevamente.' });
    } finally {
      setLoading(false);
    }
  };

  const cargarMesas = async () => {
    try {
      const data = await getMesas();
      setMesas(data || []);
    } catch (error) {
      console.error('Error actualizando mesas:', error);
      setFeedback({ tipo: 'danger', mensaje: 'No se pudieron actualizar las mesas.' });
    }
  };

  const handleMesaClick = (mesa) => {
    setMesaActiva(mesa); // Guardamos qué mesa se tocó
    setPedidoBarra(null); // Limpiamos pedido barra
    setShowModal(true);  // Mostramos el modal
  };

  const cerrarModal = () => {
    setShowModal(false);
    setMesaActiva(null);
    setPedidoBarra(null);
  };

  const categorias = useMemo(() => {
    const unique = new Set();
    productos.forEach((producto) => {
      const categoria = producto.categoria || 'General';
      unique.add(categoria);
    });
    return Array.from(unique);
  }, [productos]);

  const productosFiltrados = useMemo(() => {
    if (!selectedCategory) return productos;
    return productos.filter((producto) => (producto.categoria || 'General') === selectedCategory);
  }, [productos, selectedCategory]);

  const totalPedido = useMemo(() => (
    orderItems.reduce((sum, item) => sum + item.precio * item.cantidad, 0)
  ), [orderItems]);

  const resetPedido = () => {
    setOrderItems([]);
    setMesaAsignada('barra');
    setClienteNombre('');
    setPagoInmediato('despues');
    setFeedback(null);
    setPaymentContext(null);
    setConfirmingPayment(false);
  };

  const handleAddProducto = (producto) => {
    if (producto.disponible === false) {
      setFeedback({ tipo: 'warning', mensaje: `${producto.nombre} no está disponible para pedidos.` });
      return;
    }

    if (producto.stock_actual !== undefined && producto.stock_actual <= 0) {
      setFeedback({ tipo: 'warning', mensaje: `No hay stock disponible para ${producto.nombre}.` });
      return;
    }

    setOrderItems((prev) => {
      const existente = prev.find((item) => item.id === producto.id);
      if (existente) {
        return prev.map((item) =>
          item.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          id: producto.id,
          nombre: producto.nombre,
          precio: producto.precio,
          cantidad: 1,
          producto
        }
      ];
    });
  };

  const handleCambiarCantidad = (productoId, nuevaCantidad) => {
    const cantidad = Number(nuevaCantidad);
    setOrderItems((prev) => {
      if (cantidad <= 0) {
        return prev.filter((item) => item.id !== productoId);
      }
      return prev.map((item) =>
        item.id === productoId ? { ...item, cantidad } : item
      );
    });
  };

  const handleEliminarItem = (productoId) => {
    setOrderItems((prev) => prev.filter((item) => item.id !== productoId));
  };

  const handleConfirmarPedido = async () => {
    if (orderItems.length === 0) {
      setFeedback({ tipo: 'warning', mensaje: 'Agrega al menos un producto al pedido.' });
      return;
    }

    const esBarra = mesaAsignada === 'barra';
    const mesaSeleccionada = mesas.find((mesa) => String(mesa.id) === mesaAsignada);
    const mesaId = esBarra ? null : mesaSeleccionada?.id;
    const cliente = esBarra ? clienteNombre.trim() : null;

    if (!esBarra && !mesaId) {
      setFeedback({ tipo: 'warning', mensaje: 'Selecciona una mesa para el pedido.' });
      return;
    }

    if (esBarra && !cliente) {
      setFeedback({ tipo: 'warning', mensaje: 'Ingresa el nombre del cliente para pedidos sin mesa.' });
      return;
    }

    const itemsParaPedido = orderItems.flatMap((item) =>
      Array.from({ length: item.cantidad }, () => item.producto)
    );

    if (itemsParaPedido.length === 0) {
      setFeedback({ tipo: 'warning', mensaje: 'No se pudo procesar el pedido. Intenta nuevamente.' });
      return;
    }

    setSubmitting(true);
    let paymentPending = false;

    try {
      if (mesaId) {
        if (mesaSeleccionada && mesaSeleccionada.estado !== 'ocupada') {
          await abrirMesa(mesaId);
        }
      }

      const total = totalPedido;
      const pedidoId = await crearPedido(mesaId, itemsParaPedido, total, cliente || null);

      if (pagoInmediato === 'ahora') {
        const etiqueta = mesaId
          ? `Mesa ${mesaSeleccionada?.numero_mesa || ''}`.trim()
          : (cliente || 'Pedido de barra');

        setPaymentContext({
          tipo: mesaId ? 'mesa' : 'barra',
          mesaId,
          pedidoId,
          etiqueta,
          total,
          mantenerOcupada: Boolean(mesaId) // si es mesa y cobro ahora, mantenerla ocupada pero pagada
        });
        paymentPending = true;
        return;
      }

      resetPedido();
      await cargarMesas();
      setFeedback({ tipo: 'success', mensaje: 'Pedido registrado correctamente.' });
    } catch (error) {
      console.error('Error confirmando pedido:', error);
      setFeedback({ tipo: 'danger', mensaje: 'No se pudo registrar el pedido. Revisa los datos e intenta nuevamente.' });
    } finally {
      if (!paymentPending) {
        setSubmitting(false);
      }
    }
  };

  const cancelarPago = () => {
    resetPedido();
    cargarMesas();
    setSubmitting(false);
    setFeedback({ tipo: 'warning', mensaje: 'Pedido registrado. El cobro queda pendiente.' });
  };

  const confirmarPago = async (metodo) => {
    if (!paymentContext || !metodo) return;
    try {
      setConfirmingPayment(true);
      if (paymentContext.tipo === 'mesa' && paymentContext.mesaId) {
        await cobrarMesa(paymentContext.mesaId, metodo, paymentContext.mantenerOcupada);
      } else if (paymentContext.tipo === 'barra' && paymentContext.pedidoId) {
        await cobrarPedidoBarra(paymentContext.pedidoId, metodo);
      }

      resetPedido();
      await cargarMesas();
      setFeedback({ tipo: 'success', mensaje: `Pedido cobrado (${metodo}).` });
    } catch (error) {
      console.error('Error cobrando pedido:', error);
      setFeedback({ tipo: 'danger', mensaje: 'No se pudo completar el cobro. Intenta nuevamente.' });
    } finally {
      setConfirmingPayment(false);
      setPaymentContext(null);
      setSubmitting(false);
    }
  };

  const abrirModalExtraccion = () => {
    setExtraccionMonto('');
    setExtraccionMotivo('');
    setShowExtraccionModal(true);
  };

  const registrarExtraccionCaja = async () => {
    const monto = Number(extraccionMonto);
    if (!monto || monto <= 0) {
      setFeedback({ tipo: 'warning', mensaje: 'Ingresa un monto válido para la extracción.' });
      return;
    }
    if (!extraccionMotivo.trim()) {
      setFeedback({ tipo: 'warning', mensaje: 'Describe el motivo de la extracción.' });
      return;
    }
    try {
      setSavingExtraccion(true);
      await registrarExtraccion(monto, extraccionMotivo.trim());
      setFeedback({ tipo: 'success', mensaje: 'Extracción registrada en caja.' });
      setExtraccionMonto('');
      setExtraccionMotivo('');
      setShowExtraccionModal(false);
    } catch (error) {
      console.error('Error registrando extracción:', error);
      setFeedback({ tipo: 'danger', mensaje: 'No se pudo registrar la extracción. Intenta nuevamente.' });
    } finally {
      setSavingExtraccion(false);
    }
  };

  if (loading && mesas.length === 0) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Crear Nuevo Pedido</h2>
          <p className="text-muted mb-0">Gestiona pedidos para mesas o clientes de barra desde un sólo panel.</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="dark" onClick={abrirModalExtraccion}>
            Extracción de Caja
          </Button>
          <Button variant="outline-secondary" onClick={cargarMesas}>
            Actualizar
          </Button>
        </div>
      </div>

      {feedback && (
        <Alert variant={feedback.tipo} onClose={() => setFeedback(null)} dismissible>
          {feedback.mensaje}
        </Alert>
      )}

      <Row className="g-3 mb-4">
        <Col lg={4}>
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <h5 className="mb-3">Menú</h5>
              {categorias.length > 0 ? (
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {categorias.map((categoria) => (
                    <Button
                      key={categoria}
                      size="sm"
                      variant={selectedCategory === categoria ? 'primary' : 'outline-primary'}
                      onClick={() => setSelectedCategory(categoria)}
                    >
                      {categoria}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-muted">Sin categorías disponibles.</p>
              )}

              <div style={{ maxHeight: '50vh', overflowY: 'auto' }}>
                {productosFiltrados.length === 0 ? (
                  <p className="text-muted">No hay productos en esta categoría.</p>
                ) : (
                  <ListGroup>
                    {productosFiltrados.map((producto) => (
                      <ListGroup.Item
                        key={producto.id}
                        className="d-flex justify-content-between align-items-center"
                      >
                        <div>
                          <div className="fw-semibold">{producto.nombre}</div>
                          <small className="text-muted">${producto.precio}</small>
                        </div>
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={() => handleAddProducto(producto)}
                          disabled={producto.disponible === false}
                        >
                          Agregar
                        </Button>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <h5 className="mb-3">Resumen del Pedido</h5>
              {orderItems.length === 0 ? (
                <p className="text-muted">Todavía no agregaste productos.</p>
              ) : (
                <ListGroup className="mb-3">
                  {orderItems.map((item) => (
                    <ListGroup.Item key={item.id}>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <strong>{item.nombre}</strong>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => handleEliminarItem(item.id)}
                        >
                          Quitar
                        </Button>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <Form.Select
                          style={{ width: '45%' }}
                          value={item.cantidad}
                          onChange={(e) => handleCambiarCantidad(item.id, e.target.value)}
                        >
                          {Array.from({ length: 10 }, (_, idx) => idx + 1).map((value) => (
                            <option key={value} value={value}>{value}</option>
                          ))}
                        </Form.Select>
                        <span className="fw-semibold">${item.precio * item.cantidad}</span>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}

              <div className="d-flex justify-content-between align-items-center">
                <span className="fw-semibold">Total</span>
                <h4 className="mb-0 text-primary">${totalPedido}</h4>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <h5 className="mb-3">Opciones de Asignación</h5>
              <Form.Group className="mb-3">
                <Form.Label>Asignar Mesa</Form.Label>
                <Form.Select
                  value={mesaAsignada}
                  onChange={(e) => setMesaAsignada(e.target.value)}
                >
                  <option value="barra">Sin Mesa (Barra)</option>
                  {mesas.map((mesa) => (
                    <option value={mesa.id} key={mesa.id}>
                      Mesa {mesa.numero_mesa}
                      {mesa.estado === 'ocupada' ? ' - Ocupada' : ''}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              {mesaAsignada === 'barra' && (
                <Form.Group className="mb-3">
                  <Form.Label>Cliente (Obligatorio)</Form.Label>
                  <Form.Control
                    placeholder="Nombre del cliente"
                    value={clienteNombre}
                    onChange={(e) => setClienteNombre(e.target.value)}
                  />
                </Form.Group>
              )}

              <Form.Group className="mb-3">
                <Form.Label>Opciones de Pago</Form.Label>
                <div className="d-flex flex-column gap-2">
                  <Form.Check
                    type="radio"
                    label="Cobrar Ahora"
                    name="opcionPago"
                    value="ahora"
                    checked={pagoInmediato === 'ahora'}
                    onChange={(e) => setPagoInmediato(e.target.value)}
                  />
                  <Form.Check
                    type="radio"
                    label="Cobrar Después"
                    name="opcionPago"
                    value="despues"
                    checked={pagoInmediato === 'despues'}
                    onChange={(e) => setPagoInmediato(e.target.value)}
                  />
                </div>
              </Form.Group>

              <Button
                variant="dark"
                className="w-100"
                disabled={submitting}
                onClick={handleConfirmarPedido}
              >
                {submitting ? 'Procesando...' : 'Confirmar Pedido'}
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <hr className="my-4" />

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Mesas del Salón</h3>
        <span className="text-muted">Selecciona una mesa para ver su detalle.</span>
      </div>

      <Row>
        {mesas.map((mesa) => (
          <Col key={mesa.id} xs={6} md={4} lg={3} className="mb-4">
            <MesaCard mesa={mesa} onClick={handleMesaClick} />
          </Col>
        ))}
      </Row>

      {/* --- AQUÍ ESTÁ EL MODAL --- */}
      <PedidoModal 
        show={showModal} 
        onHide={cerrarModal} 
        mesa={mesaActiva}
        pedidoBarra={pedidoBarra}
        onUpdate={cargarMesas} // Le pasamos la función para refrescar la lista
      />
      <PaymentMethodModal
        show={Boolean(paymentContext)}
        title={`Seleccionar forma de pago${paymentContext?.etiqueta ? ` · ${paymentContext.etiqueta}` : ''}`}
        total={paymentContext?.total || 0}
        onCancel={cancelarPago}
        onConfirm={confirmarPago}
        confirming={confirmingPayment}
      />

      {/* Modal de Extracción */}
      <Modal show={showExtraccionModal} onHide={() => setShowExtraccionModal(false)} centered>
        <Modal.Header closeButton={!savingExtraccion}>
          <Modal.Title>Registrar Extracción</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Monto a extraer</Form.Label>
            <Form.Control
              type="number"
              min="0"
              step="0.01"
              value={extraccionMonto}
              onChange={(e) => setExtraccionMonto(e.target.value)}
              placeholder="0"
              disabled={savingExtraccion}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Motivo</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={extraccionMotivo}
              onChange={(e) => setExtraccionMotivo(e.target.value)}
              placeholder="Ej: Cambio, depósito, gastos menores"
              disabled={savingExtraccion}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowExtraccionModal(false)} disabled={savingExtraccion}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={registrarExtraccionCaja} disabled={savingExtraccion}>
            {savingExtraccion ? 'Guardando...' : 'Registrar extracción'}
          </Button>
        </Modal.Footer>
      </Modal>

    </Container>
  );
};

export default Salon;