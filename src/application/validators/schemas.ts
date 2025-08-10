import Joi from 'joi';
import { PostStatus } from '../../domain/enums/PostStatus';
import { CommentStatus } from '../../domain/enums/CommentStatus';
import { UserRole } from '../../domain/enums/UserRole';

export const authSchemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    username: Joi.string().alphanum().min(3).max(30).required(),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    password: Joi.string().min(6).required(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

export const blogPostSchemas = {
  create: Joi.object({
    title: Joi.string().min(5).max(200).required(),
    content: Joi.string().min(50).required(),
    excerpt: Joi.string().max(500).optional(),
    categoryId: Joi.string().required(),
    tags: Joi.array().items(Joi.string()).optional(),
    featuredImage: Joi.string().uri().optional(),
    images: Joi.array().items(Joi.string().uri()).optional(),
    status: Joi.string().valid(...Object.values(PostStatus)).optional(),
    isPublished: Joi.boolean().optional(),
  }),

  update: Joi.object({
    title: Joi.string().min(5).max(200).optional(),
    content: Joi.string().min(50).optional(),
    excerpt: Joi.string().max(500).optional(),
    categoryId: Joi.string().optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    featuredImage: Joi.string().uri().optional(),
    images: Joi.array().items(Joi.string().uri()).optional(),
    status: Joi.string().valid(...Object.values(PostStatus)).optional(),
    isPublished: Joi.boolean().optional(),
  }),
};

export const categorySchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    description: Joi.string().max(200).optional(),
    color: Joi.string().pattern(/^#[0-9a-fA-F]{6}$/).optional(),
    icon: Joi.string().max(50).optional(),
    sortOrder: Joi.number().integer().min(0).optional(),
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(50).optional(),
    description: Joi.string().max(200).optional(),
    color: Joi.string().pattern(/^#[0-9a-fA-F]{6}$/).optional(),
    icon: Joi.string().max(50).optional(),
    sortOrder: Joi.number().integer().min(0).optional(),
    isActive: Joi.boolean().optional(),
  }),

  sortOrder: Joi.object({
    sortOrder: Joi.number().integer().min(0).required(),
  }),

   bulkSortOrder: Joi.object({
    categories: Joi.array()
      .items(
        Joi.object({
          id: Joi.string().uuid().required(),
          sortOrder: Joi.number().integer().min(0).required(),
        })
      )
      .min(1)
      .max(100)
      .required(),
  }),
};

export const commentSchemas = {
  create: Joi.object({
    content: Joi.string().min(10).max(1000).required(),
    blogPostId: Joi.string().required(),
    parentId: Joi.string().optional(),
  }),

  update: Joi.object({
    content: Joi.string().min(10).max(1000).optional(),
    status: Joi.string().valid(...Object.values(CommentStatus)).optional(),
  }),
};

export const userSchemas = {
  updateProfile: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).optional(),
    firstName: Joi.string().min(2).max(50).optional(),
    lastName: Joi.string().min(2).max(50).optional(),
    bio: Joi.string().max(500).optional(),
    avatar: Joi.string().uri().optional(),
  }),

  createUser: Joi.object({
    email: Joi.string().email().required(),
    username: Joi.string().alphanum().min(3).max(30).required(),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    password: Joi.string().min(6).required(),
    bio: Joi.string().max(500).optional(),
    avatar: Joi.string().uri().optional(),
    role: Joi.string().valid(...Object.values(UserRole)).optional(),
  }),
};