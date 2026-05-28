import { createSlice } from '@reduxjs/toolkit';

const userChatSlice = createSlice({
  name: 'userChat',
  initialState: {
    chatbots: [],
    selectedChatbot: null,
    activeSessionId: null,
  },
  reducers: {
    setUserChatbots: (state, action) => {
      state.chatbots = action.payload;
    },
    setSelectedUserChatbot: (state, action) => {
      state.selectedChatbot = action.payload;
    },
    setActiveSessionId: (state, action) => {
      state.activeSessionId = action.payload;
    },
  },
});

export const { setUserChatbots, setSelectedUserChatbot, setActiveSessionId } = userChatSlice.actions;
export default userChatSlice.reducer;
