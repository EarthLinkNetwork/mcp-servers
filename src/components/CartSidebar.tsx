'use client'

import { useState } from 'react'
import { useCartStore } from '@/store/cart'
import { X, ShoppingCart, Settings } from 'lucide-react'
import { CartItem } from '@/types/mcp'

interface CartSidebarProps {
  isOpen: boolean
  onClose: () => void
  onShowConfig: () => void
}

export function CartSidebar({ isOpen, onClose, onShowConfig }: CartSidebarProps) {
  const { items, removeServer, updateEnvValues, clearCart } = useCartStore()
  const [activeTab, setActiveTab] = useState<'servers' | 'config'>('servers')

  const handleEnvChange = (serverId: string, envName: string, value: string) => {
    const item = items.find(item => item.server.id === serverId)
    if (item) {
      const newEnvValues = { ...item.envValues, [envName]: value }
      updateEnvValues(serverId, newEnvValues)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Configuration Cart</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('servers')}
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                activeTab === 'servers'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Servers ({items.length})
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                activeTab === 'config'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Configuration
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'servers' ? (
              <div className="space-y-4">
                {items.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No servers added yet</p>
                    <p className="text-sm">Browse and add MCP servers to get started</p>
                  </div>
                ) : (
                  items.map((item) => (
                    <ServerCartItem
                      key={item.server.id}
                      item={item}
                      onRemove={() => removeServer(item.server.id)}
                      onEnvChange={handleEnvChange}
                    />
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  <p>Ready to generate configuration files for:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Claude Code (.claude.json)</li>
                    <li>Cursor (.cursor/claude_mcp_config.json)</li>
                    <li>VS Code (settings.json)</li>
                    <li>Environment variables (.env.template)</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-gray-200 p-4 space-y-2">
              <button
                onClick={onShowConfig}
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Generate Configuration</span>
              </button>
              <button
                onClick={clearCart}
                className="w-full text-gray-600 hover:text-gray-900 px-4 py-2 text-sm"
              >
                Clear Cart
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface ServerCartItemProps {
  item: CartItem
  onRemove: () => void
  onEnvChange: (serverId: string, envName: string, value: string) => void
}

function ServerCartItem({ item, onRemove, onEnvChange }: ServerCartItemProps) {
  const { server, envValues } = item

  return (
    <div className="border border-gray-200 rounded-lg p-3">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{server.icon || '🔧'}</span>
          <div>
            <h4 className="font-medium text-sm">{server.display_name}</h4>
            <p className="text-xs text-gray-500">{server.package_name}</p>
          </div>
        </div>
        <button
          onClick={onRemove}
          className="text-gray-400 hover:text-red-600 p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {server.environment_variables && server.environment_variables.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-medium text-gray-700 flex items-center space-x-1">
            <Settings className="w-3 h-3" />
            <span>Environment Variables</span>
          </h5>
          {server.environment_variables.map((envVar) => (
            <div key={envVar.id}>
              <label className="block text-xs text-gray-600 mb-1">
                {envVar.name}
                {envVar.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <input
                type={envVar.type === 'api_key' ? 'password' : 'text'}
                value={envValues[envVar.name] || ''}
                onChange={(e) => onEnvChange(server.id, envVar.name, e.target.value)}
                placeholder={envVar.example || `Enter ${envVar.name.toLowerCase()}`}
                className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              />
              {envVar.description && (
                <p className="text-xs text-gray-500 mt-1">{envVar.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}