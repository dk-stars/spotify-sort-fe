import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { startScan, fetchScanStatus } from '../../api/apiClient'
import type { ScanStatus, SyncSuggestResult } from '../../types'

interface ScanState {
  jobId: number | null
  status: ScanStatus | null
  result: SyncSuggestResult | null
  error: string | null
  loading: boolean
}

const initialState: ScanState = {
  jobId: null,
  status: null,
  result: null,
  error: null,
  loading: false,
}

export const submitScan = createAsyncThunk(
  'scan/submit',
  async ({ sourcePlaylistId, threshold }: { sourcePlaylistId: string; threshold: number }) => {
    return await startScan(sourcePlaylistId, threshold)
  },
)

export const pollScan = createAsyncThunk(
  'scan/poll',
  async (jobId: number) => {
    return await fetchScanStatus(jobId)
  },
)

const scanSlice = createSlice({
  name: 'scan',
  initialState,
  reducers: {
    resetScan: () => initialState,
  },
  extraReducers: builder => {
    builder
      .addCase(submitScan.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(submitScan.fulfilled, (state, action) => {
        state.jobId = action.payload.jobId
        state.status = 'PENDING'
        state.loading = false
      })
      .addCase(submitScan.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message ?? 'Failed to start scan'
      })
      .addCase(pollScan.fulfilled, (state, action) => {
        state.status = action.payload.status
        state.result = action.payload.result
        if (action.payload.error) state.error = action.payload.error
      })
  },
})

export const { resetScan } = scanSlice.actions
export default scanSlice.reducer
