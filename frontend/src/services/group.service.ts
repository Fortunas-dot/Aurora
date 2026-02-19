import { apiService, ApiResponse } from './api.service';
import { User } from './auth.service';

export interface Group {
  _id: string;
  name: string;
  description: string;
  tags: string[];
  memberCount: number;
  isPrivate: boolean;
  isMember: boolean;
  isAdmin?: boolean;
  admins?: User[];
  members?: User[];
  country?: string;
  avatar?: string;
  coverImage?: string;
  healthCondition?: string;
  createdAt: string;
}

class GroupService {
  async getGroups(
    page: number = 1,
    limit: number = 20,
    search?: string,
    tag?: string,
    country?: string,
    healthCondition?: string
  ): Promise<ApiResponse<Group[]>> {
    let endpoint = `/groups?page=${page}&limit=${limit}`;
    if (search) endpoint += `&search=${encodeURIComponent(search)}`;
    if (tag) endpoint += `&tag=${encodeURIComponent(tag)}`;
    if (country) endpoint += `&country=${encodeURIComponent(country)}`;
    if (healthCondition) endpoint += `&healthCondition=${encodeURIComponent(healthCondition)}`;
    
    return apiService.get<Group[]>(endpoint);
  }

  async getGroup(id: string): Promise<ApiResponse<Group>> {
    return apiService.get<Group>(`/groups/${id}`);
  }

  async createGroup(
    name: string,
    description: string,
    tags?: string[],
    isPrivate?: boolean,
    country?: string,
    avatar?: string,
    coverImage?: string,
    healthCondition?: string
  ): Promise<ApiResponse<Group>> {
    return apiService.post<Group>('/groups', {
      name,
      description,
      tags,
      isPrivate,
      country,
      avatar,
      coverImage,
      healthCondition,
    });
  }

  async joinGroup(id: string): Promise<ApiResponse<{ memberCount: number; isMember: boolean }>> {
    return apiService.post(`/groups/${id}/join`, {});
  }

  async leaveGroup(id: string): Promise<ApiResponse<{ memberCount: number; isMember: boolean }>> {
    return apiService.post(`/groups/${id}/leave`, {});
  }

  async updateGroup(
    id: string,
    data: {
      name?: string;
      description?: string;
      tags?: string[];
      isPrivate?: boolean;
      country?: string;
      avatar?: string;
      coverImage?: string;
      healthCondition?: string;
    }
  ): Promise<ApiResponse<Group>> {
    return apiService.put<Group>(`/groups/${id}`, data);
  }

  async getGroupPosts(
    id: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<any[]>> {
    return apiService.get<any[]>(`/groups/${id}/posts?page=${page}&limit=${limit}`);
  }

  async reportGroup(id: string, reason: string): Promise<ApiResponse<void>> {
    return apiService.post<void>(`/groups/${id}/report`, { reason });
  }
}

export const groupService = new GroupService();






