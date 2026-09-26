import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { generateQuestionsWithClaude, generateFinalReportWithClaude } from '../ai/claude.service';
import { prisma } from '../utils/prisma';

const createInterviewSchema = z.object({
  role: z.string().min(2, 'Role title required'),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'lead']),
  difficulty: z.enum(['easy', 'medium', 'hard', 'faang']),
  interviewType: z.enum(['technical', 'behavioral', 'system-design', 'mixed']),
  resumeId: z.string().optional(),
  jdId: z.string().optional(),
});

const calculateSimilarity = (str1: string, str2: string): number => {
  const stopWords = new Set(['the', 'is', 'at', 'which', 'on', 'you', 'your', 'how', 'what', 'would', 'can', 'with', 'from', 'for', 'in', 'of', 'and', 'or', 'a', 'an', 'to', 'this', 'that', 'role', 'worked']);
  const tokenize = (s: string) =>
    new Set(
      s.toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2 && !stopWords.has(w))
    );
  const t1 = tokenize(str1);
  const t2 = tokenize(str2);
  if (t1.size === 0 || t2.size === 0) return 0;
  let intersection = 0;
  t1.forEach((val) => {
    if (t2.has(val)) intersection++;
  });
  return intersection / (t1.size + t2.size - intersection);
};

export const createInterview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const parseResult = createInterviewSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Validation Error', details: parseResult.error.errors });
      return;
    }

    const { role, experienceLevel, difficulty, interviewType, resumeId, jdId } = parseResult.data;

    let resumeParsed: any = null;
    let jdParsed: any = null;

    if (resumeId) {
      const resumeRecord = await prisma.resume.findFirst({ where: { id: resumeId, userId } });
      if (resumeRecord) {
        resumeParsed = JSON.parse(resumeRecord.parsedJson);
      }
    }

    if (!resumeParsed) {
      // Fallback if no specific resume selected: grab latest user resume
      const latestResume = await prisma.resume.findFirst({
        where: { userId },
        orderBy: { uploadedAt: 'desc' },
      });
      if (latestResume) {
        resumeParsed = JSON.parse(latestResume.parsedJson);
      }
    }

    if (jdId) {
      const jdRecord = await prisma.jobDescription.findFirst({ where: { id: jdId, userId } });
      if (jdRecord) {
        jdParsed = JSON.parse(jdRecord.parsedJson);
      }
    }

    // Fetch prior questions for candidate/JD combination to prevent repetitive questions
    const priorQuestionRecords = await prisma.interviewQuestion.findMany({
      where: {
        interview: {
          userId,
          ...(jdId ? { jdId } : {}),
        },
      },
      select: { questionText: true },
      orderBy: { createdAt: 'desc' },
      take: 60,
    });
    const previousQuestionTexts = priorQuestionRecords.map((q) => q.questionText);

    // Call Claude AI (or fallback) to generate fresh personalized questions avoiding history
    const rawQuestions = await generateQuestionsWithClaude({
      role,
      experienceLevel,
      difficulty,
      interviewType,
      resumeParsed,
      jdParsed,
      previousQuestions: previousQuestionTexts,
    });

    // Deduplicate generated questions against history and within batch
    const dedupedQuestions: typeof rawQuestions = [];
    for (const q of rawQuestions) {
      const isDuplicateOfHistory = previousQuestionTexts.some(
        (prevText) => calculateSimilarity(q.questionText, prevText) > 0.45
      );
      const isDuplicateOfBatch = dedupedQuestions.some(
        (accepted) => calculateSimilarity(q.questionText, accepted.questionText) > 0.45
      );

      if (!isDuplicateOfHistory && !isDuplicateOfBatch) {
        dedupedQuestions.push(q);
      }
    }

    // Ensure we have at least 8 questions by appending non-batch-duplicate candidates
    let finalQuestions = dedupedQuestions;
    if (finalQuestions.length < 8) {
      for (const q of rawQuestions) {
        if (!finalQuestions.includes(q)) {
          finalQuestions.push(q);
        }
        if (finalQuestions.length >= 8) break;
      }
    }

    // Create unique Interview record in DB (fresh session ID per interview)
    const interview = await prisma.interview.create({
      data: {
        userId,
        resumeId: resumeId || null,
        jdId: jdId || null,
        role,
        experienceLevel,
        difficulty,
        interviewType,
        status: 'setup',
        questions: {
          create: finalQuestions.map((q, idx) => ({
            questionText: q.questionText,
            questionType: q.questionType || 'technical',
            orderIndex: idx + 1,
          })),
        },
      },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    res.status(201).json({
      message: 'Interview session and personalized questions created successfully.',
      interview,
    });
  } catch (error) {
    console.error('Create interview error:', error);
    res.status(500).json({ error: 'Internal Error', message: 'Failed to create interview session.' });
  }
};

export const getInterviewById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const targetId = req.params.id as string;

    const interview = await prisma.interview.findFirst({
      where: { id: targetId, userId },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
          include: {
            answers: {
              include: {
                evaluation: true,
              },
            },
          },
        },
        resume: true,
        jd: true,
      },
    });

    if (!interview) {
      res.status(404).json({ error: 'Not Found', message: 'Interview session not found.' });
      return;
    }

    res.status(200).json({ interview });
  } catch (error) {
    res.status(500).json({ error: 'Internal Error' });
  }
};

export const getUserInterviews = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const interviews = await prisma.interview.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        questions: true,
      },
    });

    res.status(200).json({ interviews });
  } catch (error) {
    res.status(500).json({ error: 'Internal Error' });
  }
};

export const finishInterviewAndGenerateReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const targetId = req.params.id as string;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const interview = await prisma.interview.findFirst({
      where: { id: targetId, userId },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
          include: {
            answers: {
              include: {
                evaluation: true,
              },
            },
          },
        },
      },
    });

    if (!interview) {
      res.status(404).json({ error: 'Not Found', message: 'Interview session not found.' });
      return;
    }

    const questionsWithEvaluations = interview.questions.map((q: any) => {
      const ans = q.answers[0];
      return {
        questionText: q.questionText,
        questionType: q.questionType,
        answerText: ans?.answerText,
        evaluation: ans?.evaluation
          ? {
              technicalScore: ans.evaluation.technicalScore,
              relevanceScore: ans.evaluation.relevanceScore,
              clarityScore: ans.evaluation.clarityScore,
              completenessScore: ans.evaluation.completenessScore,
              communicationScore: ans.evaluation.communicationScore,
              overallScore: ans.evaluation.overallScore,
              feedback: JSON.parse(ans.evaluation.feedbackJson || '{}'),
            }
          : undefined,
      };
    });

    const report = await generateFinalReportWithClaude({
      role: interview.role,
      experienceLevel: interview.experienceLevel,
      difficulty: interview.difficulty,
      interviewType: interview.interviewType,
      questionsWithEvaluations,
    });

    const updatedInterview = await prisma.interview.update({
      where: { id: interview.id },
      data: {
        status: 'completed',
        overallScore: report.overallScore,
        readinessPercent: report.readinessPercent,
        summaryJson: JSON.stringify(report),
        completedAt: new Date(),
      },
    });

    res.status(200).json({
      message: 'Interview session completed and report generated successfully.',
      interview: updatedInterview,
      report,
    });
  } catch (error) {
    console.error('Finish interview error:', error);
    res.status(500).json({ error: 'Internal Error', message: 'Failed to generate interview report.' });
  }
};

