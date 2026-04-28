import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { fetchMe, logout as apiLogout } from '../../api/apiClient'
import type { AuthUser } from '../../types'

interface AuthState {
  user: AuthUser | null
  loading: boolean
  checked: boolean // true once the initial /auth/me check has resolved
}

const initialState: AuthState = { user: null, loading: false, checked: false }

export const checkAuth = createAsyncThunk('auth/check', async () => {
  return await fetchMe()
})

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  await apiLogout()
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(checkAuth.pending, state => {
        state.loading = true
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.user = action.payload
        state.loading = false
        state.checked = true
      })
      .addCase(checkAuth.rejected, state => {
        state.user = null
        state.loading = false
        state.checked = true
      })
      .addCase(logoutUser.fulfilled, state => {
        state.user = null
      })
  },
})

export default authSlice.reducer
