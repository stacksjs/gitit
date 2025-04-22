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

  // The hooks system allows you to customize the template download process
  // Hooks are called at specific points in the template download and extraction workflow
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

    // Other available hooks:
    // - afterDownload: Called after template has been downloaded
    // - beforeExtract: Called before template is extracted
    // - afterExtract: Called after template is extracted
    // - beforeInstall: Called before dependencies are installed
  },

  // You can also register plugins for even more extensibility
  // plugins: [
  //   // A plugin with no options
  //   myCustomPlugin,
  //
  //   // A plugin with options
  //   [anotherPlugin, { customOption: true }]
  // ]
}

export default config
