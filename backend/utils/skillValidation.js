/**
 * Skill validation and confidence scoring utility
 * Maps various data sources to validated skills with confidence scores
 */

// Language to skill mapping for GitHub repositories
const LANGUAGE_TO_SKILL_MAP = {
  'JavaScript': ['JavaScript', 'Node.js', 'Web Development'],
  'TypeScript': ['TypeScript', 'JavaScript', 'Web Development'],
  'Python': ['Python', 'Backend Development'],
  'Java': ['Java', 'Backend Development', 'OOP'],
  'C++': ['C++', 'System Programming', 'DSA'],
  'C': ['C', 'System Programming'],
  'Go': ['Go', 'Backend Development', 'Cloud'],
  'Rust': ['Rust', 'System Programming'],
  'Ruby': ['Ruby', 'Backend Development'],
  'PHP': ['PHP', 'Web Development', 'Backend Development'],
  'Swift': ['Swift', 'iOS Development', 'Mobile Development'],
  'Kotlin': ['Kotlin', 'Android Development', 'Mobile Development'],
  'Dart': ['Dart', 'Flutter', 'Mobile Development'],
  'SQL': ['SQL', 'Database', 'Backend Development'],
  'HTML': ['HTML', 'Web Development', 'Frontend'],
  'CSS': ['CSS', 'Web Development', 'Frontend'],
  'Shell': ['Shell Scripting', 'DevOps', 'Linux'],
  'R': ['R', 'Data Science', 'Statistics'],
  'MATLAB': ['MATLAB', 'Data Science', 'Mathematics'],
  'Scala': ['Scala', 'Backend Development', 'Functional Programming'],
  'Haskell': ['Haskell', 'Functional Programming'],
  'Elixir': ['Elixir', 'Backend Development'],
  'Clojure': ['Clojure', 'Functional Programming'],
};

/**
 * Infer skills from GitHub repository languages
 * @param {Array} topLanguages - Array of {name, count, percentage} from GitHub
 * @returns {Array} Array of validated skill objects
 */
const inferSkillsFromGitHub = (topLanguages = []) => {
  const skills = [];
  const seenSkills = new Set();

  topLanguages.forEach(({ name, count, percentage }) => {
    const mappedSkills = LANGUAGE_TO_SKILL_MAP[name] || [name];
    
    mappedSkills.forEach(skillName => {
      const normalizedSkill = skillName.toLowerCase();
      
      if (!seenSkills.has(normalizedSkill)) {
        seenSkills.add(normalizedSkill);
        
        // Confidence based on percentage and count
        // Higher percentage and count = higher confidence
        let confidence = 0.8;
        if (percentage >= 40) confidence = 0.95;
        else if (percentage >= 20) confidence = 0.9;
        else if (percentage >= 10) confidence = 0.85;
        
        skills.push({
          name: skillName,
          source: 'github',
          confidence: confidence,
          evidence: [`${count} repositories using ${name}`],
        });
      }
    });
  });

  return skills;
};

/**
 * Infer skills from project tags
 * @param {Array} projects - Array of project objects with tags
 * @returns {Array} Array of validated skill objects
 */
const inferSkillsFromProjects = (projects = []) => {
  const skillMap = new Map();

  projects.forEach(project => {
    if (project.tags && Array.isArray(project.tags)) {
      project.tags.forEach(tag => {
        const normalized = tag.toLowerCase();
        if (!skillMap.has(normalized)) {
          skillMap.set(normalized, {
            name: tag,
            count: 0,
            projects: [],
          });
        }
        const skill = skillMap.get(normalized);
        skill.count += 1;
        skill.projects.push(project.title || 'Untitled Project');
      });
    }
  });

  const skills = [];
  skillMap.forEach(({ name, count, projects }) => {
    // Confidence increases with more projects using the skill
    let confidence = 0.7;
    if (count >= 3) confidence = 0.85;
    else if (count >= 2) confidence = 0.8;
    
    skills.push({
      name,
      source: 'project',
      confidence,
      evidence: [`Used in ${count} project(s): ${projects.slice(0, 2).join(', ')}`],
    });
  });

  return skills;
};

/**
 * Extract skills from certifications
 * @param {Array} certifications - Array of certification objects
 * @returns {Array} Array of validated skill objects
 */
