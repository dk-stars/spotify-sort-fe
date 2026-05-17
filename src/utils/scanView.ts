export function formatTrackCount(selectedCount: number, totalCount: number) {
  return `${selectedCount}/${totalCount} tracks`
}

export function formatSuggestedCount(selectedCount: number, totalCount: number) {
  return `${selectedCount}/${totalCount} suggested`
}

export function normalizeTrackCount(count: number | null | undefined) {
  return typeof count === 'number' && count > 0 ? count : 0
}

export function getTrackSubtitle(artistNames: string[]) {
  return artistNames.join(', ')
}

export function getTopArtists(tracks: { artistNames: string[] }[]) {
  const counts = new Map<string, number>()

  tracks.forEach(track => {
    track.artistNames.forEach(artistName => {
      const normalized = artistName.trim()
      if (!normalized) return
      counts.set(normalized, (counts.get(normalized) ?? 0) + 1)
    })
  })

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 3)
    .map(([artistName]) => artistName)
    .join(', ') || 'No artist data'
}

export function formatPlaylistName(name: string) {
  if (!name) return name
  return name.charAt(0).toUpperCase() + name.slice(1)
}

export function normalizeSelectionKey(value: string) {
  return value.trim().toLowerCase()
}

export function matchesSelectionKey(left: string, right: string) {
  return normalizeSelectionKey(left) === normalizeSelectionKey(right)
}

export function findMatchingSelectionKey(keys: string[], target: string) {
  return keys.find(key => matchesSelectionKey(key, target))
}