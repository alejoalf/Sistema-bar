import { supabase } from './supabase';

export const getProductos = async () => {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('activo', true) // Solo traemos los activos
    .order('categoria', { ascending: true });

  if (error) {
    console.error('Error al cargar productos:', error);
    return [];
  }
  return data;
};

// Crear nuevo producto
export const createProducto = async (producto) => {
  // Aseguramos que los números sean números
  const datosLimpios = {
    ...producto,
    precio: parseFloat(producto.precio),
    stock_actual: parseInt(producto.stock_actual),
    activo: true,
    disponible: producto.disponible !== undefined ? !!producto.disponible : true
  };

  const { error } = await supabase
    .from('productos')
    .insert([datosLimpios]);
    
  if (error) {
    console.error("Error al crear:", error);
    throw error;
  }
};

// Actualizar producto (Precio o Stock)
export const updateProducto = async (id, cambios) => {
  // 1. TRUCO IMPORTANTE: Sacamos el 'id' del objeto cambios.
  // Usamos destructuring: 'idNoUsar' se queda con el id, y 'datosLimpios' con el resto.
  const { id: idNoUsar, ...datosLimpios } = cambios;

  // 2. Aseguramos tipos de datos numéricos (por si el input viene como texto)
  if (datosLimpios.precio !== undefined) datosLimpios.precio = parseFloat(datosLimpios.precio);
  if (datosLimpios.stock_actual !== undefined) datosLimpios.stock_actual = parseInt(datosLimpios.stock_actual);
  if (datosLimpios.disponible !== undefined) datosLimpios.disponible = !!datosLimpios.disponible;

  const { error } = await supabase
    .from('productos')
    .update(datosLimpios) // Enviamos el objeto SIN el id
    .eq('id', id);
    
  if (error) {
    console.error("Error al actualizar:", error);
    throw error;
  }
};

// Eliminar producto (Borrado lógico)
export const deleteProducto = async (id) => {
  console.log("Intentando eliminar ID:", id); // Para ver en consola si llega

  const { error } = await supabase
    .from('productos')
    .update({ activo: false }) 
    .eq('id', id);

  if (error) {
    console.error("Error al eliminar:", error);
    throw error;
  }
};

export const setDisponibilidadProducto = async (id, disponible) => {
  const { error } = await supabase
    .from('productos')
    .update({ disponible: !!disponible })
    .eq('id', id);

  if (error) {
    console.error('Error actualizando disponibilidad:', error);
    throw error;
  }
};