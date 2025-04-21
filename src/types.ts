export interface GitItConfig {
  verbose: boolean
  dir: string
  force: boolean
  forceClean: boolean
  shell: boolean
  install: boolean
  command: string
  auth: string
  cwd: string
  offline: boolean
  preferOffline: boolean
}

export type GitItOptions = Partial<GitItConfig>

export interface GitInfo {
  provider: 'github' | 'gitlab' | 'bitbucket' | 'sourcehut'
  repo: string
  subdir: string
  ref: string
}

export interface TemplateInfo {
  name: string
  tar: string
  version?: string
  subdir?: string
  url?: string
  defaultDir?: string
  headers?: Record<string, string | undefined>

  // Added by giget
  source?: never
  dir?: never

  [key: string]: any
}

export type TemplateProvider = (
  input: string,
  options: { auth?: string },
) => TemplateInfo | Promise<TemplateInfo> | null