const inferSkillsFromCertifications = (certifications = []) => {
  const skills = [];
  const seenSkills = new Set();

  // Common certification name patterns to skill mapping
  const certPatterns = [
    { pattern: /aws|amazon web services/i, skill: 'AWS' },
    { pattern: /azure|microsoft azure/i, skill: 'Azure' },
    { pattern: /google cloud|gcp/i, skill: 'Google Cloud' },
    { pattern: /kubernetes|k8s/i, skill: 'Kubernetes' },
    { pattern: /docker/i, skill: 'Docker' },
    { pattern: /python/i, skill: 'Python' },
    { pattern: /java(?!script)/i, skill: 'Java' },
    { pattern: /javascript|js/i, skill: 'JavaScript' },
    { pattern: /react/i, skill: 'React' },
    { pattern: /angular/i, skill: 'Angular' },
    { pattern: /vue/i, skill: 'Vue.js' },
    { pattern: /node\.?js/i, skill: 'Node.js' },
    { pattern: /machine learning|ml/i, skill: 'Machine Learning' },
    { pattern: /data science/i, skill: 'Data Science' },
    { pattern: /artificial intelligence|ai/i, skill: 'Artificial Intelligence' },
    { pattern: /devops/i, skill: 'DevOps' },
    { pattern: /sql|database/i, skill: 'Database' },
    { pattern: /mongodb/i, skill: 'MongoDB' },
    { pattern: /postgresql|postgres/i, skill: 'PostgreSQL' },
  ];

  certifications
    .filter(cert => cert.status === 'verified')
    .forEach(cert => {
      const certName = cert.name.toLowerCase();
      
      certPatterns.forEach(({ pattern, skill }) => {
        if (pattern.test(certName)) {
          const normalized = skill.toLowerCase();
          if (!seenSkills.has(normalized)) {
            seenSkills.add(normalized);
            skills.push({
              name: skill,
              source: 'certificate',
              confidence: 1.0, // Verified certifications have max confidence
              evidence: [`Certified: ${cert.name}`],
            });
          }
        }
      });
    });

  return skills;
};

/**
 * Extract skills from resume (simple keyword extraction)
 * @param {Array} resumeSkills - Array of skill strings from resume
 * @returns {Array} Array of validated skill objects
 */
const inferSkillsFromResume = (resumeSkills = []) => {
  return resumeSkills.map(skillName => ({
    name: skillName,
    source: 'resume',
    confidence: 0.6, // Resume-only skills have moderate confidence
    evidence: ['Listed in resume'],
  }));
};

/**
 * Merge and deduplicate skills from multiple sources
 * Takes the highest confidence score when duplicates exist
 * @param {Array} skillArrays - Array of skill arrays from different sources
 * @returns {Array} Merged and deduplicated skills
 */
const mergeValidatedSkills = (...skillArrays) => {
  const skillMap = new Map();

  skillArrays.forEach(skillArray => {
    if (!Array.isArray(skillArray)) return;
    
    skillArray.forEach(skill => {
      const normalized = skill.name.toLowerCase().trim();
      
      if (!skillMap.has(normalized)) {
        skillMap.set(normalized, skill);
      } else {
        // Keep the entry with higher confidence
        const existing = skillMap.get(normalized);
        if (skill.confidence > existing.confidence) {
          // Merge evidence from both sources
          skill.evidence = [...existing.evidence, ...skill.evidence];
          skillMap.set(normalized, skill);
        } else {
          // Add evidence to existing entry
          existing.evidence = [...existing.evidence, ...skill.evidence];
        }
      }
    });
  });

  return Array.from(skillMap.values())
    .sort((a, b) => b.confidence - a.confidence); // Sort by confidence descending
};

/**
 * Update student validated skills based on all available data sources
 * @param {Object} student - Student document
 * @returns {Array} Updated validated skills array
 */
const updateValidatedSkills = (student) => {
  const githubSkills = student.githubStats?.topLanguages 
    ? inferSkillsFromGitHub(student.githubStats.topLanguages)
    : [];
  
  const projectSkills = inferSkillsFromProjects(student.projects || []);
  
  const certSkills = inferSkillsFromCertifications(student.certifications || []);
  
  const resumeSkills = inferSkillsFromResume(student.skills || []);

  return mergeValidatedSkills(githubSkills, projectSkills, certSkills, resumeSkills);
};

module.exports = {
  inferSkillsFromGitHub,
  inferSkillsFromProjects,
  inferSkillsFromCertifications,
  inferSkillsFromResume,
  mergeValidatedSkills,
  updateValidatedSkills,
};
