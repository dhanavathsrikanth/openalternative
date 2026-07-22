export async function fetchCrate(name: string, signal?: AbortSignal) {
  const res = await fetch(`https://crates.io/api/v1/crates/${name}`, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'forklane-ingestion/1.0 (https://github.com/dhanavathsrikanth/openalternative)',
    },
    signal,
  })

  if (!res.ok) {
    throw new Error(`crates.io API ${res.status}: ${name}`)
  }

  const data = await res.json()
  const crate = data.crate

  return {
    identifier: name,
    payload: {
      source: 'crates',
      name: crate.name,
      description: crate.description,
      version: crate.max_version,
      downloads: crate.downloads,
      recentDownloads: crate.recent_downloads,
      repository: crate.repository || null,
      homepage: crate.homepage || null,
      license: crate.license || null,
      categories: crate.categories ?? [],
      keywords: crate.keywords ?? [],
      createdAt: crate.created_at,
      updatedAt: crate.updated_at,
      fetchedAt: new Date().toISOString(),
    },
  }
}
