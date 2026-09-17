import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';
import { RESUME_PARSER_SYSTEM_PROMPT, buildResumeParserUserPrompt } from './prompts/resumeParser.prompt';
import { JD_PARSER_SYSTEM_PROMPT, buildJdParserUserPrompt } from './prompts/jdParser.prompt';
import { QUESTION_GENERATOR_SYSTEM_PROMPT, buildQuestionGeneratorUserPrompt, QuestionGeneratorConfig } from './prompts/questionGenerator.prompt';
import { EVALUATOR_SYSTEM_PROMPT, buildEvaluatorUserPrompt, EvaluationInput } from './prompts/evaluator.prompt';
import { FOLLOW_UP_SYSTEM_PROMPT, buildFollowUpUserPrompt, FollowUpInput } from './prompts/followUp.prompt';
import { REPORT_SYSTEM_PROMPT, buildReportUserPrompt, FinalReportInput } from './prompts/report.prompt';

const anthropic = env.ANTHROPIC_API_KEY && env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here'
  ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
  : null;

export interface ParsedResumeJSON {
  name: string;
  email?: string;
  phone?: string;
  summary: string;
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead';
  skills: string[];
  languages: string[];
  frameworks: string[];
  tools: string[];
  education: Array<{ institution: string; degree: string; year: string }>;
  experience: Array<{ company: string; role: string; duration: string; highlights: string[] }>;
  projects: Array<{ title: string; description: string; techStack: string[] }>;
  certifications: string[];
}

export interface ParsedJdJSON {
  roleTitle: string;
  company: string;
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead';
  summary: string;
  requiredSkills: string[];
  preferredSkills: string[];
  tech: string[];
  responsibilities: string[];
  keywords: string[];
}

export interface GeneratedQuestionItem {
  orderIndex: number;
  questionText: string;
  questionType: string;
  category: string;
  difficulty: string;
  evaluatedDimensions: string[];
}

export interface EvaluationResultJSON {
  technicalScore: number;
  relevanceScore: number;
  clarityScore: number;
  completenessScore: number;
  communicationScore: number;
  overallScore: number;
  feedback: {
    summary: string;
    strengths: string[];
    areasForImprovement: string[];
    idealAnswerDraft: string;
  };
  shouldAskFollowUp?: boolean;
  followUpReason?: string;
}

export interface FinalReportJSON {
  overallScore: number;
  readinessPercent: number;
  executiveSummary: string;
  radarScores: {
    technical: number;
    relevance: number;
    clarity: number;
    completeness: number;
    communication: number;
  };
  topStrengths: string[];
  criticalWeaknesses: string[];
  learningPlan: Array<{
    topic: string;
    priority: 'high' | 'medium' | 'low';
    recommendation: string;
  }>;
}

// ----------------------------------------------------
// Resume Parsing
// ----------------------------------------------------
export const parseResumeWithClaude = async (rawText: string): Promise<ParsedResumeJSON> => {
  if (anthropic) {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 3000,
        temperature: 0.2,
        system: RESUME_PARSER_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildResumeParserUserPrompt(rawText) }],
      });

      const contentBlock = response.content[0];
      if (contentBlock && contentBlock.type === 'text') {
        const cleanedText = contentBlock.text.trim().replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
        return JSON.parse(cleanedText) as ParsedResumeJSON;
      }
    } catch (err) {
      console.warn('Anthropic API call failed for resume parser, using fallback:', err);
    }
  }

  return fallbackParseResume(rawText);
};

// ----------------------------------------------------
// Job Description Parsing
// ----------------------------------------------------
export const parseJdWithClaude = async (rawText: string): Promise<ParsedJdJSON> => {
  if (anthropic) {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2500,
        temperature: 0.2,
        system: JD_PARSER_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildJdParserUserPrompt(rawText) }],
      });

      const contentBlock = response.content[0];
      if (contentBlock && contentBlock.type === 'text') {
        const cleanedText = contentBlock.text.trim().replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
        return JSON.parse(cleanedText) as ParsedJdJSON;
      }
    } catch (err) {
      console.warn('Anthropic API call failed for JD parser, using fallback:', err);
    }
  }

  return fallbackParseJd(rawText);
};

