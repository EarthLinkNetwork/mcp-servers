-- Insert initial MCP servers
INSERT INTO mcp_servers (name, display_name, description, category, package_name, repository, icon, is_official) VALUES
('clickup', 'ClickUp', 'Integrate ClickUp task management with Claude', 'productivity', '@taazkareem/clickup-mcp-server', 'https://github.com/taazkareem/clickup-mcp-server', '📋', false),
('supabase', 'Supabase', 'Connect to Supabase databases and services', 'database', '@supabase/mcp-server-supabase', 'https://github.com/supabase/mcp-server-supabase', '🗄️', true),
('slack', 'Slack', 'Access Slack workspaces and channels', 'communication', '@modelcontextprotocol/server-slack', 'https://github.com/modelcontextprotocol/servers/tree/main/src/slack', '💬', true),
('github', 'GitHub', 'Interact with GitHub repositories and issues', 'development', '@modelcontextprotocol/server-github', 'https://github.com/modelcontextprotocol/servers/tree/main/src/github', '🐙', true),
('google-drive', 'Google Drive', 'Access and manage Google Drive files', 'productivity', '@modelcontextprotocol/server-gdrive', 'https://github.com/modelcontextprotocol/servers/tree/main/src/gdrive', '📁', true),
('postgres', 'PostgreSQL', 'Connect to PostgreSQL databases', 'database', '@modelcontextprotocol/server-postgres', 'https://github.com/modelcontextprotocol/servers/tree/main/src/postgres', '🐘', true),
('notion', 'Notion', 'Access Notion workspaces and pages', 'productivity', '@modelcontextprotocol/server-notion', 'https://github.com/modelcontextprotocol/servers/tree/main/src/notion', '📝', true),
('jira', 'Jira', 'Manage Jira issues and projects', 'productivity', '@modelcontextprotocol/server-jira', 'https://github.com/modelcontextprotocol/servers/tree/main/src/jira', '🎯', true);

-- Get server IDs for foreign key references
DO $$
DECLARE
  clickup_id UUID;
  supabase_id UUID;
  slack_id UUID;
  github_id UUID;
  gdrive_id UUID;
  postgres_id UUID;
  notion_id UUID;
  jira_id UUID;
BEGIN
  SELECT id INTO clickup_id FROM mcp_servers WHERE name = 'clickup';
  SELECT id INTO supabase_id FROM mcp_servers WHERE name = 'supabase';
  SELECT id INTO slack_id FROM mcp_servers WHERE name = 'slack';
  SELECT id INTO github_id FROM mcp_servers WHERE name = 'github';
  SELECT id INTO gdrive_id FROM mcp_servers WHERE name = 'google-drive';
  SELECT id INTO postgres_id FROM mcp_servers WHERE name = 'postgres';
  SELECT id INTO notion_id FROM mcp_servers WHERE name = 'notion';
  SELECT id INTO jira_id FROM mcp_servers WHERE name = 'jira';

  -- Insert environment variables
  INSERT INTO environment_variables (server_id, name, description, required, type, example) VALUES
  -- ClickUp
  (clickup_id, 'CLICKUP_API_KEY', 'Your ClickUp API key', true, 'api_key', 'pk_12345678_ABCDEFGHIJKLMNOP'),
  (clickup_id, 'CLICKUP_WORKSPACE_ID', 'Your ClickUp workspace ID', true, 'string', '12345678'),
  
  -- Supabase
  (supabase_id, 'SUPABASE_URL', 'Your Supabase project URL', true, 'url', 'https://your-project.supabase.co'),
  (supabase_id, 'SUPABASE_SERVICE_ROLE_KEY', 'Your Supabase service role key', true, 'api_key', '***REMOVED***'),
  
  -- Slack
  (slack_id, 'SLACK_BOT_TOKEN', 'Your Slack bot user OAuth token', true, 'api_key', 'xoxb-YOUR-BOT-TOKEN-HERE'),
  (slack_id, 'SLACK_USER_TOKEN', 'Your Slack user OAuth token (optional)', false, 'api_key', 'xoxp-YOUR-USER-TOKEN-HERE'),
  
  -- GitHub
  (github_id, 'GITHUB_PERSONAL_ACCESS_TOKEN', 'Your GitHub personal access token', true, 'api_key', 'ghp_YOUR-GITHUB-TOKEN-HERE'),
  
  -- Google Drive
  (gdrive_id, 'GOOGLE_DRIVE_CLIENT_ID', 'OAuth 2.0 Client ID', true, 'string', NULL),
  (gdrive_id, 'GOOGLE_DRIVE_CLIENT_SECRET', 'OAuth 2.0 Client Secret', true, 'api_key', NULL),
  
  -- PostgreSQL
  (postgres_id, 'POSTGRES_CONNECTION_STRING', 'PostgreSQL connection string', true, 'string', 'postgresql://user:password@localhost:5432/dbname'),
  
  -- Notion
  (notion_id, 'NOTION_API_KEY', 'Notion integration token', true, 'api_key', 'secret_abcdefghijklmnopqrstuvwxyz'),
  
  -- Jira
  (jira_id, 'JIRA_URL', 'Your Jira instance URL', true, 'url', 'https://your-domain.atlassian.net'),
  (jira_id, 'JIRA_EMAIL', 'Your Jira account email', true, 'string', NULL),
  (jira_id, 'JIRA_API_TOKEN', 'Your Jira API token', true, 'api_key', NULL);

  -- Insert config templates
  INSERT INTO config_templates (server_id, args, env) VALUES
  (clickup_id, '[]'::jsonb, '{"CLICKUP_API_KEY": "${CLICKUP_API_KEY}", "CLICKUP_WORKSPACE_ID": "${CLICKUP_WORKSPACE_ID}"}'::jsonb),
  (supabase_id, '[]'::jsonb, '{"SUPABASE_URL": "${SUPABASE_URL}", "SUPABASE_SERVICE_ROLE_KEY": "${SUPABASE_SERVICE_ROLE_KEY}"}'::jsonb),
  (slack_id, '[]'::jsonb, '{"SLACK_BOT_TOKEN": "${SLACK_BOT_TOKEN}", "SLACK_USER_TOKEN": "${SLACK_USER_TOKEN}"}'::jsonb),
  (github_id, '[]'::jsonb, '{"GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"}'::jsonb),
  (gdrive_id, '[]'::jsonb, '{"GOOGLE_DRIVE_CLIENT_ID": "${GOOGLE_DRIVE_CLIENT_ID}", "GOOGLE_DRIVE_CLIENT_SECRET": "${GOOGLE_DRIVE_CLIENT_SECRET}"}'::jsonb),
  (postgres_id, '["${POSTGRES_CONNECTION_STRING}"]'::jsonb, '{}'::jsonb),
  (notion_id, '[]'::jsonb, '{"NOTION_API_KEY": "${NOTION_API_KEY}"}'::jsonb),
  (jira_id, '[]'::jsonb, '{"JIRA_URL": "${JIRA_URL}", "JIRA_EMAIL": "${JIRA_EMAIL}", "JIRA_API_TOKEN": "${JIRA_API_TOKEN}"}'::jsonb);
