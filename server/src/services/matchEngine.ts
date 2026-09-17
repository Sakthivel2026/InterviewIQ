import { ParsedResumeJSON, ParsedJdJSON } from '../ai/claude.service';

export interface SkillMatchResult {
  matchPercentage: number;
  matchingSkills: string[];
  missingSkills: string[];
  preferredMatches: string[];
  experienceMatchScore: number;
  summaryFeedback: string;
}

export const computeSkillMatch = (
  resume: ParsedResumeJSON,
  jd: ParsedJdJSON
): SkillMatchResult => {
  const candidateSkillsLower = new Set([
    ...resume.skills.map((s) => s.toLowerCase()),
    ...resume.languages.map((s) => s.toLowerCase()),
    ...resume.frameworks.map((s) => s.toLowerCase()),
    ...resume.tools.map((s) => s.toLowerCase()),
  ]);

  const requiredSkills = jd.requiredSkills || [];
  const preferredSkills = jd.preferredSkills || [];
  const techStack = jd.tech || [];

  const allJdRequired = Array.from(new Set([...requiredSkills, ...techStack]));

  const matchingSkills: string[] = [];
  const missingSkills: string[] = [];
  const preferredMatches: string[] = [];

  allJdRequired.forEach((reqSkill) => {
    const norm = reqSkill.toLowerCase();
    let isFound = false;
    for (const candSkill of candidateSkillsLower) {
      if (candSkill.includes(norm) || norm.includes(candSkill)) {
        isFound = true;
        break;
      }
    }
    if (isFound) {
      matchingSkills.push(reqSkill);
    } else {
      missingSkills.push(reqSkill);
    }
  });

  preferredSkills.forEach((prefSkill) => {
    const norm = prefSkill.toLowerCase();
    let isFound = false;
    for (const candSkill of candidateSkillsLower) {
      if (candSkill.includes(norm) || norm.includes(candSkill)) {
        isFound = true;
        break;
      }
    }
    if (isFound) {
      preferredMatches.push(prefSkill);
    }
  });

  const totalRequired = allJdRequired.length || 1;
  const matchRatio = matchingSkills.length / totalRequired;
  let matchPercentage = Math.round(matchRatio * 85 + (preferredMatches.length > 0 ? 10 : 0));
  if (matchPercentage > 98) matchPercentage = 98;
  if (matchPercentage < 35 && matchingSkills.length > 0) matchPercentage = 55;

  const levelHierarchy: Record<string, number> = { entry: 1, mid: 2, senior: 3, lead: 4 };
  const candidateLevelScore = levelHierarchy[resume.experienceLevel] || 2;
  const jdLevelScore = levelHierarchy[jd.experienceLevel] || 2;
  const experienceMatchScore = candidateLevelScore >= jdLevelScore ? 100 : Math.round((candidateLevelScore / jdLevelScore) * 100);

  let summaryFeedback = `Candidate matches ${matchingSkills.length} of ${totalRequired} core technical requirements (${matchPercentage}% compatibility). `;
  if (missingSkills.length > 0) {
    summaryFeedback += `Key skill gaps to address during interview: ${missingSkills.join(', ')}.`;
  } else {
    summaryFeedback += `Strong alignment across all core technologies!`;
  }

  return {
    matchPercentage,
    matchingSkills,
    missingSkills,
    preferredMatches,
    experienceMatchScore,
    summaryFeedback,
  };
};