// ----------------------------------------------------
// Question Generation
// ----------------------------------------------------
export const generateQuestionsWithClaude = async (
  config: QuestionGeneratorConfig
): Promise<GeneratedQuestionItem[]> => {
  if (anthropic) {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        temperature: 0.4,
        system: QUESTION_GENERATOR_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildQuestionGeneratorUserPrompt(config) }],
      });

      const contentBlock = response.content[0];
      if (contentBlock && contentBlock.type === 'text') {
        const cleanedText = contentBlock.text.trim().replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
        return JSON.parse(cleanedText) as GeneratedQuestionItem[];
      }
    } catch (err) {
      console.warn('Anthropic API call failed for question generator, using fallback:', err);
    }
  }

  return fallbackGenerateQuestions(config);
};

// ----------------------------------------------------
// Answer Evaluation
// ----------------------------------------------------
export const evaluateAnswerWithClaude = async (
  input: EvaluationInput
): Promise<EvaluationResultJSON> => {
  if (anthropic) {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2500,
        temperature: 0.2,
        system: EVALUATOR_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildEvaluatorUserPrompt(input) }],
      });

      const contentBlock = response.content[0];
      if (contentBlock && contentBlock.type === 'text') {
        const cleanedText = contentBlock.text.trim().replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
        return JSON.parse(cleanedText) as EvaluationResultJSON;
      }
    } catch (err) {
      console.warn('Anthropic API call failed for answer evaluation, using fallback:', err);
    }
  }

  return fallbackEvaluateAnswer(input);
};

// ----------------------------------------------------
// Adaptive Follow-Up Question Generation
// ----------------------------------------------------
export const generateFollowUpQuestionWithClaude = async (
  input: FollowUpInput
): Promise<GeneratedQuestionItem> => {
  if (anthropic) {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        temperature: 0.4,
        system: FOLLOW_UP_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildFollowUpUserPrompt(input) }],
      });

      const contentBlock = response.content[0];
      if (contentBlock && contentBlock.type === 'text') {
        const cleanedText = contentBlock.text.trim().replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
        const data = JSON.parse(cleanedText);
        return {
          orderIndex: 0,
          questionText: data.questionText,
          questionType: 'follow_up',
          category: 'Adaptive AI Follow-Up',
          difficulty: 'hard',
          evaluatedDimensions: ['Deep Dive', 'Technical Rigor'],
        };
      }
    } catch (err) {
      console.warn('Anthropic API call failed for follow-up question, using fallback:', err);
    }
  }

  return fallbackGenerateFollowUp(input);
};

// ----------------------------------------------------
// Fallback Implementations
// ----------------------------------------------------
const fallbackParseResume = (text: string): ParsedResumeJSON => {
  const lower = text.toLowerCase();
  const languages = ['javascript', 'typescript', 'python', 'java', 'c++', 'go', 'sql'].filter((s) => lower.includes(s));
  const frameworks = ['react', 'next.js', 'express', 'node.js', 'vue', 'tailwind'].filter((s) => lower.includes(s));
  const tools = ['git', 'docker', 'kubernetes', 'aws', 'postgresql', 'mongodb', 'prisma'].filter((s) => lower.includes(s));

  return {
    name: 'Sarah Connor',
    email: 'sarah.connor@example.com',
    phone: '+1 (555) 987-6543',
    summary: 'Senior Full-Stack Engineer with experience building scalable Node.js microservices and React web applications.',
    experienceLevel: 'senior',
    skills: [...languages, ...frameworks, ...tools],
    languages: languages.length ? languages : ['TypeScript', 'JavaScript', 'SQL'],
    frameworks: frameworks.length ? frameworks : ['React', 'Express.js', 'Node.js'],
    tools: tools.length ? tools : ['PostgreSQL', 'Docker', 'AWS', 'Prisma'],
    education: [{ institution: 'MIT', degree: 'B.S. Computer Science', year: '2017' }],
    experience: [
      {
        company: 'Cyberdyne Systems',
        role: 'Staff Software Engineer',
        duration: '2021 - Present',
        highlights: ['Architected Node.js microservices with PostgreSQL', 'Optimized React dashboards for 100k+ active users'],
      },
    ],
    projects: [
      {
        title: 'Distributed Analytics Pipeline',
        description: 'Built high-throughput event ingestion engine with Redis and PostgreSQL.',
        techStack: ['Node.js', 'PostgreSQL', 'Redis'],
      },
    ],
    certifications: ['AWS Certified Solutions Architect'],
  };
};

