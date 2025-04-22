# Offline Mode

Gitit can operate in offline mode, allowing you to continue using templates even when you don't have an internet connection.

## How It Works

When offline mode is enabled, Gitit will:

1. Use locally cached templates instead of trying to fetch them from remote repositories
2. Skip network-dependent operations like update checks
3. Provide feedback about operating in offline mode

## Enabling Offline Mode

You can use Gitit in offline mode in two ways:

### Command Line Flag

Use the `--offline` flag when running Gitit commands:

```bash
gitit new my-project --template stacks --offline
```

### Configuration Option

Set the `offline` option to `true` in your Gitit configuration file:

```typescript
// gitit.config.ts
export default {
  offline: true,
  // other configuration options...
}
```

## Template Caching

For offline mode to work effectively, templates need to be cached locally first. Gitit automatically caches templates when you use them while connected to the internet.

To pre-cache templates for offline use:

```bash
# Run this command while connected to ensure the template is cached
gitit new temp-project --template your-favorite-template

# You can then delete the temp project if needed
```

## Limitations

When operating in offline mode:

- Only previously cached templates will be available
- Template updates won't be fetched
- Features requiring network connectivity (like checking for Gitit updates) will be disabled

## Use Cases

Offline mode is particularly useful for:

- Working during travel or in locations with limited connectivity
- Ensuring consistent template behavior regardless of network status
- Improving performance by skipping network operations
- Workshops and educational settings where network connectivity may be unreliable

## Working Offline

When you need to work without an internet connection, Gitit offers two main offline modes:

### Strict Offline Mode

Use the `--offline` flag to work exclusively with cached templates:

```bash
gitit github:user/repo my-project --offline
```

In this mode, Gitit will:

- Not attempt to connect to the internet
- Only use previously downloaded templates from the cache
- Fail if the requested template is not in the cache

This is useful when you're completely offline and want to ensure no network requests are made.

### Prefer Offline Mode

Use the `--prefer-offline` flag to prioritize cached templates:

```bash
gitit github:user/repo my-project --prefer-offline
```

In this mode, Gitit will:

- First check if the template exists in the cache
- Use the cached version if available
- Only attempt to download the template if it's not found in the cache

This provides the best of both worlds - fast access to cached templates without completely disabling network access.

## Cache Management

Gitit automatically manages a cache of downloaded templates for offline use. By default, templates are cached after the first download.

### Cache Location

Templates are cached in the following locations, depending on your operating system:

- **macOS/Linux**: `~/.cache/gitit` (or `$XDG_CACHE_HOME/gitit` if set)
- **Windows**: Temporary directory (`%TEMP%/gitit`)

### Cache Structure

The cache is organized by provider and template name:

```
<cache-dir>/
├── github/
│   └── user-repo/
│       └── main.tar.gz
│       └── main.tar.gz.json
└── gitlab/
    └── user-repo/
        └── main.tar.gz
        └── main.tar.gz.json
```

Each template is stored as a tarball (`*.tar.gz`) with a corresponding JSON metadata file that includes information like the ETag for cache validation.

## Implementation Details

When you download a template, Gitit:

1. Checks for an existing cached version based on the provider, template name, and version
2. If `preferOffline` is true and a cached version exists, uses it without checking for updates
3. If not in offline mode, performs a HEAD request to check if the template has been updated (using ETags)
4. Downloads the template if it doesn't exist or needs updating
5. Stores the tarball and metadata in the cache directory

## Environment Variables

You can influence the cache behavior using environment variables:

- `DEBUG`: Set to enable detailed debugging output about cache operations
- `XDG_CACHE_HOME`: Override the default cache location on Unix-like systems

## Best Practices for Offline Use

1. **Pre-cache templates** you expect to use offline by running Gitit with them while you have internet access
2. **Use specific tags or versions** to ensure the cached template doesn't change unexpectedly
3. **Combine with the `--shell` option** for a complete offline workflow
4. **For team environments**, consider creating a shared cache directory that all team members can access
