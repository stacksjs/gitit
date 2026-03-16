# Configuration

Gitit can be configured using a `gitit.config.ts` _(or `gitit.config.js`)_ file and it will be automatically loaded when running the `gitit` command.

```ts
// gitit.config.{ts,js}
import type { GitItConfig } from '@stacksjs/gitit'

const config: GitItConfig = {
  /**

   _ Whether to enable verbose logging.
   _ Default: true

   */
  verbose: true,

  /**

   _ Default directory to clone templates to if not specified.
   _ Default: './'

   */
  dir: './',

  /**

   _ Whether to clone to existing directory even if it exists.
   _ Default: false

   */
  force: false,

  /**

   _ Whether to remove any existing directory or file recursively before cloning.
   _ Default: false

   */
  forceClean: false,

  /**

   _ Whether to open a new shell with current working directory after cloning.
   _ Default: false

   */
  shell: false,

  /**

   _ Whether to install dependencies after cloning.
   _ Default: true

   */
  install: true,

  /**

   _ Custom command to run after template is cloned.
   _ Default: ''

   */
  command: '',

  /**

   _ Custom Authorization token to use for downloading templates.
   _ Can be overridden with `GITIT_AUTH` environment variable.
   _ Default: ''

   _/
  auth: '',

  /**

   _ Set current working directory to resolve dirs relative to it.
   _ Default: process.cwd()

   */
  cwd: process.cwd(),

  /**

   _ Whether to use offline mode (don't attempt to download and use cached version).
   _ Default: false

   */
  offline: false,

  /**

   _ Whether to prefer offline mode (use cache if exists otherwise try to download).
   _ Default: false

   */
  preferOffline: false,
}

export default config
```

Then run:

```bash
gitit github:user/repo my-project
```

To learn more, head over to the [documentation](https://gitit.sh/).
