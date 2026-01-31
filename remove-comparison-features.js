import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'src', 'pages', 'RecruiterDashboard.tsx');

console.log('Reading RecruiterDashboard.tsx...');
let content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log(`Original file has ${lines.length} lines`);

// Step 1: Remove state variables (lines 34-35)
console.log('Step 1: Removing comparison state variables...');
const stateVarPattern1 = /const \[selectedStudents, setSelectedStudents\] = useState<string\[\]>\(\[\]\);/;
const stateVarPattern2 = /const \[compareMode, setCompareMode\] = useState\(false\);/;
content = content.replace(stateVarPattern1, '');
content = content.replace(stateVarPattern2, '');

// Step 2: Remove the three comparison functions
console.log('Step 2: Removing comparison functions...');
// Remove toggleStudentSelection function
const toggleFunctionPattern = /const toggleStudentSelection = \(studentId: string\) => \{[\s\S]*?\n  \};\n\n/;
content = content.replace(toggleFunctionPattern, '');

// Remove handleCompare function
const handleComparePattern = /const handleCompare = \(\) => \{[\s\S]*?\n  \};\n\n/;
content = content.replace(handleComparePattern, '');

// Remove clearComparison function
const clearComparisonPattern = /const clearComparison = \(\) => \{[\s\S]*?\n  \};\n\n/;
content = content.replace(clearComparisonPattern, '');

// Step 3: Remove data variables
console.log('Step 3: Removing comparison data variables...');
const topCandidatesPattern = /const topCandidates = filteredStudents\.slice\(0, 10\);\n\n/;
content = content.replace(topCandidatesPattern, '');

const comparedStudentsPattern = /  \/\/ Get selected students for comparison[\s\S]*?const studentCName = comparedStudents\[2\]\?\.name \|\| "Student C";\n\n/;
content = content.replace(comparedStudentsPattern, '');

// Step 4: Remove Top Candidates and Comparison sections from JSX
console.log('Step 4: Removing Top Candidates and Comparison Card sections...');
// Find and remove from "Top Candidates" comment to just before "AI Recruiter Assistant"
const topCandidatesJSXPattern = /\n\n        {\/\* Top Candidates \*\/}[\s\S]*?        <\/motion\.div>\n      <\/div>\n\n      {\/\* AI Recruiter Assistant \*\/}/;
const replacement = '\n      </div>\n\n      {/* AI Recruiter Assistant */}';
content = content.replace(topCandidatesJSXPattern, replacement);

// Step 5: Remove selectedStudents prop from AIRecruiterAssistant
console.log('Step 5: Removing selectedStudents prop from AIRecruiterAssistant...');
const aiAssistantPattern = /<AIRecruiterAssistant\s+students=\{students\}\s+selectedStudents=\{selectedStudents\}\s+\/>/;
content = content.replace(aiAssistantPattern, '<AIRecruiterAssistant\n        students={students}\n      />');

// Step 6: Remove GitCompare from imports (optional cleanup)
console.log('Step 6: Cleaning up imports...');
content = content.replace(/GitCompare, /g, '');

// Write the modified content back
console.log('Writing modified file...');
fs.writeFileSync(filePath, content, 'utf8');

const newLines = content.split('\n');
console.log(`✅ Done! New file has ${newLines.length} lines (removed ${lines.length - newLines.length} lines)`);
console.log('Changes made:');
console.log('  - Removed selectedStudents and compareMode state variables');
console.log('  - Removed toggleStudentSelection, handleCompare, and clearComparison functions');
console.log('  - Removed topCandidates and comparison data variables');
console.log('  - Removed Top Candidates section from UI');
console.log('  - Removed Comparison Card section from UI');
console.log('  - Removed selectedStudents prop from AIRecruiterAssistant');
console.log('  - Cleaned up unused imports');
