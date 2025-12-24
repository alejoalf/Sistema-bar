import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Button, ListGroup } from 'react-bootstrap';

const DEFAULT_METHODS = [
  'Efectivo',
  'Tarjeta',
  'Transferencia',
  'Mercado Pago',
  'Cuenta Corriente'
];

const PaymentMethodModal = ({
  show,
  title,
  total = 0,
  onCancel,
  onConfirm,
  confirming = false,
  methods
}) => {
  const [selectedMethod, setSelectedMethod] = useState('');

  const availableMethods = useMemo(() => {
    if (Array.isArray(methods) && methods.length > 0) {
      return methods;
    }
    return DEFAULT_METHODS;
  }, [methods]);

  useEffect(() => {
    if (show) {
      setSelectedMethod('');
    }
  }, [show]);

  const handleConfirm = () => {
    if (!selectedMethod || confirming) return;
    if (typeof onConfirm === 'function') {
      onConfirm(selectedMethod);
    }
  };

  const handleCancel = () => {
    if (confirming) return;
    if (typeof onCancel === 'function') {
      onCancel();
    }
  };

  const formattedTotal = typeof total === 'number'
    ? total.toLocaleString('es-AR')
    : total;

  return (
    <Modal
      show={show}
      onHide={handleCancel}
      centered
      backdrop={confirming ? 'static' : true}
      keyboard={!confirming}
    >
      <Modal.Header closeButton={!confirming}>
        <Modal.Title>{title || 'Seleccionar forma de pago'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span className="fw-semibold text-muted">Total</span>
          <span className="fw-bold text-primary">${formattedTotal}</span>
        </div>
        <ListGroup>
          {availableMethods.map((method) => (
            <ListGroup.Item
              key={method}
              action
              active={selectedMethod === method}
              onClick={() => setSelectedMethod(method)}
              disabled={confirming}
              className="d-flex justify-content-between align-items-center"
            >
              <span>{method}</span>
              <span className="small text-muted">
                {selectedMethod === method ? 'Seleccionado' : ''}
              </span>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={handleCancel} disabled={confirming}>
          Cancelar
        </Button>
        <Button
          variant="success"
          onClick={handleConfirm}
          disabled={!selectedMethod || confirming}
        >
          {confirming ? 'Confirmando...' : 'Confirmar cobro'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PaymentMethodModal;
