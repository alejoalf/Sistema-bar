import { supabase } from './supabase';

// Crear un pedido (Sirve para Mesa y para Barra)
export const crearPedido = async (mesaId, items, total, nombreCliente = null) => {
  try {
    const pedidoObj = { 
      estado: 'pendiente', 
      total: total,
      cliente: nombreCliente 
    };

    // Solo asignamos mesa si existe (si es null, es pedido de barra)
    if (mesaId) pedidoObj.mesa_id = mesaId;

    const { data: pedidoData, error: pedidoError } = await supabase
      .from('pedidos')
      .insert([pedidoObj])
      .select()
      .single();

    if (pedidoError) throw pedidoError;

    const pedidoId = pedidoData.id;

    const detalles = items.map(item => ({
      pedido_id: pedidoId,
      producto_id: item.id,
      cantidad: 1, 
      precio_unitario: item.precio
    }));

    const { error: detalleError } = await supabase
      .from('detalle_pedidos')
      .insert(detalles);

    if (detalleError) throw detalleError;

    // Restar Stock
    for (const item of items) {
      const { data: producto, error: errorGet } = await supabase
        .from('productos')
        .select('stock_actual')
        .eq('id', item.id)
        .single();

      if (errorGet) {
        console.error(`Error obteniendo stock del producto ${item.id}:`, errorGet);
        continue;
      }

      const nuevoStock = producto.stock_actual - 1;
      
      const { error: errorUpdate } = await supabase
        .from('productos')
        .update({ stock_actual: nuevoStock })
        .eq('id', item.id);

      if (errorUpdate) {
        console.error(`Error actualizando stock del producto ${item.id}:`, errorUpdate);
      }
    }

    return pedidoId;

  } catch (error) {
    console.error('Error creando pedido:', error);
    throw error;
  }
};

// Obtener cuenta de una mesa
export const getCuentaMesa = async (mesaId) => {
  const { data, error } = await supabase
    .from('pedidos')
    .select(`
      id, total, estado, created_at,
      detalle_pedidos ( id, pedido_id, producto_id, cantidad, precio_unitario, productos (nombre) )
    `)
    .eq('mesa_id', mesaId)
    .neq('estado', 'cobrado');

  if (error) return [];
  return data;
};

// Cobrar Mesa (Libera la mesa)
export const cobrarMesa = async (mesaId) => {
  const { error: errorPedidos } = await supabase
    .from('pedidos')
    .update({ estado: 'cobrado' })
    .eq('mesa_id', mesaId)
    .neq('estado', 'cobrado');
  if (errorPedidos) throw errorPedidos;

  const { error: errorMesa } = await supabase
    .from('mesas')
    .update({ estado: 'libre' })
    .eq('id', mesaId);
  if (errorMesa) throw errorMesa;
};

// --- NUEVAS FUNCIONES PARA BARRA (ESTAS ERAN LAS QUE FALTABAN) ---

// Traer pedidos de barra (sin mesa)
export const getPedidosBarra = async () => {
  const { data, error } = await supabase
    .from('pedidos')
    .select(`
      id, cliente, total, created_at, estado,
      detalle_pedidos ( id, pedido_id, producto_id, cantidad, precio_unitario, productos (nombre) )
    `)
    .is('mesa_id', null) 
    .neq('estado', 'cobrado');

  if (error) return [];
  return data;
};

// Cobrar pedido de barra específico
export const cobrarPedidoBarra = async (pedidoId) => {
  const { error } = await supabase
    .from('pedidos')
    .update({ estado: 'cobrado' })
    .eq('id', pedidoId);
  if (error) throw error;
};

// Cobrar todos los pedidos de un cliente de barra
export const cobrarClienteBarra = async (nombreCliente) => {
  const { error } = await supabase
    .from('pedidos')
    .update({ estado: 'cobrado' })
    .eq('cliente', nombreCliente)
    .is('mesa_id', null)
    .neq('estado', 'cobrado');
  if (error) throw error;
};

// Obtener cuenta completa de un cliente de barra
export const getCuentaCliente = async (nombreCliente) => {
  const { data, error } = await supabase
    .from('pedidos')
    .select(`
      id, total, estado, created_at,
      detalle_pedidos ( id, pedido_id, producto_id, cantidad, precio_unitario, productos (nombre) )
    `)
    .eq('cliente', nombreCliente)
    .is('mesa_id', null)
    .neq('estado', 'cobrado');

  if (error) return [];
  return data;
};

// Eliminar un item de un pedido
export const eliminarItemPedido = async (detalleId, productoId, precioUnitario, pedidoId) => {
  try {
    // Devolver stock primero
    const { data: producto, error: errorGet } = await supabase
      .from('productos')
      .select('stock_actual')
      .eq('id', productoId)
      .single();

    if (!errorGet && producto) {
      await supabase
        .from('productos')
        .update({ stock_actual: producto.stock_actual + 1 })
        .eq('id', productoId);
    }

    // Eliminar el detalle
    const { error: deleteError } = await supabase
      .from('detalle_pedidos')
      .delete()
      .eq('id', detalleId);

    if (deleteError) throw deleteError;

    // Recalcular el total del pedido
    await recalcularTotalPedido(pedidoId);

    return true;
  } catch (error) {
    console.error('Error eliminando item:', error);
    throw error;
  }
};

// Recalcular total de un pedido
const recalcularTotalPedido = async (pedidoId) => {
  const { data: detalles } = await supabase
    .from('detalle_pedidos')
    .select('cantidad, precio_unitario')
    .eq('pedido_id', pedidoId);

  if (detalles && detalles.length > 0) {
    const nuevoTotal = detalles.reduce((sum, d) => sum + (d.cantidad * d.precio_unitario), 0);
    
    await supabase
      .from('pedidos')
      .update({ total: nuevoTotal })
      .eq('id', pedidoId);
  } else {
    // Si no quedan items, marcar pedido como cobrado o eliminarlo
    await supabase
      .from('pedidos')
      .update({ estado: 'cancelado' })
      .eq('id', pedidoId);
  }
};

// Obtener historial completo
export const getHistorialVentas = async () => {
  const { data, error } = await supabase
    .from('pedidos')
    .select(`
      id, created_at, total, estado, cliente,
      mesas (numero_mesa),
      detalle_pedidos ( cantidad, precio_unitario, productos (nombre, categoria) )
    `)
    .eq('estado', 'cobrado')
    .order('created_at', { ascending: false });

  if (error) return [];
  return data;
};