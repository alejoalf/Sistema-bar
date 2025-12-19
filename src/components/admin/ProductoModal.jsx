import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';

const ProductoModal = ({ show, onHide, productoEditar, onSave }) => {
  // Estado inicial del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    precio: '',
    categoria: 'bebida',
    stock_actual: 0
  });

  // Si nos pasan un producto para editar, llenamos el form
  useEffect(() => {
    if (show) {
      if (productoEditar) {
        setFormData(productoEditar);
      } else {
        // Si es nuevo, limpiar
        setFormData({ nombre: '', precio: '', categoria: 'bebida', stock_actual: 0 });
      }
    }
  }, [productoEditar, show]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    // Si es número, lo convertimos; si no, lo dejamos como texto
    const valorFinal = type === 'number' ? parseFloat(value) : value;

    setFormData({ ...formData, [name]: valorFinal });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData); // Pasamos los datos al padre
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton className="bg-dark text-white">
        <Modal.Title>{productoEditar ? 'Editar Producto' : 'Nuevo Producto'}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Nombre del Producto</Form.Label>
            <Form.Control 
              type="text" 
              name="nombre" 
              required 
              value={formData.nombre} 
              onChange={handleChange} 
            />
          </Form.Group>

          <Row>
            <Col>
                <Form.Group className="mb-3">
                    <Form.Label>Precio ($)</Form.Label>
                    <Form.Control 
                        type="number" 
                        name="precio" 
                        required 
                        value={formData.precio} 
                        onChange={handleChange} 
                    />
                </Form.Group>
            </Col>
            <Col>
                <Form.Group className="mb-3">
                    <Form.Label>Stock Inicial</Form.Label>
                    <Form.Control 
                        type="number" 
                        name="stock_actual" 
                        required 
                        value={formData.stock_actual} 
                        onChange={handleChange} 
                    />
                </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Categoría</Form.Label>
            <Form.Select name="categoria" value={formData.categoria} onChange={handleChange}>
              <option value="bebida">Bebida</option>
              <option value="comida">Comida</option>
              <option value="postre">Postre</option>
              <option value="otros">Otros</option>
            </Form.Select>
          </Form.Group>

        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>Cancelar</Button>
          <Button variant="primary" type="submit">Guardar Cambios</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ProductoModal;