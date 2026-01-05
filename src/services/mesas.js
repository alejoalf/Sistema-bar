import { supabase } from './supabase';

// Datos mock para cuando Supabase no esté configurado
const mesasMock = [
  // Salón (10)
  { id: 'S1', numero_mesa: 1, estado: 'libre', capacidad: 4, sector: 'salon' },
  { id: 'S2', numero_mesa: 2, estado: 'ocupada', capacidad: 4, sector: 'salon' },
  { id: 'S3', numero_mesa: 3, estado: 'pagando', capacidad: 2, sector: 'salon' },
  { id: 'S4', numero_mesa: 4, estado: 'libre', capacidad: 6, sector: 'salon' },
  { id: 'S5', numero_mesa: 5, estado: 'libre', capacidad: 4, sector: 'salon' },
  { id: 'S6', numero_mesa: 6, estado: 'ocupada', capacidad: 4, sector: 'salon' },
  { id: 'S7', numero_mesa: 7, estado: 'libre', capacidad: 4, sector: 'salon' },
  { id: 'S8', numero_mesa: 8, estado: 'libre', capacidad: 4, sector: 'salon' },
  { id: 'S9', numero_mesa: 9, estado: 'libre', capacidad: 4, sector: 'salon' },
  { id: 'S10', numero_mesa: 10, estado: 'libre', capacidad: 4, sector: 'salon' },
  // Patio del medio (6)
  { id: 'M1', numero_mesa: 11, estado: 'libre', capacidad: 4, sector: 'patio-medio' },
  { id: 'M2', numero_mesa: 12, estado: 'ocupada', capacidad: 4, sector: 'patio-medio' },
  { id: 'M3', numero_mesa: 13, estado: 'libre', capacidad: 4, sector: 'patio-medio' },
  { id: 'M4', numero_mesa: 14, estado: 'pagando', capacidad: 4, sector: 'patio-medio' },
  { id: 'M5', numero_mesa: 15, estado: 'libre', capacidad: 4, sector: 'patio-medio' },
  { id: 'M6', numero_mesa: 16, estado: 'libre', capacidad: 4, sector: 'patio-medio' },
  // Patio del fondo (8)
  { id: 'F1', numero_mesa: 17, estado: 'libre', capacidad: 4, sector: 'patio-fondo' },
  { id: 'F2', numero_mesa: 18, estado: 'ocupada', capacidad: 4, sector: 'patio-fondo' },
  { id: 'F3', numero_mesa: 19, estado: 'libre', capacidad: 4, sector: 'patio-fondo' },
  { id: 'F4', numero_mesa: 20, estado: 'libre', capacidad: 4, sector: 'patio-fondo' },
  { id: 'F5', numero_mesa: 21, estado: 'pagando', capacidad: 4, sector: 'patio-fondo' },
  { id: 'F6', numero_mesa: 22, estado: 'libre', capacidad: 4, sector: 'patio-fondo' },
  { id: 'F7', numero_mesa: 23, estado: 'libre', capacidad: 4, sector: 'patio-fondo' },
  { id: 'F8', numero_mesa: 24, estado: 'libre', capacidad: 4, sector: 'patio-fondo' },
];

// Obtener todas las mesas ordenadas por número
export const getMesas = async () => {
  // Si no hay configuración de Supabase, usar datos mock
  if (!import.meta.env.VITE_SUPABASE_URL) {
    console.log('🎭 Usando datos MOCK (configura Supabase en .env)');
    return mesasMock;
  }

  const { data, error } = await supabase
    .from('mesas')
    .select('*')
    .order('numero_mesa', { ascending: true });

  if (error) {
    console.error('Error cargando mesas:', error);
    console.log('🎭 Fallback a datos MOCK');
    return mesasMock;
  }
  return data || [];
};

// Función para cambiar estado (la usaremos pronto)
export const updateEstadoMesa = async (id, nuevoEstado) => {
  const { error } = await supabase
    .from('mesas')
    .update({ estado: nuevoEstado })
    .eq('id', id);
    
  if (error) throw error;
};

// ... (manten lo que ya tenias arriba: getMesas)

// Función para abrir la mesa (Marcar como ocupada)
export const abrirMesa = async (idMesa) => {
  // Si no hay Supabase configurado, simular éxito
  if (!import.meta.env.VITE_SUPABASE_URL) {
    console.log('🎭 MOCK: Mesa abierta (ID:', idMesa, ')');
    await new Promise(resolve => setTimeout(resolve, 500)); // Simular delay
    return;
  }

  const { error } = await supabase
    .from('mesas')
    .update({ estado: 'ocupada' })
    .eq('id', idMesa);
    
  if (error) throw error;
};

// Función para cerrar la mesa (Liberar)
export const cerrarMesa = async (idMesa) => {
  // Si no hay Supabase configurado, simular éxito
  if (!import.meta.env.VITE_SUPABASE_URL) {
    console.log('🎭 MOCK: Mesa cerrada (ID:', idMesa, ')');
    await new Promise(resolve => setTimeout(resolve, 500)); // Simular delay
    return;
  }

  const { error } = await supabase
    .from('mesas')
    .update({ estado: 'libre' })
    .eq('id', idMesa);

  if (error) throw error;
};