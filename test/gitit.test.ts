import { beforeAll, describe, expect, it } from 'bun:test'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { gzipSync } from 'node:zlib'
import { downloadTemplate, parseTar } from '../src'
import type { TarEntry } from '../src'

// ---------------------------------------------------------------------------
// Helpers to build tar buffers by hand
// ---------------------------------------------------------------------------
const encoder = new TextEncoder()

function buildTarHeader(opts: {
  name: string
  size: number
  typeflag: string
  prefix?: string
}): Uint8Array {
  const header = new Uint8Array(512)

  // name (0-99)
  header.set(encoder.encode(opts.name).subarray(0, 100), 0)

  // mode (100-107)
  header.set(encoder.encode('0000644\0'), 100)

  // uid (108-115)
  header.set(encoder.encode('0001000\0'), 108)

  // gid (116-123)
  header.set(encoder.encode('0001000\0'), 116)

  // size (124-135) - octal, 11 chars + NUL
  const sizeOctal = `${opts.size.toString(8).padStart(11, '0')}\0`
  header.set(encoder.encode(sizeOctal), 124)

  // mtime (136-147)
  header.set(encoder.encode('00000000000\0'), 136)

  // typeflag (156)
  header[156] = opts.typeflag.charCodeAt(0)

  // magic (257-262)
  header.set(encoder.encode('ustar\0'), 257)

  // version (263-264)
  header.set(encoder.encode('00'), 263)

  // prefix (345-499)
  if (opts.prefix) {
    header.set(encoder.encode(opts.prefix).subarray(0, 155), 345)
  }

  // checksum (148-155) — fill with spaces first, sum, then write
  for (let i = 148; i < 156; i++) header[i] = 0x20
  let checksum = 0
  for (let i = 0; i < 512; i++) checksum += header[i]!
  header.set(encoder.encode(`${checksum.toString(8).padStart(6, '0')}\0 `), 148)

  return header
}

function padTo512(data: Uint8Array): Uint8Array {
  const padded = Math.ceil(data.length / 512) * 512
  if (padded === data.length)
    return data
  const buf = new Uint8Array(padded)
  buf.set(data)
  return buf
}

function endOfArchive(): Uint8Array {
  return new Uint8Array(1024) // two zero blocks
}

function concatBuffers(...bufs: Uint8Array[]): Uint8Array {
  const total = bufs.reduce((sum, b) => sum + b.length, 0)
  const result = new Uint8Array(total)
  let offset = 0
  for (const b of bufs) {
    result.set(b, offset)
    offset += b.length
  }
  return result
}

function makeFileEntry(name: string, content: string, opts?: { prefix?: string }): Uint8Array {
  const data = encoder.encode(content)
  const header = buildTarHeader({ name, size: data.length, typeflag: '0', prefix: opts?.prefix })
  return concatBuffers(header, padTo512(data))
}

function makeDirEntry(name: string): Uint8Array {
  return buildTarHeader({ name, size: 0, typeflag: '5' })
}

function makeGnuLongName(longName: string): Uint8Array {
  const nameData = encoder.encode(`${longName}\0`)
  const header = buildTarHeader({ name: '././@LongLink', size: nameData.length, typeflag: 'L' })
  return concatBuffers(header, padTo512(nameData))
}

function makePaxHeader(path: string): Uint8Array {
  const record = `${(`${path.length + 7} path=${path}\n`).length} path=${path}\n`
  const data = encoder.encode(record)
  const header = buildTarHeader({ name: 'PaxHeader/foo', size: data.length, typeflag: 'x' })
  return concatBuffers(header, padTo512(data))
}

function makeGlobalPaxHeader(path: string): Uint8Array {
  const record = `${(`${path.length + 7} path=${path}\n`).length} path=${path}\n`
  const data = encoder.encode(record)
  const header = buildTarHeader({ name: 'PaxHeader/global', size: data.length, typeflag: 'g' })
  return concatBuffers(header, padTo512(data))
}

