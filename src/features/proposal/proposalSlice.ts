import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import { executeProposal } from '../../api/apiClient'
import type { ExecuteSummary, SyncSuggestResult } from '../../types'

interface ProposalState {
  // Sets of keys the user has checked
  selectedUpdateIds: string[]   // playlistId
  selectedIdeaTags: string[]    // tag name
  excludedUpdateTrackUris: Record<string, string[]>
  excludedIdeaTrackUris: Record<string, string[]>
  executing: boolean
  summary: ExecuteSummary | null
  error: string | null
}

const initialState: ProposalState = {
  selectedUpdateIds: [],
  selectedIdeaTags: [],
  excludedUpdateTrackUris: {},
  excludedIdeaTrackUris: {},
  executing: false,
  summary: null,
  error: null,
}

// Initialise selection from a completed scan result (all checked by default)
export const initSelection = createAsyncThunk(
  'proposal/initSelection',
  async (result: SyncSuggestResult) => result,
)

export const applyProposal = createAsyncThunk(
  'proposal/apply',
  async (_: void, { getState }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const state = getState() as any
    const proposal = state.proposal as ProposalState
    const scan = state.scan

    const result: SyncSuggestResult = scan.result
    const updates = result.playlistsToUpdate
      .filter(u => proposal.selectedUpdateIds.includes(u.playlistId))
      .map(u => ({
        playlistId: u.playlistId,
        trackUris: u.tracks
          .filter(t => !(proposal.excludedUpdateTrackUris[u.playlistId] ?? []).includes(t.trackUri))
          .map(t => t.trackUri),
      }))
      .filter(u => u.trackUris.length > 0)

    const creates = result.newIdeas
      .filter(i => proposal.selectedIdeaTags.includes(i.tag))
      .map(i => ({
        playlistName: i.tag,
        trackUris: i.tracks
          .filter(t => !(proposal.excludedIdeaTrackUris[i.tag] ?? []).includes(t.trackUri))
          .map(t => t.trackUri),
      }))
      .filter(i => i.trackUris.length > 0)

    return await executeProposal({ updates, creates })
  },
)

function toggleTrackUri(stateMap: Record<string, string[]>, groupKey: string, trackUri: string) {
  const current = stateMap[groupKey] ?? []
  stateMap[groupKey] = current.includes(trackUri)
    ? current.filter(uri => uri !== trackUri)
    : [...current, trackUri]
}

const proposalSlice = createSlice({
  name: 'proposal',
  initialState,
  reducers: {
    toggleUpdate: (state, action: PayloadAction<string>) => {
      const id = action.payload
      if (state.selectedUpdateIds.includes(id)) {
        state.selectedUpdateIds = state.selectedUpdateIds.filter(x => x !== id)
      } else {
        state.selectedUpdateIds.push(id)
      }
    },
    toggleIdea: (state, action: PayloadAction<string>) => {
      const tag = action.payload
      if (state.selectedIdeaTags.includes(tag)) {
        state.selectedIdeaTags = state.selectedIdeaTags.filter(x => x !== tag)
      } else {
        state.selectedIdeaTags.push(tag)
      }
    },
    toggleUpdateTrack: (
      state,
      action: PayloadAction<{ playlistId: string; trackUri: string }>,
    ) => {
      toggleTrackUri(
        state.excludedUpdateTrackUris,
        action.payload.playlistId,
        action.payload.trackUri,
      )
    },
    toggleIdeaTrack: (
      state,
      action: PayloadAction<{ tag: string; trackUri: string }>,
    ) => {
      toggleTrackUri(
        state.excludedIdeaTrackUris,
        action.payload.tag,
        action.payload.trackUri,
      )
    },
    resetProposal: () => initialState,
  },
  extraReducers: builder => {
    builder
      .addCase(initSelection.fulfilled, (state, action) => {
        state.selectedUpdateIds = action.payload.playlistsToUpdate.map(u => u.playlistId)
        state.selectedIdeaTags = action.payload.newIdeas.map(i => i.tag)
        state.excludedUpdateTrackUris = {}
        state.excludedIdeaTrackUris = {}
        state.summary = null
        state.error = null
      })
      .addCase(applyProposal.pending, state => {
        state.executing = true
        state.error = null
      })
      .addCase(applyProposal.fulfilled, (state, action) => {
        state.executing = false
        state.summary = action.payload
      })
      .addCase(applyProposal.rejected, (state, action) => {
        state.executing = false
        state.error = action.error.message ?? 'Execution failed'
      })
  },
})

export const {
  toggleUpdate,
  toggleIdea,
  toggleUpdateTrack,
  toggleIdeaTrack,
  resetProposal,
} = proposalSlice.actions
export default proposalSlice.reducer
