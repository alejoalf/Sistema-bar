import { create } from 'zustand'

export const useBarStore = create((set) => ({
  mesaSeleccionada: null,
  
  // Acciones
  seleccionarMesa: (mesa) => set({ mesaSeleccionada: mesa }),
  liberarMesa: () => set({ mesaSeleccionada: null }),
}))
