import { Navbar, Container, Nav } from 'react-bootstrap';
import { Home, UtensilsCrossed, ChefHat, Users } from 'lucide-react';

const MainNavbar = () => {
  return (
    <Navbar bg="dark" variant="dark" expand="lg" sticky="top">
      <Container fluid>
        <Navbar.Brand href="/" className="d-flex align-items-center gap-2">
          <img src="/angus_bar.png" alt="Angus Bar" width={28} height={28} className="rounded" />
          <UtensilsCrossed className="me-1" size={20} />
          Angus Bar
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link href="/">
              <Home size={18} className="me-1" />
              Salón
            </Nav.Link>
            <Nav.Link href="/cocina">
              <ChefHat size={18} className="me-1" />
              Cocina
            </Nav.Link>
            <Nav.Link href="/admin">
              <Users size={18} className="me-1" />
              Admin
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default MainNavbar;
