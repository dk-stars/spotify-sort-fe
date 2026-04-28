import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { fetchPlaylists } from '../../api/apiClient'
import type { PlaylistSummary } from '../../types'

interface PlaylistsState {
  items: PlaylistSummary[]
  loading: boolean
  error: string | null
}

const initialState: PlaylistsState = { items: [], loading: false, error: null }

export const loadPlaylists = createAsyncThunk('playlists/load', async () => {
  return await fetchPlaylists()
})

const playlistsSlice = createSlice({
  name: 'playlists',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(loadPlaylists.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(loadPlaylists.fulfilled, (state, action) => {
        state.items = action.payload
        state.loading = false
      })
      .addCase(loadPlaylists.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message ?? 'Failed to load playlists'
      })
  },
})

export default playlistsSlice.reducer
