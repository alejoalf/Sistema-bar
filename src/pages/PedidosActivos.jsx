import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Badge, Button, Table, Spinner, Modal, ListGroup, Toast, ToastContainer } from 'react-bootstrap';
import { ClipboardList, RefreshCw, ShoppingBag, Trash2, Edit2, CheckCircle, XCircle } from 'lucide-react';
import { getPedidosBarra, cobrarClienteBarra, getCuentaMesa, cobrarMesa, eliminarItemPedido, crearPedido, cancelarClienteBarra, cancelarMesa } from '../services/pedidos';
import { getMesas } from '../services/mesas';
import { getProductos } from '../services/productos';

const PedidosActivos = () => {
  const [pedidosBarra, setPedidosBarra] = useState([]);
  const [pedidosMesas, setPedidosMesas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Toast notifications
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState('success');
  
  // Modal de edición
  const [showEditModal, setShowEditModal] = useState(false);
  const [pedidoEditando, setPedidoEditando] = useState(null);
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);

  useEffect(() => {
    cargarPedidos();
  }, []);

  const mostrarToast = (mensaje, variant = 'success') => {
    setToastMessage(mensaje);
    setToastVariant(variant);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const cargarPedidos = async () => {
    setLoading(true);
    try {
      // Pedidos de barra agrupados por cliente
      const barra = await getPedidosBarra();
      
      // Agrupar pedidos por cliente
      const pedidosAgrupados = {};
      barra.forEach(pedido => {
        if (!pedidosAgrupados[pedido.cliente]) {
          pedidosAgrupados[pedido.cliente] = {
            cliente: pedido.cliente,
            pedidos: [],
            total: 0
          };
        }
        pedidosAgrupados[pedido.cliente].pedidos.push(pedido);
        pedidosAgrupados[pedido.cliente].total += pedido.total;
      });
      
      setPedidosBarra(Object.values(pedidosAgrupados));
      
      // Pedidos de mesas ocupadas
      const mesas = await getMesas();
      const mesasOcupadas = mesas.filter(m => m.estado === 'ocupada');
      
      const pedidosMesasData = await Promise.all(
        mesasOcupadas.map(async (mesa) => {
          const cuenta = await getCuentaMesa(mesa.id);
          return {
            mesa,
            pedidos: cuenta,
            total: cuenta.reduce((sum, p) => sum + p.total, 0)
          };
        })
      );
      
      setPedidosMesas(pedidosMesasData.filter(m => m.pedidos.length > 0));
    } catch (error) {
      console.error("Error cargando pedidos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCobrarBarra = async (nombreCliente) => {
    if (!confirm("¿Cobrar este pedido?")) return;
    try {
      // Actualización optimista: remover del estado inmediatamente
      setPedidosBarra(prev => prev.filter(p => p.cliente !== nombreCliente));
      mostrarToast(`✅ Pedido de ${nombreCliente} cobrado exitosamente`);
      
      // Luego hacer la llamada a la DB en segundo plano
      await cobrarClienteBarra(nombreCliente);
    } catch (error) {
      mostrarToast("Error al cobrar el pedido", "danger");
      console.error(error);
      // Si falla, recargar para recuperar el estado correcto
      cargarPedidos();
    }
  };

  const handleCobrarMesa = async (mesaId) => {
    if (!confirm("¿Cobrar toda la mesa?")) return;
    try {
      const mesa = pedidosMesas.find(m => m.mesa.id === mesaId);
      // Actualización optimista: remover del estado inmediatamente
      setPedidosMesas(prev => prev.filter(m => m.mesa.id !== mesaId));
      mostrarToast(`✅ Mesa ${mesa?.mesa.numero_mesa} cobrada exitosamente`);
      
      // Luego hacer la llamada a la DB en segundo plano
      await cobrarMesa(mesaId);
    } catch (error) {
      mostrarToast("Error al cobrar la mesa", "danger");
      console.error(error);
      // Si falla, recargar para recuperar el estado correcto
      cargarPedidos();
    }
  };

  const handleCancelarBarra = async (nombreCliente) => {
    if (!confirm("¿Cancelar este pedido? Se devolverá el stock de los productos.")) return;
    try {
      // Actualización optimista: remover del estado inmediatamente
      setPedidosBarra(prev => prev.filter(p => p.cliente !== nombreCliente));
      mostrarToast(`✅ Pedido de ${nombreCliente} cancelado exitosamente`);
      
      // Luego hacer la llamada a la DB en segundo plano
      await cancelarClienteBarra(nombreCliente);
    } catch (error) {
      mostrarToast("Error al cancelar el pedido", "danger");
      console.error(error);
      // Si falla, recargar para recuperar el estado correcto
      cargarPedidos();
    }
  };

  const handleCancelarMesa = async (mesaId) => {
    if (!confirm("¿Cancelar toda la mesa? Se devolverá el stock y se liberará la mesa.")) return;
    try {
      const mesa = pedidosMesas.find(m => m.mesa.id === mesaId);
      
      // Primero hacer la llamada a la DB
      await cancelarMesa(mesaId);
      
      // Actualización optimista: remover del estado solo si tuvo éxito
      setPedidosMesas(prev => prev.filter(m => m.mesa.id !== mesaId));
      mostrarToast(`✅ Mesa ${mesa?.mesa.numero_mesa} cancelada exitosamente`);
    } catch (error) {
      mostrarToast("Error al cancelar la mesa", "danger");
      console.error(error);
      // Si falla, recargar para recuperar el estado correcto
      cargarPedidos();
    }
  };

  const handleEditarPedido = async (pedidos, tipo, identificador, mesaId = null) => {
    // Cargar productos disponibles
    const prods = await getProductos();
    setProductos(prods || []);
    
    setPedidoEditando({ pedidos, tipo, identificador, mesaId });
    setCarrito([]);
    setShowEditModal(true);
  };

  const handleEliminarItem = async (detalleId, productoId, pedidoId) => {
    if (!confirm("¿Eliminar este producto del pedido?")) return;
    try {
      // Actualización optimista del modal
      if (pedidoEditando) {
        const pedidosActualizados = pedidoEditando.pedidos.map(pedido => {
          if (pedido.id === pedidoId) {
            const nuevosDetalles = pedido.detalle_pedidos.filter(d => d.id !== detalleId);
            const itemEliminado = pedido.detalle_pedidos.find(d => d.id === detalleId);
            const precioEliminado = itemEliminado ? itemEliminado.cantidad * itemEliminado.precio_unitario : 0;
            
            return {
              ...pedido,
              detalle_pedidos: nuevosDetalles,
              total: pedido.total - precioEliminado
            };
          }
          return pedido;
        }).filter(p => p.detalle_pedidos.length > 0); // Remover pedidos vacíos

        setPedidoEditando({
          ...pedidoEditando,
          pedidos: pedidosActualizados
        });

        // Actualizar también el estado principal
        const { tipo, identificador } = pedidoEditando;
        if (tipo === 'barra') {
          setPedidosBarra(prev => prev.map(cliente => {
            if (cliente.cliente === identificador) {
              return {
                ...cliente,
                pedidos: pedidosActualizados,
                total: pedidosActualizados.reduce((sum, p) => sum + p.total, 0)
              };
            }
            return cliente;
          }).filter(c => c.pedidos.length > 0));
        } else {
          setPedidosMesas(prev => prev.map(mesaData => {
            if (mesaData.mesa.id === identificador) {
              return {
                ...mesaData,
                pedidos: pedidosActualizados,
                total: pedidosActualizados.reduce((sum, p) => sum + p.total, 0)
              };
            }
            return mesaData;
          }).filter(m => m.pedidos.length > 0));
        }

        // Si no quedan pedidos, cerrar el modal
        if (pedidosActualizados.length === 0) {
          setShowEditModal(false);
        }
      }
      
      // Luego hacer la llamada a la DB en segundo plano
      await eliminarItemPedido(detalleId, productoId, null, pedidoId);
      mostrarToast("Producto eliminado correctamente");
    } catch (error) {
      mostrarToast("Error al eliminar el producto", "danger");
      console.error(error);
      // Si falla, recargar para recuperar el estado correcto
      cargarPedidos();
    }
  };

  const agregarAlCarrito = (producto) => {
    setCarrito([...carrito, producto]);
  };

  const handleConfirmarAgregar = async () => {
    if (carrito.length === 0) return;
    try {
      const total = carrito.reduce((sum, item) => sum + item.precio, 0);
      const { tipo, identificador, mesaId } = pedidoEditando;
      
      // Crear nuevo pedido optimista
      const nuevoPedido = {
        id: `temp-${Date.now()}`, // ID temporal
        total: total,
        created_at: new Date().toISOString(),
        estado: 'pendiente',
        detalle_pedidos: carrito.map(item => ({
          id: `temp-${Date.now()}-${item.id}`,
          producto_id: item.id,
          cantidad: 1,
          precio_unitario: item.precio,
          productos: { nombre: item.nombre }
        }))
      };

      // Actualización optimista del modal
      const pedidosActualizados = [...pedidoEditando.pedidos, nuevoPedido];
      setPedidoEditando({
        ...pedidoEditando,
        pedidos: pedidosActualizados
      });

      // Actualizar estado principal
      if (tipo === 'barra') {
        setPedidosBarra(prev => prev.map(cliente => {
          if (cliente.cliente === identificador) {
            return {
              ...cliente,
              pedidos: pedidosActualizados,
              total: cliente.total + total
            };
          }
          return cliente;
        }));
      } else {
        setPedidosMesas(prev => prev.map(mesaData => {
          if (mesaData.mesa.id === identificador) {
            return {
              ...mesaData,
              pedidos: pedidosActualizados,
              total: mesaData.total + total
            };
          }
          return mesaData;
        }));
      }

      setCarrito([]);
      mostrarToast(`✅ ${carrito.length} producto(s) agregado(s) correctamente`);
      
      // Luego hacer la llamada a la DB en segundo plano
      if (tipo === 'barra') {
        await crearPedido(null, carrito, total, identificador);
      } else {
        await crearPedido(mesaId, carrito, total);
      }
      
      // Recargar solo los datos del pedido editado para obtener IDs reales
      if (tipo === 'barra') {
        const barra = await getPedidosBarra();
        const clientePedidos = barra.filter(p => p.cliente === identificador);
        const clienteData = {
          cliente: identificador,
          pedidos: clientePedidos,
          total: clientePedidos.reduce((sum, p) => sum + p.total, 0)
        };
        setPedidoEditando({ ...pedidoEditando, pedidos: clienteData.pedidos });
        setPedidosBarra(prev => prev.map(c => c.cliente === identificador ? clienteData : c));
      } else {
        const cuenta = await getCuentaMesa(mesaId);
        const mesaData = {
          pedidos: cuenta,
          total: cuenta.reduce((sum, p) => sum + p.total, 0)
        };
        setPedidoEditando({ ...pedidoEditando, pedidos: mesaData.pedidos });
        setPedidosMesas(prev => prev.map(m => m.mesa.id === identificador ? { ...m, ...mesaData } : m));
      }
    } catch (error) {
      mostrarToast("Error al agregar productos", "danger");
      console.error(error);
      // Si falla, recargar para recuperar el estado correcto
      cargarPedidos();
    }
  };

  const cerrarEditModal = () => {
    setShowEditModal(false);
    setPedidoEditando(null);
    setCarrito([]);
    // No recargar al cerrar - el estado ya está actualizado
  };

  if (loading) {
    return (
      <Container fluid className="py-4 d-flex justify-content-center align-items-center" style={{ minHeight: '50vh', backgroundColor: '#f8f9fa' }}>
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  return (
    <Container fluid className="py-3 py-md-4 px-2 px-md-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <style>{`
        .hover-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
          transition: all 0.2s ease;
        }
        
        @media (max-width: 767px) {
          .card-body {
            font-size: 0.85rem;
          }
        }
      `}</style>
      
      {/* Header */}
      <div className="mb-3 mb-md-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start mb-2">
          <div className="mb-3 mb-md-0">
            <h2 className="mb-1 fw-bold fs-4 fs-md-2" style={{ color: '#2d3748' }}>
              <ClipboardList size={24} className="me-2 d-none d-md-inline" />
              Pedidos Activos
            </h2>
            <p className="text-muted mb-0 small">Gestión de pedidos pendientes de cobro</p>
          </div>
          <Button 
            variant="outline-secondary"
            onClick={cargarPedidos}
            disabled={loading}
          >
            {loading ? <Spinner animation="border" size="sm" className="me-1"/> : <RefreshCw size={18} className="me-1" />}
            Actualizar
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <Row className="mb-4">
        <Col xs={6} md={3} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <ShoppingBag size={28} className="text-info mb-2" />
              <h3 className="mb-0 fw-bold">{pedidosBarra.length}</h3>
              <small className="text-muted">Pedidos Barra</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <ClipboardList size={28} className="text-danger mb-2" />
              <h3 className="mb-0 fw-bold">{pedidosMesas.length}</h3>
              <small className="text-muted">Mesas Ocupadas</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Pedidos de Barra */}
      <div className="mb-5">
        <h4 className="mb-3 fw-semibold" style={{ color: '#2d3748' }}>
          🛍️ Pedidos de Barra
        </h4>
        {pedidosBarra.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center py-5">
              <ShoppingBag size={48} className="text-muted mb-3" />
              <p className="text-muted mb-0">No hay pedidos de barra activos</p>
            </Card.Body>
          </Card>
        ) : (
          <Row>
            {pedidosBarra.map(({ cliente, pedidos, total }) => (
              <Col key={cliente} xs={12} md={6} lg={4} className="mb-3">
                <Card className="border-0 shadow-sm hover-card h-100">
                  <Card.Header className="bg-info text-white border-0 d-flex justify-content-between align-items-center">
                    <span className="fw-bold">{cliente}</span>
                    <Badge bg="warning" text="dark">pendiente</Badge>
                  </Card.Header>
                  <Card.Body>
                    <Table size="sm" borderless className="mb-0">
                      <tbody>
                        {pedidos.map(pedido => (
                          <React.Fragment key={pedido.id}>
                            <tr>
                              <td colSpan={2} className="text-muted small pt-2">
                                {new Date(pedido.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                              </td>
                            </tr>
                            {pedido.detalle_pedidos?.map((detalle, idx) => (
                              <tr key={idx}>
                                <td className="small">• {detalle.cantidad}x {detalle.productos?.nombre}</td>
                                <td className="text-end small fw-semibold">${detalle.precio_unitario * detalle.cantidad}</td>
                              </tr>
                            ))}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </Table>
                    <hr />
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-semibold">Total:</span>
                      <h4 className="mb-0 text-primary fw-bold">${total}</h4>
                    </div>
                  </Card.Body>
                  <Card.Footer className="bg-white border-0 pt-0">
                    <div className="d-grid gap-2">
                      <Button 
                        variant="outline-primary" 
                        onClick={() => handleEditarPedido(pedidos, 'barra', cliente)}
                      >
                        <Edit2 size={18} className="me-2" />
                        Editar Pedido
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        onClick={() => handleCancelarBarra(cliente)}
                      >
                        <XCircle size={18} className="me-2" />
                        Cancelar Pedido
                      </Button>
                      <Button 
                        variant="success" 
                        onClick={() => handleCobrarBarra(cliente)}
                      >
                        💸 Cobrar - ${total}
                      </Button>
                    </div>
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>

      {/* Pedidos de Mesas */}
      <div>
        <h4 className="mb-3 fw-semibold" style={{ color: '#2d3748' }}>
          🪑 Mesas Ocupadas
        </h4>
        {pedidosMesas.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center py-5">
              <ClipboardList size={48} className="text-muted mb-3" />
              <p className="text-muted mb-0">No hay mesas ocupadas</p>
            </Card.Body>
          </Card>
        ) : (
          <Row>
            {pedidosMesas.map(({ mesa, pedidos, total }) => (
              <Col key={mesa.id} xs={12} md={6} lg={4} className="mb-3">
                <Card className="border-0 shadow-sm hover-card h-100">
                  <Card.Header className="bg-dark text-white border-0 d-flex justify-content-between align-items-center">
                    <span className="fw-bold">Mesa {mesa.numero_mesa}</span>
                    <Badge bg="danger">ocupada</Badge>
                  </Card.Header>
                  <Card.Body>
                    <Table size="sm" borderless className="mb-0">
                      <tbody>
                        {pedidos.map(pedido => (
                          <React.Fragment key={pedido.id}>
                            <tr>
                              <td colSpan={2} className="text-muted small pt-2">
                                {new Date(pedido.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                              </td>
                            </tr>
                            {pedido.detalle_pedidos?.map((detalle, idx) => (
                              <tr key={idx}>
                                <td className="small">• {detalle.cantidad}x {detalle.productos?.nombre}</td>
                                <td className="text-end small fw-semibold">${detalle.precio_unitario * detalle.cantidad}</td>
                              </tr>
                            ))}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </Table>
                    <hr />
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-semibold">Total:</span>
                      <h4 className="mb-0 text-primary fw-bold">${total}</h4>
                    </div>
                  </Card.Body>
                  <Card.Footer className="bg-white border-0 pt-0">
                    <div className="d-grid gap-2">
                      <Button 
                        variant="outline-primary" 
                        onClick={() => handleEditarPedido(pedidos, 'mesa', mesa.id, mesa.id)}
                      >
                        <Edit2 size={18} className="me-2" />
                        Editar Pedido
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        onClick={() => handleCancelarMesa(mesa.id)}
                      >
                        <XCircle size={18} className="me-2" />
                        Cancelar Mesa
                      </Button>
                      <Button 
                        variant="success" 
                        onClick={() => handleCobrarMesa(mesa.id)}
                      >
                        💸 Cobrar - ${total}
                      </Button>
                    </div>
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>

      {/* Modal de edición de pedido */}
      <Modal show={showEditModal} onHide={cerrarEditModal} size="lg" centered>
        <Modal.Header closeButton className="bg-dark text-white">
          <Modal.Title>
            {pedidoEditando?.tipo === 'barra' ? `🛍️ ${pedidoEditando.identificador}` : `Mesa ${pedidosMesas.find(m => m.mesa.id === pedidoEditando?.identificador)?.mesa.numero_mesa}`}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {pedidoEditando && (
            <>
              {/* Productos actuales */}
              <div className="mb-4">
                <h5 className="mb-3 fw-semibold">📦 Productos Actuales</h5>
                <ListGroup>
                  {pedidoEditando.pedidos.map(pedido => (
                    <React.Fragment key={pedido.id}>
                      <ListGroup.Item className="bg-light border-0 py-2">
                        <small className="text-muted fw-semibold">
                          {new Date(pedido.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                        </small>
                      </ListGroup.Item>
                      {pedido.detalle_pedidos?.map((detalle, idx) => (
                        <ListGroup.Item 
                          key={detalle.id || idx} 
                          className="d-flex justify-content-between align-items-center"
                        >
                          <div className="flex-grow-1">
                            <div className="fw-semibold">{detalle.productos?.nombre}</div>
                            <small className="text-muted">
                              {detalle.cantidad}x ${detalle.precio_unitario} = ${detalle.cantidad * detalle.precio_unitario}
                            </small>
                          </div>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleEliminarItem(detalle.id, detalle.producto_id, pedido.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </ListGroup.Item>
                      ))}
                    </React.Fragment>
                  ))}
                </ListGroup>
                <div className="mt-3 p-3 bg-light rounded">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-bold">Total:</span>
                    <h4 className="mb-0 text-primary">
                      ${pedidoEditando.pedidos.reduce((sum, p) => sum + p.total, 0)}
                    </h4>
                  </div>
                </div>
              </div>

              <hr />

              {/* Agregar nuevos productos */}
              <div>
                <h5 className="mb-3 fw-semibold">➕ Agregar Productos</h5>
                <Row>
                  <Col md={7}>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      <ListGroup>
                        {productos.map(prod => (
                          <ListGroup.Item 
                            key={prod.id} 
                            action 
                            onClick={() => agregarAlCarrito(prod)}
                            className="d-flex justify-content-between align-items-center"
                          >
                            <div>
                              <div className="fw-semibold">{prod.nombre}</div>
                              <small className="text-muted">{prod.categoria}</small>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                              <Badge bg={prod.stock_actual > 0 ? 'success' : 'danger'}>
                                Stock: {prod.stock_actual}
                              </Badge>
                              <span className="fw-bold">${prod.precio}</span>
                              <Button size="sm" variant="outline-primary">+</Button>
                            </div>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    </div>
                  </Col>
                  <Col md={5} className="border-start">
                    <div className="bg-light p-3 rounded">
                      <h6 className="fw-semibold mb-2">🛒 Por agregar:</h6>
                      {carrito.length === 0 ? (
                        <p className="text-muted small">Selecciona productos...</p>
                      ) : (
                        <ul className="mb-3 ps-3">
                          {carrito.map((item, i) => (
                            <li key={i} className="small">{item.nombre} - ${item.precio}</li>
                          ))}
                        </ul>
                      )}
                      <h5 className="text-end mb-3">${carrito.reduce((sum, item) => sum + item.precio, 0)}</h5>
                      <Button 
                        variant="success" 
                        className="w-100"
                        disabled={carrito.length === 0}
                        onClick={handleConfirmarAgregar}
                      >
                        Confirmar ✓
                      </Button>
                    </div>
                  </Col>
                </Row>
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>

      {/* Toast Notifications */}
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
        <Toast show={showToast} onClose={() => setShowToast(false)} bg={toastVariant} delay={3000} autohide>
          <Toast.Header>
            <CheckCircle size={18} className="me-2" />
            <strong className="me-auto">Notificación</strong>
          </Toast.Header>
          <Toast.Body className={toastVariant === 'danger' ? 'text-white' : ''}>{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  );
};

export default PedidosActivos;
