/**
 * Comprehensive Profile Validation Utility
 * Provides reusable validation functions for student profile fields
 */

/**
 * Validate name fields (firstName, lastName)
 */
const validateName = (name, fieldName = 'Name', minLength = 2) => {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: `${fieldName} is required` };
  }

  const trimmed = name.trim();
  
  if (trimmed.length < minLength) {
    return { valid: false, error: `${fieldName} must be at least ${minLength} character${minLength === 1 ? '' : 's'}` };
  }

  if (trimmed.length > 50) {
    return { valid: false, error: `${fieldName} must not exceed 50 characters` };
  }

  // Allow letters, spaces, hyphens, apostrophes (for names like O'Brien, Jean-Pierre)
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(trimmed)) {
    return { valid: false, error: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes` };
  }

  return { valid: true, value: trimmed };
};

/**
 * Validate email format
 */
const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Invalid email format' };
  }

  return { valid: true, value: trimmed };
};

/**
 * Validate phone number (international format)
 * Accepts: +91 9876543210, +1-234-567-8900, 9876543210
 */
const validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, error: 'Phone number is required' };
  }

  const trimmed = phone.trim();

  // Remove spaces, hyphens, parentheses for validation
  const cleaned = trimmed.replace(/[\s\-()]/g, '');

  // Must start with + or digit, and contain 10-15 digits
  const phoneRegex = /^\+?\d{10,15}$/;

  if (!phoneRegex.test(cleaned)) {
    return { valid: false, error: 'Phone number must be 10-15 digits (with optional + prefix)' };
  }

  return { valid: true, value: trimmed };
};

/**
 * Validate date of birth
 * Must be past date, reasonable age range (13-100 years)
 */
const validateDateOfBirth = (dob) => {
  if (!dob) {
    return { valid: false, error: 'Date of birth is required' };
  }

  const date = new Date(dob);
  const now = new Date();

  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }

  if (date >= now) {
    return { valid: false, error: 'Date of birth cannot be in the future' };
  }

  // Calculate age
  const age = Math.floor((now - date) / (365.25 * 24 * 60 * 60 * 1000));

  if (age < 13) {
    return { valid: false, error: 'You must be at least 13 years old' };
  }

  if (age > 100) {
    return { valid: false, error: 'Please enter a valid date of birth' };
  }

  return { valid: true, value: date.toISOString() };
};

/**
 * Validate gender field
 */
const validateGender = (gender) => {
  const validGenders = ['male', 'female', 'non-binary', 'prefer-not-to-say'];

  if (!gender || typeof gender !== 'string') {
    return { valid: false, error: 'Gender is required' };
  }

  const normalized = gender.toLowerCase().trim();

  if (!validGenders.includes(normalized)) {
    return { valid: false, error: 'Invalid gender value' };
  }

  return { valid: true, value: normalized };
};

/**
 * Validate URL fields
 * Accepts both full URLs and usernames
 * Returns normalized full URL
 */
const validateURL = (url, platform = 'generic', required = false) => {
  if (!url || typeof url !== 'string') {
    if (required) {
      return { valid: false, error: `${platform} URL is required` };
    }
    return { valid: true, value: '' };
  }

  const trimmed = url.trim();

  if (!trimmed) {
    if (required) {
      return { valid: false, error: `${platform} URL is required` };
    }
    return { valid: true, value: '' };
  }

  // Platform-specific URL construction
  const platformConfig = {
    linkedin: {
      domain: 'linkedin.com/in/',
      prefix: 'https://linkedin.com/in/',
      regex: /^(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9\-]+)\/?$/
    },
    github: {
      domain: 'github.com/',
      prefix: 'https://github.com/',
      regex: /^(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9\-]+)\/?$/
    },
    leetcode: {
      domain: 'leetcode.com/',
      prefix: 'https://leetcode.com/',
      regex: /^(?:https?:\/\/)?(?:www\.)?leetcode\.com\/(?:u\/)?([a-zA-Z0-9\-_]+)\/?$/
    },
    hackerrank: {
      domain: 'hackerrank.com/',
      prefix: 'https://www.hackerrank.com/profile/',
      regex: /^(?:https?:\/\/)?(?:www\.)?hackerrank\.com\/(?:profile\/)?([a-zA-Z0-9\-_]+)\/?$/
    },
    generic: {
      regex: /^https?:\/\/.+\..+/
    }
  };

  const config = platformConfig[platform.toLowerCase()] || platformConfig.generic;

  // If it looks like a username (no protocol, no dots), construct full URL
  if (config.prefix && !trimmed.includes('://') && !trimmed.includes('.')) {
    // Validate username format (alphanumeric, hyphens, underscores)
    const usernameRegex = /^[a-zA-Z0-9\-_]+$/;
    if (!usernameRegex.test(trimmed)) {
      return { valid: false, error: `Invalid ${platform} username format` };
    }
    return { valid: true, value: config.prefix + trimmed };
  }

  // Validate full URL
  if (config.regex) {
    if (!config.regex.test(trimmed)) {
      return { valid: false, error: `Invalid ${platform} URL format` };
    }
    // Ensure https
    if (!trimmed.startsWith('http')) {
      return { valid: true, value: 'https://' + trimmed };
    }
  } else {
    // Generic URL validation
    try {
      const urlObj = new URL(trimmed.startsWith('http') ? trimmed : 'https://' + trimmed);
      return { valid: true, value: urlObj.href };
    } catch (error) {
      return { valid: false, error: 'Invalid URL format' };
    }
  }

  return { valid: true, value: trimmed };
};

/**
 * Validate graduation year
 */
const validateGraduationYear = (year) => {
  if (!year) {
    return { valid: true, value: null }; // Optional field
  }

  const numYear = parseInt(year, 10);
  const currentYear = new Date().getFullYear();

  if (isNaN(numYear)) {
    return { valid: false, error: 'Graduation year must be a number' };
  }

  if (numYear < currentYear - 10) {
    return { valid: false, error: 'Graduation year seems too far in the past' };
  }

  if (numYear > currentYear + 10) {
    return { valid: false, error: 'Graduation year cannot be more than 10 years in the future' };
  }

  return { valid: true, value: numYear };
};

/**
 * Validate year of study
 */
const validateYearOfStudy = (year) => {
  if (!year) {
    return { valid: true, value: '' }; // Optional
  }

  const validYears = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate', 'Postgraduate'];
  const normalized = year.trim();

  // Accept variations
  const yearMap = {
    '1': '1st Year',
    '2': '2nd Year',
    '3': '3rd Year',
    '4': '4th Year',
    'first': '1st Year',
    'second': '2nd Year',
    'third': '3rd Year',
    'fourth': '4th Year',
    'graduate': 'Graduate',
    'postgraduate': 'Postgraduate'
  };

  const lowerNorm = normalized.toLowerCase();
  const mapped = yearMap[lowerNorm];

  if (mapped) {
    return { valid: true, value: mapped };
  }

  if (validYears.includes(normalized)) {
    return { valid: true, value: normalized };
  }

  return { valid: true, value: normalized }; // Allow free text
};

/**
 * Validate CGPA
 */
const validateCGPA = (cgpa) => {
  if (!cgpa && cgpa !== 0) {
    return { valid: true, value: null }; // Optional
  }

  const num = parseFloat(cgpa);

  if (isNaN(num)) {
    return { valid: false, error: 'CGPA must be a number' };
  }

  if (num < 0 || num > 10) {
    return { valid: false, error: 'CGPA must be between 0 and 10' };
  }

  return { valid: true, value: parseFloat(num.toFixed(2)) };
};

/**
 * Validate GitHub Personal Access Token
 */
const validateGitHubToken = (token) => {
  if (!token || typeof token !== 'string') {
    return { valid: true, value: '' }; // Optional
  }

  const trimmed = token.trim();

  if (!trimmed) {
    return { valid: true, value: '' };
  }

  // GitHub tokens start with specific prefixes
  const validPrefixes = ['ghp_', 'github_pat_', 'gho_', 'ghu_', 'ghs_', 'ghr_'];
  const hasValidPrefix = validPrefixes.some(prefix => trimmed.startsWith(prefix));

  if (!hasValidPrefix) {
    return { valid: false, error: 'GitHub token must start with a valid prefix (ghp_, github_pat_, etc.)' };
  }

  if (trimmed.length < 20) {
    return { valid: false, error: 'GitHub token seems too short' };
  }

  return { valid: true, value: trimmed };
};

/**
 * Validate skills array
 */
const validateSkills = (skills) => {
  if (!skills || !Array.isArray(skills) || skills.length === 0) {
    return { valid: false, error: 'At least one skill is required' };
  }

  const cleanSkills = skills
    .filter(skill => skill && typeof skill === 'string')
    .map(skill => skill.trim())
    .filter(skill => skill.length > 0);

  if (cleanSkills.length === 0) {
    return { valid: false, error: 'At least one valid skill is required' };
  }

  // Validate individual skills
  for (const skill of cleanSkills) {
    if (skill.length > 50) {
      return { valid: false, error: 'Each skill must not exceed 50 characters' };
    }
  }

  // Remove duplicates (case-insensitive)
  const uniqueSkills = [...new Set(cleanSkills.map(s => s.toLowerCase()))].map(s => 
    cleanSkills.find(orig => orig.toLowerCase() === s)
  );

  if (uniqueSkills.length > 100) {
    return { valid: false, error: 'Maximum 100 skills allowed' };
  }

  return { valid: true, value: uniqueSkills };
};

/**
 * Validate text fields with length limits
 */
const validateTextField = (text, fieldName, options = {}) => {
  const { required = false, minLength = 0, maxLength = 1000 } = options;

  if (!text || typeof text !== 'string') {
    if (required) {
      return { valid: false, error: `${fieldName} is required` };
    }
    return { valid: true, value: '' };
  }

  const trimmed = text.trim();

  if (required && trimmed.length === 0) {
    return { valid: false, error: `${fieldName} is required` };
  }

  if (trimmed.length < minLength) {
    return { valid: false, error: `${fieldName} must be at least ${minLength} characters` };
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error: `${fieldName} must not exceed ${maxLength} characters` };
  }

  return { valid: true, value: trimmed };
};

/**
 * Validate profile photo (base64 or file size)
 */
const validateProfilePhoto = (photoData) => {
  if (!photoData || typeof photoData !== 'string') {
    return { valid: true, value: '' }; // Optional
  }

  const trimmed = photoData.trim();

  if (!trimmed) {
    return { valid: true, value: '' };
  }

  // Check if it's base64
  if (trimmed.startsWith('data:image/')) {
    // Extract size from base64 (approximate)
    const base64Length = trimmed.split(',')[1]?.length || 0;
    const sizeInBytes = (base64Length * 3) / 4;
    const sizeInMB = sizeInBytes / (1024 * 1024);

    if (sizeInMB > 5) {
      return { valid: false, error: 'Profile photo must be less than 5MB' };
    }

    // Validate image format
    const validFormats = ['data:image/jpeg', 'data:image/jpg', 'data:image/png', 'data:image/gif', 'data:image/webp'];
    const hasValidFormat = validFormats.some(format => trimmed.startsWith(format));

    if (!hasValidFormat) {
      return { valid: false, error: 'Profile photo must be JPEG, PNG, GIF, or WebP' };
    }
  }

  return { valid: true, value: trimmed };
};

/**
 * Validate complete profile
 * Returns object with all validation results
 */
const validateCompleteProfile = (profileData) => {
  const errors = {};
  const validated = {};

  // Required fields
  const firstNameResult = validateName(profileData.firstName, 'First name', 2);
  if (!firstNameResult.valid) errors.firstName = firstNameResult.error;
  else validated.firstName = firstNameResult.value;

  const lastNameResult = validateName(profileData.lastName, 'Last name', 1);
  if (!lastNameResult.valid) errors.lastName = lastNameResult.error;
  else validated.lastName = lastNameResult.value;

  const dobResult = validateDateOfBirth(profileData.dateOfBirth);
  if (!dobResult.valid) errors.dateOfBirth = dobResult.error;
  else validated.dateOfBirth = dobResult.value;

  const genderResult = validateGender(profileData.gender);
  if (!genderResult.valid) errors.gender = genderResult.error;
  else validated.gender = genderResult.value;

  const phoneResult = validatePhone(profileData.phone);
  if (!phoneResult.valid) errors.phone = phoneResult.error;
  else validated.phone = phoneResult.value;

  const collegeResult = validateTextField(profileData.college, 'College', { required: true, minLength: 2, maxLength: 200 });
  if (!collegeResult.valid) errors.college = collegeResult.error;
  else validated.college = collegeResult.value;

  const linkedinResult = validateURL(profileData.linkedinUrl, 'linkedin', true);
  if (!linkedinResult.valid) errors.linkedinUrl = linkedinResult.error;
  else validated.linkedinUrl = linkedinResult.value;

  const skillsResult = validateSkills(profileData.skills);
  if (!skillsResult.valid) errors.skills = skillsResult.error;
  else validated.skills = skillsResult.value;

  // At least one coding platform required
  const leetcodeResult = validateURL(profileData.leetcodeUrl, 'leetcode', false);
  const hackerrankResult = validateURL(profileData.hackerrankUrl, 'hackerrank', false);

  if (leetcodeResult.valid) validated.leetcodeUrl = leetcodeResult.value;
  if (hackerrankResult.valid) validated.hackerrankUrl = hackerrankResult.value;

  if (!validated.leetcodeUrl && !validated.hackerrankUrl) {
    errors.codingPlatform = 'At least one coding platform (LeetCode or HackerRank) is required';
  }

  // Optional fields
  const locationResult = validateTextField(profileData.location, 'Location', { maxLength: 100 });
  if (locationResult.valid) validated.location = locationResult.value;
  else if (locationResult.error) errors.location = locationResult.error;

  const branchResult = validateTextField(profileData.branch, 'Branch', { maxLength: 100 });
  if (branchResult.valid) validated.branch = branchResult.value;

  const yearResult = validateYearOfStudy(profileData.year);
  if (yearResult.valid) validated.year = yearResult.value;

  const gradYearResult = validateGraduationYear(profileData.graduationYear);
  if (!gradYearResult.valid) errors.graduationYear = gradYearResult.error;
  else if (gradYearResult.value) validated.graduationYear = gradYearResult.value;

  const cgpaResult = validateCGPA(profileData.cgpa);
  if (!cgpaResult.valid) errors.cgpa = cgpaResult.error;
  else if (cgpaResult.value !== null) validated.cgpa = cgpaResult.value;

  const headlineResult = validateTextField(profileData.headline, 'Headline', { maxLength: 200 });
  if (headlineResult.valid) validated.headline = headlineResult.value;
  else if (headlineResult.error) errors.headline = headlineResult.error;

  const summaryResult = validateTextField(profileData.summary, 'Summary', { maxLength: 2000 });
  if (summaryResult.valid) validated.summary = summaryResult.value;
  else if (summaryResult.error) errors.summary = summaryResult.error;

  const portfolioResult = validateURL(profileData.portfolioUrl, 'generic', false);
  if (portfolioResult.valid) validated.portfolioUrl = portfolioResult.value;
  else if (portfolioResult.error) errors.portfolioUrl = portfolioResult.error;

  const githubResult = validateURL(profileData.githubUrl, 'github', false);
  if (githubResult.valid) validated.githubUrl = githubResult.value;
  else if (githubResult.error) errors.githubUrl = githubResult.error;

  const githubTokenResult = validateGitHubToken(profileData.githubToken);
  if (!githubTokenResult.valid) errors.githubToken = githubTokenResult.error;
  else if (githubTokenResult.value) validated.githubToken = githubTokenResult.value;

  const resumeResult = validateURL(profileData.resumeLink, 'generic', false);
  if (resumeResult.valid) validated.resumeLink = resumeResult.value;
  else if (resumeResult.error) errors.resumeLink = resumeResult.error;

  const avatarResult = validateProfilePhoto(profileData.avatar);
  if (!avatarResult.valid) errors.avatar = avatarResult.error;
  else if (avatarResult.value) validated.avatar = avatarResult.value;

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    validated
  };
};

module.exports = {
  validateName,
  validateEmail,
  validatePhone,
  validateDateOfBirth,
  validateGender,
  validateURL,
  validateGraduationYear,
  validateYearOfStudy,
  validateCGPA,
  validateGitHubToken,
  validateSkills,
  validateTextField,
  validateProfilePhoto,
  validateCompleteProfile
};
