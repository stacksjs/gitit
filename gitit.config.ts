import type { GitItConfig } from './src/types'
import process from 'node:process'

// Configuration for gitit
const config: GitItConfig = {
  // Standard options
  verbose: true,
  dir: './',
  force: false,
  forceClean: false,
  shell: false,
  install: true,
  command: '',
  auth: '',
  cwd: process.cwd(),
  offline: false,
  preferOffline: false,

  hooks: {
    // Before downloading a template
    beforeDownload: (template, options) => {
      console.log(`About to download template: ${template}`)
      return { template, options }
    },

    // After dependencies are installed
    afterInstall: async (result) => {
      console.log('Dependencies installed, running custom logic...')
      return result
    },
  },
}

export default config
