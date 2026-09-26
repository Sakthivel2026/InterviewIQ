import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { evaluateAnswerWithClaude, generateFollowUpQuestionWithClaude } from '../ai/claude.service';
import { prisma } from '../utils/prisma';

const evaluateAnswerSchema = z.object({
  questionId: z.string().min(1, 'questionId required'),
  answerText: z.string().min(5, 'Answer text must be at least 5 characters long'),
});

export const evaluateAnswer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const parseResult = evaluateAnswerSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Validation Error', details: parseResult.error.errors });
      return;
    }

    const { questionId, answerText } = parseResult.data;

    const question = await prisma.interviewQuestion.findUnique({
      where: { id: questionId },
      include: {
        interview: true,
      },
    });

    if (!question || question.interview.userId !== userId) {
      res.status(404).json({ error: 'Not Found', message: 'Interview question record not found.' });
      return;
    }

    // Call Claude AI to evaluate candidate answer
    const evalResult = await evaluateAnswerWithClaude({
      questionText: question.questionText,
      questionType: question.questionType,
      answerText,
      role: question.interview.role,
      experienceLevel: question.interview.experienceLevel,
    });

    // Check for existing Answer record for this question to update/upsert
    let answerRecord = await prisma.answer.findFirst({
      where: { questionId: question.id },
    });

    if (answerRecord) {
      await prisma.answerEvaluation.deleteMany({ where: { answerId: answerRecord.id } });
      answerRecord = await prisma.answer.update({
        where: { id: answerRecord.id },
        data: { answerText },
      });
    } else {
      answerRecord = await prisma.answer.create({
        data: {
          questionId: question.id,
          answerText,
        },
      });
    }

    // Save AnswerEvaluation record
    const evaluationRecord = await prisma.answerEvaluation.create({
      data: {
        answerId: answerRecord.id,
        technicalScore: evalResult.technicalScore,
        relevanceScore: evalResult.relevanceScore,
        clarityScore: evalResult.clarityScore,
        completenessScore: evalResult.completenessScore,
        communicationScore: evalResult.communicationScore,
        overallScore: evalResult.overallScore,
        feedbackJson: JSON.stringify(evalResult.feedback),
      },
    });

    // Ensure interview status is set to in_progress
    if (question.interview.status === 'setup') {
      await prisma.interview.update({
        where: { id: question.interviewId },
        data: { status: 'in_progress' },
      });
    }

    let createdFollowUpQuestion: any = null;

    // Optionally inject adaptive AI follow-up question into interview sequence
    if (evalResult.shouldAskFollowUp) {
      try {
        const followUpData = await generateFollowUpQuestionWithClaude({
          questionText: question.questionText,
          answerText,
          role: question.interview.role,
        });

        const totalQuestions = await prisma.interviewQuestion.count({
          where: { interviewId: question.interviewId },
        });

        createdFollowUpQuestion = await prisma.interviewQuestion.create({
          data: {
            interviewId: question.interviewId,
            questionText: followUpData.questionText,
            questionType: 'follow_up',
            orderIndex: totalQuestions + 1,
          },
        });
      } catch (err) {
        console.warn('Failed to inject follow-up question:', err);
      }
    }

    res.status(200).json({
      message: 'Answer evaluated successfully.',
      evaluation: {
        id: evaluationRecord.id,
        answerId: answerRecord.id,
        technicalScore: evalResult.technicalScore,
        relevanceScore: evalResult.relevanceScore,
        clarityScore: evalResult.clarityScore,
        completenessScore: evalResult.completenessScore,
        communicationScore: evalResult.communicationScore,
        overallScore: evalResult.overallScore,
        feedback: evalResult.feedback,
      },
      followUpQuestion: createdFollowUpQuestion,
    });
  } catch (error) {
    console.error('Answer evaluation error:', error);
    res.status(500).json({ error: 'Internal Error', message: 'Failed to evaluate answer.' });
  }
};
