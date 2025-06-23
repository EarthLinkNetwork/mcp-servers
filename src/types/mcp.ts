import { Database } from './database'

export type MCPServer = Database['public']['Tables']['mcp_servers']['Row'] & {
  environment_variables?: Database['public']['Tables']['environment_variables']['Row'][]
  config_template?: Database['public']['Tables']['config_templates']['Row']
  tags?: Database['public']['Tables']['tags']['Row'][]
}

export type ServerCategory = Database['public']['Enums']['server_category']
export type EnvVarType = Database['public']['Enums']['env_var_type']

export interface CartItem {
  server: MCPServer
  envValues: Record<string, string>
}

export interface ServerConfig {
  command: string
  args?: string[]
  env?: Record<string, string>
}

export interface ClaudeConfig {
  mcpServers?: Record<string, ServerConfig>
}

export interface CursorConfig {
  mcpServers?: Record<string, ServerConfig>
}

export interface VSCodeConfig {
  "modelcontextprotocol.servers"?: Record<string, ServerConfig>
}

export interface GeneratedConfig {
  claudeCode?: ClaudeConfig
  cursor?: CursorConfig
  vscode?: VSCodeConfig
  envTemplate?: string
}