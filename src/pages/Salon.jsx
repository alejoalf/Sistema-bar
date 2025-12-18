import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import MesaCard from '../components/mesas/MesaCard';
import { useBarStore } from '../store/useBarStore';

const Salon = () => {
  const seleccionarMesa = useBarStore((state) => state.seleccionarMesa);

  // Datos falsos (mock) para probar visualmente antes de conectar la DB real
  const mesasMock = [
    { id: 1, numero_mesa: 1, estado: 'libre' },
    { id: 2, numero_mesa: 2, estado: 'ocupada' },
    { id: 3, numero_mesa: 3, estado: 'pagando' },
    { id: 4, numero_mesa: 4, estado: 'libre' },
    { id: 5, numero_mesa: 5, estado: 'libre' },
    { id: 6, numero_mesa: 6, estado: 'ocupada' },
  ];

  const handleMesaClick = (mesa) => {
    seleccionarMesa(mesa);
    alert(`Has seleccionado la mesa ${mesa.numero_mesa}`);
    // Aquí abriremos el modal de pedidos más adelante
  };

  return (
    <Container className="py-4">
      <h2 className="mb-4">Salón Principal</h2>
      <Row>
        {mesasMock.map((mesa) => (
          <Col key={mesa.id} xs={6} md={4} lg={3} className="mb-4">
            <MesaCard mesa={mesa} onClick={handleMesaClick} />
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default Salon;