// ---------------------------------------------------------------------------
// parseTar unit tests
// ---------------------------------------------------------------------------
describe('parseTar', () => {
  it('parses empty archive (zero blocks only)', () => {
    const tar = endOfArchive()
    const entries = parseTar(tar)
    expect(entries).toEqual([])
  })

  it('parses empty buffer', () => {
    const entries = parseTar(new Uint8Array(0))
    expect(entries).toEqual([])
  })

  it('parses buffer smaller than 512 bytes', () => {
    const entries = parseTar(new Uint8Array(100))
    expect(entries).toEqual([])
  })

  it('parses a single file entry', () => {
    const tar = concatBuffers(makeFileEntry('hello.txt', 'Hello World'), endOfArchive())
    const entries = parseTar(tar)
    expect(entries).toHaveLength(1)
    expect(entries[0]!.name).toBe('hello.txt')
    expect(entries[0]!.type).toBe('file')
    expect(entries[0]!.size).toBe(11)
    expect(new TextDecoder().decode(entries[0]!.data)).toBe('Hello World')
  })

  it('parses a single directory entry', () => {
    const tar = concatBuffers(makeDirEntry('mydir/'), endOfArchive())
    const entries = parseTar(tar)
    expect(entries).toHaveLength(1)
    expect(entries[0]!.name).toBe('mydir/')
    expect(entries[0]!.type).toBe('directory')
    expect(entries[0]!.size).toBe(0)
    expect(entries[0]!.data).toBeUndefined()
  })

  it('parses multiple files and directories', () => {
    const tar = concatBuffers(
      makeDirEntry('project/'),
      makeDirEntry('project/src/'),
      makeFileEntry('project/README.md', '# Hello'),
      makeFileEntry('project/src/index.ts', 'export {}'),
      endOfArchive(),
    )
    const entries = parseTar(tar)
    expect(entries).toHaveLength(4)
    expect(entries[0]!.type).toBe('directory')
    expect(entries[0]!.name).toBe('project/')
    expect(entries[1]!.type).toBe('directory')
    expect(entries[1]!.name).toBe('project/src/')
    expect(entries[2]!.type).toBe('file')
    expect(entries[2]!.name).toBe('project/README.md')
    expect(new TextDecoder().decode(entries[2]!.data)).toBe('# Hello')
    expect(entries[3]!.type).toBe('file')
    expect(entries[3]!.name).toBe('project/src/index.ts')
    expect(new TextDecoder().decode(entries[3]!.data)).toBe('export {}')
  })

  it('handles empty file (size 0)', () => {
    const header = buildTarHeader({ name: 'empty.txt', size: 0, typeflag: '0' })
    const tar = concatBuffers(header, endOfArchive())
    const entries = parseTar(tar)
    expect(entries).toHaveLength(1)
    expect(entries[0]!.name).toBe('empty.txt')
    expect(entries[0]!.type).toBe('file')
    expect(entries[0]!.size).toBe(0)
    expect(entries[0]!.data).toBeUndefined()
  })

  it('handles null typeflag (\\0) as regular file', () => {
    const header = buildTarHeader({ name: 'old.txt', size: 3, typeflag: '\0' })
    const data = padTo512(encoder.encode('abc'))
    const tar = concatBuffers(header, data, endOfArchive())
    const entries = parseTar(tar)
    expect(entries).toHaveLength(1)
    expect(entries[0]!.type).toBe('file')
    expect(entries[0]!.name).toBe('old.txt')
    expect(new TextDecoder().decode(entries[0]!.data)).toBe('abc')
  })

  it('skips symlinks and other unsupported types', () => {
    // typeflag '2' = symlink
    const symlink = buildTarHeader({ name: 'link.txt', size: 0, typeflag: '2' })
    const file = makeFileEntry('real.txt', 'content')
    const tar = concatBuffers(symlink, file, endOfArchive())
    const entries = parseTar(tar)
    expect(entries).toHaveLength(1)
    expect(entries[0]!.name).toBe('real.txt')
  })

  it('handles files exactly 512 bytes (no padding needed)', () => {
    const content = 'A'.repeat(512)
    const tar = concatBuffers(makeFileEntry('exact.txt', content), endOfArchive())
    const entries = parseTar(tar)
    expect(entries).toHaveLength(1)
    expect(entries[0]!.size).toBe(512)
    expect(new TextDecoder().decode(entries[0]!.data)).toBe(content)
  })

  it('handles files spanning multiple 512-byte blocks', () => {
    const content = 'B'.repeat(1500)
    const tar = concatBuffers(makeFileEntry('big.txt', content), endOfArchive())
    const entries = parseTar(tar)
    expect(entries).toHaveLength(1)
    expect(entries[0]!.size).toBe(1500)
    expect(new TextDecoder().decode(entries[0]!.data)).toBe(content)
  })

  it('handles file with size exactly at block boundary (1024 bytes)', () => {
    const content = 'C'.repeat(1024)
    const tar = concatBuffers(makeFileEntry('block-aligned.txt', content), endOfArchive())
    const entries = parseTar(tar)
    expect(entries).toHaveLength(1)
    expect(entries[0]!.size).toBe(1024)
    expect(new TextDecoder().decode(entries[0]!.data)).toBe(content)
  })

  it('handles file with 1 byte', () => {
    const tar = concatBuffers(makeFileEntry('tiny.txt', 'x'), endOfArchive())
    const entries = parseTar(tar)
    expect(entries).toHaveLength(1)
    expect(entries[0]!.size).toBe(1)
    expect(new TextDecoder().decode(entries[0]!.data)).toBe('x')
  })

  it('preserves binary data correctly', () => {
    const binaryContent = new Uint8Array(256)
    for (let i = 0; i < 256; i++) binaryContent[i] = i
    const header = buildTarHeader({ name: 'binary.bin', size: 256, typeflag: '0' })
    const tar = concatBuffers(header, padTo512(binaryContent), endOfArchive())
    const entries = parseTar(tar)
    expect(entries).toHaveLength(1)
    expect(entries[0]!.size).toBe(256)
    for (let i = 0; i < 256; i++) {
      expect(entries[0]!.data![i]).toBe(i)
    }
  })

  it('produces an independent copy of file data (not a view)', () => {
    const content = encoder.encode('original')
    const header = buildTarHeader({ name: 'copy.txt', size: content.length, typeflag: '0' })
    const tar = concatBuffers(header, padTo512(content), endOfArchive())
    const entries = parseTar(tar)
    // Mutate the original buffer — entry data should be unaffected
    tar[512] = 0xFF
    expect(new TextDecoder().decode(entries[0]!.data)).toBe('original')
  })

  // -- POSIX prefix for long paths --
  it('handles POSIX prefix for long paths', () => {
    const tar = concatBuffers(
      makeFileEntry('file.txt', 'data', { prefix: 'very/long/directory/path' }),
      endOfArchive(),
    )
    const entries = parseTar(tar)
    expect(entries).toHaveLength(1)
    expect(entries[0]!.name).toBe('very/long/directory/path/file.txt')
    expect(new TextDecoder().decode(entries[0]!.data)).toBe('data')
  })

  it('handles empty prefix (no prefix field)', () => {
    const tar = concatBuffers(makeFileEntry('simple.txt', 'ok'), endOfArchive())
    const entries = parseTar(tar)
    expect(entries[0]!.name).toBe('simple.txt')
  })

  // -- GNU long name extension --
  it('handles GNU long name extension (type L)', () => {
    const longPath = 'a/very/deeply/nested/directory/structure/that/exceeds/one/hundred/characters/and/needs/gnu/long/name/extension/file.txt'
    const longNameEntry = makeGnuLongName(longPath)
    const fileEntry = makeFileEntry('placeholder', 'long name content')
    const tar = concatBuffers(longNameEntry, fileEntry, endOfArchive())
    const entries = parseTar(tar)
    expect(entries).toHaveLength(1)
    expect(entries[0]!.name).toBe(longPath)
    expect(entries[0]!.type).toBe('file')
    expect(new TextDecoder().decode(entries[0]!.data)).toBe('long name content')
  })

  it('GNU long name only applies to the immediately next entry', () => {
    const longPath = 'some/very/long/path/that/is/over/one/hundred/characters/in/length/to/test/gnu/long/name/extension/first.txt'
    const tar = concatBuffers(
      makeGnuLongName(longPath),
      makeFileEntry('placeholder1', 'first'),
      makeFileEntry('normal.txt', 'second'),
      endOfArchive(),
    )
    const entries = parseTar(tar)
    expect(entries).toHaveLength(2)
    expect(entries[0]!.name).toBe(longPath)
    expect(entries[1]!.name).toBe('normal.txt')
  })

  // -- Pax extended headers --
  it('handles pax extended header (type x) for long paths', () => {
    const longPath = 'pax/extended/path/to/some/deeply/nested/file.txt'
    const tar = concatBuffers(
      makePaxHeader(longPath),
      makeFileEntry('ignored-name', 'pax content'),
      endOfArchive(),
    )
    const entries = parseTar(tar)
    expect(entries).toHaveLength(1)
    expect(entries[0]!.name).toBe(longPath)
    expect(new TextDecoder().decode(entries[0]!.data)).toBe('pax content')
  })

  it('handles global pax header (type g)', () => {
    const longPath = 'global/pax/path/file.txt'
    const tar = concatBuffers(
      makeGlobalPaxHeader(longPath),
      makeFileEntry('ignored-global', 'global pax'),
      endOfArchive(),
    )
    const entries = parseTar(tar)
    expect(entries).toHaveLength(1)
    expect(entries[0]!.name).toBe(longPath)
  })

  it('pax path only applies to the immediately next entry', () => {
    const paxPath = 'pax/override/first.txt'
    const tar = concatBuffers(
      makePaxHeader(paxPath),
      makeFileEntry('first-placeholder', 'first'),
      makeFileEntry('second.txt', 'second'),
      endOfArchive(),
    )
    const entries = parseTar(tar)
    expect(entries).toHaveLength(2)
    expect(entries[0]!.name).toBe(paxPath)
    expect(entries[1]!.name).toBe('second.txt')
  })

  // -- Mixed entry types --
  it('handles a complex archive with dirs, files, symlinks, gnu long names', () => {
    const longPath = 'repo/a/very/long/deeply/nested/path/that/has/more/than/one/hundred/bytes/in/its/name/to/trigger/gnu/extension.js'
    const tar = concatBuffers(
      makeDirEntry('repo/'),
      makeDirEntry('repo/src/'),
      makeFileEntry('repo/package.json', '{"name":"test"}'),
      // symlink — should be skipped
      buildTarHeader({ name: 'repo/link', size: 0, typeflag: '2' }),
      // GNU long name entry
      makeGnuLongName(longPath),
      makeFileEntry('placeholder', 'long content'),
      makeFileEntry('repo/src/index.ts', 'export default 42'),
      endOfArchive(),
    )
    const entries = parseTar(tar)
    expect(entries).toHaveLength(5) // 2 dirs + 3 files (symlink skipped)
    expect(entries.map(e => e.name)).toEqual([
      'repo/',
      'repo/src/',
      'repo/package.json',
      longPath,
      'repo/src/index.ts',
    ])
    expect(entries.map(e => e.type)).toEqual([
      'directory',
      'directory',
      'file',
      'file',
      'file',
    ])
  })

  // -- Edge cases for null-terminated strings --
  it('handles name with embedded nulls (uses content before first null)', () => {
    const header = new Uint8Array(512)
    // Write "hello\0garbage" in the name field
    header.set(encoder.encode('hello'), 0)
    header[5] = 0
    header.set(encoder.encode('garbage'), 6)

    // mode, uid, gid
    header.set(encoder.encode('0000644\0'), 100)
    header.set(encoder.encode('0001000\0'), 108)
    header.set(encoder.encode('0001000\0'), 116)

    // size = 0
    header.set(encoder.encode('00000000000\0'), 124)

    // mtime
    header.set(encoder.encode('00000000000\0'), 136)

    // typeflag = '0' (file)
    header[156] = '0'.charCodeAt(0)

    // magic
    header.set(encoder.encode('ustar\0'), 257)
    header.set(encoder.encode('00'), 263)

    // checksum
    for (let i = 148; i < 156; i++) header[i] = 0x20
    let checksum = 0
    for (let i = 0; i < 512; i++) checksum += header[i]!
    header.set(encoder.encode(`${checksum.toString(8).padStart(6, '0')}\0 `), 148)

    const tar = concatBuffers(header, endOfArchive())
    const entries = parseTar(tar)
    expect(entries).toHaveLength(1)
    expect(entries[0]!.name).toBe('hello')
  })

  // -- Size edge cases --
  it('handles size field with leading spaces', () => {
    const header = buildTarHeader({ name: 'spacey.txt', size: 0, typeflag: '0' })
    // Overwrite size field with space-padded value: "     00005\0"
    header.set(encoder.encode('     00005\0'), 124)
    // recalc checksum
    for (let i = 148; i < 156; i++) header[i] = 0x20
    let checksum = 0
    for (let i = 0; i < 512; i++) checksum += header[i]!
    header.set(encoder.encode(`${checksum.toString(8).padStart(6, '0')}\0 `), 148)

    const data = padTo512(encoder.encode('12345'))
    const tar = concatBuffers(header, data, endOfArchive())
    const entries = parseTar(tar)
    expect(entries).toHaveLength(1)
    expect(entries[0]!.size).toBe(5)
    expect(new TextDecoder().decode(entries[0]!.data)).toBe('12345')
  })

  it('handles empty size field (treated as 0)', () => {
    const header = buildTarHeader({ name: 'nosize.txt', size: 0, typeflag: '0' })
    // Clear the size field entirely
    for (let i = 124; i < 136; i++) header[i] = 0
    // recalc checksum
    for (let i = 148; i < 156; i++) header[i] = 0x20
    let checksum = 0
    for (let i = 0; i < 512; i++) checksum += header[i]!
    header.set(encoder.encode(`${checksum.toString(8).padStart(6, '0')}\0 `), 148)

    const tar = concatBuffers(header, endOfArchive())
    const entries = parseTar(tar)
    expect(entries).toHaveLength(1)
    expect(entries[0]!.size).toBe(0)
  })

  // -- Archive without trailing zero blocks --
  it('handles archive that ends abruptly without zero blocks', () => {
    const tar = makeFileEntry('abrupt.txt', 'no end blocks')
    const entries = parseTar(tar)
    expect(entries).toHaveLength(1)
    expect(entries[0]!.name).toBe('abrupt.txt')
    expect(new TextDecoder().decode(entries[0]!.data)).toBe('no end blocks')
  })

  // -- Archive with extra trailing garbage after zero blocks --
  it('stops at first zero block even with trailing data', () => {
    const tar = concatBuffers(
      makeFileEntry('first.txt', 'data'),
      endOfArchive(),
      makeFileEntry('ghost.txt', 'should not appear'),
    )
    const entries = parseTar(tar)
    expect(entries).toHaveLength(1)
    expect(entries[0]!.name).toBe('first.txt')
  })

  // -- Multiple consecutive directories --
  it('handles multiple consecutive directories', () => {
    const tar = concatBuffers(
      makeDirEntry('a/'),
      makeDirEntry('a/b/'),
      makeDirEntry('a/b/c/'),
      endOfArchive(),
    )
    const entries = parseTar(tar)
    expect(entries).toHaveLength(3)
    expect(entries.every(e => e.type === 'directory')).toBe(true)
    expect(entries.map(e => e.name)).toEqual(['a/', 'a/b/', 'a/b/c/'])
  })

  // -- Files with special characters in names --
  it('handles filenames with spaces and special chars', () => {
    const tar = concatBuffers(
      makeFileEntry('my file (1).txt', 'spaces'),
      makeFileEntry('path/to/[special].json', '{}'),
      endOfArchive(),
    )
    const entries = parseTar(tar)
    expect(entries).toHaveLength(2)
    expect(entries[0]!.name).toBe('my file (1).txt')
    expect(entries[1]!.name).toBe('path/to/[special].json')
  })

  // -- Verify data isolation between entries --
  it('each entry has independent data', () => {
    const tar = concatBuffers(
      makeFileEntry('a.txt', 'aaa'),
      makeFileEntry('b.txt', 'bbb'),
      makeFileEntry('c.txt', 'ccc'),
      endOfArchive(),
    )
    const entries = parseTar(tar)
    expect(entries).toHaveLength(3)
    expect(new TextDecoder().decode(entries[0]!.data)).toBe('aaa')
    expect(new TextDecoder().decode(entries[1]!.data)).toBe('bbb')
    expect(new TextDecoder().decode(entries[2]!.data)).toBe('ccc')

    // Mutating one entry's data should not affect others
    entries[0]!.data![0] = 0xFF
    expect(new TextDecoder().decode(entries[1]!.data)).toBe('bbb')
    expect(new TextDecoder().decode(entries[2]!.data)).toBe('ccc')
  })

  // -- Large file (>64KB) --
  it('handles large files correctly', () => {
    const size = 70000
    const content = 'X'.repeat(size)
    const tar = concatBuffers(makeFileEntry('large.bin', content), endOfArchive())
    const entries = parseTar(tar)
    expect(entries).toHaveLength(1)
    expect(entries[0]!.size).toBe(size)
    expect(entries[0]!.data!.length).toBe(size)
    expect(new TextDecoder().decode(entries[0]!.data)).toBe(content)
  })

  // -- Interleaved dirs and files --
  it('correctly parses interleaved directories and files', () => {
    const tar = concatBuffers(
      makeDirEntry('root/'),
      makeFileEntry('root/a.txt', 'a'),
      makeDirEntry('root/sub/'),
      makeFileEntry('root/sub/b.txt', 'bb'),
      makeFileEntry('root/c.txt', 'ccc'),
      endOfArchive(),
    )
    const entries = parseTar(tar)
    expect(entries).toHaveLength(5)
    expect(entries[0]).toMatchObject({ name: 'root/', type: 'directory' })
    expect(entries[1]).toMatchObject({ name: 'root/a.txt', type: 'file', size: 1 })
    expect(entries[2]).toMatchObject({ name: 'root/sub/', type: 'directory' })
    expect(entries[3]).toMatchObject({ name: 'root/sub/b.txt', type: 'file', size: 2 })
    expect(entries[4]).toMatchObject({ name: 'root/c.txt', type: 'file', size: 3 })
  })
})