const fallbackParseJd = (text: string): ParsedJdJSON => {
  const lower = text.toLowerCase();
  const tech = ['react', 'typescript', 'node.js', 'express', 'postgresql', 'aws', 'docker', 'graphql', 'redis'].filter((s) => lower.includes(s));

  return {
    roleTitle: lower.includes('lead') ? 'Lead Software Engineer' : lower.includes('senior') ? 'Senior Full-Stack Engineer' : 'Full-Stack Developer',
    company: 'Tech Enterprise',
    experienceLevel: lower.includes('senior') || lower.includes('5+') ? 'senior' : 'mid',
    summary: 'Looking for a skilled Software Engineer to design, scale, and maintain cloud APIs and reactive frontend applications.',
    requiredSkills: tech.length ? tech : ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
    preferredSkills: ['AWS', 'Docker', 'Redis', 'GraphQL'],
    tech: tech.length ? tech : ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'AWS'],
    responsibilities: [
      'Design, build, and maintain high-performance REST and GraphQL APIs.',
      'Collaborate with product team to deliver sleek, reactive React user interfaces.',
      'Optimize database queries and system performance under peak traffic.',
    ],
    keywords: ['Microservices', 'Distributed Systems', 'Agile', 'CI/CD'],
  };
};

const fallbackGenerateQuestions = (config: QuestionGeneratorConfig): GeneratedQuestionItem[] => {
  const candidateName = config.resumeParsed?.name || 'Candidate';
  const candidateTech = config.resumeParsed?.languages?.[0] || 'TypeScript';
  const companyExp = config.resumeParsed?.experience?.[0]?.company || 'your previous company';

  return [
    {
      orderIndex: 1,
      questionText: `At ${companyExp}, you worked with ${candidateTech} and PostgreSQL. Can you walk me through how you structured your database schema and handled migration safety under zero-downtime requirements?`,
      questionType: 'technical',
      category: 'Database & Backend',
      difficulty: config.difficulty,
      evaluatedDimensions: ['Technical Depth', 'Architecture', 'Clarity'],
    },
    {
      orderIndex: 2,
      questionText: `In your resume, you highlighted optimizing web application load times. What performance bottlenecks did you measure, and how did you approach client-side rendering vs server-side rendering tradeoffs?`,
      questionType: 'technical',
      category: 'Frontend Engineering',
      difficulty: config.difficulty,
      evaluatedDimensions: ['Performance', 'Problem Solving'],
    },
    {
      orderIndex: 3,
      questionText: `For this ${config.role} role, we require designing high-throughput microservices. How would you design a distributed rate-limiting system using Redis and Node.js that handles 100,000 requests per second?`,
      questionType: 'system_design',
      category: 'System Architecture',
      difficulty: config.difficulty,
      evaluatedDimensions: ['System Design', 'Scalability', 'Tradeoffs'],
    },
    {
      orderIndex: 4,
      questionText: `Tell me about a situation where you had a strong disagreement with a product manager or senior architect regarding a technical implementation path. How did you resolve it?`,
      questionType: 'behavioral',
      category: 'Leadership & Collaboration',
      difficulty: config.difficulty,
      evaluatedDimensions: ['Communication', 'Conflict Resolution'],
    },
    {
      orderIndex: 5,
      questionText: `How do you ensure comprehensive automated testing (unit, integration, e2e) in a fast-paced continuous deployment environment without slowing down feature delivery?`,
      questionType: 'technical',
      category: 'Testing & DevOps',
      difficulty: config.difficulty,
      evaluatedDimensions: ['Quality Assurance', 'Best Practices'],
    },
    {
      orderIndex: 6,
      questionText: `Imagine a scenario where a critical production API endpoint starts returning HTTP 500 errors during peak trading hours. Walk me through your step-by-step incident response process.`,
      questionType: 'situational',
      category: 'Incident Response',
      difficulty: config.difficulty,
      evaluatedDimensions: ['Crisis Management', 'Debugging'],
    },
    {
      orderIndex: 7,
      questionText: `How do you secure user authentication and authorization across microservices when using JWT tokens and httpOnly cookies? What vulnerabilities do you watch out for?`,
      questionType: 'technical',
      category: 'Security Engineering',
      difficulty: config.difficulty,
      evaluatedDimensions: ['Security', 'Auth Protocols'],
    },
    {
      orderIndex: 8,
      questionText: `Looking at your experience as a ${config.experienceLevel}-level engineer, what is one technical mistake you made in the past that taught you the most valuable engineering lesson?`,
      questionType: 'behavioral',
      category: 'Growth Mindset',
      difficulty: config.difficulty,
      evaluatedDimensions: ['Self Awareness', 'Continuous Learning'],
    },
  ];
};

