// ── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthUser {
  userId: number
  spotifyId: string
  displayName: string
  avatarUrl: string
}

// ── Playlists ─────────────────────────────────────────────────────────────────
export interface PlaylistSummary {
  id: string
  name: string
  totalTracks: number
}

// ── Tagging / Engine ──────────────────────────────────────────────────────────
export interface TrackRef {
  trackId: string
  trackName: string
  trackUri: string
  artistNames: string[]
  albumImageUrl: string | null
}

export interface PlaylistUpdate {
  playlistId: string
  playlistName: string
  tracks: TrackRef[]
}

export interface PlaylistIdea {
  tag: string
  tracks: TrackRef[]
}

export interface SyncSuggestResult {
  playlistsToUpdate: PlaylistUpdate[]
  newIdeas: PlaylistIdea[]
}

// ── Scan ──────────────────────────────────────────────────────────────────────
export type ScanStatus = 'PENDING' | 'RUNNING' | 'CANCELLED' | 'DONE' | 'FAILED'

export interface ScanStatusResponse {
  jobId: number
  status: ScanStatus
  result: SyncSuggestResult | null
  error: string | null
  currentStep: string | null
  progressPercent: number
}

// ── Proposal execution ────────────────────────────────────────────────────────
export interface UpdateAction {
  playlistId: string
  trackUris: string[]
}

export interface CreateAction {
  playlistName: string
  trackUris: string[]
}

export interface ExecuteRequest {
  updates: UpdateAction[]
  creates: CreateAction[]
}

export interface ExecuteSummary {
  playlistsUpdated: number
  playlistsCreated: number
  totalTracksAdded: number
}
