import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Badge, Form, InputGroup, Button } from 'react-bootstrap';
import { Package, Eye, EyeOff, Search, Filter, Plus, Edit2, Trash2 } from 'lucide-react';
import { getProductos, createProducto, updateProducto, deleteProducto } from '../services/productos';
import ProductoModal from '../components/admin/ProductoModal';

const Admin = () => {
  const [productos, setProductos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProd, setEditingProd] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');
  const [soloDisponibles, setSoloDisponibles] = useState(false);

  useEffect(() => {
    cargar();
  }, []);

  const cargar = async () => {
    const data = await getProductos();
    setProductos(data);
  };

  // Estadísticas
  const totalProductos = productos.length;
  const productosActivos = productos.filter(p => p.activo).length;
  const productosAgotados = productos.filter(p => p.stock_actual === 0).length;

  // Filtrado
  const productosFiltrados = productos.filter(prod => {
    const matchSearch = prod.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategoria = categoriaFiltro === 'todas' || prod.categoria === categoriaFiltro;
    const matchDisponible = !soloDisponibles || prod.stock_actual > 0;
    return matchSearch && matchCategoria && matchDisponible;
  });

  const handleSave = async (datos) => {
    try {
      if (editingProd) {
        await updateProducto(editingProd.id, datos);
      } else {
        await createProducto(datos);
      }
      setShowModal(false);
      setEditingProd(null);
      await cargar();
    } catch (error) {
      console.error(error);
      alert("Error al guardar: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("¿Seguro que quieres borrar este producto?")) {
      try {
        await deleteProducto(id);
        await cargar();
      } catch (error) {
        alert("No se pudo eliminar");
      }
    }
  };

  const abrirCrear = () => {
    setEditingProd(null);
    setShowModal(true);
  };

  const abrirEditar = (prod) => {
    setEditingProd(prod);
    setShowModal(true);
  };

  // Función para obtener el badge de categoría con color
  const getCategoriaColor = (categoria) => {
    const colores = {
      bebida: 'info',
      comida: 'warning',
      postre: 'success',
      otros: 'secondary'
    };
    return colores[categoria] || 'secondary';
  };

  return (
    <Container fluid className="py-3 py-md-4 px-2 px-md-4" style={{ backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <div className="mb-3 mb-md-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start mb-2">
          <div className="mb-3 mb-md-0">
            <h2 className="mb-1 fw-bold fs-4 fs-md-2" style={{ color: '#2d3748' }}>
              <Package size={24} className="me-2 d-none d-md-inline" />
              Gestión de Productos
            </h2>
            <p className="text-muted mb-0 small">Administra el catálogo completo de productos</p>
          </div>
          <Button 
            variant="primary" 
            onClick={abrirCrear}
            style={{ backgroundColor: '#2c5282', borderColor: '#2c5282' }}
          >
            <Plus size={18} className="me-1" />
            Nuevo Producto
          </Button>
        </div>
      </div>

      {/* Cards de Estadísticas */}
      <Row className="mb-3 mb-md-4 g-2 g-md-3">
        <Col xs={12} sm={6} md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 small">Total Productos</p>
                  <h3 className="mb-0 fw-bold">{totalProductos}</h3>
                </div>
                <div className="bg-light rounded p-3">
                  <Package size={24} className="text-secondary" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 small">Activos</p>
                  <h3 className="mb-0 fw-bold text-success">{productosActivos}</h3>
                </div>
                <div className="bg-success bg-opacity-10 rounded p-3">
                  <Eye size={24} className="text-success" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 small">Agotados</p>
                  <h3 className="mb-0 fw-bold text-danger">{productosAgotados}</h3>
                </div>
                <div className="bg-danger bg-opacity-10 rounded p-3">
                  <EyeOff size={24} className="text-danger" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Barra de búsqueda y filtros */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={5}>
              <InputGroup>
                <InputGroup.Text className="bg-white">
                  <Search size={18} className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Buscar producto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-start-0"
                />
              </InputGroup>
            </Col>
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text className="bg-white">
                  <Filter size={18} className="text-muted" />
                </InputGroup.Text>
                <Form.Select 
                  value={categoriaFiltro}
                  onChange={(e) => setCategoriaFiltro(e.target.value)}
                  className="border-start-0"
                >
                  <option value="todas">Todas las categorías</option>
                  <option value="bebida">Bebidas</option>
                  <option value="comida">Comidas</option>
                  <option value="postre">Postres</option>
                  <option value="otros">Otros</option>
                </Form.Select>
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Check
                type="checkbox"
                label="Solo disponibles"
                checked={soloDisponibles}
                onChange={(e) => setSoloDisponibles(e.target.checked)}
              />
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Tabla de Productos */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0" style={{ fontSize: '0.95rem' }}>
              <thead style={{ backgroundColor: '#f7fafc', borderBottom: '2px solid #e2e8f0' }}>
                <tr>
                  <th className="px-4 py-3 text-uppercase small text-muted fw-semibold">Producto</th>
                  <th className="px-4 py-3 text-uppercase small text-muted fw-semibold">Categoría</th>
                  <th className="px-4 py-3 text-uppercase small text-muted fw-semibold">Precio</th>
                  <th className="px-4 py-3 text-uppercase small text-muted fw-semibold">Estado</th>
                  <th className="px-4 py-3 text-uppercase small text-muted fw-semibold">Destacados</th>
                  <th className="px-4 py-3 text-uppercase small text-muted fw-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productosFiltrados.map((prod) => (
                  <tr key={prod.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td className="px-4 py-3">
                      <div className="d-flex align-items-center">
                        <div className="bg-light rounded p-2 me-3">
                          <Package size={20} className="text-secondary" />
                        </div>
                        <div>
                          <div className="fw-semibold text-dark">{prod.nombre}</div>
                          <small className="text-muted">Stock: {prod.stock_actual} unidades</small>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge 
                        bg={getCategoriaColor(prod.categoria)}
                        className="px-3 py-2"
                        style={{ fontWeight: '500' }}
                      >
                        {prod.categoria.charAt(0).toUpperCase() + prod.categoria.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="fw-semibold">${prod.precio.toLocaleString('es-AR')}</span>
                    </td>
                    <td className="px-4 py-3">
                      {prod.stock_actual > 0 ? (
                        <Badge bg="success" className="px-3 py-2" style={{ fontWeight: '500' }}>
                          Disponible
                        </Badge>
                      ) : (
                        <Badge bg="danger" className="px-3 py-2" style={{ fontWeight: '500' }}>
                          Agotado
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {prod.stock_actual < 10 && prod.stock_actual > 0 ? (
                        <Badge bg="warning" text="dark" className="px-3 py-2" style={{ fontWeight: '500' }}>
                          Stock bajo
                        </Badge>
                      ) : prod.precio > 10000 ? (
                        <Badge bg="primary" className="px-3 py-2" style={{ fontWeight: '500' }}>
                          Premium
                        </Badge>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="d-flex gap-2">
                        <Button
                          variant="link"
                          size="sm"
                          className="text-muted p-1"
                          onClick={() => abrirEditar(prod)}
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </Button>
                        <Button
                          variant="link"
                          size="sm"
                          className="text-danger p-1"
                          onClick={() => handleDelete(prod.id)}
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {productosFiltrados.length === 0 && (
            <div className="text-center py-5 text-muted">
              <Package size={48} className="mb-3 opacity-50" />
              <p>No se encontraron productos</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modal */}
      <ProductoModal 
        show={showModal} 
        onHide={() => {
          setShowModal(false);
          setEditingProd(null);
        }}
        productoEditar={editingProd}
        onSave={handleSave}
      />
    </Container>
  );
};

export default Admin;