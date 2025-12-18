import { Card, Button, Badge } from 'react-bootstrap';
import { Armchair } from 'lucide-react'; // Icono de sillón/mesa

const MesaCard = ({ mesa, onClick }) => {
  // Lógica de colores según estado
  const getColor = (estado) => {
    switch(estado) {
      case 'libre': return 'success';     // Verde
      case 'ocupada': return 'danger';    // Rojo
      case 'pagando': return 'warning';   // Amarillo
      default: return 'secondary';
    }
  };

  const variant = getColor(mesa.estado);

  return (
    <Card 
      className="text-center shadow-sm h-100" 
      style={{ borderTop: `4px solid var(--bs-${variant})`, cursor: 'pointer' }}
      onClick={() => onClick(mesa)}
    >
      <Card.Body className="d-flex flex-column align-items-center justify-content-center">
        <Armchair size={32} className={`text-${variant} mb-2`} />
        <Card.Title>Mesa {mesa.numero_mesa}</Card.Title>
        <Badge bg={variant} className="mb-3">
          {mesa.estado.toUpperCase()}
        </Badge>
        <Button variant={`outline-${variant}`} size="sm">
          {mesa.estado === 'libre' ? 'Abrir Mesa' : 'Ver Pedido'}
        </Button>
      </Card.Body>
    </Card>
  );
};

export default MesaCard;
