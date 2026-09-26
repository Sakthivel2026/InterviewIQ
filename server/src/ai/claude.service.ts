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
  answeredCount: number;
  totalQuestions: number;
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
        temperature: 0.85,
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
    for (let attempt = 1; attempt <= 2; attempt++) {
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
        console.warn(`Anthropic API call attempt ${attempt} failed for answer evaluation:`, err);
      }
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
  const languages = ['javascript', 'typescript', 'python', 'java', 'c++', 'go', 'sql', 'c#', 'ruby', 'rust', 'php', 'swift', 'kotlin', 'html', 'css'].filter((s) => lower.includes(s));
  const frameworks = ['react', 'next.js', 'express', 'node.js', 'vue', 'tailwind', 'angular', 'django', 'flask', 'spring'].filter((s) => lower.includes(s));
  const tools = ['git', 'docker', 'kubernetes', 'aws', 'postgresql', 'mongodb', 'prisma', 'redis', 'azure', 'gcp'].filter((s) => lower.includes(s));

  const detectedLevel: 'entry' | 'mid' | 'senior' | 'lead' = lower.includes('lead')
    ? 'lead'
    : lower.includes('senior')
    ? 'senior'
    : lower.includes('mid')
    ? 'mid'
    : lower.includes('junior') || lower.includes('entry')
    ? 'entry'
    : 'mid';

  return {
    name: '',
    email: '',
    phone: '',
    summary: text.length > 250 ? text.slice(0, 250).trim() + '...' : text.trim(),
    experienceLevel: detectedLevel,
    skills: [...languages, ...frameworks, ...tools],
    languages,
    frameworks,
    tools,
    education: [],
    experience: [],
    projects: [],
    certifications: [],
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

const helperCalculateSimilarity = (str1: string, str2: string): number => {
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

const fallbackGenerateQuestions = (config: QuestionGeneratorConfig): GeneratedQuestionItem[] => {
  const lang = config.resumeParsed?.languages?.[0] || 'TypeScript';
  const framework = config.resumeParsed?.frameworks?.[0] || 'React';
  const tool = config.resumeParsed?.tools?.[0] || 'PostgreSQL';
  const secondTool = config.resumeParsed?.tools?.[1] || 'Docker';
  const projectTitle = config.resumeParsed?.projects?.[0]?.title || 'your recent web project';
  const companyExp = config.resumeParsed?.experience?.[0]?.company || 'your past technical work';
  const jdTech = config.jdParsed?.requiredSkills?.[0] || config.jdParsed?.tech?.[0] || framework;
  const level = config.experienceLevel || 'senior';

  // Dynamic question pools categorized by depth and topic
  const entryQuestions: Array<Omit<GeneratedQuestionItem, 'orderIndex'>> = [
    {
      questionText: `In your work with ${lang}, how do you manage asynchronous operations, promises, and error handling to ensure application stability?`,
      questionType: 'technical',
      category: 'Language & Core Syntax',
      difficulty: config.difficulty,
      evaluatedDimensions: ['Core Fundamentals', 'Syntax Precision'],
    },
    {
      questionText: `When building components with ${framework}, can you explain state management, component lifecycle, and how re-renders are triggered?`,
      questionType: 'technical',
      category: 'Frontend Fundamentals',
      difficulty: config.difficulty,
      evaluatedDimensions: ['Framework Mechanics', 'State Management'],
    },
    {
      questionText: `For basic database operations in ${tool}, how do you construct SELECT queries with JOINs and ensure input parameterization to prevent SQL injection?`,
      questionType: 'technical',
      category: 'Database Basics',
      difficulty: config.difficulty,
      evaluatedDimensions: ['SQL Syntax', 'Security Fundamentals'],
    },
    {
      questionText: `Tell me about a time when you encountered a tricky bug in a ${lang} codebase. What debugging tools or logs did you use to track it down?`,
      questionType: 'situational',
      category: 'Debugging & Troubleshooting',
      difficulty: config.difficulty,
      evaluatedDimensions: ['Problem Solving', 'Debugging'],
    },
    {
      questionText: `In your experience with Git and version control, how do you handle merge conflicts and maintain a clean git history when collaborating with teammates?`,
      questionType: 'technical',
      category: 'Developer Tooling',
      difficulty: config.difficulty,
      evaluatedDimensions: ['Git Workflow', 'Collaboration'],
    },
  ];

  const midQuestions: Array<Omit<GeneratedQuestionItem, 'orderIndex'>> = [
    {
      questionText: `In ${projectTitle}, you utilized ${framework} and ${tool}. How did you structure your API requests and handle client-side caching to reduce server load?`,
      questionType: 'technical',
      category: 'API & State Management',
      difficulty: config.difficulty,
      evaluatedDimensions: ['API Design', 'Performance'],
    },
    {
      questionText: `When designing database tables in ${tool} for a ${config.role} feature, how do you evaluate indexing tradeoffs (e.g. B-Tree vs Hash) for read-heavy vs write-heavy workloads?`,
      questionType: 'system_design',
      category: 'Database Optimization',
      difficulty: config.difficulty,
      evaluatedDimensions: ['Data Modeling', 'Indexing Strategy'],
    },
    {
      questionText: `How do you structure automated unit and integration test suites using modern test runners to achieve reliable code coverage without flaky test runs?`,
      questionType: 'technical',
      category: 'Quality Assurance',
      difficulty: config.difficulty,
      evaluatedDimensions: ['Test Automation', 'Code Quality'],
    },
    {
      questionText: `Can you share a situation at ${companyExp} where a feature requirement changed right before release? How did you adapt your implementation plan?`,
      questionType: 'behavioral',
      category: 'Adaptability',
      difficulty: config.difficulty,
      evaluatedDimensions: ['Flexibility', 'Communication'],
    },
    {
      questionText: `If an API endpoint built with ${lang} and ${framework} starts experiencing memory leaks in staging, how do you profile heap memory and resolve the leak?`,
      questionType: 'situational',
      category: 'Profiling & Performance',
      difficulty: config.difficulty,
      evaluatedDimensions: ['Memory Management', 'Diagnostics'],
    },
  ];

  const seniorLeadQuestions: Array<Omit<GeneratedQuestionItem, 'orderIndex'>> = [
    {
      questionText: `Looking at your experience at ${companyExp} and your work with ${tool}, how would you architect a zero-downtime database migration strategy under heavy concurrent traffic?`,
      questionType: 'system_design',
      category: 'Distributed Architecture',
      difficulty: config.difficulty,
      evaluatedDimensions: ['High Availability', 'Database Migration'],
    },
    {
      questionText: `For this ${config.role} position requiring ${jdTech}, how would you design a rate-limiting and circuit-breaker pattern to protect microservices from cascading failures?`,
      questionType: 'system_design',
      category: 'Resilience Engineering',
      difficulty: config.difficulty,
      evaluatedDimensions: ['Fault Tolerance', 'Microservices'],
    },
    {
      questionText: `In your resume project "${projectTitle}", how did you approach security authorization, JWT token rotation, and preventing CSRF/XSS attacks across frontend and backend services?`,
      questionType: 'technical',
      category: 'Security Architecture',
      difficulty: config.difficulty,
      evaluatedDimensions: ['Security Protocols', 'Auth Architecture'],
    },
    {
      questionText: `Tell me about a major technical decision where you advocated for a specific technology or architecture against pushback from stakeholders. How did you align the team?`,
      questionType: 'behavioral',
      category: 'Technical Leadership',
      difficulty: config.difficulty,
      evaluatedDimensions: ['Leadership', 'Stakeholder Management'],
    },
    {
      questionText: `Suppose a production service built with ${secondTool} and ${tool} encounters a sudden 10x traffic spike causing connection pool exhaustion. Walk through your immediate incident response steps.`,
      questionType: 'situational',
      category: 'Incident Response',
      difficulty: config.difficulty,
      evaluatedDimensions: ['Crisis Handling', 'Root Cause Analysis'],
    },
  ];

  const generalBehavioralQuestions: Array<Omit<GeneratedQuestionItem, 'orderIndex'>> = [
    {
      questionText: `Reflecting on your journey with ${lang} and modern tech stacks, describe a project where technical debt severely impacted development velocity and how you refactored it.`,
      questionType: 'behavioral',
      category: 'Tech Debt & Refactoring',
      difficulty: config.difficulty,
      evaluatedDimensions: ['Continuous Improvement', 'Refactoring'],
    },
    {
      questionText: `How do you prioritize technical trade-offs when business deadlines pressure you to ship code before architectural optimizations are complete?`,
      questionType: 'behavioral',
      category: 'Pragmatic Engineering',
      difficulty: config.difficulty,
      evaluatedDimensions: ['Prioritization', 'Product Alignment'],
    },
    {
      questionText: `Describe a scenario where you conducted a code review that led to a significant architecture improvement. What feedback strategy did you use?`,
      questionType: 'behavioral',
      category: 'Mentorship & Code Review',
      difficulty: config.difficulty,
      evaluatedDimensions: ['Peer Mentorship', 'Code Standards'],
    },
  ];

  // Select base pool depending on candidate experience level
  let primaryPool = level === 'entry' ? [...entryQuestions, ...midQuestions] : level === 'mid' ? [...midQuestions, ...entryQuestions, ...seniorLeadQuestions] : [...seniorLeadQuestions, ...midQuestions];
  let fullPool = [...primaryPool, ...generalBehavioralQuestions, ...entryQuestions, ...midQuestions, ...seniorLeadQuestions];

  // Exclude questions that are too similar to config.previousQuestions
  const previousList = config.previousQuestions || [];
  let eligibleQuestions = fullPool.filter((candidateQ) => {
    return !previousList.some((prevQ) => helperCalculateSimilarity(candidateQ.questionText, prevQ) > 0.45);
  });

  // If filtering left fewer than 8 questions, fall back to full pool to ensure valid output size
  if (eligibleQuestions.length < 8) {
    eligibleQuestions = fullPool;
  }

  // Shuffle using a time/random seed
  const shuffled = [...eligibleQuestions].sort(() => 0.5 - Math.random());

  // Deduplicate within the selected batch
  const selectedBatch: Array<Omit<GeneratedQuestionItem, 'orderIndex'>> = [];
  for (const q of shuffled) {
    if (!selectedBatch.some((accepted) => helperCalculateSimilarity(accepted.questionText, q.questionText) > 0.45)) {
      selectedBatch.push(q);
    }
    if (selectedBatch.length >= 8) break;
  }

  // Fill up if needed to guarantee at least 8 questions
  let index = 0;
  while (selectedBatch.length < 8 && index < shuffled.length) {
    const fallbackQ = shuffled[index++];
    if (!selectedBatch.includes(fallbackQ)) {
      selectedBatch.push(fallbackQ);
    }
  }

  return selectedBatch.map((q, i) => ({
    ...q,
    orderIndex: i + 1,
  }));
};

const fallbackEvaluateAnswer = (input: EvaluationInput): EvaluationResultJSON => {
  const text = (input.answerText || '').trim();

  if (text.length === 0) {
    return {
      technicalScore: 0,
      relevanceScore: 0,
      clarityScore: 0,
      completenessScore: 0,
      communicationScore: 0,
      overallScore: 0,
      feedback: {
        summary: 'No answer was submitted for this question.',
        strengths: [],
        areasForImprovement: ['Submit a complete response addressing the technical question.'],
        idealAnswerDraft: `An ideal response to "${input.questionText.slice(0, 60)}..." should detail system architecture principles, key frameworks, and trade-off analysis.`,
      },
      shouldAskFollowUp: false,
    };
  }

  const questionLower = (input.questionText || '').toLowerCase();
  const answerLower = text.toLowerCase();

  // Extract core keywords from question (words >= 4 chars)
  const qKeywords = Array.from(new Set(questionLower.match(/\b[a-z]{4,}\b/g) || []));
  const matchedKeywords = qKeywords.filter((word) => answerLower.includes(word));
  const keywordMatchRatio = qKeywords.length > 0 ? matchedKeywords.length / qKeywords.length : 0;

  // Technical terms library check
  const techTerms = ['react', 'node', 'express', 'postgresql', 'sql', 'aws', 'docker', 'redis', 'api', 'schema', 'async', 'index', 'query', 'component', 'state', 'architecture', 'latency', 'throughput', 'microservices', 'database', 'rest', 'graphql', 'cache', 'lock', 'thread', 'memory', 'cpu', 'security', 'token', 'auth', 'jwt', 'cookie', 'http', 'testing', 'vitest', 'jest', 'deploy', 'ci/cd', 'ddl', 'b-tree', 'concurrency', 'migration', 'monitored', 'bottleneck'];
  const matchedTech = techTerms.filter((term) => answerLower.includes(term));

  const wordCount = text.split(/\s+/).length;

  // Case 1: Extremely brief or non-answer
  if (wordCount < 5 || ['idk', 'pass', 'no idea', 'skip', 'dont know', "don't know", 'dunno'].includes(answerLower)) {
    return {
      technicalScore: 10,
      relevanceScore: 10,
      clarityScore: 15,
      completenessScore: 10,
      communicationScore: 15,
      overallScore: 12,
      feedback: {
        summary: 'The candidate answer was extremely brief or indicated no knowledge of the topic.',
        strengths: [],
        areasForImprovement: [`Provide detailed reasoning, tech stack choices, and step-by-step solutions for: "${input.questionText.slice(0, 70)}..."`],
        idealAnswerDraft: `An ideal response should walk through technical specifications and concrete examples related to ${input.role} practices.`,
      },
      shouldAskFollowUp: false,
    };
  }

  // Case 2: Irrelevant / Off-topic answer (no question keyword overlap and low tech terms)
  if (keywordMatchRatio === 0 && matchedTech.length === 0) {
    const irrelTech = Math.min(25, wordCount * 2);
    const irrelRel = Math.min(20, Math.round(wordCount * 1.5));
    const irrelCla = Math.min(40, 20 + Math.round(wordCount * 1.5));
    const irrelCom = 15;
    const irrelComm = Math.min(45, 25 + Math.round(wordCount * 1.5));
    const irrelOverall = Math.round((irrelTech + irrelRel + irrelCla + irrelCom + irrelComm) / 5);

    return {
      technicalScore: irrelTech,
      relevanceScore: irrelRel,
      clarityScore: irrelCla,
      completenessScore: irrelCom,
      communicationScore: irrelComm,
      overallScore: irrelOverall,
      feedback: {
        summary: `Answer lacks relevance to the specific question asked ("${input.questionText.slice(0, 60)}...").`,
        strengths: wordCount > 15 ? ['Articulate prose style'] : [],
        areasForImprovement: ['Address the core technical topic requested rather than tangential subjects.'],
        idealAnswerDraft: `Focus specifically on ${qKeywords.slice(0, 3).join(', ')} when responding to this prompt.`,
      },
      shouldAskFollowUp: false,
    };
  }

  // Case 3: Substantive response — score dynamically based on keyword match, tech depth, and completeness
  const relevanceScore = Math.min(98, Math.max(35, Math.round(45 + keywordMatchRatio * 45 + Math.min(10, matchedKeywords.length * 5))));
  const technicalScore = Math.min(98, Math.max(30, Math.round(40 + matchedTech.length * 10 + keywordMatchRatio * 20)));
  const completenessScore = Math.min(95, Math.max(25, Math.round(35 + Math.min(45, wordCount * 0.9) + keywordMatchRatio * 15)));
  const clarityScore = Math.min(95, Math.max(40, Math.round(50 + (text.includes('.') ? 15 : 0) + Math.min(20, wordCount * 0.4))));
  const communicationScore = Math.min(95, Math.max(45, Math.round(55 + (wordCount > 30 ? 20 : 10) + (text.includes(',') ? 10 : 0))));
  const overallScore = Math.round((technicalScore + relevanceScore + clarityScore + completenessScore + communicationScore) / 5);

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (matchedKeywords.length > 0) {
    strengths.push(`Directly referenced question domain (${matchedKeywords.slice(0, 3).join(', ')})`);
  }
  if (matchedTech.length > 0) {
    strengths.push(`Incorporated relevant technical stack keywords (${matchedTech.slice(0, 3).join(', ')})`);
  }
  if (wordCount > 40) {
    strengths.push('Provided substantial answer length and structure');
  }

  if (completenessScore < 70) {
    improvements.push('Elaborate further on architectural trade-offs and edge-case handling');
  }
  if (technicalScore < 70) {
    improvements.push('Include specific metric benchmarks, tooling choices, and code/schema structure');
  }

  if (strengths.length === 0) {
    strengths.push('Attempted answer response');
  }
  if (improvements.length === 0) {
    improvements.push('Provide additional quantitative metrics to further strengthen response');
  }

  return {
    technicalScore,
    relevanceScore,
    clarityScore,
    completenessScore,
    communicationScore,
    overallScore,
    feedback: {
      summary: overallScore >= 80
        ? `Strong, relevant response covering ${matchedKeywords.slice(0, 2).join(' and ')} effectively.`
        : overallScore >= 55
        ? `Partially complete response covering basic concepts of ${input.questionText.slice(0, 45)}...`
        : `Answer provides limited coverage of ${input.questionText.slice(0, 45)}...`,
      strengths,
      areasForImprovement: improvements,
      idealAnswerDraft: `A comprehensive answer for this ${input.role} question should combine ${qKeywords.slice(0, 3).join(', ')} with concrete production metrics.`,
    },
    shouldAskFollowUp: overallScore >= 60 && overallScore < 85,
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
  let report: FinalReportJSON;

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
        report = JSON.parse(cleanedText) as FinalReportJSON;
      } else {
        report = fallbackGenerateFinalReport(input);
      }
    } catch (err) {
      console.warn('Anthropic API call failed for report generator, using fallback:', err);
      report = fallbackGenerateFinalReport(input);
    }
  } else {
    report = fallbackGenerateFinalReport(input);
  }

  // Purely calculate & enforce exact mathematical consistency from answered questions ONLY
  const totalQuestions = input.questionsWithEvaluations.length;
  const answeredQuestions = input.questionsWithEvaluations.filter(
    (q) => q.answerText && q.answerText.trim().length > 0 && q.evaluation
  );
  const answeredCount = answeredQuestions.length;

  report.totalQuestions = totalQuestions;
  report.answeredCount = answeredCount;

  if (totalQuestions === 0 || answeredCount === 0) {
    report.overallScore = 0;
    report.readinessPercent = 0;
    report.answeredCount = 0;
    report.totalQuestions = totalQuestions;
    report.radarScores = { technical: 0, relevance: 0, clarity: 0, completeness: 0, communication: 0 };
    report.executiveSummary = `Session unattempted: Candidate answered 0 of ${totalQuestions} assigned interview questions. Overall score and readiness reflect an unattempted session.`;
    report.topStrengths = ['No strengths demonstrated — 0 questions answered.'];
    report.criticalWeaknesses = [
      `Unattempted mock interview session: 0 of ${totalQuestions} questions answered.`,
      'Candidate must attempt questions to receive evaluation scores.',
    ];
    return report;
  }

  // Calculate sum across ONLY answered questions
  let sumTech = 0;
  let sumRel = 0;
  let sumCla = 0;
  let sumCom = 0;
  let sumComm = 0;
  let sumOverall = 0;

  for (const q of answeredQuestions) {
    if (q.evaluation) {
      sumTech += q.evaluation.technicalScore || 0;
      sumRel += q.evaluation.relevanceScore || 0;
      sumCla += q.evaluation.clarityScore || 0;
      sumCom += q.evaluation.completenessScore || 0;
      sumComm += q.evaluation.communicationScore || 0;
      sumOverall += q.evaluation.overallScore || 0;
    }
  }

  report.radarScores = {
    technical: Math.round(sumTech / answeredCount),
    relevance: Math.round(sumRel / answeredCount),
    clarity: Math.round(sumCla / answeredCount),
    completeness: Math.round(sumCom / answeredCount),
    communication: Math.round(sumComm / answeredCount),
  };
  report.overallScore = Math.round(sumOverall / answeredCount);
  report.readinessPercent = report.overallScore;

  if (answeredCount < totalQuestions) {
    report.executiveSummary = `Candidate answered ${answeredCount} of ${totalQuestions} questions for the ${input.role} (${input.experienceLevel} level) mock interview. Computed score across answered questions is ${report.overallScore}/100 with a readiness rating of ${report.readinessPercent}%.`;
  }

  return report;
};

