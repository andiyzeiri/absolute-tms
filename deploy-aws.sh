#!/bin/bash

# AWS Lambda Deployment Script for Absolute TMS
echo "🚀 AWS Lambda Deployment Script for Absolute TMS"
echo "================================================"

# Check if AWS CLI is configured
echo "📋 Checking AWS CLI configuration..."
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    echo "You need:"
    echo "  - AWS Access Key ID"
    echo "  - AWS Secret Access Key" 
    echo "  - Default region (us-east-1)"
    echo "  - Default output format (json)"
    exit 1
fi

echo "✅ AWS CLI configured successfully"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp .env.aws .env
    echo "📝 Please edit .env file with your actual values before deploying"
    echo "💡 Current MongoDB URI and JWT secrets are already configured"
fi

echo "🔍 Validating serverless configuration..."

# Check if serverless.yml exists
if [ ! -f serverless.yml ]; then
    echo "❌ serverless.yml not found!"
    exit 1
fi

echo "✅ Serverless configuration found"

echo "🏗️  Starting deployment to AWS Lambda..."
echo "This may take a few minutes..."

# Deploy to AWS
serverless deploy

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Deployment successful!"
    echo "==============================================="
    echo ""
    echo "📋 Next Steps:"
    echo "1. Copy the API Gateway URL from above"
    echo "2. Update netlify.toml with your new API URL:"
    echo "   REACT_APP_API_URL = \"https://your-api-id.execute-api.us-east-1.amazonaws.com/prod\""
    echo ""
    echo "3. Test your API:"
    echo "   curl https://your-api-id.execute-api.us-east-1.amazonaws.com/prod/health"
    echo ""
    echo "4. Commit and push to trigger Netlify rebuild"
    echo ""
    echo "🎯 Your backend is now running on AWS Lambda!"
else
    echo ""
    echo "❌ Deployment failed!"
    echo "Please check the error messages above and try again."
    echo ""
    echo "Common issues:"
    echo "- AWS credentials not configured"
    echo "- Insufficient permissions"
    echo "- Environment variables missing"
fi