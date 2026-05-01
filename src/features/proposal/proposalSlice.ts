import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import { executeProposal } from '../../api/apiClient'
import type { ExecuteRequest, ExecuteSummary, SyncSuggestResult } from '../../types'

interface ProposalState {
  // Sets of keys the user has checked
  selectedUpdateIds: string[]   // playlistId
  selectedIdeaTags: string[]    // tag name
  excludedUpdateTrackUris: Record<string, string[]>
  excludedIdeaTrackUris: Record<string, string[]>
  executing: boolean
  deleteFromSources: boolean
  summary: ExecuteSummary | null
  error: string | null
}

interface SelectSingleTrackPayload {
  groupKey: string
  trackUri: string
  allTrackUris: string[]
}

const initialState: ProposalState = {
  selectedUpdateIds: [],
  selectedIdeaTags: [],
  excludedUpdateTrackUris: {},
  excludedIdeaTrackUris: {},
  executing: false,
  deleteFromSources: false,
  summary: null,
  error: null,
}

// Initialise selection from a completed scan result (parent playlists unchecked by default)
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

    return await executeProposal({
      scanJobId: scan.jobId,
      deleteFromSources: proposal.deleteFromSources,
      updates,
      creates,
    })
  },
)

function toggleTrackUri(stateMap: Record<string, string[]>, groupKey: string, trackUri: string) {
  const current = stateMap[groupKey] ?? []
  stateMap[groupKey] = current.includes(trackUri)
    ? current.filter(uri => uri !== trackUri)
    : [...current, trackUri]
}

function selectOnlyTrack(stateMap: Record<string, string[]>, groupKey: string, trackUri: string, allTrackUris: string[]) {
  stateMap[groupKey] = allTrackUris.filter(uri => uri !== trackUri)
}

function buildExcludedTrackMap<GroupKey extends string>(
  entries: { key: GroupKey; allTrackUris: string[] }[],
  selectedTrackUrisByGroup: Record<GroupKey, Set<string>>,
) {
  return Object.fromEntries(
    entries.map(entry => [
      entry.key,
      entry.allTrackUris.filter(trackUri => !selectedTrackUrisByGroup[entry.key]?.has(trackUri)),
    ]),
  ) as Record<GroupKey, string[]>
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
        state.excludedUpdateTrackUris[id] = []
      }
    },
    toggleIdea: (state, action: PayloadAction<string>) => {
      const tag = action.payload
      if (state.selectedIdeaTags.includes(tag)) {
        state.selectedIdeaTags = state.selectedIdeaTags.filter(x => x !== tag)
      } else {
        state.selectedIdeaTags.push(tag)
        state.excludedIdeaTrackUris[tag] = []
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
    selectSingleUpdateTrack: (state, action: PayloadAction<SelectSingleTrackPayload>) => {
      const { groupKey, trackUri, allTrackUris } = action.payload
      if (!state.selectedUpdateIds.includes(groupKey)) {
        state.selectedUpdateIds.push(groupKey)
      }
      selectOnlyTrack(state.excludedUpdateTrackUris, groupKey, trackUri, allTrackUris)
    },
    selectSingleIdeaTrack: (state, action: PayloadAction<SelectSingleTrackPayload>) => {
      const { groupKey, trackUri, allTrackUris } = action.payload
      if (!state.selectedIdeaTags.includes(groupKey)) {
        state.selectedIdeaTags.push(groupKey)
      }
      selectOnlyTrack(state.excludedIdeaTrackUris, groupKey, trackUri, allTrackUris)
    },
    setDeleteFromSources: (state, action: PayloadAction<boolean>) => {
      state.deleteFromSources = action.payload
    },
    restoreSelectionFromExecution: (
      state,
      action: PayloadAction<{ result: SyncSuggestResult; executionRequest: ExecuteRequest }>,
    ) => {
      const { result, executionRequest } = action.payload
      const updateTrackUris = Object.fromEntries(
        executionRequest.updates.map(update => [update.playlistId, new Set(update.trackUris)]),
      ) as Record<string, Set<string>>
      const ideaTrackUris = Object.fromEntries(
        executionRequest.creates.map(create => [create.playlistName, new Set(create.trackUris)]),
      ) as Record<string, Set<string>>

      state.selectedUpdateIds = executionRequest.updates.map(update => update.playlistId)
      state.selectedIdeaTags = executionRequest.creates.map(create => create.playlistName)
      state.excludedUpdateTrackUris = buildExcludedTrackMap(
        result.playlistsToUpdate.map(update => ({
          key: update.playlistId,
          allTrackUris: update.tracks.map(track => track.trackUri),
        })),
        updateTrackUris,
      )
      state.excludedIdeaTrackUris = buildExcludedTrackMap(
        result.newIdeas.map(idea => ({
          key: idea.tag,
          allTrackUris: idea.tracks.map(track => track.trackUri),
        })),
        ideaTrackUris,
      )
      state.deleteFromSources = executionRequest.deleteFromSources ?? false
      state.summary = null
      state.error = null
      state.executing = false
    },
    resetProposal: () => initialState,
  },
  extraReducers: builder => {
    builder
      .addCase(initSelection.fulfilled, state => {
        state.selectedUpdateIds = []
        state.selectedIdeaTags = []
        state.excludedUpdateTrackUris = {}
        state.excludedIdeaTrackUris = {}
        state.deleteFromSources = false
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
  selectSingleUpdateTrack,
  selectSingleIdeaTrack,
  setDeleteFromSources,
  restoreSelectionFromExecution,
  resetProposal,
} = proposalSlice.actions
export default proposalSlice.reducer
