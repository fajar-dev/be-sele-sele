import { z } from 'zod';

export const createPageSchema = z.object({
  title: z.string().min(1).max(255),
  icon: z.string().max(255).optional(),
  description: z.string().optional(),
});

export const updatePageSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  icon: z.string().max(255).optional(),
  description: z.string().optional(),
});
