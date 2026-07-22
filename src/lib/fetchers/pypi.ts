export async function fetchPypiPackage(name: string, signal?: AbortSignal) {
  const res = await fetch(`https://pypi.org/pypi/${name}/json`, {
    headers: { Accept: 'application/json' },
    signal,
  })

  if (!res.ok) {
    throw new Error(`PyPI API ${res.status}: ${name}`)
  }

  const data = await res.json()
  const info = data.info
  const releases = data.releases || {}
  const versions = Object.keys(releases)

  return {
    identifier: name,
    payload: {
      source: 'pypi',
      name,
      summary: info.summary,
      version: info.version,
      versionCount: versions.length,
      license: info.license || null,
      homepage: info.homepage || null,
      projectUrl: info.project_url || null,
      requiresPython: info.requires_python || null,
      dependencies: info.requires_dist?.length ?? 0,
      author: info.author || info.maintainer || null,
      classifiers: info.classifiers ?? [],
      fetchedAt: new Date().toISOString(),
    },
  }
}
