'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { MCPServer, ServerCategory } from '@/types/mcp'

export function useServers() {
  const [servers, setServers] = useState<MCPServer[]>([])
  const [filteredServers, setFilteredServers] = useState<MCPServer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ServerCategory | 'all'>('all')

  const supabase = createClient()

  const fetchServers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: serversData, error: serversError } = await supabase
        .from('mcp_servers')
        .select(`
          *,
          environment_variables (*),
          config_templates (*),
          server_tags (
            tags (*)
          )
        `)
        .eq('is_active', true)
        .order('display_name')

      if (serversError) throw serversError

      // Transform the data to match our MCPServer type
      const transformedServers: MCPServer[] = serversData.map(server => ({
        ...server,
        config_template: server.config_templates?.[0] || null,
        tags: server.server_tags?.map((st: { tags: unknown }) => st.tags) || []
      }))

      setServers(transformedServers)
    } catch (err) {
      console.error('Error fetching servers:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch servers')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const filterServers = useCallback(() => {
    let filtered = [...servers]

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(server => server.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(server =>
        server.display_name.toLowerCase().includes(query) ||
        server.name.toLowerCase().includes(query) ||
        server.description?.toLowerCase().includes(query) ||
        server.package_name.toLowerCase().includes(query) ||
        server.tags?.some(tag => tag.name.toLowerCase().includes(query))
      )
    }

    setFilteredServers(filtered)
  }, [servers, selectedCategory, searchQuery])

  useEffect(() => {
    fetchServers()
  }, [fetchServers])

  useEffect(() => {
    filterServers()
  }, [servers, searchQuery, selectedCategory, filterServers])

  const getCategoryCounts = () => {
    const counts: Record<ServerCategory | 'all', number> = {
      all: servers.length,
      productivity: 0,
      development: 0,
      communication: 0,
      database: 0,
      analytics: 0,
      automation: 0,
      monitoring: 0,
      security: 0,
      other: 0
    }

    servers.forEach(server => {
      counts[server.category] = (counts[server.category] || 0) + 1
    })

    return counts
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleCategoryChange = (category: ServerCategory | 'all') => {
    setSelectedCategory(category)
  }

  return {
    servers: filteredServers,
    allServers: servers,
    loading,
    error,
    searchQuery,
    selectedCategory,
    categoryCounts: getCategoryCounts(),
    handleSearch,
    handleCategoryChange,
    refetch: fetchServers
  }
}