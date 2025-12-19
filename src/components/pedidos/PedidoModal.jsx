import React, { useState, useEffect } from 'react';
import { Modal, Button, Badge, ListGroup, Row, Col, Tab, Tabs, Table } from 'react-bootstrap';
import { abrirMesa } from '../../services/mesas';
import { getProductos } from '../../services/productos';
import { crearPedido, getCuentaMesa, cobrarMesa } from '../../services/pedidos';

const PedidoModal = ({ show, onHide, mesa, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('carta'); // Controla qué pestaña vemos
  const [loading, setLoading] = useState(false);
  
  // Datos
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]); 
  const [cuentaHistoria, setCuentaHistoria] = useState([]); // Los pedidos viejos

  // Cargar datos al abrir
  useEffect(() => {
    if (show && mesa?.estado === 'ocupada') {
      cargarDatos();
    }
    setCarrito([]); // Limpiar carrito nuevo al abrir
    setActiveTab('carta'); // Siempre abrir en la carta primero
  }, [show, mesa]);

  const cargarDatos = async () => {
    try {
      // 1. Cargamos productos para vender
      const prods = await getProductos();
      setProductos(prods);
      
      // 2. Si la mesa está ocupada, cargamos lo que ya consumieron (La Cuenta)
      if (mesa?.estado === 'ocupada') {
          const historial = await getCuentaMesa(mesa.id);
          setCuentaHistoria(historial);
      }
    } catch (error) {
      console.error("Error cargando datos modal:", error);
    }
  };

  // --- LÓGICA DEL CARRITO (NUEVO PEDIDO) ---
  const agregarAlCarrito = (producto) => {
    setCarrito([...carrito, producto]);
  };

  const calcularTotalCarrito = () => carrito.reduce((sum, item) => sum + item.precio, 0);

  const handleConfirmarPedido = async () => {
    if (carrito.length === 0) return;
    try {
      setLoading(true);
      await crearPedido(mesa.id, carrito, calcularTotalCarrito());
      alert("✅ Pedido enviado a cocina!");
      onHide(); // Cerramos para que al volver a abrir se refresque todo
    } catch (error) { 
      alert("Error al enviar pedido"); 
      console.error(error);
    } finally { 
      setLoading(false); 
    }
  };

  // --- LÓGICA DE LA CUENTA (HISTORIAL) ---
  const calcularTotalCuenta = () => {
    // Sumamos los totales de todos los pedidos YA confirmados
    return cuentaHistoria.reduce((sum, pedido) => sum + pedido.total, 0);
  };

  const handleCobrarMesa = async () => {
    const total = calcularTotalCuenta();
    if (!confirm(`¿El cliente pagó $${total}? \nAl confirmar, la mesa quedará LIBRE.`)) return;
    
    try {
      setLoading(true);
      await cobrarMesa(mesa.id);
      await onUpdate(); // Refrescar el salón (se pondrá verde)
      onHide();
    } catch (error) { 
      alert("Error al cobrar"); 
      console.error(error);
    } finally { 
      setLoading(false); 
    }
  };

  // --- LÓGICA DE APERTURA ---
  const handleAbrirMesa = async () => {
    try { 
      setLoading(true); 
      await abrirMesa(mesa.id); 
      await onUpdate(); 
      onHide(); 
    } catch (e) { 
      alert('Error al abrir mesa'); 
    } finally { 
      setLoading(false); 
    }
  };

  if (!mesa) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="bg-dark text-white">
        <Modal.Title>Mesa {mesa.numero_mesa} <Badge bg="secondary">{mesa.estado}</Badge></Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {mesa.estado === 'libre' ? (
          // VISTA MESA LIBRE
          <div className="text-center py-5">
            <h3>Mesa Disponible</h3>
            <p className="text-muted">La mesa está lista para recibir clientes.</p>
            <Button variant="success" size="lg" className="mt-3" onClick={handleAbrirMesa} disabled={loading}>
              👥 ABRIR MESA
            </Button>
          </div>
        ) : (
          // VISTA MESA OCUPADA (CON TABS)
          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
            
            {/* PESTAÑA 1: TOMAR NUEVO PEDIDO */}
            <Tab eventKey="carta" title="🍺 Nueva Comanda">
              <Row>
                <Col md={7} style={{ maxHeight: '50vh', overflowY: 'auto' }}>
                  <ListGroup>
                    {productos.map(prod => (
                      <ListGroup.Item key={prod.id} action onClick={() => agregarAlCarrito(prod)} className="d-flex justify-content-between align-items-center">
                        <div>
                            <strong>{prod.nombre}</strong>
                            <div className="text-muted small">${prod.precio}</div>
                        </div>
                        <Button size="sm" variant="outline-primary">+</Button>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </Col>
                <Col md={5} className="border-start bg-light p-3 rounded">
                    <h5 className="mb-3">En cola para cocina:</h5>
                    {carrito.length === 0 ? <p className="text-muted small">Selecciona productos...</p> : (
                        <ul className="list-unstyled mb-3" style={{maxHeight: '200px', overflowY: 'auto'}}>
                            {carrito.map((item, i) => (
                                <li key={i} className="d-flex justify-content-between border-bottom py-1 small">
                                    <span>{item.nombre}</span>
                                    <span>${item.precio}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                    <div className="mt-auto">
                        <h3 className="text-end mb-3">${calcularTotalCarrito()}</h3>
                        <Button variant="success" className="w-100 fw-bold" disabled={carrito.length===0 || loading} onClick={handleConfirmarPedido}>
                            {loading ? 'Enviando...' : 'CONFIRMAR PEDIDO 🚀'}
                        </Button>
                    </div>
                </Col>
              </Row>
            </Tab>

            {/* PESTAÑA 2: VER CUENTA Y COBRAR */}
            <Tab eventKey="cuenta" title="💰 Cuenta Total">
                <div className="p-2">
                    {cuentaHistoria.length === 0 ? (
                        <div className="alert alert-info text-center">Aún no se han confirmado pedidos en esta mesa.</div>
                    ) : (
                        <Table size="sm" striped hover responsive>
                            <thead className="table-dark">
                                <tr><th>Hora</th><th>Detalle</th><th className="text-end">Subtotal</th></tr>
                            </thead>
                            <tbody>
                                {cuentaHistoria.map(pedido => (
                                    <tr key={pedido.id}>
                                        <td className="align-middle">
                                            {new Date(pedido.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </td>
                                        <td>
                                            {pedido.detalle_pedidos.map(d => (
                                                <div key={d.id} className="small">
                                                    • {d.cantidad}x {d.productos?.nombre}
                                                </div>
                                            ))}
                                        </td>
                                        <td className="text-end align-middle fw-bold">${pedido.total}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                    
                    <div className="d-flex justify-content-end align-items-center mt-4 pt-3 border-top">
                        <div className="text-end me-4">
                            <span className="text-muted d-block small">Total a cobrar:</span>
                            <span className="display-6 fw-bold text-primary">${calcularTotalCuenta()}</span>
                        </div>
                        <Button 
                            variant="danger" 
                            size="lg" 
                            onClick={handleCobrarMesa}
                            disabled={loading || cuentaHistoria.length === 0}
                        >
                            💸 COBRAR Y CERRAR MESA
                        </Button>
                    </div>
                </div>
            </Tab>

          </Tabs>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default PedidoModal;