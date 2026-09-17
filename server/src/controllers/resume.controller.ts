import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { extractTextFromFile } from '../utils/fileExtractor';
import { parseResumeWithClaude } from '../ai/claude.service';
import { prisma } from '../utils/prisma';

export const uploadResume = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    let rawText = req.body.rawText || '';
    let fileUrl = 'text-input';

    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
      try {
        rawText = await extractTextFromFile(req.file.path, req.file.mimetype);
      } catch (err) {
        res.status(400).json({ error: 'File Extraction Failed', message: 'Could not extract text from document.' });
        return;
      }
    }

    if (!rawText || rawText.trim().length < 20) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Resume text is too short or missing. Please upload a valid PDF/DOCX or paste complete text.',
      });
      return;
    }

    // Call Claude AI (or AI fallback) to extract structured JSON
    const parsedData = await parseResumeWithClaude(rawText);

    const resumeRecord = await prisma.resume.create({
      data: {
        userId,
        fileUrl,
        rawText,
        parsedJson: JSON.stringify(parsedData),
      },
    });

    res.status(201).json({
      message: 'Resume uploaded and parsed successfully.',
      resume: {
        id: resumeRecord.id,
        fileUrl: resumeRecord.fileUrl,
        uploadedAt: resumeRecord.uploadedAt,
        parsed: parsedData,
      },
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({ error: 'Internal Error', message: 'Failed to process resume upload.' });
  }
};

export const getUserResumes = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const resumes = await prisma.resume.findMany({
      where: { userId },
      orderBy: { uploadedAt: 'desc' },
    });

    const formattedResumes = resumes.map((r) => ({
      id: r.id,
      fileUrl: r.fileUrl,
      uploadedAt: r.uploadedAt,
      parsed: JSON.parse(r.parsedJson),
    }));

    res.status(200).json({ resumes: formattedResumes });
  } catch (error) {
    res.status(500).json({ error: 'Internal Error' });
  }
};

export const getResumeById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const interviewId = req.params.id as string;

    const resume = await prisma.resume.findFirst({
      where: { id: interviewId, userId },
    });

    if (!resume) {
      res.status(404).json({ error: 'Not Found', message: 'Resume record not found.' });
      return;
    }

    res.status(200).json({
      resume: {
        id: resume.id,
        fileUrl: resume.fileUrl,
        uploadedAt: resume.uploadedAt,
        parsed: JSON.parse(resume.parsedJson),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Error' });
  }
};
