import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { parseJdWithClaude } from '../ai/claude.service';
import { computeSkillMatch } from '../services/matchEngine';
import { prisma } from '../utils/prisma';

export const parseJobDescription = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { rawText } = req.body;
    if (!rawText || rawText.trim().length < 20) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Job description content is too short. Please provide a complete job posting.',
      });
      return;
    }

    const parsedJd = await parseJdWithClaude(rawText);

    const jdRecord = await prisma.jobDescription.create({
      data: {
        userId,
        rawText,
        parsedJson: JSON.stringify(parsedJd),
      },
    });

    res.status(201).json({
      message: 'Job description parsed successfully.',
      jd: {
        id: jdRecord.id,
        createdAt: jdRecord.createdAt,
        parsed: parsedJd,
      },
    });
  } catch (error) {
    console.error('JD parse error:', error);
    res.status(500).json({ error: 'Internal Error', message: 'Failed to process job description.' });
  }
};

export const matchResumeWithJd = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { resumeId, jdId } = req.body;

    if (!userId || !resumeId || !jdId) {
      res.status(400).json({ error: 'Bad Request', message: 'resumeId and jdId are required.' });
      return;
    }

    const resumeRecord = await prisma.resume.findFirst({ where: { id: resumeId, userId } });
    const jdRecord = await prisma.jobDescription.findFirst({ where: { id: jdId, userId } });

    if (!resumeRecord || !jdRecord) {
      res.status(404).json({ error: 'Not Found', message: 'Resume or Job Description record not found.' });
      return;
    }

    const resumeParsed = JSON.parse(resumeRecord.parsedJson);
    const jdParsed = JSON.parse(jdRecord.parsedJson);

    const matchAnalysis = computeSkillMatch(resumeParsed, jdParsed);

    res.status(200).json({
      matchAnalysis,
      resumeParsed,
      jdParsed,
    });
  } catch (error) {
    console.error('Match compute error:', error);
    res.status(500).json({ error: 'Internal Error' });
  }
};

export const getUserJds = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const jds = await prisma.jobDescription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = jds.map((j) => ({
      id: j.id,
      createdAt: j.createdAt,
      parsed: JSON.parse(j.parsedJson),
    }));

    res.status(200).json({ jds: formatted });
  } catch (error) {
    res.status(500).json({ error: 'Internal Error' });
  }
};
