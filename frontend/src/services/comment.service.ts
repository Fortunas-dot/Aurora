import { apiService, ApiResponse } from './api.service';
import { User } from './auth.service';

export interface Comment {
  _id: string;
  post: string;
  author: User;
  content: string;
  likes: string[];
  parentComment?: string; // ID of parent comment if this is a reply
  replies?: Comment[]; // Nested replies
  repliesCount?: number; // Number of replies
  createdAt: string;
  updatedAt: string;
}

class CommentService {
  async getCommentsForPost(
    postId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<Comment[]>> {
    return apiService.get<Comment[]>(`/comments/post/${postId}?page=${page}&limit=${limit}`);
  }

  async createComment(
    postId: string,
    content: string,
    parentCommentId?: string
  ): Promise<ApiResponse<Comment>> {
    return apiService.post<Comment>('/comments', {
      postId,
      content,
      parentCommentId,
    });
  }

  async replyToComment(
    commentId: string,
    content: string,
    postId: string
  ): Promise<ApiResponse<Comment>> {
    return apiService.post<Comment>('/comments', {
      postId,
      content,
      parentCommentId: commentId,
    });
  }

  async getReplies(
    commentId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<ApiResponse<Comment[]>> {
    return apiService.get<Comment[]>(`/comments/${commentId}/replies?page=${page}&limit=${limit}`);
  }

  async updateComment(
    id: string,
    content: string
  ): Promise<ApiResponse<Comment>> {
    return apiService.put<Comment>(`/comments/${id}`, {
      content,
    });
  }

  async deleteComment(id: string): Promise<ApiResponse<void>> {
    return apiService.delete(`/comments/${id}`);
  }

  async likeComment(id: string): Promise<ApiResponse<{ likes: number; isLiked: boolean }>> {
    return apiService.post(`/comments/${id}/like`, {});
  }

  async reportComment(id: string, reason: string): Promise<ApiResponse<void>> {
    return apiService.post(`/comments/${id}/report`, { reason });
  }
}

export const commentService = new CommentService();







