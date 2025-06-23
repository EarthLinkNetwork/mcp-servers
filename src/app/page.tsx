'use client'

import { useState, useEffect } from 'react'
import { useServers } from '@/hooks/useServers'
import { useCartStore } from '@/store/cart'
import { SearchBar } from '@/components/SearchBar'
import { CategoryFilter } from '@/components/CategoryFilter'
import { ServerCard } from '@/components/ServerCard'
import { CartSidebar } from '@/components/CartSidebar'
import { ConfigModal } from '@/components/ConfigModal'
import { AuthModal } from '@/components/AuthModal'
import { UserMenu } from '@/components/UserMenu'
import { AddServerModal } from '@/components/AddServerModal'
import { generateConfigurations } from '@/lib/configGenerator'
import { useAuthStore } from '@/store/auth'
import { ShoppingCart, Settings, LogIn } from 'lucide-react'
import { GeneratedConfig } from '@/types/mcp'

export default function Home() {
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [isAddServerOpen, setIsAddServerOpen] = useState(false)
  const [generatedConfig, setGeneratedConfig] = useState<GeneratedConfig | null>(null)
  const { items } = useCartStore()
  const { user, initialize } = useAuthStore()
  const {
    servers,
    loading,
    error,
    searchQuery,
    selectedCategory,
    categoryCounts,
    handleSearch,
    handleCategoryChange,
    refetch
  } = useServers()

  // Initialize auth on mount
  useEffect(() => {
    initialize()
  }, [initialize])

  const handleShowConfig = () => {
    if (items.length === 0) return

    const configs = generateConfigurations(items)
    setGeneratedConfig(configs)
    setIsCartOpen(false)
    setIsConfigOpen(true)
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
          <p className="text-sm text-gray-500 mt-2">
            Please check your Supabase configuration
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">MCP Hub</h1>
                <p className="text-sm text-gray-500">MCP Server Configuration Manager</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <UserMenu onAddServer={() => setIsAddServerOpen(true)} />
              ) : (
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <LogIn className="w-5 h-5" />
                  <span>Sign In</span>
                </button>
              )}
              
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Cart</span>
                {items.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {items.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="max-w-2xl">
            <SearchBar onSearch={handleSearch} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <CategoryFilter
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategoryChange}
              categoryCounts={categoryCounts}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-8 h-8 bg-gray-300 rounded"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-300 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : servers.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Settings className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery || selectedCategory !== 'all' ? 'No servers found' : 'No servers available'}
                </h3>
                <p className="text-gray-500">
                  {searchQuery || selectedCategory !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : 'Check your database configuration'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {servers.map((server) => (
                  <ServerCard key={server.id} server={server} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cart Sidebar */}
      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onShowConfig={handleShowConfig}
      />

      {/* Config Modal */}
      {generatedConfig && (
        <ConfigModal
          isOpen={isConfigOpen}
          onClose={() => setIsConfigOpen(false)}
          config={generatedConfig}
        />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      {/* Add Server Modal */}
      <AddServerModal
        isOpen={isAddServerOpen}
        onClose={() => setIsAddServerOpen(false)}
        onSuccess={() => {
          refetch()
          setIsAddServerOpen(false)
        }}
      />
    </div>
  )
}
