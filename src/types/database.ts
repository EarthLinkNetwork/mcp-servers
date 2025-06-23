export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      mcp_servers: {
        Row: {
          id: string
          name: string
          display_name: string
          description: string | null
          category: 'productivity' | 'development' | 'communication' | 'database' | 'analytics' | 'automation' | 'monitoring' | 'security' | 'other'
          package_name: string
          repository: string | null
          author: string | null
          version: string | null
          icon: string | null
          documentation: string | null
          is_official: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          display_name: string
          description?: string | null
          category: 'productivity' | 'development' | 'communication' | 'database' | 'analytics' | 'automation' | 'monitoring' | 'security' | 'other'
          package_name: string
          repository?: string | null
          author?: string | null
          version?: string | null
          icon?: string | null
          documentation?: string | null
          is_official?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          display_name?: string
          description?: string | null
          category?: 'productivity' | 'development' | 'communication' | 'database' | 'analytics' | 'automation' | 'monitoring' | 'security' | 'other'
          package_name?: string
          repository?: string | null
          author?: string | null
          version?: string | null
          icon?: string | null
          documentation?: string | null
          is_official?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      environment_variables: {
        Row: {
          id: string
          server_id: string
          name: string
          description: string | null
          required: boolean
          default_value: string | null
          example: string | null
          type: 'string' | 'number' | 'boolean' | 'url' | 'api_key'
          created_at: string
        }
        Insert: {
          id?: string
          server_id: string
          name: string
          description?: string | null
          required?: boolean
          default_value?: string | null
          example?: string | null
          type?: 'string' | 'number' | 'boolean' | 'url' | 'api_key'
          created_at?: string
        }
        Update: {
          id?: string
          server_id?: string
          name?: string
          description?: string | null
          required?: boolean
          default_value?: string | null
          example?: string | null
          type?: 'string' | 'number' | 'boolean' | 'url' | 'api_key'
          created_at?: string
        }
      }
      config_templates: {
        Row: {
          id: string
          server_id: string
          args: Json
          env: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          server_id: string
          args?: Json
          env?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          server_id?: string
          args?: Json
          env?: Json
          created_at?: string
          updated_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      server_tags: {
        Row: {
          server_id: string
          tag_id: string
        }
        Insert: {
          server_id: string
          tag_id: string
        }
        Update: {
          server_id?: string
          tag_id?: string
        }
      }
      user_configurations: {
        Row: {
          id: string
          name: string
          description: string | null
          config_data: Json
          is_public: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          config_data: Json
          is_public?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          config_data?: Json
          is_public?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      env_var_type: 'string' | 'number' | 'boolean' | 'url' | 'api_key'
      server_category: 'productivity' | 'development' | 'communication' | 'database' | 'analytics' | 'automation' | 'monitoring' | 'security' | 'other'
    }
  }
}