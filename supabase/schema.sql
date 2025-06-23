-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories enum
CREATE TYPE server_category AS ENUM (
  'productivity',
  'development',
  'communication',
  'database',
  'analytics',
  'automation',
  'monitoring',
  'security',
  'other'
);

-- Environment variable type enum
CREATE TYPE env_var_type AS ENUM (
  'string',
  'number',
  'boolean',
  'url',
  'api_key'
);

-- MCP Servers table
CREATE TABLE mcp_servers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  category server_category NOT NULL,
  package_name VARCHAR(255) NOT NULL,
  repository VARCHAR(255),
  author VARCHAR(255),
  version VARCHAR(50),
  icon VARCHAR(10),
  documentation TEXT,
  is_official BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Environment Variables table
CREATE TABLE environment_variables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_id UUID NOT NULL REFERENCES mcp_servers(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  required BOOLEAN DEFAULT true,
  default_value VARCHAR(255),
  example VARCHAR(255),
  type env_var_type DEFAULT 'string',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(server_id, name)
);

-- Config Templates table
CREATE TABLE config_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_id UUID NOT NULL REFERENCES mcp_servers(id) ON DELETE CASCADE,
  args JSONB DEFAULT '[]'::jsonb,
  env JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(server_id)
);

-- Tags table
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Server Tags junction table
CREATE TABLE server_tags (
  server_id UUID NOT NULL REFERENCES mcp_servers(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (server_id, tag_id)
);

-- User Configurations table (for saved configurations)
CREATE TABLE user_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  config_data JSONB NOT NULL,
  is_public BOOLEAN DEFAULT false,
  created_by UUID, -- Will be used when auth is implemented
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX idx_mcp_servers_category ON mcp_servers(category);
CREATE INDEX idx_mcp_servers_is_active ON mcp_servers(is_active);
CREATE INDEX idx_server_tags_server_id ON server_tags(server_id);
CREATE INDEX idx_server_tags_tag_id ON server_tags(tag_id);
CREATE INDEX idx_environment_variables_server_id ON environment_variables(server_id);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_mcp_servers_updated_at BEFORE UPDATE ON mcp_servers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_config_templates_updated_at BEFORE UPDATE ON config_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_configurations_updated_at BEFORE UPDATE ON user_configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE mcp_servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE environment_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_configurations ENABLE ROW LEVEL SECURITY;

-- Public read access for server information
CREATE POLICY "Public servers are viewable by everyone" ON mcp_servers
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public environment variables are viewable by everyone" ON environment_variables
  FOR SELECT USING (true);

CREATE POLICY "Public config templates are viewable by everyone" ON config_templates
  FOR SELECT USING (true);

CREATE POLICY "Public tags are viewable by everyone" ON tags
  FOR SELECT USING (true);

CREATE POLICY "Public server tags are viewable by everyone" ON server_tags
  FOR SELECT USING (true);

CREATE POLICY "Public configurations are viewable by everyone" ON user_configurations
  FOR SELECT USING (is_public = true);