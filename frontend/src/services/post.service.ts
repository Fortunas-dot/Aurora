import { apiService, ApiResponse } from './api.service';
import { User } from './auth.service';

export interface Post {
  _id: string;
  author: User;
  content: string;
  tags: string[];
  groupId?: string;
  likes: string[];
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PostsResponse {
  posts: Post[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class PostService {
  async getPosts(
    page: number = 1,
    limit: number = 20,
    tag?: string,
    groupId?: string
  ): Promise<ApiResponse<Post[]>> {
    let endpoint = `/posts?page=${page}&limit=${limit}`;
    if (tag) endpoint += `&tag=${tag}`;
    if (groupId) endpoint += `&groupId=${groupId}`;
    
    return apiService.get<Post[]>(endpoint);
  }

  async getPost(id: string): Promise<ApiResponse<Post>> {
    return apiService.get<Post>(`/posts/${id}`);
  }

  async createPost(
    content: string,
    tags?: string[],
    groupId?: string
  ): Promise<ApiResponse<Post>> {
    return apiService.post<Post>('/posts', {
      content,
      tags,
      groupId,
    });
  }

  async updatePost(
    id: string,
    content: string,
    tags?: string[]
  ): Promise<ApiResponse<Post>> {
    return apiService.put<Post>(`/posts/${id}`, {
      content,
      tags,
    });
  }

  async deletePost(id: string): Promise<ApiResponse<void>> {
    return apiService.delete(`/posts/${id}`);
  }

  async likePost(id: string): Promise<ApiResponse<{ likes: number; isLiked: boolean }>> {
    return apiService.post(`/posts/${id}/like`, {});
  }

  async reportPost(id: string, reason: string): Promise<ApiResponse<void>> {
    return apiService.post(`/posts/${id}/report`, { reason });
  }
}

export const postService = new PostService();

