import { create } from 'zustand'
import { CartItem, MCPServer } from '@/types/mcp'

interface CartStore {
  items: CartItem[]
  addServer: (server: MCPServer) => void
  removeServer: (serverId: string) => void
  updateEnvValues: (serverId: string, envValues: Record<string, string>) => void
  clearCart: () => void
  getTotalServers: () => number
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  
  addServer: (server: MCPServer) => {
    const items = get().items
    const existingItem = items.find(item => item.server.id === server.id)
    
    if (!existingItem) {
      const newItem: CartItem = {
        server,
        envValues: {}
      }
      set({ items: [...items, newItem] })
    }
  },
  
  removeServer: (serverId: string) => {
    set(state => ({
      items: state.items.filter(item => item.server.id !== serverId)
    }))
  },
  
  updateEnvValues: (serverId: string, envValues: Record<string, string>) => {
    set(state => ({
      items: state.items.map(item =>
        item.server.id === serverId
          ? { ...item, envValues }
          : item
      )
    }))
  },
  
  clearCart: () => {
    set({ items: [] })
  },
  
  getTotalServers: () => {
    return get().items.length
  }
}))