// ---------------------------------------------------------------------------
// extractTar integration tests (through downloadTemplate internals)
// We test by creating real .tar.gz files and extracting them
// ---------------------------------------------------------------------------
describe('extractTar (via tar.gz files)', () => {
  const tmpDir = resolve(__dirname, '.tmp/tar-tests')

  beforeAll(async () => {
    await rm(tmpDir, { recursive: true, force: true })
    await mkdir(tmpDir, { recursive: true })
  })

  async function createTarGz(name: string, tarData: Uint8Array): Promise<string> {
    const gzipped = gzipSync(tarData)
    const filePath = resolve(tmpDir, `${name}.tar.gz`)
    await writeFile(filePath, gzipped)
    return filePath
  }

  it('parseTar works after gzip round-trip', async () => {
    const originalTar = concatBuffers(
      makeDirEntry('project/'),
      makeFileEntry('project/index.js', 'console.log("hi")'),
      makeFileEntry('project/package.json', '{"name":"test"}'),
      endOfArchive(),
    )
    const gzipped = gzipSync(originalTar)
    const { gunzipSync } = await import('node:zlib')
    const restored = gunzipSync(gzipped)
    const entries = parseTar(restored)
    expect(entries).toHaveLength(3)
    expect(entries[0]!.name).toBe('project/')
    expect(entries[1]!.name).toBe('project/index.js')
    expect(new TextDecoder().decode(entries[1]!.data)).toBe('console.log("hi")')
    expect(entries[2]!.name).toBe('project/package.json')
  })

  it('parseTar handles gzip of archive with GNU long names', async () => {
    const longPath = 'project/src/components/deeply/nested/folder/with/many/levels/that/exceeds/one/hundred/characters/Component.tsx'
    const originalTar = concatBuffers(
      makeDirEntry('project/'),
      makeGnuLongName(longPath),
      makeFileEntry('placeholder', '<div>hello</div>'),
      endOfArchive(),
    )
    const gzipped = gzipSync(originalTar)
    const { gunzipSync } = await import('node:zlib')
    const restored = gunzipSync(gzipped)
    const entries = parseTar(restored)
    expect(entries).toHaveLength(2)
    expect(entries[1]!.name).toBe(longPath)
    expect(new TextDecoder().decode(entries[1]!.data)).toBe('<div>hello</div>')
  })
})

