import { z } from 'zod';

/**
 * Student Profile Validation Schemas using Zod
 * Provides comprehensive frontend validation with detailed error messages
 */

// Helper: URL or username validator
const createUrlOrUsernameSchema = (platform: string, required: boolean = false) => {
  const baseSchema = z.string().trim();
  
  if (!required) {
    return baseSchema.optional().or(z.literal('')).transform(val => val || '');
  }

  const platformConfigs: Record<string, { domain: string; prefix: string }> = {
    linkedin: { domain: 'linkedin.com', prefix: 'https://linkedin.com/in/' },
    github: { domain: 'github.com', prefix: 'https://github.com/' },
    leetcode: { domain: 'leetcode.com', prefix: 'https://leetcode.com/' },
    hackerrank: { domain: 'hackerrank.com', prefix: 'https://www.hackerrank.com/profile/' },
  };

  return z.string().min(1, `${platform} is required`).transform((val) => {
    const trimmed = val.trim();
    const config = platformConfigs[platform.toLowerCase()];
    
    // If username (no protocol, no dots), construct full URL
    if (config && !trimmed.includes('://') && !trimmed.includes('.')) {
      return config.prefix + trimmed;
    }
    
    // Ensure https protocol
    if (trimmed && !trimmed.startsWith('http')) {
      return 'https://' + trimmed;
    }
    
    return trimmed;
  });
};

