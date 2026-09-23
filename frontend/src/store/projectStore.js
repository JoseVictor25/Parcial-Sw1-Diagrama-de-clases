import { create } from 'zustand';
import api from '../api/axios';

export const useProjectStore = create((set, get) => ({
  projects: [],
  currentProject: null,
  loading: false,

  fetchProjects: async () => {
    set({ loading: true });
    try {
      const res = await api.get('projects/');
      set({ projects: res.data, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  createProject: async (name, description) => {
    const res = await api.post('projects/', { name, description });
    set({ projects: [res.data, ...get().projects] });
    return res.data;
  },

  getProject: async (id) => {
    set({ loading: true });
    try {
      const res = await api.get(`projects/${id}/`);
      set({ currentProject: res.data, loading: false });
      return res.data;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  addCollaborator: async (projectId, identifier) => {
    const res = await api.post(`projects/${projectId}/collaborators/`, { identifier, role: 'editor' });
    const current = get().currentProject;
    if (current && current.id === projectId) {
      set({ currentProject: { ...current, collaborators: [...(current.collaborators || []), res.data] } });
    }
    set({
      projects: get().projects.map(p =>
        p.id === projectId ? { ...p, collaborators: [...(p.collaborators || []), res.data] } : p
      )
    });
    return res.data;
  },

  removeCollaborator: async (projectId, userId) => {
    await api.delete(`projects/${projectId}/collaborators/${userId}/`);
    const current = get().currentProject;
    if (current && current.id === projectId) {
      set({ 
        currentProject: { 
          ...current, 
          collaborators: (current.collaborators || []).filter(c => c.user.id !== userId) 
        } 
      });
    }
    set({
      projects: get().projects.map(p =>
        p.id === projectId
          ? { ...p, collaborators: (p.collaborators || []).filter(c => c.user.id !== userId) }
          : p
      )
    });
  },

  deleteProject: async (id) => {
    await api.delete(`projects/${id}/`);
    set({
      projects: get().projects.filter(p => p.id !== id),
      currentProject: get().currentProject?.id === id ? null : get().currentProject,
    });
  },
}));
