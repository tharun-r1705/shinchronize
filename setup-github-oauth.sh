#!/bin/bash

# GitHub OAuth Setup Helper Script
# Run this after configuring your GitHub OAuth app

echo "🚀 EvolvEd GitHub OAuth Setup"
echo "=============================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🔐 Generating GitHub token encryption key..."
ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "Generated: $ENCRYPTION_KEY"

# Check if encryption key already exists in .env
if grep -q "GITHUB_TOKEN_ENCRYPTION_KEY=" .env; then
    echo "⚠️  Encryption key already exists in .env"
    read -p "Do you want to replace it? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # macOS compatible sed
        sed -i '' "s/GITHUB_TOKEN_ENCRYPTION_KEY=.*/GITHUB_TOKEN_ENCRYPTION_KEY=$ENCRYPTION_KEY/" .env
        echo "✅ Encryption key updated"
    else
        echo "⏭️  Keeping existing key"
    fi
else
    echo "GITHUB_TOKEN_ENCRYPTION_KEY=$ENCRYPTION_KEY" >> .env
    echo "✅ Encryption key added to .env"
fi

echo ""
echo "📦 Installing required dependencies..."
cd backend
npm install cookie-parser express-rate-limit
echo "✅ Dependencies installed"

echo ""
echo "=============================="
echo "✅ Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Create a GitHub OAuth App at:"
echo "   https://github.com/settings/developers"
echo ""
echo "2. Set these values in GitHub:"
echo "   - Homepage URL: http://localhost:5173"
echo "   - Callback URL: http://localhost:5001/api/github/callback"
echo ""
echo "3. Add to your .env file:"
echo "   GITHUB_CLIENT_ID=your_client_id"
echo "   GITHUB_CLIENT_SECRET=your_client_secret"
echo ""
echo "4. Start the servers:"
echo "   cd backend && npm run dev"
echo "   npm run dev (in project root)"
echo ""
echo "📖 Full documentation: docs/GITHUB_OAUTH_SETUP.md"
