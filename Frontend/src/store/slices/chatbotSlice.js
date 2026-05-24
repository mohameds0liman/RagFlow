import { createSlice } from '@reduxjs/toolkit';

const chatbotSlice = createSlice({
  name: 'chatbots',
  initialState: {
    list: [],
    selectedChatbot: null,
    loading: false,
    error: null,
  },
  reducers: {},
});

export default chatbotSlice.reducer;
