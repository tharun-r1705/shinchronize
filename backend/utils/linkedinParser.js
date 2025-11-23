const cheerio = require('cheerio');

const SECTION_HEADERS = [
  'about',
  'summary',
  'experience',
  'education',
  'skills',
  'projects',
  'publications',
  'certifications',
  'licenses',
  'volunteer experience',
  'honors & awards',
  'organizations',
  'languages',
];

const SECTION_HEADER_SET = new Set(SECTION_HEADERS.map((header) => header.toLowerCase()));
const DISALLOWED_NAME_TOKENS = new Set(['contact', 'info', 'information', 'details', 'phone', 'linkedin', 'profile']);

const LINKEDIN_NAME_SELECTORS = [
  'h1.text-heading-xlarge',
  'h1[data-anonymize="person-name"]',
  '.pv-top-card h1',
  '.top-card-layout__title',
];

const LINKEDIN_PHONE_SELECTORS = [
  'a[href^="tel:"]',
  '.pv-contact-info__contact-type.ci-phone a[href^="tel:"]',
  '.pv-contact-info__ci-container a[href^="tel:"]',
];

const LINKEDIN_LOCATION_SELECTORS = [
  '.pv-text-details__left-panel .text-body-small',
  '.top-card-layout__first-subline span',
  '.pv-top-card--list-bullet li',
];

const LINKEDIN_SKILL_SELECTORS = [
  '.pv-skill-category-entity__name-text',
  '.pv-skill-category-list__skill span',
  '.skill-chip__text',
];

const cleanLine = (line = '') =>
  line
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const sanitizeNameCandidate = (candidate = '') =>
  candidate
    .split(/\s+/)
    .filter((part) => part && !DISALLOWED_NAME_TOKENS.has(part.toLowerCase()))
    .join(' ')
    .trim();

