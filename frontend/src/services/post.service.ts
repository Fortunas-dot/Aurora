import { apiService, ApiResponse } from './api.service';
import { User } from './auth.service';
import { Group } from './group.service';

// Helper function to normalize URLs to absolute URLs
const normalizeUrl = (url: string | undefined): string | undefined => {
  if (!url || typeof url !== 'string' || url.trim() === '') return undefined;
  
  // Remove any whitespace
  const trimmedUrl = url.trim();
  
  // If already absolute, return as-is
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    return trimmedUrl;
  }
  
  // If relative, make it absolute
  const baseUrl = 'https://aurora-production.up.railway.app';
  
  // Ensure the relative URL starts with /
  let relativeUrl = trimmedUrl;
  if (!relativeUrl.startsWith('/')) {
    relativeUrl = `/${relativeUrl}`;
  }
  
  // Remove any double slashes (except after http:// or https://)
  const normalized = `${baseUrl}${relativeUrl}`.replace(/([^:]\/)\/+/g, '$1');
  
  return normalized;
};

// Helper function to normalize post data (images and video URLs)
// Export it so it can be used in components for state updates
export const normalizePost = (post: Post): Post => {
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'post.service.ts:33',message:'normalizePost - Input URLs',data:{postId:post._id,images:post.images,video:post.video,imagesSample:post.images?.[0],imagesAreAbsolute:post.images?.map((u:string)=>u?.startsWith('http')),videoIsAbsolute:post.video?.startsWith('http')},timestamp:Date.now(),runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  const normalized: Post = {
    ...post,
    images: post.images?.map(img => normalizeUrl(img) || img).filter((img): img is string => !!img),
    video: normalizeUrl(post.video),
    author: {
      ...post.author,
      avatar: normalizeUrl(post.author.avatar),
    },
  };
  
  // Normalize group avatar if present
  if (post.group && post.group.avatar) {
    normalized.group = {
      ...post.group,
      avatar: normalizeUrl(post.group.avatar),
    };
  }
  
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'post.service.ts:50',message:'normalizePost - Output URLs',data:{postId:normalized._id,images:normalized.images,video:normalized.video,imagesSample:normalized.images?.[0],imagesAreAbsolute:normalized.images?.map((u:string)=>u?.startsWith('http')),videoIsAbsolute:normalized.video?.startsWith('http')},timestamp:Date.now(),runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  return normalized;
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
      // Log ALL posts with media to see exact URLs from backend
      const mediaPosts = response.data.filter((p: Post) => (p.images && p.images.length > 0) || p.video);
      mediaPosts.forEach((p: Post) => {
        fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'post.service.ts:getPosts',message:'getPosts - Post with media from API',data:{postId:p._id,images:p.images,video:p.video,authorAvatar:p.author?.avatar},timestamp:Date.now(),runId:'run2',hypothesisId:'H3'})}).catch(()=>{});
        // Also do HTTP probe on each media URL to check if files actually exist
        const urlsToProbe = [...(p.images || []), p.video].filter(Boolean) as string[];
        urlsToProbe.forEach(url => {
          const absoluteUrl = url.startsWith('http') ? url : `https://aurora-production.up.railway.app${url.startsWith('/') ? url : '/' + url}`;
          fetch(absoluteUrl, { method: 'HEAD' })
            .then(resp => {
              fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'post.service.ts:probe',message:'HTTP probe on media URL',data:{url:absoluteUrl,httpStatus:resp.status,httpStatusText:resp.statusText,contentType:resp.headers.get('content-type'),contentLength:resp.headers.get('content-length')},timestamp:Date.now(),runId:'run2',hypothesisId:'H1'})}).catch(()=>{});
            })
            .catch(err => {
              fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'post.service.ts:probe',message:'HTTP probe FAILED on media URL',data:{url:absoluteUrl,error:String(err)},timestamp:Date.now(),runId:'run2',hypothesisId:'H1'})}).catch(()=>{});
            });
        });
      });
      // #endregion
      const normalized = normalizePosts(response.data);
      return {
        ...response,
        data: normalized,
      };
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

