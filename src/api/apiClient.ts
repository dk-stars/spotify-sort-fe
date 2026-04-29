import axios from 'axios'
import type {
  AuthUser,
  PlaylistSummary,
  ScanStatusResponse,
  ExecuteRequest,
  ExecuteSummary,
} from '../types'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // send session cookie on every request
})

// ── Auth ──────────────────────────────────────────────────────────────────────
export const fetchMe = (): Promise<AuthUser> =>
  api.get<AuthUser>('/auth/me').then(r => r.data)

export const logout = (): Promise<void> =>
  api.post('/auth/logout').then(() => undefined)

// ── Playlists ─────────────────────────────────────────────────────────────────
export const fetchPlaylists = (): Promise<PlaylistSummary[]> =>
  api.get<PlaylistSummary[]>('/playlists').then(r => r.data)

// ── Scan ──────────────────────────────────────────────────────────────────────
export const startScan = (
  sourcePlaylistId: string,
  threshold: number,
): Promise<{ jobId: number }> =>
  api.post<{ jobId: number }>('/scan', { sourcePlaylistId, threshold }).then(r => r.data)

export const fetchScanStatus = (jobId: number): Promise<ScanStatusResponse> =>
  api.get<ScanStatusResponse>(`/scan/${jobId}`).then(r => r.data)

export const cancelScan = (jobId: number): Promise<{ jobId: number; status: string }> =>
  api.post<{ jobId: number; status: string }>(`/scan/${jobId}/cancel`).then(r => r.data)

// ── Proposal ──────────────────────────────────────────────────────────────────
export const executeProposal = (body: ExecuteRequest): Promise<ExecuteSummary> =>
  api.post<ExecuteSummary>('/proposal/execute', body).then(r => r.data)
