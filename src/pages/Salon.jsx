import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Spinner, Alert } from 'react-bootstrap';
import MesaCard from '../components/mesas/MesaCard';
import PedidoModal from '../components/pedidos/PedidoModal'; // <--- IMPORT NUEVO
import { useBarStore } from '../store/useBarStore';
import { getMesas } from '../services/mesas';

const Salon = () => {
  const seleccionarMesa = useBarStore((state) => state.seleccionarMesa);
  const [mesas, setMesas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para controlar el Modal
  const [showModal, setShowModal] = useState(false);
  const [mesaActiva, setMesaActiva] = useState(null);

  useEffect(() => {
    cargarMesas();
  }, []);

  const cargarMesas = async () => {
    // setLoading(true); // Comentamos esto para que no parpadee al actualizar una sola mesa
    const data = await getMesas();
    setMesas(data);
    setLoading(false);
  };

  const handleMesaClick = (mesa) => {
    setMesaActiva(mesa); // Guardamos qué mesa se tocó
    setShowModal(true);  // Mostramos el modal
  };

  const cerrarModal = () => {
    setShowModal(false);
    setMesaActiva(null);
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
        <h2>Salón Principal</h2>
        <button className="btn btn-sm btn-outline-secondary" onClick={() => cargarMesas()}>
            🔄 Actualizar
        </button>
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
        onUpdate={cargarMesas} // Le pasamos la función para refrescar la lista
      />

    </Container>
  );
};

export default Salon;