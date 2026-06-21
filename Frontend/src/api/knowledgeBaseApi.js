import api from './axiosInstance';

export const createKnowledgeBase = (name, description) =>
  api.post('/admin/knowledge-bases', { knowledge_base_name: name, description });

export const listKnowledgeBases = (status) =>
  api.get('/admin/knowledge_bases', { params: status ? { status } : {} });

export const updateKnowledgeBase = (id, payload) =>
  api.put(`/admin/knowledge_bases/${id}`, payload);

export const deleteKnowledgeBase = (id) =>
  api.delete(`/admin/knowledge_bases/${id}`);

export const getKnowledgeBaseStatus = (id) =>
  api.get(`/admin/knowledge_bases/${id}/status`);

export const createUpsertionConfig = (id, config) =>
  api.post(`/admin/knowledge_bases/${id}/config`, config);

export const updateUpsertionConfig = (id, config) =>
  api.put(`/admin/knowledge_bases/${id}/config`, config);

export const uploadDocument = (id, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/admin/knowledge_bases/${id}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const listDocuments = (id) =>
  api.get(`/admin/knowledge_bases/${id}/documents`);

export const deleteDocument = (id, docId) =>
  api.delete(`/admin/knowledge_bases/${id}/documents/${docId}`);

export const ingestDocument = (id, payload) =>
  api.post(`/admin/knowledge_bases/${id}/ingest_document`, payload);

export const listChunks = (id, docId) =>
  api.get(`/admin/knowledge_bases/${id}/chunks`, { params: { doc_id: docId } });

export const getChunk = (id, chunkId) =>
  api.get(`/admin/knowledge_bases/${id}/chunks/${chunkId}`);

export const updateChunk = (id, chunkId, payload) =>
  api.put(`/admin/knowledge_bases/${id}/chunks/${chunkId}`, payload);

export const deleteChunk = (id, chunkId) =>
  api.delete(`/admin/knowledge_bases/${id}/chunks/${chunkId}`);

export const addChunk = (id, docId, payload) =>
  api.post(`/admin/knowledge_bases/${id}/chunks`, payload, { params: { doc_id: docId } });

export const triggerUpsert = (id, docId) =>
  api.post(`/admin/knowledge_bases/${id}/upsert`, JSON.stringify(docId));

export const listComponentCategories = () =>
  api.get('/admin/components/categories');

export const listComponents = (category) =>
  api.get('/admin/components', { params: { category } });

export const getComponentSchema = (name, category) =>
  api.get(`/admin/components/${name}/schema`, { params: { category } });

export const addWebPage = (id, url, name) =>
  api.post(`/admin/knowledge_bases/${id}/web_page`, { url, name });

export const getDashboardStats = () =>
  api.get('/admin/dashboard/stats');