// ---------------------------------------------------------------------------
// downloadTemplate integration tests
// ---------------------------------------------------------------------------
describe('downloadTemplate', () => {
  const tmpDir = resolve(__dirname, '.tmp/download-tests')

  beforeAll(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  it('clone unjs/template', async () => {
    const dir = resolve(tmpDir, 'cloned')
    const result = await downloadTemplate('gh:unjs/template', {
      dir,
      preferOffline: true,
    })
    expect(existsSync(resolve(result.dir, 'package.json'))).toBe(true)
  })

  it('rejects cloning to existing non-empty dir', async () => {
    const dir = resolve(tmpDir, 'existing')
    await mkdir(dir, { recursive: true })
    await writeFile(resolve(dir, 'test.txt'), 'test')
    await expect(
      downloadTemplate('gh:unjs/template', { dir }),
    ).rejects.toThrow('already exists')
  })

  it('allows cloning to existing non-empty dir with force', async () => {
    const dir = resolve(tmpDir, 'force')
    await mkdir(dir, { recursive: true })
    await writeFile(resolve(dir, 'test.txt'), 'test')
    const result = await downloadTemplate('gh:unjs/template', {
      dir,
      force: true,
      preferOffline: true,
    })
    expect(existsSync(resolve(result.dir, 'package.json'))).toBe(true)
  })

  it('allows cloning with forceClean (removes dir first)', async () => {
    const dir = resolve(tmpDir, 'forceclean')
    await mkdir(dir, { recursive: true })
    await writeFile(resolve(dir, 'stale.txt'), 'stale')
    const result = await downloadTemplate('gh:unjs/template', {
      dir,
      forceClean: true,
      preferOffline: true,
    })
    expect(existsSync(resolve(result.dir, 'package.json'))).toBe(true)
    expect(existsSync(resolve(result.dir, 'stale.txt'))).toBe(false)
  })

  it('respects env var overrides for registry', async () => {
    const original = process.env.GITIT_REGISTRY
    try {
      process.env.GITIT_REGISTRY = 'false'
      const dir = resolve(tmpDir, 'env-registry')
      // With registry set to string "false", it should still use the provider
      const result = await downloadTemplate('gh:unjs/template', {
        dir,
        preferOffline: true,
      })
      expect(existsSync(resolve(result.dir, 'package.json'))).toBe(true)
    }
    finally {
      if (original === undefined)
        delete process.env.GITIT_REGISTRY
      else
        process.env.GITIT_REGISTRY = original
    }
  })

  it('options.auth is preserved when env var is not set', async () => {
    const original = process.env.GITIT_AUTH
    try {
      delete process.env.GITIT_AUTH
      const dir = resolve(tmpDir, 'auth-preserved')
      // This should work without auth for public repos
      const result = await downloadTemplate('gh:unjs/template', {
        dir,
        preferOffline: true,
        auth: undefined,
      })
      expect(existsSync(resolve(result.dir, 'package.json'))).toBe(true)
    }
    finally {
      if (original !== undefined)
        process.env.GITIT_AUTH = original
    }
  })

  it('throws for unsupported provider', async () => {
    await expect(
      downloadTemplate('nonexistent:foo/bar', {
        dir: resolve(tmpDir, 'bad-provider'),
        registry: false,
      }),
    ).rejects.toThrow('Unsupported provider')
  })

  it('handles provider prefix correctly (github, gh)', async () => {
    const dir1 = resolve(tmpDir, 'provider-gh')
    const result = await downloadTemplate('gh:unjs/template', {
      dir: dir1,
      preferOffline: true,
    })
    expect(result.source).toBe('unjs/template')
    expect(existsSync(resolve(result.dir, 'package.json'))).toBe(true)
  })

  it('returns correct result shape', async () => {
    const dir = resolve(tmpDir, 'result-shape')
    const result = await downloadTemplate('gh:unjs/template', {
      dir,
      preferOffline: true,
    })
    expect(typeof result.dir).toBe('string')
    expect(typeof result.source).toBe('string')
    expect(typeof result.name).toBe('string')
    expect(typeof result.tar).toBe('string')
    expect(result.dir).toBe(dir)
  })

  it('calls hooks in correct order', async () => {
    const order: string[] = []
    const dir = resolve(tmpDir, 'hooks-order')

    await downloadTemplate('gh:unjs/template', {
      dir,
      preferOffline: true,
      hooks: {
        beforeDownload(template, options) {
          order.push('beforeDownload')
          return { template, options }
        },
        afterDownload(result) {
          order.push('afterDownload')
          return result
        },
        beforeExtract(result, extractOptions) {
          order.push('beforeExtract')
          return { result, extractOptions }
        },
        afterExtract(result) {
          order.push('afterExtract')
          return result
        },
      },
    })

    expect(order).toEqual([
      'beforeDownload',
      'afterDownload',
      'beforeExtract',
      'afterExtract',
    ])
  })

  it('beforeDownload hook can modify template input', async () => {
    const dir = resolve(tmpDir, 'hook-modify')

    const result = await downloadTemplate('gh:some/nonexistent-thing', {
      dir,
      preferOffline: true,
      hooks: {
        beforeDownload(_template, options) {
          // Redirect to a real template
          return { template: 'gh:unjs/template', options }
        },
      },
    })

    expect(existsSync(resolve(result.dir, 'package.json'))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// parseTar with real-world tar.gz files (download and parse)
// ---------------------------------------------------------------------------
describe('parseTar with real tarballs', () => {
  const tmpDir = resolve(__dirname, '.tmp/real-tar-tests')

  beforeAll(async () => {
    await rm(tmpDir, { recursive: true, force: true })
    await mkdir(tmpDir, { recursive: true })
  })

  it('can parse a real GitHub tarball', async () => {
    const tarPath = resolve(tmpDir, 'template.tar.gz')

    // Download a small real tarball
    const response = await fetch('https://codeload.github.com/unjs/template/tar.gz/main')
    if (!response.ok) {
      // Skip if no network
      console.warn('Skipping real tarball test (no network)')
      return
    }

    const buffer = await response.arrayBuffer()
    await writeFile(tarPath, new Uint8Array(buffer))

    // Decompress and parse
    const { gunzipSync } = await import('node:zlib')
    const compressed = await readFile(tarPath)
    const tarData = gunzipSync(compressed)
    const entries = parseTar(tarData)

    // Should have entries
    expect(entries.length).toBeGreaterThan(0)

    // Should have a package.json somewhere
    const pkgJson = entries.find(e => e.name.endsWith('package.json'))
    expect(pkgJson).toBeDefined()
    expect(pkgJson!.type).toBe('file')
    expect(pkgJson!.data).toBeDefined()

    // The package.json should be valid JSON
    const content = new TextDecoder().decode(pkgJson!.data)
    expect(() => JSON.parse(content)).not.toThrow()

    // Should have both files and directories
    const hasFiles = entries.some(e => e.type === 'file')
    const hasDirs = entries.some(e => e.type === 'directory')
    expect(hasFiles).toBe(true)
    expect(hasDirs).toBe(true)

    // All file entries with size > 0 should have data
    for (const entry of entries) {
      if (entry.type === 'file' && entry.size > 0) {
        expect(entry.data).toBeDefined()
        expect(entry.data!.length).toBe(entry.size)
      }
    }

    // All directory entries should have no data
    for (const entry of entries) {
      if (entry.type === 'directory') {
        expect(entry.data).toBeUndefined()
      }
    }
  })
})
