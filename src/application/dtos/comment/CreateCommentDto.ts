export interface CreateCommentDto {
  content: string;
  blogPostId: string;
  parentId?: string;
}