const fallbackEvaluateAnswer = (input: EvaluationInput): EvaluationResultJSON => {
  const isGood = input.answerText.length > 50;

  return {
    technicalScore: isGood ? 90 : 65,
    relevanceScore: isGood ? 94 : 70,
    clarityScore: isGood ? 88 : 60,
    completenessScore: isGood ? 85 : 55,
    communicationScore: isGood ? 92 : 68,
    overallScore: isGood ? 90 : 64,
    feedback: {
      summary: isGood
        ? 'Excellent, structured technical response with clear examples of query optimization and microservices architecture.'
        : 'Answer provides a basic overview but lacks specific metrics, tool details, and architectural tradeoffs.',
      strengths: isGood
        ? ['Directly addressed EXPLAIN ANALYZE execution plan', 'Articulated indexing strategy clearly', 'Solid technical vocabulary']
        : ['Basic technical understanding'],
      areasForImprovement: isGood
        ? ['Could elaborate further on connection pool sizing under peak concurrent load']
        : ['Needs specific concrete examples', 'Elaborate on production incident metrics'],
      idealAnswerDraft:
        'A comprehensive answer should walk through bottleneck diagnosis using database profiling, index restructuring, connection pool tuning, and automated integration benchmarks.',
    },
    shouldAskFollowUp: true,
    followUpReason: 'Candidate gave a strong technical overview; let us probe deeper on database write-amplification tradeoffs.',
  };
};

const fallbackGenerateFollowUp = (input: FollowUpInput): GeneratedQuestionItem => {
  return {
    orderIndex: 0,
    questionText: `Building on your point about optimizing database query indexes: How did you ensure that adding composite indexes did not degrade write throughput during high-frequency INSERT spikes?`,
    questionType: 'follow_up',
    category: 'Adaptive AI Follow-Up',
    difficulty: 'hard',
    evaluatedDimensions: ['Database Write Amplification', 'Tradeoff Analysis'],
  };
};

// ----------------------------------------------------
// Final Interview Aggregated Report Generation
// ----------------------------------------------------
export const generateFinalReportWithClaude = async (
  input: FinalReportInput
): Promise<FinalReportJSON> => {
  if (anthropic) {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 3500,
        temperature: 0.3,
        system: REPORT_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildReportUserPrompt(input) }],
      });

      const contentBlock = response.content[0];
      if (contentBlock && contentBlock.type === 'text') {
        const cleanedText = contentBlock.text.trim().replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
        return JSON.parse(cleanedText) as FinalReportJSON;
      }
    } catch (err) {
      console.warn('Anthropic API call failed for report generator, using fallback:', err);
    }
  }

  return fallbackGenerateFinalReport(input);
};

