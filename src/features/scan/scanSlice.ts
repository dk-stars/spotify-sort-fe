import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { startScan, fetchScanStatus, cancelScan } from '../../api/apiClient'
import type { ScanStatus, SyncSuggestResult } from '../../types'

interface ScanState {
  jobId: number | null
  status: ScanStatus | null
  result: SyncSuggestResult | null
  error: string | null
  loading: boolean
  currentStep: string | null
  progressPercent: number
  currentItem: number
  totalItems: number
  currentFetchRequest: number
  totalFetchRequests: number
  canceling: boolean
}

const initialState: ScanState = {
  jobId: null,
  status: null,
  result: null,
  error: null,
  loading: false,
  currentStep: null,
  progressPercent: 0,
  currentItem: 0,
  totalItems: 0,
  currentFetchRequest: 0,
  totalFetchRequests: 0,
  canceling: false,
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

export const requestScanCancel = createAsyncThunk(
  'scan/cancel',
  async (jobId: number) => {
    return await cancelScan(jobId)
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
        state.currentStep = 'Queued'
        state.progressPercent = 0
        state.currentItem = 0
        state.totalItems = 0
        state.currentFetchRequest = 0
        state.totalFetchRequests = 0
        state.canceling = false
      })
      .addCase(submitScan.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message ?? 'Failed to start scan'
      })
      .addCase(pollScan.fulfilled, (state, action) => {
        state.status = action.payload.status
        state.result = action.payload.result
        state.currentStep = action.payload.currentStep
        state.progressPercent = action.payload.progressPercent
        state.currentItem = action.payload.currentItem
        state.totalItems = action.payload.totalItems
        state.currentFetchRequest = action.payload.currentFetchRequest
        state.totalFetchRequests = action.payload.totalFetchRequests
        if (action.payload.status === 'CANCELLED') {
          state.canceling = false
        }
        if (action.payload.error) state.error = action.payload.error
      })
      .addCase(requestScanCancel.pending, state => {
        state.canceling = true
      })
      .addCase(requestScanCancel.fulfilled, state => {
        state.currentStep = 'Cancelling scan…'
      })
      .addCase(requestScanCancel.rejected, (state, action) => {
        state.canceling = false
        state.error = action.error.message ?? 'Failed to cancel scan'
      })
  },
})

export const { resetScan } = scanSlice.actions
export default scanSlice.reducer
