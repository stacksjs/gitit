# Configuration

Gitit can be configured using a `gitit.config.ts` _(or `gitit.config.js`)_ file and it will be automatically loaded when running the `gitit` command.

```ts
// gitit.config.{ts,js}
import type { GitItConfig } from '@stacksjs/gitit'

const config: GitItConfig = {
  /**
   * Whether to enable verbose logging.
   * Default: true
   */
  verbose: true,

  /**
   * Default directory to clone templates to if not specified.
   * Default: './'
   */
  dir: './',

  /**
   * Whether to clone to existing directory even if it exists.
   * Default: false
   */
  force: false,

  /**
   * Whether to remove any existing directory or file recursively before cloning.
   * Default: false
   */
  forceClean: false,

  /**
   * Whether to open a new shell with current working directory after cloning.
   * Default: false
   */
  shell: false,

  /**
   * Whether to install dependencies after cloning.
   * Default: true
   */
  install: true,

  /**
   * Custom command to run after template is cloned.
   * Default: ''
   */
  command: '',

  /**
   * Custom Authorization token to use for downloading templates.
   * Can be overridden with `GITIT_AUTH` environment variable.
   * Default: ''
   */
  auth: '',

  /**
   * Set current working directory to resolve dirs relative to it.
   * Default: process.cwd()
   */
  cwd: process.cwd(),

  /**
   * Whether to use offline mode (don't attempt to download and use cached version).
   * Default: false
   */
  offline: false,

  /**
   * Whether to prefer offline mode (use cache if exists otherwise try to download).
   * Default: false
   */
  preferOffline: false,
}

export default config
```

_Then run:_

```bash
gitit template github:user/repo my-project
```

To learn more, head over to the [documentation](https://gitit.sh/).
