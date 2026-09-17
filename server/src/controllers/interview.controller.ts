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

    // Call Claude AI to generate 8-10 personalized questions
    const generatedQuestions = await generateQuestionsWithClaude({
      role,
      experienceLevel,
      difficulty,
      interviewType,
      resumeParsed,
      jdParsed,
    });

    // Create Interview record in DB
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
          create: generatedQuestions.map((q, idx) => ({
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

