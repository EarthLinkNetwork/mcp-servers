'use client'

import { MCPServer } from '@/types/mcp'
import { useCartStore } from '@/store/cart'
import { Plus, Check, ExternalLink } from 'lucide-react'

interface ServerCardProps {
  server: MCPServer
}

export function ServerCard({ server }: ServerCardProps) {
  const { items, addServer, removeServer } = useCartStore()
  const isInCart = items.some(item => item.server.id === server.id)

  const handleToggleCart = () => {
    if (isInCart) {
      removeServer(server.id)
    } else {
      addServer(server)
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      productivity: 'bg-blue-100 text-blue-800',
      development: 'bg-green-100 text-green-800',
      communication: 'bg-purple-100 text-purple-800',
      database: 'bg-orange-100 text-orange-800',
      analytics: 'bg-yellow-100 text-yellow-800',
      automation: 'bg-red-100 text-red-800',
      monitoring: 'bg-indigo-100 text-indigo-800',
      security: 'bg-pink-100 text-pink-800',
      other: 'bg-gray-100 text-gray-800'
    }
    return colors[category as keyof typeof colors] || colors.other
  }

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6 border border-gray-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{server.icon || '🔧'}</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{server.display_name}</h3>
            <p className="text-sm text-gray-500">{server.package_name}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {server.is_official && (
            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
              Official
            </span>
          )}
          <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(server.category)}`}>
            {server.category}
          </span>
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {server.description}
      </p>

      {server.tags && server.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {server.tags.slice(0, 3).map((tag) => (
            <span
              key={tag.id}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
            >
              {tag.name}
            </span>
          ))}
          {server.tags.length > 3 && (
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
              +{server.tags.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          {server.repository && (
            <a
              href={server.repository}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Repository</span>
            </a>
          )}
        </div>

        <button
          onClick={handleToggleCart}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            isInCart
              ? 'bg-green-100 text-green-800 hover:bg-green-200'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isInCart ? (
            <>
              <Check className="w-4 h-4" />
              <span>Added</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Add to Cart</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}