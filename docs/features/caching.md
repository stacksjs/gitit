# Caching

gitit includes a powerful caching system that speeds up template downloads and enables offline usage. This guide covers how to configure and optimize the cache.

## How Caching Works

When you download a template, gitit:

1. Checks if a cached version exists
2. If cached and valid, uses the cached version
3. If not cached or expired, downloads fresh
4. Stores the download in the cache for future use

## Cache Location

The cache is stored in your system's cache directory:

| Platform | Location |
|----------|----------|
| macOS | `~/Library/Caches/gitit` |
| Linux | `~/.cache/gitit` |
| Windows | `%LOCALAPPDATA%\gitit\Cache` |

## Cache Modes

### Prefer Offline

Use cached version if available, otherwise download:

```bash
gitit stacksjs/starter --prefer-offline
```

```typescript
await downloadTemplate('stacksjs/starter', {
  preferOffline: true,
})
```

### Offline Only

Only use cached version, fail if not cached:

```bash
gitit stacksjs/starter --offline
```

```typescript
await downloadTemplate('stacksjs/starter', {
  offline: true,
})
```

### Force Fresh

Always download fresh, ignoring cache:

```bash
gitit stacksjs/starter --no-cache
```

```typescript
await downloadTemplate('stacksjs/starter', {
  cache: false,
})
```

## Cache Configuration

### Setting Cache Directory

```bash
# Via environment variable
export GITIT_CACHE_DIR=/custom/cache/path
gitit stacksjs/starter
```

```typescript
await downloadTemplate('stacksjs/starter', {
  cacheDir: '/custom/cache/path',
})
```

### Cache TTL (Time To Live)

Configure how long cached templates remain valid:

```typescript
// gitit.config.ts
export default {
  cache: {
    ttl: 3600000, // 1 hour in milliseconds
  },
}
```

## Managing the Cache

### View Cache Contents

```bash
# List cached templates
gitit cache list

# Show cache size
gitit cache size
```

### Clear Cache

```bash
# Clear all cached templates
gitit cache clear

# Clear specific template
gitit cache clear stacksjs/starter

# Clear templates older than 7 days
gitit cache prune --days 7
```

### Programmatic Cache Management

```typescript
import { cache } from 'gitit'

// List cached templates
const templates = await cache.list()

// Get cache size
const size = await cache.size()

// Clear all
await cache.clear()

// Clear specific
await cache.remove('stacksjs/starter')

// Prune old entries
await cache.prune({ maxAge: 7 _ 24 _ 60 _ 60 _ 1000 })
```

## Cache Strategies

### Development Workflow

For rapid iteration during development:

```bash
# First download - caches the template
gitit stacksjs/starter my-project

# Subsequent downloads - use cache
gitit stacksjs/starter another-project --prefer-offline
```

### CI/CD Optimization

Speed up CI builds with caching:

```yaml
# GitHub Actions

- name: Cache gitit templates

  uses: actions/cache@v4
  with:
    path: ~/.cache/gitit
    key: gitit-${{ hashFiles('**/package.json') }}

- name: Download template

  run: gitit stacksjs/starter ./app --prefer-offline
```

### Air-Gapped Environments

Pre-populate cache for offline use:

```bash
# On connected machine
gitit stacksjs/starter --cache-only

# Copy cache to air-gapped machine
rsync -av ~/.cache/gitit user@airgapped:~/.cache/

# On air-gapped machine
gitit stacksjs/starter ./project --offline
```

## Cache Integrity

gitit verifies cached templates using checksums:

```typescript
await downloadTemplate('stacksjs/starter', {
  verify: true, // Verify cache integrity (default: true)
})
```

If verification fails, the template is re-downloaded automatically.

## Performance Tips

1. **Enable prefer-offline**: Significantly faster for repeated downloads
2. **Use specific versions**: Cached by version for better hit rate
3. **CI/CD caching**: Persist cache between builds
4. **Prune regularly**: Remove old entries to save disk space
5. **SSD storage**: Place cache on SSD for faster access

## Cache Statistics

View download and cache statistics:

```bash
# Show hit/miss statistics
gitit stats

# Output
# Cache Statistics
# Total downloads: 150
# Cache hits: 120 (80%)
# Cache misses: 30 (20%)
# Cache size: 245 MB
# Oldest entry: 30 days ago
```

## Troubleshooting

### Cache Not Working

```bash
# Verify cache directory exists
ls -la ~/.cache/gitit

# Check permissions
chmod -R 755 ~/.cache/gitit

# Reset cache
rm -rf ~/.cache/gitit
```

### Stale Cache

```bash
# Force fresh download
gitit stacksjs/starter --no-cache

# Or clear and re-download
gitit cache clear stacksjs/starter
gitit stacksjs/starter
```

## Related

- [Template Downloads](/features/template-downloads) - Basic download functionality
- [Performance](/advanced/performance) - Optimization techniques
- [CI/CD Integration](/advanced/ci-cd) - Automated workflows
