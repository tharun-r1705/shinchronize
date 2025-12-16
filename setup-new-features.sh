#!/bin/bash

echo "🚀 EvolvEd New Features Setup Script"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "${BLUE}Step 1: Installing dependencies...${NC}"
echo "Installing frontend dependencies..."
npm install socket.io-client

echo ""
echo "Installing backend dependencies..."
cd backend
npm install socket.io
cd ..

echo ""
echo "${GREEN}✅ Dependencies installed successfully!${NC}"
echo ""

echo "${BLUE}Step 2: Checking environment variables...${NC}"
if [ -f ".env" ]; then
    echo "${GREEN}✅ .env file found${NC}"
    
    # Check for required variables
    if grep -q "JWT_SECRET" .env; then
        echo "${GREEN}✅ JWT_SECRET configured${NC}"
    else
        echo "${YELLOW}⚠️  JWT_SECRET not found in .env${NC}"
    fi
    
    if grep -q "MONGODB_URI" .env; then
        echo "${GREEN}✅ MONGODB_URI configured${NC}"
    else
        echo "${YELLOW}⚠️  MONGODB_URI not found in .env${NC}"
    fi
else
    echo "${YELLOW}⚠️  .env file not found. Please create one based on .env.example${NC}"
fi

echo ""
echo "${BLUE}Step 3: Summary of new features installed:${NC}"
echo "  🔔 Real-time Notification System with WebSocket"
echo "  🌓 Dark Mode Theme System"
echo "  🔍 Advanced Recruiter Filters"
echo "  🏆 Gamification with 42 Achievements"
echo "  📊 Enhanced Analytics Dashboard"
echo ""

echo "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "${BLUE}Next Steps:${NC}"
echo "1. Review NEW_FEATURES_GUIDE.md for detailed documentation"
echo "2. Start backend: cd backend && npm run dev"
echo "3. Start frontend: npm run dev"
echo "4. Add components to your app:"
echo "   - Import ThemeProvider and NotificationProvider in main.tsx"
echo "   - Add NotificationBell and ThemeToggle to your header"
echo "   - Use AchievementShowcase in student profiles"
echo "   - Add AdvancedFilters to recruiter dashboard"
echo "   - Integrate AnalyticsDashboard for student analytics"
echo ""
echo "📖 Full documentation: NEW_FEATURES_GUIDE.md"
echo ""
echo "🎉 Happy coding!"
