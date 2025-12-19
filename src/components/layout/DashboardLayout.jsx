import React from 'react';
import Sidebar from './Sidebar';
import MobileNavbar from './MobileNavbar';

const DashboardLayout = ({ children }) => {
  return (
    <>
      {/* Navbar móvil - Solo visible en xs/sm */}
      <MobileNavbar />
      
      <div className="d-flex">
        {/* Sidebar Desktop - Solo visible en md+ */}
        <Sidebar />

        {/* Área de Contenido Principal */}
        <div 
          className="flex-grow-1 bg-light w-100" 
          style={{ 
            minHeight: '100vh',
            marginLeft: 0
          }}
        >
          {/* Cabecera superior - Solo visible en desktop */}
          <header className="bg-white shadow-sm p-3 mb-4 d-none d-md-flex justify-content-between align-items-center">
              <h5 className="m-0 text-secondary">Sistema de Gestión</h5>
              <span className="badge bg-success">Online</span>
          </header>

          {/* Contenido de la página */}
          <div className="content-wrapper">
            {children}
          </div>
        </div>
      </div>

      <style>{`
        /* Desktop: aplicar margin para el sidebar */
        @media (min-width: 768px) {
          .flex-grow-1 {
            margin-left: 250px !important;
          }
        }
        
        /* Móvil: sin margin, ocupa todo el ancho */
        @media (max-width: 767px) {
          .flex-grow-1 {
            margin-left: 0 !important;
            width: 100vw !important;
          }
          
          .content-wrapper {
            padding: 0 !important;
          }
        }
      `}</style>
    </>
  );
};

export default DashboardLayout;