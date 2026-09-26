import { describe, it, expect } from 'vitest';
import { signupSchema, loginSchema } from '../validations/auth.validation';
import { createInterviewSchema, submitAnswerSchema } from '../validations/interview.validation';

describe('Zod Request Payload Validations', () => {
  describe('Signup Schema Validation', () => {
    it('should validate correct user signup details', () => {
      const validPayload = {
        name: 'Alice Smith',
        email: 'alice@example.com',
        password: 'securePassword123',
      };
      const result = signupSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email and short password', () => {
      const invalidPayload = {
        name: 'A',
        email: 'invalid-email',
        password: '123',
      };
      const result = signupSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });
  });

  describe('Interview Setup Schema Validation', () => {
    it('should validate valid interview creation parameters', () => {
      const validPayload = {
        role: 'Full-Stack Developer',
        experienceLevel: 'senior',
        difficulty: 'faang',
        interviewType: 'technical',
      };
      const result = createInterviewSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('should reject invalid experience level or missing role', () => {
      const invalidPayload = {
        role: '',
        experienceLevel: 'ninja',
        difficulty: 'super-hard',
        interviewType: 'random',
      };
      const result = createInterviewSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });
  });

  describe('Submit Answer Schema Validation', () => {
    it('should pass for non-empty questionId and answerText', () => {
      const payload = {
        questionId: 'q-12345',
        answerText: 'I handled query optimization using index hinting and pagination.',
      };
      const result = submitAnswerSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should reject empty answer text', () => {
      const payload = {
        questionId: 'q-12345',
        answerText: '',
      };
      const result = submitAnswerSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });
});
