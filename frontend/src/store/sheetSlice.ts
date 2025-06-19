import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Sheet } from '../types';

interface SheetState {
  sheets: Sheet[];
  currentSheet: Sheet | null;
  loading: boolean;
  error: string | null;
}

const initialState: SheetState = {
  sheets: [],
  currentSheet: null,
  loading: false,
  error: null,
};

const sheetSlice = createSlice({
  name: 'sheet',
  initialState,
  reducers: {
    setSheets: (state, action: PayloadAction<Sheet[]>) => {
      state.sheets = action.payload;
    },
    setCurrentSheet: (state, action: PayloadAction<Sheet | null>) => {
      state.currentSheet = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setSheets, setCurrentSheet, setLoading, setError } = sheetSlice.actions;
export default sheetSlice.reducer; 