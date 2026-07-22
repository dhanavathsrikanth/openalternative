export async function fetchNpmPackage(name: string, signal?: AbortSignal) {
  const res = await fetch(`https://registry.npmjs.org/${name}`, {
    headers: { Accept: 'application/json' },
    signal,
  })

  if (!res.ok) {
    throw new Error(`npm API ${res.status}: ${name}`)
  }

  const data = await res.json()
  const latest = data['dist-tags']?.latest
  const latestVersion = latest ? data.versions?.[latest] : null
  const versions = Object.keys(data.versions || {})

  return {
    identifier: name,
    payload: {
      source: 'npm',
      name,
      description: data.description,
      latestVersion: latest ?? null,
      versionCount: versions.length,
      license: latestVersion?.license ?? null,
      homepage: data.homepage || latestVersion?.homepage || null,
      repository: data.repository?.url ?? null,
      dependencies: latestVersion
        ? Object.keys(latestVersion.dependencies || {}).length
        : 0,
      devDependencies: latestVersion
        ? Object.keys(latestVersion.devDependencies || {}).length
        : 0,
      keywords: data.keywords ?? [],
      time: {
        created: data.time?.created ?? null,
        modified: data.time?.modified ?? null,
      },
      fetchedAt: new Date().toISOString(),
    },
  }
}
