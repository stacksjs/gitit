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
  hooks?: Hooks
  plugins?: (GitItPlugin | [GitItPlugin, Record<string, any>])[]
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

// Hook Interfaces
export interface ExtractOptions {
  file: string
  cwd: string
  onentry?: (entry: any) => void
}

export interface InstallOptions {
  cwd: string
  silent?: boolean
}

export interface DownloadTemplateResult {
  dir: string
  source: string
  name: string
  tar: string
  version?: string
  subdir?: string
  url?: string
  defaultDir?: string
  headers?: Record<string, string | undefined>
  [key: string]: any
}

export type BeforeDownloadHook = (
  template: string,
  options: DownloadTemplateOptions
) => Promise<{ template: string, options: DownloadTemplateOptions }> | { template: string, options: DownloadTemplateOptions }

export type AfterDownloadHook = (
  result: DownloadTemplateResult
) => Promise<DownloadTemplateResult> | DownloadTemplateResult

export type BeforeExtractHook = (
  result: DownloadTemplateResult,
  extractOptions: ExtractOptions
) => Promise<{ result: DownloadTemplateResult, extractOptions: ExtractOptions }> | { result: DownloadTemplateResult, extractOptions: ExtractOptions }

export type AfterExtractHook = (
  result: DownloadTemplateResult
) => Promise<DownloadTemplateResult> | DownloadTemplateResult

export type BeforeInstallHook = (
  result: DownloadTemplateResult,
  installOptions: InstallOptions
) => Promise<{ result: DownloadTemplateResult, installOptions: InstallOptions }> | { result: DownloadTemplateResult, installOptions: InstallOptions }

export type AfterInstallHook = (
  result: DownloadTemplateResult
) => Promise<DownloadTemplateResult> | DownloadTemplateResult

export interface Hooks {
  beforeDownload?: BeforeDownloadHook
  afterDownload?: AfterDownloadHook
  beforeExtract?: BeforeExtractHook
  afterExtract?: AfterExtractHook
  beforeInstall?: BeforeInstallHook
  afterInstall?: AfterInstallHook
}

// Plugin Interface
export interface GitItPlugin {
  name: string
  version: string
  description?: string
  hooks?: Hooks
  providers?: Record<string, TemplateProvider>
  commands?: Record<string, any> // This would be defined based on your command system
}

export interface DownloadTemplateOptions {
  provider?: string
  force?: boolean
  forceClean?: boolean
  offline?: boolean
  preferOffline?: boolean
  providers?: Record<string, TemplateProvider>
  dir?: string
  registry?: false | string
  cwd?: string
  auth?: string
  install?: boolean
  silent?: boolean
  hooks?: Hooks
}
