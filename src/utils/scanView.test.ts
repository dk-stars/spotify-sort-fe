import { describe, expect, it } from 'vitest'
import {
  findMatchingSelectionKey,
  formatPlaylistName,
  formatSuggestedCount,
  formatTrackCount,
  getTopArtists,
  normalizeSelectionKey,
  normalizeTrackCount,
} from './scanView'

describe('scanView helpers', () => {
  it('formats counts and normalizes track counts', () => {
    expect(formatTrackCount(3, 10)).toBe('3/10 tracks')
    expect(formatSuggestedCount(4, 12)).toBe('4/12 suggested')
    expect(normalizeTrackCount(5)).toBe(5)
    expect(normalizeTrackCount(0)).toBe(0)
    expect(normalizeTrackCount(undefined)).toBe(0)
  })

  it('matches selection keys case-insensitively', () => {
    expect(normalizeSelectionKey('  Chill Mix ')).toBe('chill mix')
    expect(findMatchingSelectionKey(['Chill Mix', 'Workout'], ' chill mix')).toBe('Chill Mix')
  })

  it('orders top artists by frequency and then name', () => {
    expect(
      getTopArtists([
        { artistNames: ['Beta', 'Alpha'] },
        { artistNames: ['Beta'] },
        { artistNames: ['Alpha'] },
        { artistNames: ['Gamma'] },
      ]),
    ).toBe('Alpha, Beta, Gamma')
  })

  it('formats playlist names', () => {
    expect(formatPlaylistName('ambient')).toBe('Ambient')
  })
})
