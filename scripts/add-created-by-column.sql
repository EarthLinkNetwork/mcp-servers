-- Add created_by column to mcp_servers table
ALTER TABLE mcp_servers ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Update RLS policies for mcp_servers
DROP POLICY IF EXISTS "Authenticated users can insert servers" ON mcp_servers;
CREATE POLICY "Authenticated users can insert servers" ON mcp_servers
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update own servers" ON mcp_servers;
CREATE POLICY "Users can update own servers" ON mcp_servers
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete own servers" ON mcp_servers;
CREATE POLICY "Users can delete own servers" ON mcp_servers
  FOR DELETE 
  TO authenticated 
  USING (auth.uid() = created_by);

-- Update RLS policies for environment_variables
DROP POLICY IF EXISTS "Users can manage env vars for their servers" ON environment_variables;
CREATE POLICY "Users can manage env vars for their servers" ON environment_variables
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM mcp_servers 
      WHERE mcp_servers.id = environment_variables.server_id 
      AND mcp_servers.created_by = auth.uid()
    )
  );

-- Update RLS policies for config_templates
DROP POLICY IF EXISTS "Users can manage config templates for their servers" ON config_templates;
CREATE POLICY "Users can manage config templates for their servers" ON config_templates
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM mcp_servers 
      WHERE mcp_servers.id = config_templates.server_id 
      AND mcp_servers.created_by = auth.uid()
    )
  );