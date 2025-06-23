'use client'

import { useState } from 'react'
import { X, Download, Copy, Check } from 'lucide-react'
import { GeneratedConfig } from '@/types/mcp'

interface ConfigModalProps {
  isOpen: boolean
  onClose: () => void
  config: GeneratedConfig
}

export function ConfigModal({ isOpen, onClose, config }: ConfigModalProps) {
  const [activeTab, setActiveTab] = useState<'claude' | 'cursor' | 'vscode' | 'env'>('claude')
  const [copiedTab, setCopiedTab] = useState<string | null>(null)

  if (!isOpen) return null

  const tabs = [
    { id: 'claude', label: 'Claude Code', filename: '.claude.json' },
    { id: 'cursor', label: 'Cursor', filename: 'claude_mcp_config.json' },
    { id: 'vscode', label: 'VS Code', filename: 'settings.json' },
    { id: 'env', label: 'Environment', filename: '.env.template' }
  ]

  const getContent = () => {
    switch (activeTab) {
      case 'claude':
        return JSON.stringify(config.claudeCode, null, 2)
      case 'cursor':
        return JSON.stringify(config.cursor, null, 2)
      case 'vscode':
        return JSON.stringify(config.vscode, null, 2)
      case 'env':
        return config.envTemplate || ''
      default:
        return ''
    }
  }

  const getCurrentTab = () => tabs.find(tab => tab.id === activeTab)

  const handleCopy = async () => {
    const content = getContent()
    try {
      await navigator.clipboard.writeText(content)
      setCopiedTab(activeTab)
      setTimeout(() => setCopiedTab(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleDownload = () => {
    const content = getContent()
    const currentTab = getCurrentTab()
    if (!currentTab) return

    const blob = new Blob([content], { 
      type: activeTab === 'env' ? 'text/plain' : 'application/json' 
    })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = currentTab.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="absolute inset-4 bg-white rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Generated Configuration</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'claude' | 'cursor' | 'vscode' | 'env')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">
                {getCurrentTab()?.filename}
              </span>
              <span className="text-xs text-gray-500">
                {activeTab === 'env' ? 'Environment Variables' : 'JSON Configuration'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1 px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                {copiedTab === activeTab ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
          </div>

          {/* Code Display */}
          <div className="flex-1 overflow-auto">
            <pre className="p-4 text-sm font-mono text-gray-800 bg-gray-50 h-full overflow-auto">
              <code>{getContent()}</code>
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            <p className="mb-2">
              <strong>Usage Instructions:</strong>
            </p>
            {activeTab === 'claude' && (
              <p>Save as <code>.claude.json</code> in your project root directory.</p>
            )}
            {activeTab === 'cursor' && (
              <p>Save as <code>.cursor/claude_mcp_config.json</code> in your project directory.</p>
            )}
            {activeTab === 'vscode' && (
              <p>Add to your VS Code <code>settings.json</code> file in the workspace or user settings.</p>
            )}
            {activeTab === 'env' && (
              <p>Save as <code>.env.template</code> or <code>.env</code> and fill in your actual values.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}