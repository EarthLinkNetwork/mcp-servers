-- Fix RLS policies for config_templates table
-- The current policy using FOR ALL might not work properly for INSERT operations

-- Drop existing policy
DROP POLICY IF EXISTS "Users can manage config templates for their servers" ON config_templates;

-- Create separate policies for different operations
CREATE POLICY "Users can insert config templates for their servers" ON config_templates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM mcp_servers 
      WHERE mcp_servers.id = config_templates.server_id 
      AND mcp_servers.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can view config templates for their servers" ON config_templates
  FOR SELECT test3USING (
    EXISTS (
      SELECT 1 FROM mcp_servers 
      WHERE mcp_servers.id = config_templates.server_id 
      AND mcp_servers.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update config templates for their servers" ON config_templates
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM mcp_servers 
      WHERE mcp_servers.id = config_templates.server_id 
      AND mcp_servers.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete config templates for their servers" ON config_templates
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM mcp_servers 
      WHERE mcp_servers.id = config_templates.server_id 
      AND mcp_servers.created_by = auth.uid()
    )
  );

-- Also fix environment_variables policies for consistency
DROP POLICY IF EXISTS "Users can manage env vars for their servers" ON environment_variables;

CREATE POLICY "Users can insert env vars for their servers" ON environment_variables
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM mcp_servers 
      WHERE mcp_servers.id = environment_variables.server_id 
      AND mcp_servers.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can view env vars for their servers" ON environment_variables
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM mcp_servers 
      WHERE mcp_servers.id = environment_variables.server_id 
      AND mcp_servers.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update env vars for their servers" ON environment_variables
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM mcp_servers 
      WHERE mcp_servers.id = environment_variables.server_id 
      AND mcp_servers.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete env vars for their servers" ON environment_variables
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM mcp_servers 
      WHERE mcp_servers.id = environment_variables.server_id 
      AND mcp_servers.created_by = auth.uid()
    )
  );