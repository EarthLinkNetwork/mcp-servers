-- Enable email auth
-- This should be run in Supabase Dashboard > Authentication > Settings

-- 1. Go to Authentication > Settings in Supabase Dashboard
-- 2. Make sure "Enable email confirmations" is enabled (optional)
-- 3. Set "Site URL" to your domain (http://localhost:3001 for development)

-- Update existing tables to reference auth.users
ALTER TABLE mcp_servers ADD COLUMN created_by UUID REFERENCES auth.users(id);
ALTER TABLE user_configurations ALTER COLUMN created_by SET NOT NULL;
ALTER TABLE user_configurations ADD CONSTRAINT user_configurations_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES auth.users(id);

-- Update RLS policies to allow authenticated users to add servers
DROP POLICY IF EXISTS "Users can insert their own servers" ON mcp_servers;
CREATE POLICY "Users can insert their own servers" ON mcp_servers
  FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their own servers" ON mcp_servers;  
CREATE POLICY "Users can update their own servers" ON mcp_servers
  FOR UPDATE USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete their own servers" ON mcp_servers;
CREATE POLICY "Users can delete their own servers" ON mcp_servers
  FOR DELETE USING (auth.uid() = created_by);

-- Allow authenticated users to manage environment variables for their servers
DROP POLICY IF EXISTS "Users can manage env vars for their servers" ON environment_variables;
CREATE POLICY "Users can manage env vars for their servers" ON environment_variables
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM mcp_servers 
      WHERE mcp_servers.id = environment_variables.server_id 
      AND mcp_servers.created_by = auth.uid()
    )
  );

-- Allow authenticated users to manage config templates for their servers  
DROP POLICY IF EXISTS "Users can manage config templates for their servers" ON config_templates;
CREATE POLICY "Users can manage config templates for their servers" ON config_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM mcp_servers 
      WHERE mcp_servers.id = config_templates.server_id 
      AND mcp_servers.created_by = auth.uid()
    )
  );

-- User configurations policies
DROP POLICY IF EXISTS "Users can manage their own configurations" ON user_configurations;
CREATE POLICY "Users can manage their own configurations" ON user_configurations
  FOR ALL USING (auth.uid() = created_by);