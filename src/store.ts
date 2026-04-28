import { configureStore } from '@reduxjs/toolkit'
import authReducer from './features/auth/authSlice'
import playlistsReducer from './features/playlists/playlistsSlice'
import scanReducer from './features/scan/scanSlice'
import proposalReducer from './features/proposal/proposalSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    playlists: playlistsReducer,
    scan: scanReducer,
    proposal: proposalReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
