# 📋 Guía de Desarrollo - Próximos Pasos

## 1. Configurar Supabase

### Crear Tablas en Supabase

```sql
-- Tabla de Mesas
CREATE TABLE mesas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  numero_mesa INTEGER NOT NULL UNIQUE,
  estado VARCHAR(20) DEFAULT 'libre' CHECK (estado IN ('libre', 'ocupada', 'pagando')),
  capacidad INTEGER DEFAULT 4,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de Pedidos
CREATE TABLE pedidos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mesa_id UUID REFERENCES mesas(id) ON DELETE CASCADE,
  total DECIMAL(10,2) DEFAULT 0,
  estado VARCHAR(20) DEFAULT 'pendiente',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de Items del Pedido
CREATE TABLE pedido_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id),
  cantidad INTEGER NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de Productos
CREATE TABLE productos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  categoria VARCHAR(50),
  disponible BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insertar mesas de ejemplo
INSERT INTO mesas (numero_mesa, capacidad) VALUES
  (1, 4), (2, 4), (3, 2), (4, 6), (5, 4), (6, 4);
```

## 2. Conectar Vista del Salón con Supabase

Actualizar `src/pages/Salon.jsx`:

```jsx
import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const Salon = () => {
  const [mesas, setMesas] = useState([]);
  const seleccionarMesa = useBarStore((state) => state.seleccionarMesa);

  // Cargar mesas desde Supabase
  useEffect(() => {
    const fetchMesas = async () => {
      const { data, error } = await supabase
        .from('mesas')
        .select('*')
        .order('numero_mesa');
      
      if (data) setMesas(data);
    };

    fetchMesas();

    // Suscribirse a cambios en tiempo real
    const subscription = supabase
      .channel('mesas-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'mesas' },
        (payload) => {
          fetchMesas(); // Recargar cuando hay cambios
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, []);

  // ... resto del código
};
```

## 3. Crear Modal de Pedidos

Crear `src/components/pedidos/ModalPedido.jsx`:

```jsx
import { Modal, Button, Form, ListGroup } from 'react-bootstrap';
import { useState } from 'react';

const ModalPedido = ({ show, onHide, mesa }) => {
  const [items, setItems] = useState([]);

  const guardarPedido = async () => {
    // Lógica para guardar en Supabase
    const { data, error } = await supabase
      .from('pedidos')
      .insert({ mesa_id: mesa.id, estado: 'pendiente' });
    
    // Luego insertar items...
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Mesa {mesa?.numero_mesa} - Nuevo Pedido</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Formulario de pedido */}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={guardarPedido}>
          Guardar Pedido
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalPedido;
```

## 4. Agregar Store de Pedidos

Actualizar `src/store/useBarStore.js`:

```jsx
export const useBarStore = create((set) => ({
  mesaSeleccionada: null,
  pedidos: [],
  
  seleccionarMesa: (mesa) => set({ mesaSeleccionada: mesa }),
  liberarMesa: () => set({ mesaSeleccionada: null }),
  
  // Nuevas acciones
  agregarPedido: (pedido) => set((state) => ({
    pedidos: [...state.pedidos, pedido]
  })),
  
  actualizarPedido: (id, cambios) => set((state) => ({
    pedidos: state.pedidos.map(p => 
      p.id === id ? { ...p, ...cambios } : p
    )
  })),
}));
```

## 5. Vista de Cocina

Crear `src/pages/Cocina.jsx`:

```jsx
import { Container, Row, Col, Card, Badge, Button } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const Cocina = () => {
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    const fetchPedidos = async () => {
      const { data } = await supabase
        .from('pedidos')
        .select('*, mesas(*), pedido_items(*)')
        .in('estado', ['pendiente', 'preparando'])
        .order('created_at');
      
      if (data) setPedidos(data);
    };

    fetchPedidos();

    // Realtime
    const subscription = supabase
      .channel('pedidos-cocina')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'pedidos' },
        () => fetchPedidos()
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, []);

  return (
    <Container className="py-4">
      <h2 className="mb-4">Pedidos en Cocina</h2>
      {/* Renderizar pedidos */}
    </Container>
  );
};

export default Cocina;
```

## 6. Autenticación

Crear `src/pages/Login.jsx`:

```jsx
import { Container, Card, Form, Button } from 'react-bootstrap';
import { useState } from 'react';
import { supabase } from '../services/supabase';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (data) {
      // Redirigir al salón
      window.location.href = '/';
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center min-vh-100">
      <Card style={{ maxWidth: '400px', width: '100%' }}>
        <Card.Body>
          <h3 className="text-center mb-4">Sistema Bar</h3>
          <Form onSubmit={handleLogin}>
            {/* Form fields */}
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Login;
```

## 📝 Checklist de Implementación

- [x] Estructura base del proyecto
- [x] Vista del Salón con mesas mock
- [x] Integración de React Bootstrap
- [x] Estado global con Zustand
- [ ] Configurar Supabase (URL y Keys)
- [ ] Crear tablas en Supabase
- [ ] Conectar vista del Salón con DB real
- [ ] Implementar Modal de Pedidos
- [ ] Vista de Cocina con Realtime
- [ ] Sistema de Autenticación
- [ ] Panel de Administración
- [ ] Reportes y estadísticas

## 🎯 Orden Recomendado

1. Configurar Supabase (crear proyecto y obtener keys)
2. Crear las tablas en la base de datos
3. Conectar vista del Salón con datos reales
4. Implementar modal de pedidos
5. Agregar vista de cocina
6. Implementar autenticación
7. Agregar panel de admin
