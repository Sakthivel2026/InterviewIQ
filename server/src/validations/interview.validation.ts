import { z } from 'zod';

export const createInterviewSchema = z.object({
  role: z.string().min(2, 'Role description is required').max(150),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'lead']),
  difficulty: z.enum(['easy', 'medium', 'hard', 'faang']),
  interviewType: z.enum(['technical', 'behavioral', 'system-design', 'mixed']),
  resumeId: z.string().optional(),
  jdId: z.string().optional(),
});

export const submitAnswerSchema = z.object({
  questionId: z.string().min(1, 'Question ID is required'),
  answerText: z.string().min(1, 'Answer text cannot be empty'),
});

export const parseJdSchema = z.object({
  rawText: z.string().min(10, 'Job description text must be at least 10 characters long'),
  resumeId: z.string().optional(),
});