const fallbackGenerateFinalReport = (input: FinalReportInput): FinalReportJSON => {
  const questions = input.questionsWithEvaluations || [];
  const totalQuestions = questions.length;
  const answeredQuestions = questions.filter(
    (q) => q.answerText && q.answerText.trim().length > 0 && q.evaluation
  );
  const answeredCount = answeredQuestions.length;

  if (totalQuestions === 0 || answeredCount === 0) {
    return {
      overallScore: 0,
      readinessPercent: 0,
      answeredCount,
      totalQuestions,
      executiveSummary: `Session unattempted: Candidate answered 0 of ${totalQuestions} assigned interview questions.`,
      radarScores: { technical: 0, relevance: 0, clarity: 0, completeness: 0, communication: 0 },
      topStrengths: ['No strengths demonstrated — zero questions answered.'],
      criticalWeaknesses: [
        `Unattempted mock interview session: 0 of ${totalQuestions} questions answered.`,
        'Candidate must attempt questions to receive evaluation scores.',
      ],
      learningPlan: [
        {
          topic: 'Complete Full Mock Interview',
          priority: 'high',
          recommendation: `Attempt all ${totalQuestions} questions in the interview studio to receive AI evaluation and scoring.`,
        },
      ],
    };
  }

  let sumTech = 0;
  let sumRel = 0;
  let sumCla = 0;
  let sumCom = 0;
  let sumComm = 0;
  let sumOverall = 0;

  for (const q of answeredQuestions) {
    if (q.evaluation) {
      sumTech += q.evaluation.technicalScore || 0;
      sumRel += q.evaluation.relevanceScore || 0;
      sumCla += q.evaluation.clarityScore || 0;
      sumCom += q.evaluation.completenessScore || 0;
      sumComm += q.evaluation.communicationScore || 0;
      sumOverall += q.evaluation.overallScore || 0;
    }
  }

  const avgTech = Math.round(sumTech / answeredCount);
  const avgRel = Math.round(sumRel / answeredCount);
  const avgCla = Math.round(sumCla / answeredCount);
  const avgCom = Math.round(sumCom / answeredCount);
  const avgComm = Math.round(sumComm / answeredCount);
  const overallScore = Math.round(sumOverall / answeredCount);
  const readinessPercent = overallScore;

  const StrengthsList: string[] = [];
  const WeaknessesList: string[] = [];

  if (answeredCount < totalQuestions) {
    WeaknessesList.push(`Partial completion: Candidate answered ${answeredCount} of ${totalQuestions} assigned questions.`);
  }

  if (avgTech >= 70) {
    StrengthsList.push(`Demonstrated technical understanding in answered questions (${avgTech}/100 technical average).`);
  } else {
    WeaknessesList.push(`Technical answer depth requires improvement (${avgTech}/100 technical average).`);
  }

  if (avgComm >= 70) {
    StrengthsList.push(`Clear response structure and communication clarity (${avgComm}/100 communication average).`);
  } else {
    WeaknessesList.push(`Communication clarity and structure can be enhanced (${avgComm}/100 communication average).`);
  }

  if (StrengthsList.length === 0) {
    StrengthsList.push(`Attempted ${answeredCount} question(s) during the session.`);
  }

  const summary = `Candidate answered ${answeredCount} of ${totalQuestions} questions for the ${input.role} (${input.experienceLevel} level) mock interview, achieving a computed score of ${overallScore}/100 across answered questions and a readiness rating of ${readinessPercent}%.`;

  return {
    overallScore,
    readinessPercent,
    answeredCount,
    totalQuestions,
    executiveSummary: summary,
    radarScores: {
      technical: avgTech,
      relevance: avgRel,
      clarity: avgCla,
      completeness: avgCom,
      communication: avgComm,
    },
    topStrengths: StrengthsList,
    criticalWeaknesses: WeaknessesList,
    learningPlan: [
      {
        topic: 'Interview Completion & Answer Depth',
        priority: 'high',
        recommendation: `Ensure all ${totalQuestions} questions are answered with structured examples (STAR method) and explicit technical details.`,
      },
      {
        topic: 'Targeted Technical Review',
        priority: avgTech < 70 ? 'high' : 'medium',
        recommendation: `Review core ${input.role} concepts to improve technical precision and completeness scores.`,
      },
    ],
  };
};


