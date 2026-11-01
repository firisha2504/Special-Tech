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
  title: z.string().min(2, 'Project title is required'),
  slug: z.string().min(2, 'Valid slug is required'),
  category: z.string().min(2, 'Category is required'),
  shortDesc: z.string().min(5, 'Short description is required'),
  description: z.string().min(10, 'Full description is required'),
  coverImage: z.string().optional().nullable(),
  clientName: z.string().optional().nullable(),
  completionDate: z.string().or(z.date()).optional().nullable(),
  challenges: z.string().optional().nullable(),
  solutions: z.string().optional().nullable(),
  features: z.array(z.string()).default([]),
  technologies: z.array(z.string()).default([]),
  screenshots: z.array(z.string()).default([]),
  status: z.string().default('Published'),
  demoUrl: z.string().optional().nullable(),
  githubUrl: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  progress: z.number().or(z.string()).transform((val) => Number(val) || 0).optional().default(0),
  isFeatured: z.boolean().default(false),
  isPublished: z.boolean().default(true),
});

export const productPlanSchema = z.object({
  name: z.string().min(2, 'Plan name is required'),
  price: z.number().or(z.string()).transform((val) => Number(val)),
  billingInterval: z.string().default('monthly'),
  features: z.array(z.string()).default([]),
  isPopular: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const productSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  slug: z.string().min(2, 'Valid slug is required'),
  category: z.string().min(2, 'Category is required'),
  shortDesc: z.string().min(5, 'Short description is required'),
  description: z.string().min(10, 'Full description is required'),
  logoUrl: z.string().optional().nullable(),
  coverImage: z.string().optional().nullable(),
  screenshots: z.array(z.string()).default([]),
  features: z.array(z.string()).default([]),
  technologies: z.array(z.string()).default([]),
  targetAudience: z.string().optional().nullable(),
  benefits: z.array(z.string()).default([]),
  docsUrl: z.string().optional().nullable(),
  demoUrl: z.string().optional().nullable(),
  howItWorks: z.string().optional().nullable(),
  faqs: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
  status: z.string().default('Published'),
  isFeatured: z.boolean().default(false),
  isPublished: z.boolean().default(true),
  plans: z.array(productPlanSchema).optional().default([]),
});

export const demoRequestSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  productId: z.string().optional().nullable(),
  productName: z.string().optional().nullable(),
  requirements: z.string().optional().nullable(),
});

export const demoRequestStatusSchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'SCHEDULED', 'COMPLETED', 'CANCELLED']),
  internalNotes: z.string().optional().nullable(),
  scheduledAt: z.string().or(z.date()).optional().nullable(),
});
