import { Modal, Button, ListGroup, Badge, Alert } from 'react-bootstrap';
import { Plus, Check } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../../services/supabase';

const PedidoModal = ({ mesaSeleccionada, onHide }) => {
  const [procesando, setProcesando] = useState(false);

  if (!mesaSeleccionada) return null;

  const handleAbrirMesa = async () => {
    setProcesando(true);
    try {
      // Si no hay Supabase configurado, simular éxito
      if (!import.meta.env.VITE_SUPABASE_URL) {
        console.log('🎭 MOCK: Mesa abierta (configura Supabase en .env)');
        await new Promise(resolve => setTimeout(resolve, 500)); // Simular delay
        onHide(true);
        return;
      }

      const { error } = await supabase
        .from('mesas')
        .update({ estado: 'ocupada' })
        .eq('id', mesaSeleccionada.id);

      if (error) throw error;

      // Cerrar modal y recargar
      onHide(true); // Pasamos true para indicar que debe recargar
    } catch (error) {
      console.error('Error al abrir mesa:', error);
      alert('Error al abrir la mesa. Usando modo MOCK.');
      onHide(true);
    } finally {
      setProcesando(false);
    }
  };

  const handleAgregarProducto = () => {
    // Por ahora solo un alert, en el futuro abrirá un selector de productos
    alert('Funcionalidad de agregar productos - Próximamente');
  };

  const esLibre = mesaSeleccionada.estado === 'libre';
  const esOcupada = mesaSeleccionada.estado === 'ocupada';

  return (
    <Modal show={!!mesaSeleccionada} onHide={() => onHide(false)} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          Mesa {mesaSeleccionada.numero_mesa}
          <Badge 
            bg={esLibre ? 'success' : esOcupada ? 'danger' : 'warning'} 
            className="ms-3"
          >
            {mesaSeleccionada.estado.toUpperCase()}
          </Badge>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* Mesa Libre: Botón para abrir */}
        {esLibre && (
          <div className="text-center py-5">
            <Alert variant="info" className="mb-4">
              Esta mesa está disponible. Presiona el botón para abrirla y comenzar a tomar pedidos.
            </Alert>
            <Button 
              variant="success" 
              size="lg" 
              onClick={handleAbrirMesa}
              disabled={procesando}
              className="px-5 py-3"
            >
              <Check size={24} className="me-2" />
              {procesando ? 'Abriendo...' : 'Abrir Mesa'}
            </Button>
          </div>
        )}

        {/* Mesa Ocupada: Lista de productos */}
        {esOcupada && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Pedido Actual</h5>
              <Button 
                variant="primary" 
                size="sm" 
                onClick={handleAgregarProducto}
              >
                <Plus size={18} className="me-1" />
                Agregar Producto
              </Button>
            </div>

            {/* Lista de productos (vacía por ahora) */}
            <ListGroup>
              <ListGroup.Item className="text-center text-muted py-4">
                No hay productos en este pedido aún.
                <br />
                <small>Presiona "Agregar Producto" para comenzar.</small>
              </ListGroup.Item>
            </ListGroup>

            {/* Resumen */}
            <div className="mt-4 p-3 bg-light rounded">
              <div className="d-flex justify-content-between align-items-center">
                <strong>Total:</strong>
                <h4 className="mb-0">$0.00</h4>
              </div>
            </div>
          </div>
        )}

        {/* Mesa en otros estados (pagando, etc) */}
        {!esLibre && !esOcupada && (
          <Alert variant="warning">
            Esta mesa está en estado: <strong>{mesaSeleccionada.estado}</strong>
          </Alert>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={() => onHide(false)}>
          Cerrar
        </Button>
        
        {esOcupada && (
          <>
            <Button variant="warning">
              Marcar como Pagando
            </Button>
            <Button variant="success">
              Cerrar Mesa
            </Button>
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default PedidoModal;
