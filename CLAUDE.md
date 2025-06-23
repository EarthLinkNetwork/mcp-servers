# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a repository for MCP (Model Context Protocol) servers. MCP is a protocol that enables AI models to interact with external systems and data sources through standardized server implementations.

## Development Status

This repository is in its initial setup phase. When implementing MCP servers, consider:

1. Each server should be in its own directory with clear separation of concerns
2. Follow the MCP specification for server implementation
3. Include proper error handling and logging for all server operations
4. Document each server's capabilities and configuration options

## Common Development Tasks

As MCP servers are added to this repository, typical commands will include:

- Installation: Dependencies will vary by implementation language
- Running servers: Each server should have its own startup script or command
- Testing: Implement tests for each server's protocol compliance and functionality

## Architecture Considerations

When implementing MCP servers:

1. **Protocol Compliance**: Ensure all servers properly implement the MCP protocol specification
2. **Configuration**: Use environment variables or configuration files for server settings
3. **Security**: Implement proper authentication and authorization mechanisms
4. **Logging**: Include structured logging for debugging and monitoring
5. **Error Handling**: Provide clear error messages and graceful failure modes

## MCP Server Structure

Each MCP server implementation should typically include:
- Server initialization and configuration
- Request/response handlers for MCP protocol methods
- Resource management and cleanup
- Documentation of supported capabilities