import React, { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Card, Badge, Button, Table, Spinner, Modal, ListGroup, Toast, ToastContainer } from 'react-bootstrap';
import { ClipboardList, RefreshCw, ShoppingBag, Trash2, Edit2, CheckCircle, XCircle, Users } from 'lucide-react';
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
  const [showCobroModal, setShowCobroModal] = useState(false);
  const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState('');
  const [contextoCobro, setContextoCobro] = useState(null);
  const [procesandoCobro, setProcesandoCobro] = useState(false);

  const metodosPagoDisponibles = useMemo(() => ([
    'Efectivo',
    'Tarjeta',
    'Transferencia',
    'Mercado Pago',
    'Cuenta Corriente'
  ]), []);

  const totalBarraMonto = useMemo(() => pedidosBarra.reduce((sum, cliente) => sum + cliente.total, 0), [pedidosBarra]);
  const totalMesasMonto = useMemo(() => pedidosMesas.reduce((sum, mesaData) => sum + mesaData.total, 0), [pedidosMesas]);
  const totalPendiente = totalBarraMonto + totalMesasMonto;
  const totalTickets = useMemo(() => {
    const barra = pedidosBarra.reduce((sum, cliente) => sum + cliente.pedidos.length, 0);
    const mesas = pedidosMesas.reduce((sum, mesaData) => sum + mesaData.pedidos.length, 0);
    return barra + mesas;
  }, [pedidosBarra, pedidosMesas]);

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

  const abrirModalCobro = (tipo, identificador, total, etiqueta) => {
    setContextoCobro({ tipo, identificador, total, etiqueta });
    setMetodoPagoSeleccionado('');
    setShowCobroModal(true);
  };

  const cerrarCobroModal = (force = false) => {
    if (procesandoCobro && !force) return;
    setShowCobroModal(false);
    setContextoCobro(null);
    setMetodoPagoSeleccionado('');
  };

  const handleCobrarBarra = (nombreCliente, total) => {
    abrirModalCobro('barra', nombreCliente, total, nombreCliente);
  };

  const handleCobrarMesa = (mesaId, total) => {
    const mesaInfo = pedidosMesas.find(m => m.mesa.id === mesaId);
    const etiqueta = mesaInfo ? `Mesa ${mesaInfo.mesa.numero_mesa}` : `Mesa ${mesaId}`;
    abrirModalCobro('mesa', mesaId, total, etiqueta);
  };

  const confirmarCobro = async () => {
    if (!contextoCobro || !metodoPagoSeleccionado) return;
    let exito = false;
    try {
      setProcesandoCobro(true);

      if (contextoCobro.tipo === 'barra') {
        await cobrarClienteBarra(contextoCobro.identificador, metodoPagoSeleccionado);
        setPedidosBarra(prev => prev.filter(p => p.cliente !== contextoCobro.identificador));
        mostrarToast(`✅ ${contextoCobro.etiqueta} cobrado (${metodoPagoSeleccionado})`);
        exito = true;
      } else {
        await cobrarMesa(contextoCobro.identificador, metodoPagoSeleccionado);
        setPedidosMesas(prev => prev.filter(m => m.mesa.id !== contextoCobro.identificador));
        mostrarToast(`✅ ${contextoCobro.etiqueta} cobrada (${metodoPagoSeleccionado})`);
        exito = true;
      }
    } catch (error) {
      mostrarToast("Error al cobrar el pedido", "danger");
      console.error(error);
      cargarPedidos();
    } finally {
      setProcesandoCobro(false);
      if (exito) cerrarCobroModal(true);
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
    const disponibles = (prods || []).filter(prod => prod.disponible !== false);
    setProductos(disponibles);
    
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
    if (producto.disponible === false) return;
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
      <Container fluid className="py-4 d-flex justify-content-center align-items-center" style={{ minHeight: '50vh', backgroundColor: '#f4f6fb' }}>
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  const metricCards = [
    {
      title: 'Pedidos de Barra',
      value: pedidosBarra.length,
      subtitle: `$${totalBarraMonto.toLocaleString()}`,
      icon: <ShoppingBag size={22} />,
      accent: 'info',
      iconBg: 'rgba(59,130,246,0.12)'
    },
    {
      title: 'Mesas Ocupadas',
      value: pedidosMesas.length,
      subtitle: `$${totalMesasMonto.toLocaleString()}`,
      icon: <Users size={22} />,
      accent: 'primary',
      iconBg: 'rgba(59,130,246,0.12)'
    },
    {
      title: 'Pedidos Pendientes',
      value: totalTickets,
      subtitle: `$${totalPendiente.toLocaleString()}`,
      icon: <ClipboardList size={22} />,
      accent: 'success',
      iconBg: 'rgba(16,185,129,0.12)'
    }
  ];

  return (
    <Container fluid className="py-4" style={{ backgroundColor: '#f4f6fb', minHeight: '100vh' }}>
      <style>{`
        .order-card {
          border: 1px solid #e6e9f2;
          border-radius: 16px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .order-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08);
        }
        .order-card-header {
          border-bottom: 1px solid #eef1f7;
          border-radius: 16px 16px 0 0;
          background: linear-gradient(90deg, rgba(59,130,246,0.08), rgba(59,130,246,0));
        }
        .list-scroll {
          max-height: 420px;
          overflow-y: auto;
        }
      `}</style>

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="mb-1 d-flex align-items-center" style={{ color: '#1f2937' }}>
            <ClipboardList size={26} className="me-2 text-primary" />
            Pedidos Activos
          </h2>
          <p className="text-muted mb-0">Controla los pedidos pendientes de cobro en tiempo real.</p>
        </div>
        <Button
          variant="outline-secondary"
          onClick={cargarPedidos}
          disabled={loading}
          size="sm"
          className="d-flex align-items-center"
        >
          {loading ? <Spinner animation="border" size="sm" className="me-2" /> : <RefreshCw size={16} className="me-2" />}
          {loading ? 'Actualizando...' : 'Actualizar'}
        </Button>
      </div>

      <Row className="g-3 mb-4">
        {metricCards.map((card, idx) => (
          <Col md={4} key={idx}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted small mb-2">{card.title}</p>
                  <h3 className={`mb-0 text-${card.accent}`}>{card.value}</h3>
                  <small className="text-muted">{card.subtitle}</small>
                </div>
                <div style={{ backgroundColor: card.iconBg, borderRadius: '12px', width: 40, height: 40 }} className="d-flex align-items-center justify-content-center">
                  <span className={`text-${card.accent}`}>{card.icon}</span>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row className="g-4">
        <Col xl={6}>
          <Card className="order-card">
            <Card.Header className="order-card-header d-flex justify-content-between align-items-center">
              <span className="fw-semibold text-primary">Pedidos de Barra</span>
              <Badge bg="warning" text="dark">Pendientes</Badge>
            </Card.Header>
            <Card.Body>
              {pedidosBarra.length === 0 ? (
                <div className="text-center text-muted py-5">
                  <ShoppingBag size={48} className="mb-3" />
                  No hay pedidos de barra activos.
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {pedidosBarra.map(({ cliente, pedidos, total }) => (
                    <Card className="border-0 shadow-sm" key={cliente}>
                      <Card.Header className="bg-white d-flex justify-content-between align-items-center" style={{ borderBottom: '1px solid #eef1f7' }}>
                        <div>
                          <span className="fw-semibold">{cliente}</span>
                          <div className="text-muted small">{pedidos.length} ticket(s)</div>
                        </div>
                        <Badge bg="warning" text="dark">Pendiente</Badge>
                      </Card.Header>
                      <Card.Body>
                        <Table size="sm" borderless className="mb-3">
                          <tbody>
                            {pedidos.map((pedido) => (
                              <React.Fragment key={pedido.id}>
                                <tr>
                                  <td colSpan={2} className="text-muted small pt-2">
                                    {new Date(pedido.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </td>
                                </tr>
                                {pedido.detalle_pedidos?.map((detalle) => (
                                  <tr key={detalle.id || `${pedido.id}-${detalle.producto_id}`}>
                                    <td className="small">• {detalle.cantidad}x {detalle.productos?.nombre}</td>
                                    <td className="text-end small fw-semibold">${(detalle.precio_unitario * detalle.cantidad).toLocaleString()}</td>
                                  </tr>
                                ))}
                              </React.Fragment>
                            ))}
                          </tbody>
                        </Table>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="fw-semibold text-muted">Total pendiente</span>
                          <h5 className="mb-0 text-primary">${total.toLocaleString()}</h5>
                        </div>
                      </Card.Body>
                      <Card.Footer className="bg-white border-top-0">
                        <div className="d-grid gap-2">
                          <Button variant="outline-primary" onClick={() => handleEditarPedido(pedidos, 'barra', cliente)}>
                            <Edit2 size={16} className="me-2" /> Editar Pedido
                          </Button>
                          <Button variant="outline-danger" onClick={() => handleCancelarBarra(cliente)}>
                            <XCircle size={16} className="me-2" /> Cancelar Pedido
                          </Button>
                          <Button variant="success" onClick={() => handleCobrarBarra(cliente, total)}>
                            💸 Cobrar - ${total.toLocaleString()}
                          </Button>
                        </div>
                      </Card.Footer>
                    </Card>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col xl={6}>
          <Card className="order-card">
            <Card.Header className="order-card-header d-flex justify-content-between align-items-center">
              <span className="fw-semibold text-primary">Mesas Ocupadas</span>
              <Badge bg="danger">Ocupadas</Badge>
            </Card.Header>
            <Card.Body>
              {pedidosMesas.length === 0 ? (
                <div className="text-center text-muted py-5">
                  <ClipboardList size={48} className="mb-3" />
                  No hay mesas con pedidos pendientes.
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {pedidosMesas.map(({ mesa, pedidos, total }) => (
                    <Card className="border-0 shadow-sm" key={mesa.id}>
                      <Card.Header className="bg-white d-flex justify-content-between align-items-center" style={{ borderBottom: '1px solid #eef1f7' }}>
                        <div>
                          <span className="fw-semibold">Mesa {mesa.numero_mesa}</span>
                          <div className="text-muted small">{pedidos.length} ticket(s)</div>
                        </div>
                        <Badge bg="danger">Ocupada</Badge>
                      </Card.Header>
                      <Card.Body>
                        <Table size="sm" borderless className="mb-3">
                          <tbody>
                            {pedidos.map((pedido) => (
                              <React.Fragment key={pedido.id}>
                                <tr>
                                  <td colSpan={2} className="text-muted small pt-2">
                                    {new Date(pedido.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </td>
                                </tr>
                                {pedido.detalle_pedidos?.map((detalle) => (
                                  <tr key={detalle.id || `${pedido.id}-${detalle.producto_id}`}>
                                    <td className="small">• {detalle.cantidad}x {detalle.productos?.nombre}</td>
                                    <td className="text-end small fw-semibold">${(detalle.precio_unitario * detalle.cantidad).toLocaleString()}</td>
                                  </tr>
                                ))}
                              </React.Fragment>
                            ))}
                          </tbody>
                        </Table>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="fw-semibold text-muted">Total pendiente</span>
                          <h5 className="mb-0 text-primary">${total.toLocaleString()}</h5>
                        </div>
                      </Card.Body>
                      <Card.Footer className="bg-white border-top-0">
                        <div className="d-grid gap-2">
                          <Button variant="outline-primary" onClick={() => handleEditarPedido(pedidos, 'mesa', mesa.id, mesa.id)}>
                            <Edit2 size={16} className="me-2" /> Editar Pedido
                          </Button>
                          <Button variant="outline-danger" onClick={() => handleCancelarMesa(mesa.id)}>
                            <XCircle size={16} className="me-2" /> Cancelar Mesa
                          </Button>
                          <Button variant="success" onClick={() => handleCobrarMesa(mesa.id, total)}>
                            💸 Cobrar - ${total.toLocaleString()}
                          </Button>
                        </div>
                      </Card.Footer>
                    </Card>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

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

      {/* Modal de forma de pago */}
      <Modal
        show={showCobroModal}
        onHide={cerrarCobroModal}
        centered
        backdrop={procesandoCobro ? 'static' : true}
        keyboard={!procesandoCobro}
      >
        <Modal.Header closeButton={!procesandoCobro}>
          <Modal.Title>Seleccionar forma de pago</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted">
            Define la forma de pago para <strong>{contextoCobro?.etiqueta}</strong>.
          </p>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="fw-semibold text-muted">Total pendiente</span>
            <span className="fw-bold text-primary">
              ${contextoCobro?.total ? contextoCobro.total.toLocaleString() : 0}
            </span>
          </div>
          <ListGroup>
            {metodosPagoDisponibles.map((metodo) => (
              <ListGroup.Item
                key={metodo}
                action
                active={metodoPagoSeleccionado === metodo}
                onClick={() => setMetodoPagoSeleccionado(metodo)}
                disabled={procesandoCobro}
                className="d-flex justify-content-between align-items-center"
              >
                <span>{metodo}</span>
                {metodoPagoSeleccionado === metodo && <CheckCircle size={16} />}
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={cerrarCobroModal} disabled={procesandoCobro}>
            Cancelar
          </Button>
          <Button
            variant="success"
            onClick={confirmarCobro}
            disabled={!metodoPagoSeleccionado || procesandoCobro}
          >
            {procesandoCobro ? 'Confirmando...' : 'Confirmar cobro'}
          </Button>
        </Modal.Footer>
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
