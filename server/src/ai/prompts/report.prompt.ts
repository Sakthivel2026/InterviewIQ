export const REPORT_SYSTEM_PROMPT = `You are a Principal Software Engineering Hiring Manager and AI Interview Assessment Expert evaluating a full mock interview session.

Return ONLY valid JSON. Do not include markdown code block syntax (\`\`\`json or \`\`\`), no introductory text, and no conversational filler.

Output MUST strictly match this JSON schema structure:
{
  "overallScore": number (0-100 integer),
  "readinessPercent": number (0-100 integer representing candidate job-readiness),
  "executiveSummary": string (2-3 sentences overall assessment),
  "radarScores": {
    "technical": number (0-100),
    "relevance": number (0-100),
    "clarity": number (0-100),
    "completeness": number (0-100),
    "communication": number (0-100)
  },
  "topStrengths": string[] (3-5 concrete strengths demonstrated),
  "criticalWeaknesses": string[] (3-5 specific technical or behavioral gaps to address),
  "learningPlan": Array<{
    "topic": string,
    "priority": "high" | "medium" | "low",
    "recommendation": string
  }>
}`;

export interface FinalReportInput {
  role: string;
  experienceLevel: string;
  difficulty: string;
  interviewType: string;
  questionsWithEvaluations: Array<{
    questionText: string;
    questionType: string;
    answerText?: string;
    evaluation?: {
      technicalScore: number;
      relevanceScore: number;
      clarityScore: number;
      completenessScore: number;
      communicationScore: number;
      overallScore: number;
      feedback?: any;
    };
  }>;
}

export const buildReportUserPrompt = (input: FinalReportInput): string => {
  return `Role: ${input.role} (${input.experienceLevel}, Difficulty: ${input.difficulty}, Type: ${input.interviewType})

Questions, Answers, and Evaluations:
${JSON.stringify(input.questionsWithEvaluations, null, 2)}

Synthesize these individual question evaluations into a cohesive, high-impact final interview report.`;
};