END $$;

-- Insert tags
INSERT INTO tags (name) VALUES
('tasks'),
('project-management'),
('productivity'),
('database'),
('backend'),
('realtime'),
('chat'),
('communication'),
('team'),
('git'),
('version-control'),
('development'),
('storage'),
('documents'),
('cloud'),
('sql'),
('postgresql'),
('notes'),
('documentation'),
('knowledge-base'),
('issues'),
('agile');

-- Associate tags with servers
DO $$
DECLARE
  server_rec RECORD;
  tag_rec RECORD;
BEGIN
  -- ClickUp tags
  FOR server_rec IN SELECT id FROM mcp_servers WHERE name = 'clickup' LOOP
    FOR tag_rec IN SELECT id FROM tags WHERE name IN ('tasks', 'project-management', 'productivity') LOOP
      INSERT INTO server_tags (server_id, tag_id) VALUES (server_rec.id, tag_rec.id);
    END LOOP;
  END LOOP;

  -- Supabase tags
  FOR server_rec IN SELECT id FROM mcp_servers WHERE name = 'supabase' LOOP
    FOR tag_rec IN SELECT id FROM tags WHERE name IN ('database', 'backend', 'realtime') LOOP
      INSERT INTO server_tags (server_id, tag_id) VALUES (server_rec.id, tag_rec.id);
    END LOOP;
  END LOOP;

  -- Slack tags
  FOR server_rec IN SELECT id FROM mcp_servers WHERE name = 'slack' LOOP
    FOR tag_rec IN SELECT id FROM tags WHERE name IN ('chat', 'communication', 'team') LOOP
      INSERT INTO server_tags (server_id, tag_id) VALUES (server_rec.id, tag_rec.id);
    END LOOP;
  END LOOP;

  -- GitHub tags
  FOR server_rec IN SELECT id FROM mcp_servers WHERE name = 'github' LOOP
    FOR tag_rec IN SELECT id FROM tags WHERE name IN ('git', 'version-control', 'development') LOOP
      INSERT INTO server_tags (server_id, tag_id) VALUES (server_rec.id, tag_rec.id);
    END LOOP;
  END LOOP;

  -- Google Drive tags
  FOR server_rec IN SELECT id FROM mcp_servers WHERE name = 'google-drive' LOOP
    FOR tag_rec IN SELECT id FROM tags WHERE name IN ('storage', 'documents', 'cloud') LOOP
      INSERT INTO server_tags (server_id, tag_id) VALUES (server_rec.id, tag_rec.id);
    END LOOP;
  END LOOP;

  -- PostgreSQL tags
  FOR server_rec IN SELECT id FROM mcp_servers WHERE name = 'postgres' LOOP
    FOR tag_rec IN SELECT id FROM tags WHERE name IN ('database', 'sql', 'postgresql') LOOP
      INSERT INTO server_tags (server_id, tag_id) VALUES (server_rec.id, tag_rec.id);
    END LOOP;
  END LOOP;

  -- Notion tags
  FOR server_rec IN SELECT id FROM mcp_servers WHERE name = 'notion' LOOP
    FOR tag_rec IN SELECT id FROM tags WHERE name IN ('notes', 'documentation', 'knowledge-base') LOOP
      INSERT INTO server_tags (server_id, tag_id) VALUES (server_rec.id, tag_rec.id);
    END LOOP;
  END LOOP;

  -- Jira tags
  FOR server_rec IN SELECT id FROM mcp_servers WHERE name = 'jira' LOOP
    FOR tag_rec IN SELECT id FROM tags WHERE name IN ('issues', 'project-management', 'agile') LOOP
      INSERT INTO server_tags (server_id, tag_id) VALUES (server_rec.id, tag_rec.id);
    END LOOP;
  END LOOP;
END $$;