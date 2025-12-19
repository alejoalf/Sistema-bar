import React, { useState } from 'react';
import { Navbar, Container, Offcanvas, Button } from 'react-bootstrap';
import { Menu, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBarStore } from '../../store/useBarStore';
import { logout } from '../../services/auth';
import NavigationLinks from './NavigationLinks';

const MobileNavbar = () => {
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const navigate = useNavigate();
  const user = useBarStore((state) => state.user);

  const handleClose = () => setShowOffcanvas(false);
  const handleShow = () => setShowOffcanvas(true);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    handleClose();
  };

  const displayName = user?.email ? user.email.split('@')[0] : 'Usuario';

  return (
    <>
      {/* Navbar Superior - Solo visible en móvil */}
      <Navbar bg="dark" variant="dark" className="d-md-none shadow-sm" sticky="top">
        <Container fluid>
          <Button 
            variant="dark" 
            onClick={handleShow}
            className="border-0 p-2"
          >
            <Menu size={24} />
          </Button>
          <Navbar.Brand className="mx-auto fw-bold">HorusBar</Navbar.Brand>
          <div style={{ width: '40px' }}></div> {/* Espaciador para centrar */}
        </Container>
      </Navbar>

      {/* Offcanvas - Menú lateral deslizante */}
      <Offcanvas 
        show={showOffcanvas} 
        onHide={handleClose} 
        placement="start"
        className="bg-white"
      >
        <Offcanvas.Header closeButton className="bg-dark text-white">
          <Offcanvas.Title className="fw-bold">HorusBar</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="d-flex flex-column">
          {/* Links de Navegación */}
          <NavigationLinks onLinkClick={handleClose} mobile={true} />
          
          {/* Separador */}
          <hr className="my-3" />
          
          {/* Perfil de Usuario */}
          <div className="mt-auto">
            <div className="d-flex align-items-center p-3 bg-light rounded mb-2">
              <div className="bg-secondary rounded-circle d-flex justify-content-center align-items-center me-2" style={{width: 40, height: 40}}>
                <User size={20} className="text-white" />
              </div>
              <div className="flex-grow-1">
                <div className="fw-semibold">{displayName}</div>
                <small className="text-muted">{user?.email}</small>
              </div>
            </div>
            
            <Button 
              variant="outline-danger" 
              className="w-100 d-flex align-items-center justify-content-center gap-2"
              onClick={handleLogout}
            >
              <LogOut size={18} />
              Cerrar Sesión
            </Button>
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default MobileNavbar;
