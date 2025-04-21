import type { GitItConfig } from './types'
import process from 'node:process'
import { loadConfig } from 'bunfig'

export const defaultConfig: GitItConfig = {
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
}

// eslint-disable-next-line antfu/no-top-level-await
export const config: GitItConfig = await loadConfig({
  name: 'gitit',
  defaultConfig,
})
