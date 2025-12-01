// Playlist Service for API calls
import api from '../config/axios';
import type { Video } from './videoService';

export type Playlist = {
  _id: string;
  name: string;
  description?: string;
  videos: Video[];
  thumbnail?: string;
  createdBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  isPublic: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  videoCount: number;
  duration: string;
};

export type GetPlaylistsParams = {
  search?: string;
  page?: number;
  limit?: number;
};

export type GetPlaylistsResponse = {
  success: boolean;
  data: Playlist[];
  pagination: {
    total: number;
    pages: number;
    page: number;
    limit: number;
  };
};

export type CreatePlaylistData = {
  name: string;
  description?: string;
  videos?: string[];
  thumbnail?: string;
  isPublic?: boolean;
};

// Get all playlists
export const getPlaylists = async (params: GetPlaylistsParams = {}): Promise<GetPlaylistsResponse> => {
  const queryParams = new URLSearchParams();
  if (params.search) queryParams.append('search', params.search);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  const response = await api.get(`/playlists?${queryParams.toString()}`);
  return response.data;
};

// Get single playlist by ID
export const getPlaylist = async (id: string): Promise<{ success: boolean; data: Playlist }> => {
  const response = await api.get(`/playlists/${id}`);
  return response.data;
};

// Create new playlist
export const createPlaylist = async (playlistData: CreatePlaylistData): Promise<{ success: boolean; data: Playlist }> => {
  const response = await api.post('/playlists', playlistData);
  return response.data;
};

// Update playlist
export const updatePlaylist = async (id: string, playlistData: Partial<CreatePlaylistData>): Promise<{ success: boolean; data: Playlist }> => {
  const response = await api.put(`/playlists/${id}`, playlistData);
  return response.data;
};

// Delete playlist
export const deletePlaylist = async (id: string): Promise<{ success: boolean; data: object }> => {
  const response = await api.delete(`/playlists/${id}`);
  return response.data;
};

// Add video to playlist
export const addVideoToPlaylist = async (playlistId: string, videoId: string): Promise<{ success: boolean; data: Playlist }> => {
  const response = await api.post(`/playlists/${playlistId}/videos`, { videoId });
  return response.data;
};

// Remove video from playlist
export const removeVideoFromPlaylist = async (playlistId: string, videoId: string): Promise<{ success: boolean; data: Playlist }> => {
  const response = await api.delete(`/playlists/${playlistId}/videos/${videoId}`);
  return response.data;
};

export default {
  getPlaylists,
  getPlaylist,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
};