// Name validation (letters, spaces, hyphens, apostrophes only)
const nameSchema = (fieldName: string, minLength: number = 2) =>
  z
    .string()
    .min(minLength, `${fieldName} must be at least ${minLength} character${minLength === 1 ? '' : 's'}`)
    .max(50, `${fieldName} must not exceed 50 characters`)
    .regex(/^[a-zA-Z\s\-']+$/, `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`)
    .transform(val => val.trim());

// Phone number validation (international format)
const phoneSchema = z
  .string()
  .min(1, 'Phone number is required')
  .transform(val => val.replace(/[\s\-()]/g, ''))
  .refine(
    (val) => /^\+?\d{10,15}$/.test(val),
    'Phone number must be 10-15 digits with optional + prefix'
  );

// Date of birth validation
const dobSchema = z
  .string()
  .min(1, 'Date of birth is required')
  .refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, 'Invalid date format')
  .refine((val) => {
    const date = new Date(val);
    const now = new Date();
    return date < now;
  }, 'Date of birth cannot be in the future')
  .refine((val) => {
    const date = new Date(val);
    const now = new Date();
    const age = Math.floor((now.getTime() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return age >= 13 && age <= 100;
  }, 'You must be between 13 and 100 years old');

// Gender validation
const genderSchema = z.enum(['male', 'female', 'non-binary', 'prefer-not-to-say'], {
  errorMap: () => ({ message: 'Please select a valid gender' }),
});

// Skills validation
const skillsSchema = z
  .array(z.string())
  .min(1, 'At least one skill is required')
  .max(100, 'Maximum 100 skills allowed')
  .refine(
    (skills) => skills.every((skill) => skill.length <= 50),
    'Each skill must not exceed 50 characters'
  )
  .transform((skills) => {
    // Remove duplicates (case-insensitive)
    const uniqueSkills = Array.from(
      new Map(skills.map((s) => [s.toLowerCase(), s])).values()
    );
    return uniqueSkills;
  });

// CGPA validation
const cgpaSchema = z
  .union([z.number(), z.string()])
  .optional()
  .transform((val) => {
    if (!val && val !== 0) return null;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) ? null : num;
  })
  .refine(
    (val) => val === null || (val >= 0 && val <= 10),
    'CGPA must be between 0 and 10'
  );

// Graduation year validation
const graduationYearSchema = z
  .union([z.number(), z.string()])
  .optional()
  .transform((val) => {
    if (!val) return null;
    const num = typeof val === 'string' ? parseInt(val, 10) : val;
    return isNaN(num) ? null : num;
  })
  .refine(
    (val) => {
      if (val === null) return true;
      const currentYear = new Date().getFullYear();
      return val >= currentYear - 10 && val <= currentYear + 10;
    },
    'Graduation year must be within 10 years of current year'
  );

// GitHub token validation
const githubTokenSchema = z
  .string()
  .optional()
  .or(z.literal(''))
  .refine(
    (val) => {
      if (!val) return true;
      const validPrefixes = ['ghp_', 'github_pat_', 'gho_', 'ghu_', 'ghs_', 'ghr_'];
      return validPrefixes.some((prefix) => val.startsWith(prefix));
    },
    'GitHub token must start with a valid prefix (ghp_, github_pat_, etc.)'
  )
  .refine(
    (val) => !val || val.length >= 20,
    'GitHub token seems too short'
  );

// Profile photo validation (base64)
const profilePhotoSchema = z
  .string()
  .optional()
  .or(z.literal(''))
  .refine(
    (val) => {
      if (!val || !val.startsWith('data:image/')) return true;
      const base64Length = val.split(',')[1]?.length || 0;
      const sizeInBytes = (base64Length * 3) / 4;
      const sizeInMB = sizeInBytes / (1024 * 1024);
      return sizeInMB <= 5;
    },
    'Profile photo must be less than 5MB'
  )
  .refine(
    (val) => {
      if (!val || !val.startsWith('data:image/')) return true;
      const validFormats = ['data:image/jpeg', 'data:image/jpg', 'data:image/png', 'data:image/gif', 'data:image/webp'];
      return validFormats.some((format) => val.startsWith(format));
    },
    'Profile photo must be JPEG, PNG, GIF, or WebP'
  );

// Main profile schema
export const studentProfileSchema = z.object({
  // Required fields
  firstName: nameSchema('First name', 2),
  lastName: nameSchema('Last name', 1),
  dateOfBirth: dobSchema,
  gender: genderSchema,
  phone: phoneSchema,
  college: z
    .string()
    .min(2, 'College name must be at least 2 characters')
    .max(200, 'College name must not exceed 200 characters')
    .transform(val => val.trim()),
  linkedinUrl: createUrlOrUsernameSchema('linkedin', true),
  skills: skillsSchema,

  // Optional fields
  location: z
    .string()
    .max(100, 'Location must not exceed 100 characters')
    .optional()
    .or(z.literal(''))
    .transform(val => val?.trim() || ''),
  branch: z
    .string()
    .max(100, 'Branch must not exceed 100 characters')
    .optional()
    .or(z.literal(''))
    .transform(val => val?.trim() || ''),
  year: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform(val => val?.trim() || ''),
  graduationYear: graduationYearSchema,
  cgpa: cgpaSchema,
  headline: z
    .string()
    .max(200, 'Headline must not exceed 200 characters')
    .optional()
    .or(z.literal(''))
    .transform(val => val?.trim() || ''),
  summary: z
    .string()
    .max(2000, 'Summary must not exceed 2000 characters')
    .optional()
    .or(z.literal(''))
    .transform(val => val?.trim() || ''),
  portfolioUrl: createUrlOrUsernameSchema('generic', false),
  githubUrl: createUrlOrUsernameSchema('github', false),
  githubToken: githubTokenSchema,
  resumeLink: createUrlOrUsernameSchema('generic', false),
  leetcodeUrl: createUrlOrUsernameSchema('leetcode', false),
  hackerrankUrl: createUrlOrUsernameSchema('hackerrank', false),
  avatar: profilePhotoSchema,
})
  .refine(
    (data) => data.leetcodeUrl || data.hackerrankUrl,
    {
      message: 'At least one coding platform (LeetCode or HackerRank) is required',
      path: ['codingPlatform'],
    }
  );

export type StudentProfileFormData = z.infer<typeof studentProfileSchema>;

// Individual field schemas for partial validation
export const profileFieldSchemas = {
  firstName: nameSchema('First name', 2),
  lastName: nameSchema('Last name', 1),
  dateOfBirth: dobSchema,
  gender: genderSchema,
  phone: phoneSchema,
  college: z.string().min(2).max(200),
  linkedinUrl: createUrlOrUsernameSchema('linkedin', true),
  skills: skillsSchema,
  location: z.string().max(100).optional(),
  branch: z.string().max(100).optional(),
  year: z.string().optional(),
  graduationYear: graduationYearSchema,
  cgpa: cgpaSchema,
  headline: z.string().max(200).optional(),
  summary: z.string().max(2000).optional(),
  portfolioUrl: createUrlOrUsernameSchema('generic', false),
  githubUrl: createUrlOrUsernameSchema('github', false),
  githubToken: githubTokenSchema,
  resumeLink: createUrlOrUsernameSchema('generic', false),
  leetcodeUrl: createUrlOrUsernameSchema('leetcode', false),
  hackerrankUrl: createUrlOrUsernameSchema('hackerrank', false),
  avatar: profilePhotoSchema,
};

// Helper to validate a single field
export const validateField = <K extends keyof typeof profileFieldSchemas>(
  fieldName: K,
  value: any
) => {
  try {
    const schema = profileFieldSchemas[fieldName];
    schema.parse(value);
    return { success: true, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || 'Validation failed' };
    }
    return { success: false, error: 'Validation failed' };
  }
};
