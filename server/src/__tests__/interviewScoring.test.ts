import { describe, it, expect } from 'vitest';
import { generateFinalReportWithClaude, evaluateAnswerWithClaude } from '../ai/claude.service';

describe('Interview Aggregated Scoring Logic', () => {
  it('should compute weighted radar scores and readiness percentage from evaluations', async () => {
    const mockInput = {
      role: 'Senior Backend Engineer',
      experienceLevel: 'senior',
      difficulty: 'hard',
      interviewType: 'technical',
      questionsWithEvaluations: [
        {
          questionText: 'Explain database indexing tradeoffs.',
          answerText: 'Adding composite B-Tree indexes speeds up query execution but adds write overhead on high-frequency INSERTs.',
          evaluation: {
            technicalScore: 90,
            relevanceScore: 95,
            clarityScore: 90,
            completenessScore: 85,
            communicationScore: 90,
            overallScore: 90,
            feedback: {
              summary: 'Great response',
              strengths: ['Clear explanation'],
              areasForImprovement: [],
              idealAnswerDraft: 'Ideal answer content',
            },
          },
        },
        {
          questionText: 'How do you handle microservices rate limiting?',
          answerText: 'We use Redis token bucket algorithm deployed at the API gateway layer.',
          evaluation: {
            technicalScore: 85,
            relevanceScore: 90,
            clarityScore: 85,
            completenessScore: 80,
            communicationScore: 85,
            overallScore: 85,
            feedback: {
              summary: 'Good response',
              strengths: ['Practical experience'],
              areasForImprovement: [],
              idealAnswerDraft: 'Ideal answer content',
            },
          },
        },
      ],
    };

    const report = await generateFinalReportWithClaude(mockInput as any);

    expect(report.overallScore).toBe(88);
    expect(report.readinessPercent).toBe(88);
    expect(report.radarScores.technical).toBe(88);
    expect(report.answeredCount).toBe(2);
    expect(report.totalQuestions).toBe(2);
  });

  it('should return 0 readiness and 0 overall score for 0 of 8 answered questions', async () => {
    const questionsWithEvaluations = Array.from({ length: 8 }, (_, i) => ({
      questionText: `Question ${i + 1}`,
      questionType: 'technical',
    }));

    const report = await generateFinalReportWithClaude({
      role: 'Full-Stack Developer',
      experienceLevel: 'mid',
      difficulty: 'medium',
      interviewType: 'technical',
      questionsWithEvaluations,
    } as any);

    expect(report.overallScore).toBe(0);
    expect(report.readinessPercent).toBe(0);
    expect(report.answeredCount).toBe(0);
    expect(report.totalQuestions).toBe(8);
    expect(report.radarScores.technical).toBe(0);
    expect(report.executiveSummary).toContain('0 of 8');
  });

  it('should derive score ONLY from the 1 answered question for 1 of 8 case', async () => {
    const questionsWithEvaluations = Array.from({ length: 8 }, (_, i) => {
      if (i === 0) {
        return {
          questionText: 'Question 1',
          questionType: 'technical',
          answerText: 'Detailed answer to question 1',
          evaluation: {
            technicalScore: 80,
            relevanceScore: 80,
            clarityScore: 80,
            completenessScore: 80,
            communicationScore: 80,
            overallScore: 80,
          },
        };
      }
      return {
        questionText: `Question ${i + 1}`,
        questionType: 'technical',
      };
    });

    const report = await generateFinalReportWithClaude({
      role: 'Software Engineer',
      experienceLevel: 'mid',
      difficulty: 'medium',
      interviewType: 'technical',
      questionsWithEvaluations,
    } as any);

    expect(report.overallScore).toBe(80);
    expect(report.readinessPercent).toBe(80);
    expect(report.answeredCount).toBe(1);
    expect(report.totalQuestions).toBe(8);
  });

  it('should produce meaningfully different scores for excellent, partial, and wrong answers without clustering around 77', async () => {
    const excellentResult = await evaluateAnswerWithClaude({
      questionText: 'Explain database indexing tradeoffs and migration safety under zero-downtime requirements.',
      questionType: 'technical',
      answerText: 'Adding composite B-Tree indexes speeds up query execution for read-heavy workloads but introduces write overhead on high-frequency INSERT spikes. To maintain zero-downtime migration safety, we use online DDL tools like pg_repack or ghost to create indexes concurrently without holding exclusive table locks.',
      role: 'Senior Software Engineer',
      experienceLevel: 'senior',
    });

    const partialResult = await evaluateAnswerWithClaude({
      questionText: 'How do you handle microservices rate limiting?',
      questionType: 'technical',
      answerText: 'We put a rate limit at the gateway so users cannot send too many requests.',
      role: 'Software Engineer',
      experienceLevel: 'mid',
    });

    const wrongResult = await evaluateAnswerWithClaude({
      questionText: 'Explain React useEffect cleanups and memory leak prevention.',
      questionType: 'technical',
      answerText: 'I like baking pizza on weekends with extra cheese.',
      role: 'Frontend Engineer',
      experienceLevel: 'mid',
    });

    // Verify scores differ meaningfully across answer qualities
    expect(excellentResult.overallScore).toBeGreaterThanOrEqual(80);
    expect(partialResult.overallScore).toBeGreaterThanOrEqual(40);
    expect(partialResult.overallScore).toBeLessThan(75);
    expect(wrongResult.overallScore).toBeLessThan(35);

    // Verify feedback summary is answer-grounded
    expect(excellentResult.feedback.summary).not.toContain('77');
    expect(wrongResult.feedback.summary).toContain('lacks relevance');
  });
});

