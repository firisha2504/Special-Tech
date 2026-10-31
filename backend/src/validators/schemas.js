import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const customerInquirySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  title: z.string().min(3, 'Project title is required'),
  message: z.string().min(10, 'Please provide more details about your requirements'),
  budget: z.string().optional().nullable(),
  preferredContact: z.string().optional().default('Email'),
  serviceId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  requirementId: z.string().optional().nullable(),
  prototypeVersionId: z.string().optional().nullable(),
});

export const contactMessageSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional().nullable(),
  subject: z.string().min(3, 'Subject is required'),
  serviceCategory: z.string().optional().nullable(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  budget: z.string().optional().nullable(),
});

export const aiChatSchema = z.object({
  conversationId: z.string().optional(),
  sessionToken: z.string().optional(),
  message: z.string().min(1, 'Message cannot be empty'),
  systemType: z.string().optional(),
});

export const prototypeModifySchema = z.object({
  prototypeId: z.string(),
  prompt: z.string().min(3, 'Modification instruction is required'),
});

export const projectSchema = z.object({
  title: z.string().min(2),
  slug: z.string().min(2),
  category: z.string(),
  shortDesc: z.string(),
  description: z.string(),
  features: z.array(z.string()).default([]),
  technologies: z.array(z.string()).default([]),
  screenshots: z.array(z.string()).default([]),
  status: z.string().default('Completed'),
  demoUrl: z.string().optional().nullable(),
  githubUrl: z.string().optional().nullable(),
  isFeatured: z.boolean().default(false),
  isPublished: z.boolean().default(true),
});
