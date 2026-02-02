import { apiService, ApiResponse } from './api.service';
import { User } from './auth.service';
import { Group } from './group.service';

export type PostType = 'post' | 'question' | 'story';
export type SortOption = 'newest' | 'popular' | 'discussed';

export interface Post {
  _id: string;
  author: User;
  content: string;
  postType: PostType;
  tags: string[];
  images?: string[];
  groupId?: string;
  group?: Group; // Group/community information
  likes: string[];
  commentsCount: number;
  isSaved?: boolean;
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

export interface GetPostsParams {
  page?: number;
  limit?: number;
  tag?: string;
  groupId?: string;
  postType?: PostType;
  sortBy?: SortOption;
}

class PostService {
  async getPosts(params: GetPostsParams = {}): Promise<ApiResponse<Post[]>> {
    const { page = 1, limit = 20, tag, groupId, postType, sortBy } = params;
    let endpoint = `/posts?page=${page}&limit=${limit}`;
    if (tag && tag !== 'all') endpoint += `&tag=${tag}`;
    if (groupId) endpoint += `&groupId=${groupId}`;
    if (postType) endpoint += `&postType=${postType}`;
    if (sortBy) endpoint += `&sortBy=${sortBy}`;
    
    return apiService.get<Post[]>(endpoint);
  }

  async getTrendingPosts(params: GetPostsParams = {}): Promise<ApiResponse<Post[]>> {
    const { page = 1, limit = 20, tag, postType } = params;
    let endpoint = `/posts/trending?page=${page}&limit=${limit}`;
    if (tag && tag !== 'all') endpoint += `&tag=${tag}`;
    if (postType) endpoint += `&postType=${postType}`;
    
    return apiService.get<Post[]>(endpoint);
  }

  async getFollowingPosts(params: GetPostsParams = {}): Promise<ApiResponse<Post[]>> {
    const { page = 1, limit = 20, tag, postType } = params;
    let endpoint = `/posts/following?page=${page}&limit=${limit}`;
    if (tag && tag !== 'all') endpoint += `&tag=${tag}`;
    if (postType) endpoint += `&postType=${postType}`;
    
    return apiService.get<Post[]>(endpoint);
  }

  // Get posts from joined groups (Reddit-style Home feed)
  async getJoinedGroupsPosts(params: GetPostsParams = {}): Promise<ApiResponse<Post[]>> {
    const { page = 1, limit = 20, tag, postType, sortBy } = params;
    let endpoint = `/posts/joined-groups?page=${page}&limit=${limit}`;
    if (tag && tag !== 'all') endpoint += `&tag=${tag}`;
    if (postType) endpoint += `&postType=${postType}`;
    if (sortBy) endpoint += `&sortBy=${sortBy}`;
    
    return apiService.get<Post[]>(endpoint);
  }

  async getSavedPosts(page: number = 1, limit: number = 20): Promise<ApiResponse<Post[]>> {
    return apiService.get<Post[]>(`/posts/saved?page=${page}&limit=${limit}`);
  }

  async savePost(id: string): Promise<ApiResponse<{ isSaved: boolean }>> {
    return apiService.post(`/posts/${id}/save`, {});
  }

  async searchPosts(query: string, params: GetPostsParams = {}): Promise<ApiResponse<Post[]>> {
    const { page = 1, limit = 20, postType } = params;
    let endpoint = `/posts/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;
    if (postType) endpoint += `&postType=${postType}`;
    
    return apiService.get<Post[]>(endpoint);
  }

  async getPost(id: string): Promise<ApiResponse<Post>> {
    return apiService.get<Post>(`/posts/${id}`);
  }

  async createPost(
    content: string,
    tags?: string[],
    groupId?: string,
    images?: string[],
    postType?: PostType
  ): Promise<ApiResponse<Post>> {
    return apiService.post<Post>('/posts', {
      content,
      tags,
      groupId,
      images,
      postType: postType || 'post',
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

