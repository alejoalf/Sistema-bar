import { supabase } from './supabase';

export const getProductos = async () => {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('activo', true) // Solo traemos los activos
    .order('categoria', { ascending: true }); // Agrupados por categoría visualmente

  if (error) {
    console.error('Error al cargar productos:', error);
    return [];
  }
  return data;
};