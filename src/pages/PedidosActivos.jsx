import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Badge, Button, Table, Spinner, Modal, ListGroup } from 'react-bootstrap';
import { ClipboardList, RefreshCw, ShoppingBag, Trash2, Edit2 } from 'lucide-react';
import { getPedidosBarra, cobrarClienteBarra, getCuentaMesa, cobrarMesa, eliminarItemPedido, crearPedido } from '../services/pedidos';
import { getMesas } from '../services/mesas';
import { getProductos } from '../services/productos';

const PedidosActivos = () => {
  const [pedidosBarra, setPedidosBarra] = useState([]);
  const [pedidosMesas, setPedidosMesas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal de edición
  const [showEditModal, setShowEditModal] = useState(false);
  const [pedidoEditando, setPedidoEditando] = useState(null);
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);

  useEffect(() => {
    cargarPedidos();
  }, []);

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
      await cobrarClienteBarra(nombreCliente);
      cargarPedidos();
    } catch (error) {
      alert("Error al cobrar");
      console.error(error);
    }
  };

  const handleCobrarMesa = async (mesaId) => {
    if (!confirm("¿Cobrar toda la mesa?")) return;
    try {
      await cobrarMesa(mesaId);
      cargarPedidos();
    } catch (error) {
      alert("Error al cobrar");
      console.error(error);
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
      await eliminarItemPedido(detalleId, productoId, null, pedidoId);
      
      // Recargar los datos del modal
      if (pedidoEditando) {
        const { tipo, identificador } = pedidoEditando;
        await cargarPedidos();
        
        if (tipo === 'barra') {
          const cliente = pedidosBarra.find(p => p.cliente === identificador);
          if (cliente) {
            setPedidoEditando({ ...pedidoEditando, pedidos: cliente.pedidos });
          } else {
            setShowEditModal(false);
          }
        } else {
          const mesa = pedidosMesas.find(p => p.mesa.id === identificador);
          if (mesa) {
            setPedidoEditando({ ...pedidoEditando, pedidos: mesa.pedidos });
          } else {
            setShowEditModal(false);
          }
        }
      }
    } catch (error) {
      alert("Error al eliminar el item");
      console.error(error);
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
      
      if (tipo === 'barra') {
        await crearPedido(null, carrito, total, identificador);
      } else {
        await crearPedido(mesaId, carrito, total);
      }
      
      setCarrito([]);
      alert("✅ Productos agregados!");
      await cargarPedidos();
      
      // Actualizar el modal
      if (tipo === 'barra') {
        const cliente = pedidosBarra.find(p => p.cliente === identificador);
        if (cliente) {
          setPedidoEditando({ ...pedidoEditando, pedidos: cliente.pedidos });
        }
      } else {
        const mesa = pedidosMesas.find(p => p.mesa.id === identificador);
        if (mesa) {
          setPedidoEditando({ ...pedidoEditando, pedidos: mesa.pedidos });
        }
      }
    } catch (error) {
      alert("Error al agregar productos");
      console.error(error);
    }
  };

  const cerrarEditModal = () => {
    setShowEditModal(false);
    setPedidoEditando(null);
    setCarrito([]);
    cargarPedidos();
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
    </Container>
  );
};

export default PedidosActivos;