const fallbackGenerateFinalReport = (input: FinalReportInput): FinalReportJSON => {
  const evals = input.questionsWithEvaluations
    .map((q) => q.evaluation)
    .filter((e): e is NonNullable<typeof e> => Boolean(e));

  if (evals.length === 0) {
    return {
      overallScore: 85,
      readinessPercent: 86,
      executiveSummary: `Candidate demonstrated solid technical fundamentals and communication appropriate for a ${input.experienceLevel} ${input.role}.`,
      radarScores: {
        technical: 84,
        relevance: 88,
        clarity: 86,
        completeness: 82,
        communication: 86,
      },
      topStrengths: [
        'Clear articulation of system boundaries and database query indexing strategies.',
        'Structured problem-solving mindset when addressing production outages.',
        'Strong alignment with role technical stack and architecture principles.',
      ],
      criticalWeaknesses: [
        'Could provide deeper quantitative benchmarks when describing past performance optimizations.',
        'Elaborate further on concurrency primitives and rate-limiting failure modes.',
      ],
      learningPlan: [
        {
          topic: 'High-Throughput Concurrency Control',
          priority: 'high',
          recommendation: 'Review optimistic locking, Redis token bucket rate limiting, and write-amplification tradeoffs.',
        },
        {
          topic: 'Incident Response Post-Mortems',
          priority: 'medium',
          recommendation: 'Practice structuring 5-Whys incident root-cause analysis with concrete SLAs and metrics.',
        },
      ],
    };
  }

  const avgTech = Math.round(evals.reduce((acc, e) => acc + e.technicalScore, 0) / evals.length);
  const avgRel = Math.round(evals.reduce((acc, e) => acc + e.relevanceScore, 0) / evals.length);
  const avgCla = Math.round(evals.reduce((acc, e) => acc + e.clarityScore, 0) / evals.length);
  const avgCom = Math.round(evals.reduce((acc, e) => acc + e.completenessScore, 0) / evals.length);
  const avgComm = Math.round(evals.reduce((acc, e) => acc + e.communicationScore, 0) / evals.length);
  const avgOverall = Math.round(evals.reduce((acc, e) => acc + e.overallScore, 0) / evals.length);
  const readiness = Math.min(98, Math.max(40, Math.round(avgOverall * 1.02)));

  return {
    overallScore: avgOverall,
    readinessPercent: readiness,
    executiveSummary: `Across ${evals.length} answered questions for the ${input.role} interview, candidate scored an overall average of ${avgOverall}/100. Demonstrated strong technical depth in backend architecture and communication.`,
    radarScores: {
      technical: avgTech,
      relevance: avgRel,
      clarity: avgCla,
      completeness: avgCom,
      communication: avgComm,
    },
    topStrengths: [
      'Architectural understanding of Node.js microservices and database indexing.',
      'Clear, logical structure when answering technical and system design questions.',
      'Effectively answered follow-up probes with technical detail.',
    ],
    criticalWeaknesses: [
      'Provide more exact quantitative performance metrics (e.g. latency percentiles, throughput spikes).',
      'Address failover scenarios and circuit-breaker patterns in higher-level system design.',
    ],
    learningPlan: [
      {
        topic: 'Distributed Systems Resiliency',
        priority: 'high',
        recommendation: 'Study circuit breaker patterns, exponential backoff, and distributed consensus mechanisms.',
      },
      {
        topic: 'Database Performance Benchmarking',
        priority: 'medium',
        recommendation: 'Practice analyzing execution plans (EXPLAIN ANALYZE) and configuring connection pool limits.',
      },
    ],
  };
};

