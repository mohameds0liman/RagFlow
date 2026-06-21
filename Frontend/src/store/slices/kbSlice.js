import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as kbApi from '../../api/knowledgeBaseApi';

export const fetchKnowledgeBases = createAsyncThunk(
  'kb/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await kbApi.listKnowledgeBases();
      return data.knowledge_bases;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to fetch knowledge bases');
    }
  }
);

export const createKnowledgeBase = createAsyncThunk(
  'kb/create',
  async ({ name, description }, { rejectWithValue }) => {
    try {
      const { data } = await kbApi.createKnowledgeBase(name, description);
      return data.knowledge_base;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to create knowledge base');
    }
  }
);

export const updateKnowledgeBase = createAsyncThunk(
  'kb/update',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const { data } = await kbApi.updateKnowledgeBase(id, payload);
      return data.knowledge_base;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to update knowledge base');
    }
  }
);

export const deleteKnowledgeBase = createAsyncThunk(
  'kb/delete',
  async (id, { rejectWithValue }) => {
    try {
      await kbApi.deleteKnowledgeBase(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to delete knowledge base');
    }
  }
);

export const fetchDocuments = createAsyncThunk(
  'kb/fetchDocuments',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await kbApi.listDocuments(id);
      return { storeId: id, documents: data.documents };
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to fetch documents');
    }
  }
);

export const uploadDocument = createAsyncThunk(
  'kb/uploadDocument',
  async ({ id, file }, { rejectWithValue }) => {
    try {
      const { data } = await kbApi.uploadDocument(id, file);
      return data.document;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to upload document');
    }
  }
);

export const addWebPage = createAsyncThunk(
  'kb/addWebPage',
  async ({ id, url, name }, { rejectWithValue }) => {
    try {
      const { data } = await kbApi.addWebPage(id, url, name);
      return data.document;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to add web page');
    }
  }
);

export const deleteDocument = createAsyncThunk(
  'kb/deleteDocument',
  async ({ id, docId }, { rejectWithValue }) => {
    try {
      await kbApi.deleteDocument(id, docId);
      return docId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to delete document');
    }
  }
);

export const ingestDocument = createAsyncThunk(
  'kb/ingestDocument',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const { data } = await kbApi.ingestDocument(id, payload);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to ingest document');
    }
  }
);

export const fetchChunks = createAsyncThunk(
  'kb/fetchChunks',
  async ({ id, docId }, { rejectWithValue }) => {
    try {
      const { data } = await kbApi.listChunks(id, docId);
      return { docId, chunks: data.chunks };
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to fetch chunks');
    }
  }
);

export const updateChunk = createAsyncThunk(
  'kb/updateChunk',
  async ({ id, chunkId, payload }, { rejectWithValue }) => {
    try {
      const { data } = await kbApi.updateChunk(id, chunkId, payload);
      return data.chunk;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to update chunk');
    }
  }
);

export const deleteChunk = createAsyncThunk(
  'kb/deleteChunk',
  async ({ id, chunkId }, { rejectWithValue }) => {
    try {
      await kbApi.deleteChunk(id, chunkId);
      return chunkId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to delete chunk');
    }
  }
);

export const triggerUpsert = createAsyncThunk(
  'kb/triggerUpsert',
  async ({ id, docId }, { rejectWithValue }) => {
    try {
      console.log('[Upsert] sending', { id, docId });
      const { data } = await kbApi.triggerUpsert(id, docId);
      return data;
    } catch (err) {
      console.error('[Upsert] error', err.response?.status, err.response?.data);
      return rejectWithValue(err.response?.data?.detail || 'Failed to trigger upsert');
    }
  }
);

export const fetchStatus = createAsyncThunk(
  'kb/fetchStatus',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await kbApi.getKnowledgeBaseStatus(id);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to fetch status');
    }
  }
);

export const fetchDashboardStats = createAsyncThunk(
  'kb/fetchDashboardStats',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await kbApi.getDashboardStats();
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to fetch dashboard stats');
    }
  }
);

