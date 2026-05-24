import { createSlice } from '@reduxjs/toolkit';

const kbSlice = createSlice({
  name: 'knowledgeBases',
  initialState: {
    list: [],
    selectedKB: null,
    documents: [],
    chunks: [],
    loading: false,
    error: null,
  },
  reducers: {},
});

export default kbSlice.reducer;
