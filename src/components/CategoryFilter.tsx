'use client'

import { ServerCategory } from '@/types/mcp'

interface CategoryFilterProps {
  selectedCategory: ServerCategory | 'all'
  onCategoryChange: (category: ServerCategory | 'all') => void
  categoryCounts: Record<ServerCategory | 'all', number>
}

const categoryLabels: Record<ServerCategory | 'all', string> = {
  all: 'All',
  productivity: 'Productivity',
  development: 'Development',
  communication: 'Communication',
  database: 'Database',
  analytics: 'Analytics',
  automation: 'Automation',
  monitoring: 'Monitoring',
  security: 'Security',
  other: 'Other'
}

const categoryIcons: Record<ServerCategory | 'all', string> = {
  all: '🔧',
  productivity: '⚡',
  development: '💻',
  communication: '💬',
  database: '🗄️',
  analytics: '📊',
  automation: '🤖',
  monitoring: '📡',
  security: '🔒',
  other: '📦'
}

export function CategoryFilter({ selectedCategory, onCategoryChange, categoryCounts }: CategoryFilterProps) {
  const categories = Object.keys(categoryLabels) as (ServerCategory | 'all')[]

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
      <div className="space-y-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
              selectedCategory === category
                ? 'bg-blue-100 text-blue-800 font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span>{categoryIcons[category]}</span>
              <span>{categoryLabels[category]}</span>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${
              selectedCategory === category
                ? 'bg-blue-200 text-blue-800'
                : 'bg-gray-200 text-gray-600'
            }`}>
              {categoryCounts[category] || 0}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}