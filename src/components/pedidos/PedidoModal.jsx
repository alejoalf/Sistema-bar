import React, { useState, useEffect } from 'react';
import { Modal, Button, Badge, ListGroup, Row, Col, Tab, Tabs, Table } from 'react-bootstrap';
import { abrirMesa } from '../../services/mesas';
import { getProductos } from '../../services/productos';
import { crearPedido, getCuentaMesa, cobrarMesa, cobrarClienteBarra, getCuentaCliente } from '../../services/pedidos';

const PedidoModal = ({ show, onHide, mesa, pedidoBarra, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('carta'); 
  const [loading, setLoading] = useState(false);
  
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]); 
  const [cuentaHistoria, setCuentaHistoria] = useState([]); 

  const esModoBarra = !!pedidoBarra; 

  useEffect(() => {
    if (show) {
      // Cargar datos solo si el modal está visible
      if ((mesa && mesa.estado === 'ocupada') || esModoBarra) {
         cargarDatos();
      }
      // Resetear carrito siempre que se abre
      setCarrito([]); 
      setActiveTab('carta'); 
    }
  }, [show, mesa, pedidoBarra]);

  const cargarDatos = async () => {
    try {
      const prods = await getProductos();
      setProductos(prods || []);
      
      if (!esModoBarra && mesa?.estado === 'ocupada') {
          const historial = await getCuentaMesa(mesa.id);
          setCuentaHistoria(historial || []);
      } else if (esModoBarra && !pedidoBarra.esNuevo) {
          // Cargar TODOS los pedidos del cliente
          const historial = await getCuentaCliente(pedidoBarra.cliente);
          setCuentaHistoria(historial || []);
      } else {
          setCuentaHistoria([]);
      }
    } catch (error) {
      console.error("Error cargando datos modal:", error);
    }
  };

  const agregarAlCarrito = (producto) => {
    setCarrito([...carrito, producto]);
  };

  const calcularTotalCarrito = () => carrito.reduce((sum, item) => sum + item.precio, 0);
  const calcularTotalCuenta = () => cuentaHistoria.reduce((sum, pedido) => sum + pedido.total, 0);

  const handleConfirmarPedido = async () => {
    if (carrito.length === 0) return;
    try {
      setLoading(true);
      const total = calcularTotalCarrito();

      if (esModoBarra) {
          await crearPedido(null, carrito, total, pedidoBarra.cliente);
      } else {
          await crearPedido(mesa.id, carrito, total);
      }
      
      alert("✅ Pedido enviado!");
      onHide(); 
      if(onUpdate) onUpdate();
    } catch (error) { 
      alert("Error al enviar"); console.error(error);
    } finally { 
      setLoading(false); 
    }
  };

  const handleCobrar = async () => {
    const total = calcularTotalCuenta();
    if (!confirm(`¿Cobrar $${total} y cerrar?`)) return;
    try {
      setLoading(true);
      if (esModoBarra) {
          // Cobrar TODOS los pedidos del cliente
          await cobrarClienteBarra(pedidoBarra.cliente); 
      } else {
          await cobrarMesa(mesa.id);
      }
      if(onUpdate) onUpdate(); 
      onHide();
    } catch (error) { 
      alert("Error al cobrar"); console.error(error);
    } finally { 
      setLoading(false); 
    }
  };

  const handleAbrirMesa = async () => {
    try { 
      setLoading(true); 
      await abrirMesa(mesa.id); 
      if(onUpdate) onUpdate(); 
      onHide(); 
    } catch (e) { alert('Error al abrir'); } finally { setLoading(false); }
  };

  // Si no hay datos, no renderizar nada para evitar crash
  if (!mesa && !pedidoBarra) return null;

  const tituloModal = esModoBarra 
    ? `🛍️ ${pedidoBarra.cliente}` 
    : `Mesa ${mesa.numero_mesa}`;

  const estadoBadge = esModoBarra
    ? (pedidoBarra.esNuevo ? 'NUEVO' : 'PENDIENTE')
    : mesa.estado;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="bg-dark text-white">
        <Modal.Title>{tituloModal} <Badge bg="secondary">{estadoBadge}</Badge></Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {!esModoBarra && mesa.estado === 'libre' ? (
          <div className="text-center py-5">
            <h3>Mesa Disponible</h3>
            <Button variant="success" size="lg" className="mt-3" onClick={handleAbrirMesa} disabled={loading}>
              👥 ABRIR MESA
            </Button>
          </div>
        ) : (
          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
            <Tab eventKey="carta" title="🍺 Nueva Comanda">
              <Row>
                <Col md={7} style={{ maxHeight: '50vh', overflowY: 'auto' }}>
                  <ListGroup>
                    {productos.map(prod => (
                      <ListGroup.Item key={prod.id} action onClick={() => agregarAlCarrito(prod)} className="d-flex justify-content-between">
                        <span>{prod.nombre}</span><span>${prod.precio}</span>
                        <Button size="sm" variant="outline-primary">+</Button>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </Col>
                <Col md={5} className="border-start bg-light p-3 rounded">
                    <h5>En cola:</h5>
                    <ul className="mb-3">
                        {carrito.map((item, i) => <li key={i}>{item.nombre} - ${item.precio}</li>)}
                    </ul>
                    <h3 className="text-end">${calcularTotalCarrito()}</h3>
                    <Button variant="success" className="w-100" disabled={carrito.length===0 || loading} onClick={handleConfirmarPedido}>
                        CONFIRMAR 🚀
                    </Button>
                </Col>
              </Row>
            </Tab>
            {(!esModoBarra || !pedidoBarra.esNuevo) && (
                <Tab eventKey="cuenta" title="💰 Cuenta">
                    <div className="p-3">
                        <Table size="sm" striped>
                            <thead><tr><th>Hora</th><th>Detalle</th><th>Total</th></tr></thead>
                            <tbody>
                                {cuentaHistoria.map(p => (
                                    <tr key={p.id}>
                                        <td>{new Date(p.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                                        <td>{p.detalle_pedidos?.map(d => <div key={d.id || Math.random()}>• {d.cantidad}x {d.productos?.nombre}</div>)}</td>
                                        <td className="fw-bold">${p.total}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                        <h2 className="text-end text-primary mt-3">Total: ${calcularTotalCuenta()}</h2>
                        <div className="text-end">
                            <Button variant="danger" size="lg" onClick={handleCobrar} disabled={loading}>💸 COBRAR</Button>
                        </div>
                    </div>
                </Tab>
            )}
          </Tabs>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default PedidoModal;