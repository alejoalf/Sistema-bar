import React, { useState, useEffect } from 'react';
import { Modal, Button, Badge, ListGroup, Row, Col } from 'react-bootstrap';
import { abrirMesa, cerrarMesa } from '../../services/mesas';
import { getProductos } from '../../services/productos';
import { crearPedido } from '../../services/pedidos';

const PedidoModal = ({ show, onHide, mesa, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]); // Aquí guardamos lo que se va a pedir

  // Cargar productos cuando se abre el modal
  useEffect(() => {
    if (show && mesa?.estado === 'ocupada') {
      cargarProductos();
    }
    setCarrito([]); // Limpiar carrito al abrir
  }, [show, mesa]);

  const cargarProductos = async () => {
    const data = await getProductos();
    setProductos(data);
  };

  const agregarAlCarrito = (producto) => {
    setCarrito([...carrito, producto]);
  };

  const calcularTotalCarrito = () => {
    return carrito.reduce((total, item) => total + item.precio, 0);
  };

  // --- Lógica de Mesa ---
  const handleAbrirMesa = async () => {
    try {
      setLoading(true);
      await abrirMesa(mesa.id);
      await onUpdate();
      onHide();
    } catch (error) { alert('Error'); } finally { setLoading(false); }
  };

  const handleCerrarMesa = async () => {
    if(!confirm("¿Liberar mesa y cobrar?")) return;
    try {
      setLoading(true);
      await cerrarMesa(mesa.id);
      await onUpdate();
      onHide();
    } catch (error) { alert('Error'); } finally { setLoading(false); }
  };

  const handleConfirmarPedido = async () => {
  if (carrito.length === 0) return;

  try {
    setLoading(true); // Bloquear botones
    const total = calcularTotalCarrito();

    // Llamamos al servicio que creamos
    await crearPedido(mesa.id, carrito, total);

    alert("✅ Pedido enviado a cocina correctamente!");
    onHide(); // Cerramos el modal

  } catch (error) {
    console.error(error);
    alert("❌ Hubo un error al enviar el pedido.");
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
          <div className="text-center py-5">
            <h3>Mesa Disponible</h3>
            <Button variant="success" size="lg" className="mt-3" onClick={handleAbrirMesa} disabled={loading}>
              👥 ABRIR MESA
            </Button>
          </div>
        ) : (
          <Row>
            {/* COLUMNA IZQUIERDA: LISTA DE PRODUCTOS */}
            <Col md={7} style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <h5 className="mb-3">Carta</h5>
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

            {/* COLUMNA DERECHA: RESUMEN DEL PEDIDO ACTUAL */}
            <Col md={5} className="border-start">
              <h5 className="mb-3">Nuevo Pedido</h5>
              {carrito.length === 0 ? (
                <p className="text-muted text-center py-4">Selecciona productos...</p>
              ) : (
                <ul className="list-unstyled">
                  {carrito.map((item, index) => (
                    <li key={index} className="d-flex justify-content-between border-bottom py-1">
                      <span>{item.nombre}</span>
                      <strong>${item.precio}</strong>
                    </li>
                  ))}
                </ul>
              )}
              
              <div className="mt-4 pt-3 border-top">
                <h4 className="d-flex justify-content-between">
                  <span>Total:</span>
                  <span>${calcularTotalCarrito()}</span>
                </h4>
                <Button 
                    variant="success" 
                    className="w-100 mt-2" 
                    disabled={carrito.length === 0}
                    onClick={handleConfirmarPedido}
                >
                    CONFIRMAR PEDIDO 🚀
                </Button>
                
                <hr />
                <Button variant="outline-danger" className="w-100" size="sm" onClick={handleCerrarMesa}>
                    Cerrar Mesa
                </Button>
              </div>
            </Col>
          </Row>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default PedidoModal;