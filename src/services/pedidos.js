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
    .neq('estado', 'cobrado')
    .neq('estado', 'cancelado');

  if (error) return [];
  return data;
};

// Cobrar Mesa (Libera la mesa)
export const cobrarMesa = async (mesaId, metodoPago = null) => {
  const updatePayload = { estado: 'cobrado' };
  if (metodoPago) updatePayload.metodo_pago = metodoPago;

  const { error: errorPedidos } = await supabase
    .from('pedidos')
    .update(updatePayload)
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
    .neq('estado', 'cobrado')
    .neq('estado', 'cancelado');

  if (error) return [];
  return data;
};

// Cobrar pedido de barra específico
export const cobrarPedidoBarra = async (pedidoId, metodoPago = null) => {
  const updatePayload = { estado: 'cobrado' };
  if (metodoPago) updatePayload.metodo_pago = metodoPago;

  const { error } = await supabase
    .from('pedidos')
    .update(updatePayload)
    .eq('id', pedidoId);
  if (error) throw error;
};

// Cobrar todos los pedidos de un cliente de barra
export const cobrarClienteBarra = async (nombreCliente, metodoPago = null) => {
  const updatePayload = { estado: 'cobrado' };
  if (metodoPago) updatePayload.metodo_pago = metodoPago;

  const { error } = await supabase
    .from('pedidos')
    .update(updatePayload)
    .eq('cliente', nombreCliente)
    .is('mesa_id', null)
    .neq('estado', 'cobrado');
  if (error) throw error;
};

const devolverStockPorPedidos = async (pedidos = []) => {
  for (const pedido of pedidos) {
    for (const detalle of pedido.detalle_pedidos || []) {
      const { data: producto, error: errorGet } = await supabase
        .from('productos')
        .select('stock_actual')
        .eq('id', detalle.producto_id)
        .single();

      if (errorGet || !producto) continue;

      await supabase
        .from('productos')
        .update({ stock_actual: producto.stock_actual + (detalle.cantidad || 0) })
        .eq('id', detalle.producto_id);
    }
  }
};

// Cancelar todos los pedidos de un cliente de barra (devolver stock y ELIMINAR pedidos)
export const cancelarClienteBarra = async (nombreCliente) => {
  try {
    const { data: pedidos, error: errorSelect } = await supabase
      .from('pedidos')
      .select(`
        id,
        detalle_pedidos ( id, producto_id, cantidad )
      `)
      .eq('cliente', nombreCliente)
      .is('mesa_id', null)
      .neq('estado', 'cobrado');

    if (errorSelect) throw errorSelect;

    await devolverStockPorPedidos(pedidos || []);

    const pedidoIds = (pedidos || []).map((p) => p.id);
    if (pedidoIds.length > 0) {
      // Borrar detalles primero (por si no hay ON DELETE CASCADE)
      const { error: errorDeleteDetalles } = await supabase
        .from('detalle_pedidos')
        .delete()
        .in('pedido_id', pedidoIds);
      if (errorDeleteDetalles) throw errorDeleteDetalles;

      const { error: errorDeletePedidos } = await supabase
        .from('pedidos')
        .delete()
        .in('id', pedidoIds);
      if (errorDeletePedidos) throw errorDeletePedidos;
    }

    return true;
  } catch (error) {
    console.error('Error cancelando cliente barra:', error);
    throw error;
  }
};

// Cancelar todos los pedidos de una mesa (devolver stock, ELIMINAR pedidos y liberar mesa)
export const cancelarMesa = async (mesaId) => {
  try {
    const { data: pedidos, error: errorSelect } = await supabase
      .from('pedidos')
      .select(`
        id,
        detalle_pedidos ( id, producto_id, cantidad )
      `)
      .eq('mesa_id', mesaId)
      .neq('estado', 'cobrado');

    if (errorSelect) throw errorSelect;

    await devolverStockPorPedidos(pedidos || []);

    const pedidoIds = (pedidos || []).map((p) => p.id);
    if (pedidoIds.length > 0) {
      const { error: errorDeleteDetalles } = await supabase
        .from('detalle_pedidos')
        .delete()
        .in('pedido_id', pedidoIds);
      if (errorDeleteDetalles) throw errorDeleteDetalles;

      const { error: errorDeletePedidos } = await supabase
        .from('pedidos')
        .delete()
        .in('id', pedidoIds);
      if (errorDeletePedidos) throw errorDeletePedidos;
    }

    const { error: errorMesa } = await supabase
      .from('mesas')
      .update({ estado: 'libre' })
      .eq('id', mesaId);

    if (errorMesa) throw errorMesa;

    return true;
  } catch (error) {
    console.error('Error cancelando mesa:', error);
    throw error;
  }
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
    // Si no quedan items, eliminar el pedido (evita constraint de estados)
    await supabase
      .from('pedidos')
      .delete()
      .eq('id', pedidoId);
  }
};

// Obtener historial completo
export const getHistorialVentas = async () => {
  const { data, error } = await supabase
    .from('pedidos')
    .select(`
      id, created_at, total, estado, cliente, metodo_pago,
      mesas (numero_mesa),
      detalle_pedidos ( cantidad, precio_unitario, productos (nombre, categoria) )
    `)
    .eq('estado', 'cobrado')
    .order('created_at', { ascending: false });

  if (error) return [];
  return data;
};