const isLikelyName = (line = '') => {
  if (!line) return false;
  const words = line.split(' ').filter(Boolean);
  if (!words.length || words.length > 5) return false;
  const alphaWordRatio = words.filter((word) => /^[A-Za-z'.-]+$/.test(word)).length / words.length;
  return alphaWordRatio > 0.6;
};

const extractProbableNameLine = (lines = []) => {
  for (let i = 0; i < Math.min(lines.length, 10); i += 1) {
    const original = lines[i];
    if (!original) continue;
    const lower = original.toLowerCase();
    if (lower.includes('@') || lower.includes('linkedin.com') || SECTION_HEADER_SET.has(lower)) continue;
    const candidate = sanitizeNameCandidate(original);
    if (candidate && isLikelyName(candidate)) {
      return candidate;
    }
  }
  return sanitizeNameCandidate(lines[0] || '');
};

const splitLines = (text = '') =>
  text
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => cleanLine(line))
    .filter(Boolean);

const findSectionIndices = (lines) =>
  lines.reduce((acc, line, index) => {
    const key = line.toLowerCase();
    if (SECTION_HEADER_SET.has(key)) {
      acc.push({ header: key, index });
    }
    return acc;
  }, []);

const sliceSection = (lines, header, sectionMap) => {
  const target = sectionMap.find((section) => section.header === header.toLowerCase());
  if (!target) return [];

  const currentIndex = sectionMap.indexOf(target);
  const nextSection = sectionMap[currentIndex + 1];
  const endIndex = nextSection ? nextSection.index : lines.length;
  return lines.slice(target.index + 1, endIndex).filter(Boolean);
};

const parseSkills = (lines) => {
  if (!lines.length) return [];
  const combined = lines.join(' ');
  return combined
    .split(/[,•\-]/)
    .map((skill) => cleanLine(skill))
    .filter((skill) => skill.length > 1)
    .slice(0, 20);
};

const chunkByBlankLines = (lines) => {
  const chunks = [];
  let current = [];

  lines.forEach((line) => {
    if (!line.trim()) {
      if (current.length) {
        chunks.push(current);
        current = [];
      }
      return;
    }
    current.push(line.trim());
  });

  if (current.length) {
    chunks.push(current);
  }

  return chunks;
};

const buildExperienceEntries = (lines) => {
  if (!lines.length) return [];
  const chunks = chunkByBlankLines(lines);

  return chunks.slice(0, 6).map((chunk) => ({
    role: chunk[0] || '',
    organization: chunk[1] || '',
    duration: chunk.find((line) => /\d{4}/.test(line)) || '',
    summary: chunk.slice(2).join(' '),
  }));
};

const buildEducationEntries = (lines) => {
  if (!lines.length) return [];
  const chunks = chunkByBlankLines(lines);

  return chunks.slice(0, 5).map((chunk) => ({
    institution: chunk[0] || '',
    degree: chunk[1] || '',
    duration: chunk.find((line) => /\d{4}/.test(line)) || '',
    summary: chunk.slice(2).join(' '),
  }));
};

const findFirstMatch = (pattern, text) => {
  if (!text) return '';
  const match = text.match(pattern);
  return match ? match[0] : '';
};

const normalizePhoneNumber = (phone = '') => {
  if (!phone) return '';
  const trimmed = phone.trim();
  if (!trimmed) return '';
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return '';
  if (trimmed.trim().startsWith('+')) {
    return `+${digits}`;
  }
  return digits;
};

const dedupeSkills = (skills = []) => {
  const seen = new Set();
  return skills.filter((skill) => {
    const lower = skill.toLowerCase();
    if (seen.has(lower)) return false;
    seen.add(lower);
    return true;
  });
};

const parseContactBlock = (lines) => {
  const blockLimit = Math.min(lines.length, 12);
  const block = lines.slice(0, blockLimit);
  const joined = block.join(' \n ');

  const email = findFirstMatch(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i, joined);
  const phone = normalizePhoneNumber(findFirstMatch(/\+?\d[\d\s().-]{6,}/, joined));
  const linkedinUrl = findFirstMatch(/(?:https?:\/\/)?[\w.-]*linkedin\.com\/[\w\/-]+/i, joined);
  const websites = Array.from(joined.matchAll(/https?:\/\/[^\s]+/gi)).map((match) => match[0]);

  const headline = block[1] && !SECTION_HEADER_SET.has(block[1].toLowerCase()) ? block[1] : '';
  const locationCandidate = block.find((line) => line.includes(',') && !line.toLowerCase().includes('linkedin'));

  return {
    headline,
    location: locationCandidate || '',
    email,
    phone,
    linkedinUrl,
    websites,
  };
};

const parseLocationDetails = (location = '') => {
  if (!location) {
    return {
      city: '',
      state: '',
      country: '',
    };
  }

  const parts = location
    .split(',')
    .map((part) => cleanLine(part))
    .filter(Boolean);

  if (!parts.length) {
    return {
      city: '',
      state: '',
      country: '',
    };
  }

  const [city = '', state = '', ...rest] = parts;
  const country = rest.join(', ');

  if (parts.length === 1) {
    return {
      city: parts[0],
      state: '',
      country: '',
    };
  }

  if (parts.length === 2) {
    return {
      city,
      state,
      country: '',
    };
  }

  return {
    city,
    state,
    country,
  };
};

const isValidNameToken = (token = '') => /^[A-Za-z][A-Za-z.'-]*$/.test(token || '');

const deriveNameFromStudentPattern = (words = []) => {
  if (!words.length) return { firstName: '', lastName: '' };
  for (let i = 0; i < words.length; i += 1) {
    if (words[i].toLowerCase() !== 'student') continue;

    let lastIndex = i - 1;
    while (lastIndex >= 0 && !isValidNameToken(words[lastIndex])) {
      lastIndex -= 1;
    }

    if (lastIndex < 0) continue;

    let firstIndex = lastIndex - 1;
    while (firstIndex >= 0 && !isValidNameToken(words[firstIndex])) {
      firstIndex -= 1;
    }

    const lastName = sanitizeNameCandidate(words[lastIndex]);
    const firstName = sanitizeNameCandidate(firstIndex >= 0 ? words[firstIndex] : '');

    if (lastName) {
      return {
        firstName,
        lastName,
      };
    }
  }
  return { firstName: '', lastName: '' };
};

const looksLikeHtml = (text = '') => /<\/?(html|body|main|section|div|span|h1|head)[^>]*>/i.test(text);

const extractFirstText = ($, selectors = []) => {
  for (const selector of selectors) {
    const value = cleanLine($(selector).first().text());
    if (value) return value;
  }
  return '';
};

const extractPhoneFromHtml = ($) => {
  for (const selector of LINKEDIN_PHONE_SELECTORS) {
    const node = $(selector).first();
    if (!node || !node.length) continue;
    const href = node.attr('href') || '';
    const text = cleanLine(node.text());
    const candidate = href.startsWith('tel:') ? href.replace(/^tel:/i, '') : text;
    const normalized = normalizePhoneNumber(candidate);
    if (normalized) return normalized;
  }
  return '';
};

const extractSkillsFromHtml = ($) => {
  const skillSet = new Set();
  LINKEDIN_SKILL_SELECTORS.forEach((selector) => {
    $(selector).each((_, element) => {
      const text = cleanLine($(element).text());
      if (text.length > 1) {
        skillSet.add(text);
      }
    });
  });
  return Array.from(skillSet).slice(0, 20);
};

const extractLinkedInUrlFromHtml = ($) => {
  const anchor = $('a[href*="linkedin.com/in/"]').first();
  const href = anchor.attr('href');
  if (!href) return '';
  return href.split('?')[0];
};

const parseLinkedInHtml = (html = '') => {
  const $ = cheerio.load(html);
  const nameCandidate = sanitizeNameCandidate(extractFirstText($, LINKEDIN_NAME_SELECTORS));
  const tokens = nameCandidate.split(' ').filter(Boolean);
  const [firstName, ...restName] = tokens;
  const lastName = restName.join(' ');

  const locationText = cleanLine(extractFirstText($, LINKEDIN_LOCATION_SELECTORS));
  const phone = extractPhoneFromHtml($);
  const skills = dedupeSkills(extractSkillsFromHtml($));

  const summary = cleanLine(
    extractFirstText($, ['.pv-about__summary-text', '.pv-shared-text-with-see-more span[aria-hidden="true"]'])
  );

  const linkedinUrl = extractLinkedInUrlFromHtml($);
  const confidence = [nameCandidate, summary, phone, skills.length ? 'skills' : ''].filter(Boolean).length;

  return {
    name: nameCandidate,
    firstName: firstName || '',
    lastName: lastName || '',
    phone,
    location: locationText,
    ...parseLocationDetails(locationText),
    summary,
    linkedinUrl,
    skills,
    confidence,
  };
};

const parsePlainTextProfile = (text = '') => {
  if (!text) {
    return {
      confidence: 0,
      skills: [],
    };
  }

  const lines = splitLines(text);
  const extractedWords = text
    .replace(/\r/g, ' ')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);
  console.log('[LinkedInParser] Extracted words:', extractedWords);
  if (!lines.length) {
    return {
      confidence: 0,
      skills: [],
    };
  }

  const sections = findSectionIndices(lines);
  const contactInfo = parseContactBlock(lines);

  const nameLine = extractProbableNameLine(lines);
    const nameTokens = nameLine.split(' ').filter(Boolean);
  const [firstName, ...restName] = nameTokens;
  const lastName = restName.join(' ');
  const derived = deriveNameFromStudentPattern(extractedWords);
  const resolvedFirstName = derived.firstName || firstName || '';
  const resolvedLastName = derived.lastName || lastName || '';

  const { city, state, country } = parseLocationDetails(contactInfo.location);

  const summaryLines = sliceSection(lines, 'about', sections);
  const summary = summaryLines.join(' ').trim();

  const skillsSection = sliceSection(lines, 'skills', sections);
  const skills = dedupeSkills(parseSkills(skillsSection));

  const experienceSection = sliceSection(lines, 'experience', sections);
  const experience = buildExperienceEntries(experienceSection);

  const educationSection = sliceSection(lines, 'education', sections);
  const education = buildEducationEntries(educationSection);

  const confidenceScore = [firstName, contactInfo.headline, summary, skills.length ? 'skills' : '', contactInfo.phone]
    .filter(Boolean)
    .length;

  return {
    name: [resolvedFirstName, resolvedLastName].filter(Boolean).join(' '),
    firstName: resolvedFirstName,
    lastName: resolvedLastName,
    headline: contactInfo.headline,
    location: contactInfo.location,
    city,
    state,
    country,
    email: contactInfo.email,
    phone: contactInfo.phone,
    linkedinUrl: contactInfo.linkedinUrl,
    websites: contactInfo.websites,
    summary,
    skills,
    experience,
    education,
    confidence: confidenceScore,
  };
};

const mergeProfiles = (base = {}, overrides = {}) => {
  const merged = { ...base };
  Object.entries(overrides).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (Array.isArray(value)) {
      if (!value.length) return;
      if (key === 'skills') {
        const existing = Array.isArray(merged.skills) ? merged.skills : [];
        merged.skills = dedupeSkills([...value, ...existing]);
        return;
      }
      merged[key] = value;
      return;
    }

    if (typeof value === 'string' && !value.trim()) return;

    merged[key] = value;
  });

  merged.confidence = Math.max(base.confidence || 0, overrides.confidence || 0);

  return merged;
};

const parseLinkedInPdf = (rawText = '') => {
  const normalized = (rawText || '').replace(/\u00a0/g, ' ').trim();
  if (!normalized) {
    return {
      confidence: 0,
      skills: [],
    };
  }

  if (looksLikeHtml(normalized)) {
    const htmlProfile = parseLinkedInHtml(normalized);
    const textProfile = parsePlainTextProfile(cheerio.load(normalized).text());
    return mergeProfiles(textProfile, htmlProfile);
  }

  return parsePlainTextProfile(normalized);
};

module.exports = {
  parseLinkedInPdf,
};
