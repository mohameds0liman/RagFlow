import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import kbReducer from './slices/kbSlice';
import chatbotReducer from './slices/chatbotSlice';
import usersReducer from './slices/usersSlice';
import themeReducer from './slices/themeSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    knowledgeBases: kbReducer,
    chatbots: chatbotReducer,
    users: usersReducer,
    theme: themeReducer,
  },
});

export default store;
