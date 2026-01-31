// Test script for email settings endpoint
// Run with: node test-email-endpoint.js

const API_URL = 'http://localhost:5000/api';

// You need to replace this with a real token from your browser localStorage
const TEST_TOKEN = 'YOUR_TOKEN_HERE';

async function testEmailSettings() {
  console.log('Testing Email Settings Endpoints...\n');

  // Test GET endpoint
  console.log('1. Testing GET /recruiters/email-settings');
  try {
    const response = await fetch(`${API_URL}/recruiters/email-settings`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Status:', response.status, response.statusText);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('GET Error:', error.message);
  }

  console.log('\n---\n');

  // Test PUT endpoint
  console.log('2. Testing PUT /recruiters/email-settings');
  try {
    const testData = {
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: 'test@example.com',
      smtpPass: 'testpassword123',
      fromEmail: 'test@example.com',
    };

    const response = await fetch(`${API_URL}/recruiters/email-settings`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    console.log('Status:', response.status, response.statusText);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('PUT Error:', error.message);
  }
}

// Check if token is provided
if (TEST_TOKEN === 'YOUR_TOKEN_HERE') {
  console.log('❌ Please edit this file and add your token from browser localStorage');
  console.log('\nTo get your token:');
  console.log('1. Open browser DevTools (F12)');
  console.log('2. Go to Console tab');
  console.log('3. Type: localStorage.getItem("token")');
  console.log('4. Copy the token and paste it in this file\n');
} else {
  testEmailSettings();
}
