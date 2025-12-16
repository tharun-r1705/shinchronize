#!/bin/bash

# GitHub Integration Test Script
# Tests the new GitHub sync endpoint

BASE_URL="http://localhost:5001"

echo "🔧 Testing GitHub Integration..."
echo ""

# Step 1: Login
echo "1️⃣ Logging in as student1..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/students/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student1@college.edu","password":"EvolvEd@123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed"
  echo $LOGIN_RESPONSE
  exit 1
fi

echo "✅ Login successful"
echo ""

# Step 2: Sync GitHub profile
echo "2️⃣ Syncing GitHub profile (octocat)..."
SYNC_RESPONSE=$(curl -s -X POST $BASE_URL/api/students/github-sync \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"githubUsername":"octocat"}')

echo $SYNC_RESPONSE | python3 -m json.tool 2>/dev/null || echo $SYNC_RESPONSE
echo ""

# Step 3: Try syncing again (should hit rate limit)
echo "3️⃣ Testing rate limit (should fail)..."
RATE_LIMIT_RESPONSE=$(curl -s -X POST $BASE_URL/api/students/github-sync \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"githubUsername":"octocat"}')

echo $RATE_LIMIT_RESPONSE | python3 -m json.tool 2>/dev/null || echo $RATE_LIMIT_RESPONSE
echo ""

# Step 4: Check updated profile
echo "4️⃣ Checking updated profile..."
PROFILE_RESPONSE=$(curl -s -X GET $BASE_URL/api/students/profile \
  -H "Authorization: Bearer $TOKEN")

echo "GitHub Stats:"
echo $PROFILE_RESPONSE | grep -o '"githubStats":{[^}]*}' | python3 -m json.tool 2>/dev/null || echo "Not found"
echo ""

echo "Trust Badges:"
echo $PROFILE_RESPONSE | grep -o '"trustBadges":\[[^\]]*\]' || echo "Not found"
echo ""

echo "Growth Timeline (last 3):"
echo $PROFILE_RESPONSE | grep -o '"growthTimeline":\[[^\]]*\]' | tail -3 || echo "Not found"
echo ""

echo "✅ Test complete!"
