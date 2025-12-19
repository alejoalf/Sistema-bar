import React from 'react';
import Sidebar from './Sidebar';
import { Container } from 'react-bootstrap';

const DashboardLayout = ({ children }) => {
  return (
    <div className="d-flex">
      {/* 1. Sidebar Fijo */}
      <Sidebar />

      {/* 2. Área de Contenido Principal */}
      {/* ml-auto empuja el contenido para no quedar debajo del sidebar */}
      <div 
        className="flex-grow-1 bg-light" 
        style={{ marginLeft: '250px', minHeight: '100vh' }}
      >
        {/* Cabecera superior simple (Opcional, puede ir el título de la página) */}
        <header className="bg-white shadow-sm p-3 mb-4 d-flex justify-content-between align-items-center">
            <h5 className="m-0 text-secondary">Sistema de Gestión</h5>
            <span className="badge bg-success">Online</span>
        </header>

        {/* Aquí se renderiza la página que estés visitando (Salon, Cocina, etc) */}
        <Container fluid className="px-4">
          {children}
        </Container>
      </div>
    </div>
  );
};

export default DashboardLayout;