const kbSlice = createSlice({
  name: 'knowledgeBases',
  initialState: {
    list: [],
    selectedKB: null,
    documents: [],
    chunks: [],
    loading: false,
    error: null,
    documentLoading: false,
    chunkLoading: false,
    ingestLoading: false,
    upsertLoading: false,
    dashboardStats: null,
    dashboardLoading: false,
  },
  reducers: {
    setSelectedKB: (state, action) => {
      state.selectedKB = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearDocuments: (state) => {
      state.documents = [];
    },
    clearChunks: (state) => {
      state.chunks = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchKnowledgeBases.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchKnowledgeBases.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchKnowledgeBases.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createKnowledgeBase.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })
      .addCase(updateKnowledgeBase.fulfilled, (state, action) => {
        const idx = state.list.findIndex((kb) => kb.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
        if (state.selectedKB?.id === action.payload.id) state.selectedKB = action.payload;
      })
      .addCase(deleteKnowledgeBase.fulfilled, (state, action) => {
        state.list = state.list.filter((kb) => kb.id !== action.payload);
        if (state.selectedKB?.id === action.payload) state.selectedKB = null;
      })
      .addCase(fetchDocuments.pending, (state) => {
        state.documentLoading = true;
        state.error = null;
      })
      .addCase(fetchDocuments.fulfilled, (state, action) => {
        state.documentLoading = false;
        state.documents = action.payload.documents;
      })
      .addCase(fetchDocuments.rejected, (state, action) => {
        state.documentLoading = false;
        state.error = action.payload;
      })
      .addCase(uploadDocument.fulfilled, (state, action) => {
        state.documents.unshift(action.payload);
      })
      .addCase(deleteDocument.fulfilled, (state, action) => {
        state.documents = state.documents.filter((d) => d.id !== action.payload);
      })
      .addCase(ingestDocument.pending, (state) => {
        state.ingestLoading = true;
      })
      .addCase(ingestDocument.fulfilled, (state, action) => {
        state.ingestLoading = false;
        const doc = state.documents.find((d) => d.id === action.payload.doc_id);
        if (doc) doc.status = 'ready';
      })
      .addCase(ingestDocument.rejected, (state) => {
        state.ingestLoading = false;
      })
      .addCase(fetchChunks.pending, (state) => {
        state.chunkLoading = true;
      })
      .addCase(fetchChunks.fulfilled, (state, action) => {
        state.chunkLoading = false;
        state.chunks = action.payload.chunks;
      })
      .addCase(fetchChunks.rejected, (state) => {
        state.chunkLoading = false;
      })
      .addCase(updateChunk.fulfilled, (state, action) => {
        const idx = state.chunks.findIndex((c) => c.id === action.payload.id);
        if (idx !== -1) state.chunks[idx] = action.payload;
      })
      .addCase(deleteChunk.fulfilled, (state, action) => {
        state.chunks = state.chunks.filter((c) => c.id !== action.payload);
      })
      .addCase(triggerUpsert.pending, (state) => {
        state.upsertLoading = true;
      })
      .addCase(triggerUpsert.fulfilled, (state, action) => {
        state.upsertLoading = false;
        const doc = state.documents.find((d) => d.id === action.meta.arg.docId);
        if (doc) doc.status = 'embedded';
      })
      .addCase(triggerUpsert.rejected, (state) => {
        state.upsertLoading = false;
      })
      .addCase(fetchDashboardStats.pending, (state) => {
        state.dashboardLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.dashboardLoading = false;
        state.dashboardStats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.dashboardLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchStatus.fulfilled, (state, action) => {
        const kb = state.list.find((k) => k.id === action.payload.knowledge_base_id);
        if (kb) {
          kb.upsertion_config_ready = action.payload.upsertion_config_ready;
          kb.vector_store_configured = action.payload.vector_store_configured;
        }
        if (state.selectedKB?.id === action.payload.knowledge_base_id) {
          state.selectedKB = { ...state.selectedKB, ...action.payload };
        }
      });
  },
});

export const { setSelectedKB, clearError, clearDocuments, clearChunks } = kbSlice.actions;
export default kbSlice.reducer;
