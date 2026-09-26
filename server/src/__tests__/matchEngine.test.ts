import { describe, it, expect } from 'vitest';
import { computeSkillMatch } from '../services/matchEngine';
import { ParsedResumeJSON, ParsedJdJSON } from '../ai/claude.service';

describe('Skill Match Engine', () => {
  const sampleResume: ParsedResumeJSON = {
    name: 'Jane Doe',
    summary: 'Full-stack software engineer specializing in TypeScript and Node.js',
    experienceLevel: 'senior',
    skills: ['TypeScript', 'JavaScript', 'Node.js', 'React', 'PostgreSQL', 'Docker'],
    languages: ['TypeScript', 'JavaScript', 'SQL'],
    frameworks: ['React', 'Express.js', 'Node.js'],
    tools: ['PostgreSQL', 'Docker', 'Git', 'AWS'],
    education: [{ institution: 'Stanford', degree: 'B.S. CS', year: '2019' }],
    experience: [],
    projects: [],
    certifications: [],
  };

  const sampleJd: ParsedJdJSON = {
    roleTitle: 'Senior Full-Stack Engineer',
    company: 'TechCorp',
    experienceLevel: 'senior',
    summary: 'Looking for a Senior Full-Stack Engineer skilled in TypeScript, React, Node.js, and PostgreSQL.',
    requiredSkills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
    preferredSkills: ['Docker', 'AWS', 'Kubernetes'],
    tech: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
    responsibilities: ['Build scalable APIs', 'Develop reactive React frontends'],
    keywords: ['Full-Stack', 'Microservices'],
  };

  it('should compute high match percentage for strong resume alignment', () => {
    const result = computeSkillMatch(sampleResume, sampleJd);

    expect(result.matchPercentage).toBeGreaterThanOrEqual(80);
    expect(result.matchingSkills).toContain('TypeScript');
    expect(result.matchingSkills).toContain('React');
    expect(result.matchingSkills).toContain('PostgreSQL');
    expect(result.preferredMatches).toContain('Docker');
    expect(result.experienceMatchScore).toBe(100);
  });

  it('should identify missing skill gaps accurately when resume lacks core tech', () => {
    const weakResume: ParsedResumeJSON = {
      ...sampleResume,
      skills: ['Python', 'Django', 'MongoDB'],
      languages: ['Python'],
      frameworks: ['Django'],
      tools: ['MongoDB'],
    };

    const result = computeSkillMatch(weakResume, sampleJd);

    expect(result.missingSkills.length).toBeGreaterThan(0);
    expect(result.summaryFeedback).toContain('Key skill gaps');
  });

  it('should adjust experience match score based on level hierarchy', () => {
    const juniorResume: ParsedResumeJSON = {
      ...sampleResume,
      experienceLevel: 'entry',
    };

    const result = computeSkillMatch(juniorResume, sampleJd);

    expect(result.experienceMatchScore).toBeLessThan(100);
  });
});
