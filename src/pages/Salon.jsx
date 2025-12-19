import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Spinner, Alert } from 'react-bootstrap';
import MesaCard from '../components/mesas/MesaCard';
import PedidoModal from '../components/pedidos/PedidoModal';
import { useBarStore } from '../store/useBarStore';
import { getMesas } from '../services/mesas';

const Salon = () => {
  const mesaSeleccionada = useBarStore((state) => state.mesaSeleccionada);
  const seleccionarMesa = useBarStore((state) => state.seleccionarMesa);
  const liberarMesa = useBarStore((state) => state.liberarMesa);
  
  // Estado local para manejar los datos y la carga
  const [mesas, setMesas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar mesas al iniciar el componente
  useEffect(() => {
    cargarMesas();
  }, []);

  const cargarMesas = async () => {
    setLoading(true);
    const data = await getMesas();
    setMesas(data);
    setLoading(false);
  };

  const handleMesaClick = (mesa) => {
    seleccionarMesa(mesa);
  };

  const handleModalClose = (shouldReload) => {
    liberarMesa();
    if (shouldReload) {
      cargarMesas(); // Recargar mesas si hubo cambios
    }
  };

  if (loading) {
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
        <button className="btn btn-sm btn-outline-secondary" onClick={cargarMesas}>
            Actualizar
        </button>
      </div>

      {mesas.length === 0 ? (
        <Alert variant="info">No hay mesas cargadas en el sistema.</Alert>
      ) : (
        <Row>
          {mesas.map((mesa) => (
            <Col key={mesa.id} xs={6} md={4} lg={3} className="mb-4">
              <MesaCard mesa={mesa} onClick={handleMesaClick} />
            </Col>
          ))}
        </Row>
      )}

      {/* Modal de Pedido */}
      <PedidoModal 
        mesaSeleccionada={mesaSeleccionada} 
        onHide={handleModalClose}
      />
    </Container>
  );
};

export default Salon;