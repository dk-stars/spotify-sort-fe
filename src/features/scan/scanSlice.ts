import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import { startScan, fetchScanStatus, cancelScan } from '../../api/apiClient'
import type { ScanStatus, ScanStatusResponse, SyncSuggestResult } from '../../types'

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
  async ({ sourcePlaylistIds, threshold }: { sourcePlaylistIds: string[]; threshold: number }) => {
    return await startScan(sourcePlaylistIds, threshold)
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

function applyScanStatus(state: ScanState, payload: ScanStatusResponse) {
  state.jobId = payload.jobId
  state.status = payload.status
  state.result = payload.result
  state.currentStep = payload.currentStep
  state.progressPercent = payload.progressPercent
  state.currentItem = payload.currentItem
  state.totalItems = payload.totalItems
  state.currentFetchRequest = payload.currentFetchRequest
  state.totalFetchRequests = payload.totalFetchRequests
  state.error = payload.error
}

const scanSlice = createSlice({
  name: 'scan',
  initialState,
  reducers: {
    resetScan: () => initialState,
    hydrateScan: (state, action: PayloadAction<ScanStatusResponse>) => {
      state.loading = false
      state.canceling = false
      applyScanStatus(state, action.payload)
    },
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
        applyScanStatus(state, action.payload)
        if (action.payload.status === 'CANCELLED') {
          state.canceling = false
        }
      })
      .addCase(requestScanCancel.pending, state => {
        state.canceling = true
      })
      .addCase(requestScanCancel.fulfilled, state => {
        state.status = 'CANCELLING'
        state.currentStep = 'Cancelling scan…'
      })
      .addCase(requestScanCancel.rejected, (state, action) => {
        state.canceling = false
        state.error = action.error.message ?? 'Failed to cancel scan'
      })
  },
})

export const { resetScan, hydrateScan } = scanSlice.actions
export default scanSlice.reducer
