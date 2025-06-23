'use client'

import { useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { createClient } from '@/lib/supabase'
import { ServerCategory } from '@/types/mcp'

interface AddServerModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface EnvironmentVariable {
  name: string
  description: string
  required: boolean
  type: 'string' | 'number' | 'boolean' | 'url' | 'api_key'
  example: string
}

export function AddServerModal({ isOpen, onClose, onSuccess }: AddServerModalProps) {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    category: 'other' as ServerCategory,
    packageName: '',
    repository: '',
    icon: '',
    documentation: ''
  })

  const [envVars, setEnvVars] = useState<EnvironmentVariable[]>([])
  // Remove unused config args and env state for now
  // const [configArgs, setConfigArgs] = useState<string[]>([''])
  // const [configEnv, setConfigEnv] = useState<Record<string, string>>({})

  const categories: { value: ServerCategory; label: string }[] = [
    { value: 'productivity', label: 'Productivity' },
    { value: 'development', label: 'Development' },
    { value: 'communication', label: 'Communication' },
    { value: 'database', label: 'Database' },
    { value: 'analytics', label: 'Analytics' },
    { value: 'automation', label: 'Automation' },
    { value: 'monitoring', label: 'Monitoring' },
    { value: 'security', label: 'Security' },
    { value: 'other', label: 'Other' }
  ]

  if (!isOpen) return null

  const addEnvVar = () => {
    setEnvVars([...envVars, {
      name: '',
      description: '',
      required: true,
      type: 'string',
      example: ''
    }])
  }

  const removeEnvVar = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index))
  }

  const updateEnvVar = (index: number, field: keyof EnvironmentVariable, value: string | boolean) => {
    setEnvVars(envVars.map((env, i) => 
      i === index ? { ...env, [field]: value } : env
    ))
  }

  // Remove unused arg management functions for now
  // const addArg = () => {
  //   setConfigArgs([...configArgs, ''])
  // }

  // const removeArg = (index: number) => {
  //   setConfigArgs(configArgs.filter((_, i) => i !== index))
  // }

  // const updateArg = (index: number, value: string) => {
  //   setConfigArgs(configArgs.map((arg, i) => i === index ? value : arg))
  // }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Insert server
      const { data: server, error: serverError } = await supabase
        .from('mcp_servers')
        .insert({
          name: formData.name,
          display_name: formData.displayName,
          description: formData.description,
          category: formData.category,
          package_name: formData.packageName,
          repository: formData.repository || null,
          icon: formData.icon || null,
          documentation: formData.documentation || null,
          is_official: false,
          is_active: true,
          created_by: user.id
        })
        .select()
        .single()

      if (serverError) throw serverError

      // Insert environment variables
      if (envVars.length > 0) {
        const { error: envError } = await supabase
          .from('environment_variables')
          .insert(
            envVars.map(env => ({
              server_id: server.id,
              name: env.name,
              description: env.description,
              required: env.required,
              type: env.type,
              example: env.example || null
            }))
          )

        if (envError) throw envError
      }

      // Insert config template (simple default for now)
      const { error: configError } = await supabase
        .from('config_templates')
        .insert({
          server_id: server.id,
          args: [],
          env: {}
        })

      if (configError) throw configError

      onSuccess()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="absolute inset-4 bg-white rounded-lg shadow-xl flex flex-col max-h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add MCP Server</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Server Name (ID) *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="clickup"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name *
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="ClickUp"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                placeholder="Brief description of what this server does"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as ServerCategory })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Package Name *
                </label>
                <input
                  type="text"
                  value={formData.packageName}
                  onChange={(e) => setFormData({ ...formData, packageName: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="@your-org/mcp-server-name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Repository URL
                </label>
                <input
                  type="url"
                  value={formData.repository}
                  onChange={(e) => setFormData({ ...formData, repository: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="https://github.com/user/repo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Icon (Emoji)
                </label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="🔧"
                />
              </div>
            </div>
          </div>

          {/* Environment Variables */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Environment Variables</h3>
              <button
                type="button"
                onClick={addEnvVar}
                className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span>Add Variable</span>
              </button>
            </div>

            {envVars.map((envVar, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Variable {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeEnvVar(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={envVar.name}
                      onChange={(e) => updateEnvVar(index, 'name', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                      placeholder="API_KEY"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={envVar.type}
                      onChange={(e) => updateEnvVar(index, 'type', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                    >
                      <option value="string">String</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                      <option value="url">URL</option>
                      <option value="api_key">API Key</option>
                    </select>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={envVar.description}
                    onChange={(e) => updateEnvVar(index, 'description', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder="Description of this variable"
                  />
                </div>

                <div className="mt-3 flex items-center">
                  <input
                    type="checkbox"
                    checked={envVar.required}
                    onChange={(e) => updateEnvVar(index, 'required', e.target.checked)}
                    className="mr-2"
                  />
                  <label className="text-xs text-gray-700">Required</label>
                </div>
              </div>
            ))}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Server'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}