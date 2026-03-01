import { apiService, ApiResponse } from './api.service';
import { User } from './auth.service';
import { Group } from './group.service';

// Helper function to normalize URLs to absolute URLs
const normalizeUrl = (url: string | undefined): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const baseUrl = 'https://aurora-production.up.railway.app';
  const relativeUrl = url.startsWith('/') ? url : `/${url}`;
  return `${baseUrl}${relativeUrl}`;
};

// Helper function to normalize post data (images and video URLs)
const normalizePost = (post: Post): Post => {
  return {
    ...post,
    images: post.images?.map(img => normalizeUrl(img) || img).filter((img): img is string => !!img),
    video: normalizeUrl(post.video),
    author: {
      ...post.author,
      avatar: normalizeUrl(post.author.avatar),
    },
  };
};

// Helper function to normalize array of posts
const normalizePosts = (posts: Post[]): Post[] => {
  return posts.map(normalizePost);
};

export type PostType = 'post' | 'question' | 'story';
export type SortOption = 'newest' | 'popular' | 'discussed';

export interface Post {
  _id: string;
  author: User;
  title?: string;
  content: string;
  postType: PostType;
  tags: string[];
  images?: string[];
  video?: string;
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
  publicOnly?: boolean;
}

class PostService {
  async getPosts(params: GetPostsParams = {}): Promise<ApiResponse<Post[]>> {
    const { page = 1, limit = 20, tag, groupId, postType, sortBy, publicOnly } = params;
    let endpoint = `/posts?page=${page}&limit=${limit}`;
    if (tag && tag !== 'all') endpoint += `&tag=${tag}`;
    if (groupId) endpoint += `&groupId=${groupId}`;
    if (postType) endpoint += `&postType=${postType}`;
    if (sortBy) endpoint += `&sortBy=${sortBy}`;
    if (publicOnly) endpoint += `&publicOnly=true`;
    
    const response = await apiService.get<Post[]>(endpoint);
    if (response.success && response.data) {
      // #region agent log
      const samplePost = response.data[0];
      if (samplePost) {
        fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'post.service.ts:47',message:'getPosts - URLs from backend BEFORE normalization',data:{postId:samplePost._id, images:samplePost.images, video:samplePost.video, imagesSample:samplePost.images?.[0], imagesAreAbsolute:samplePost.images?.map((u: string) => u?.startsWith('http')), videoIsAbsolute:samplePost.video?.startsWith('http')},timestamp:Date.now(),runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      }
      const normalized = normalizePosts(response.data);
      if (normalized[0]) {
        fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'post.service.ts:56',message:'getPosts - URLs AFTER normalization',data:{postId:normalized[0]._id, images:normalized[0].images, video:normalized[0].video, imagesSample:normalized[0].images?.[0], imagesAreAbsolute:normalized[0].images?.map((u: string) => u?.startsWith('http')), videoIsAbsolute:normalized[0].video?.startsWith('http')},timestamp:Date.now(),runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      }
      return {
        ...response,
        data: normalized,
      };
      // #endregion
    }
    return response;
  }

  async getTrendingPosts(params: GetPostsParams = {}): Promise<ApiResponse<Post[]>> {
    const { page = 1, limit = 20, tag, groupId, postType } = params;
    let endpoint = `/posts/trending?page=${page}&limit=${limit}`;
    if (tag && tag !== 'all') endpoint += `&tag=${tag}`;
    if (groupId) endpoint += `&groupId=${groupId}`;
    if (postType) endpoint += `&postType=${postType}`;
    
    const response = await apiService.get<Post[]>(endpoint);
    if (response.success && response.data) {
      return {
        ...response,
        data: normalizePosts(response.data),
      };
    }
    return response;
  }

  async getFollowingPosts(params: GetPostsParams = {}): Promise<ApiResponse<Post[]>> {
    const { page = 1, limit = 20, tag, postType } = params;
    let endpoint = `/posts/following?page=${page}&limit=${limit}`;
    if (tag && tag !== 'all') endpoint += `&tag=${tag}`;
    if (postType) endpoint += `&postType=${postType}`;
    
    const response = await apiService.get<Post[]>(endpoint);
    if (response.success && response.data) {
      return {
        ...response,
        data: normalizePosts(response.data),
      };
    }
    return response;
  }

  // Get posts from joined groups (Reddit-style Home feed)
  async getJoinedGroupsPosts(params: GetPostsParams = {}): Promise<ApiResponse<Post[]>> {
    const { page = 1, limit = 20, tag, groupId, postType, sortBy } = params;
    let endpoint = `/posts/joined-groups?page=${page}&limit=${limit}`;
    if (tag && tag !== 'all') endpoint += `&tag=${tag}`;
    if (groupId) endpoint += `&groupId=${groupId}`;
    if (postType) endpoint += `&postType=${postType}`;
    if (sortBy) endpoint += `&sortBy=${sortBy}`;
    
    const response = await apiService.get<Post[]>(endpoint);
    if (response.success && response.data) {
      return {
        ...response,
        data: normalizePosts(response.data),
      };
    }
    return response;
  }

  async getSavedPosts(page: number = 1, limit: number = 20): Promise<ApiResponse<Post[]>> {
    const response = await apiService.get<Post[]>(`/posts/saved?page=${page}&limit=${limit}`);
    if (response.success && response.data) {
      return {
        ...response,
        data: normalizePosts(response.data),
      };
    }
    return response;
  }

  async getUserPosts(userId: string, page: number = 1, limit: number = 20): Promise<ApiResponse<Post[]>> {
    const response = await apiService.get<Post[]>(`/users/${userId}/posts?page=${page}&limit=${limit}`);
    if (response.success && response.data) {
      return {
        ...response,
        data: normalizePosts(response.data),
      };
    }
    return response;
  }

  async savePost(id: string): Promise<ApiResponse<{ isSaved: boolean }>> {
    return apiService.post(`/posts/${id}/save`, {});
  }

  async searchPosts(query: string, params: GetPostsParams = {}): Promise<ApiResponse<Post[]>> {
    const { page = 1, limit = 20, postType } = params;
    let endpoint = `/posts/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;
    if (postType) endpoint += `&postType=${postType}`;
    
    const response = await apiService.get<Post[]>(endpoint);
    if (response.success && response.data) {
      return {
        ...response,
        data: normalizePosts(response.data),
      };
    }
    return response;
  }

  async getPost(id: string): Promise<ApiResponse<Post>> {
    const response = await apiService.get<Post>(`/posts/${id}`);
    if (response.success && response.data) {
      return {
        ...response,
        data: normalizePost(response.data),
      };
    }
    return response;
  }

  async createPost(
    content: string,
    tags?: string[],
    groupId?: string,
    images?: string[],
    postType?: PostType,
    title?: string,
    video?: string
  ): Promise<ApiResponse<Post>> {
    const response = await apiService.post<Post>('/posts', {
      title,
      content,
      tags,
      groupId,
      images,
      video,
      postType: postType || 'post',
    });
    if (response.success && response.data) {
      return {
        ...response,
        data: normalizePost(response.data),
      };
    }
    return response;
  }

  async updatePost(
    id: string,
    content: string,
    tags?: string[],
    title?: string
  ): Promise<ApiResponse<Post>> {
    return apiService.put<Post>(`/posts/${id}`, {
      title,
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

