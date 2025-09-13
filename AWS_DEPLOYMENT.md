# AWS Deployment Guide for Absolute TMS

## Option 1: AWS Lambda + API Gateway (Serverless) - Recommended

### Prerequisites
1. AWS Account with CLI configured
2. Node.js 18+ installed
3. Serverless Framework CLI

### Setup AWS CLI
```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS credentials
aws configure
# Enter your AWS Access Key ID, Secret Access Key, Region (us-east-1), and output format (json)
```

### Setup Serverless Framework
```bash
npm install -g serverless
npm install # Install project dependencies including serverless plugins
```

### Environment Variables Setup
Create a `.env` file with your production values:
```bash
MONGODB_URI=mongodb+srv://andi_db_user:mfVEIDLWYj04uBPU@cluster0.cnhkiiz.mongodb.net/tms?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your_super_secure_jwt_secret_key_here_2024
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_SECRET=your_refresh_token_secret_key_here_2024
REFRESH_TOKEN_EXPIRES_IN=7d
CORS_ORIGIN=https://overdrivetms2025.netlify.app,http://localhost:3000
MAX_FILE_SIZE=10485760
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
BCRYPT_SALT_ROUNDS=12
```

### Deploy to AWS Lambda
```bash
# Deploy to AWS (production)
npm run deploy:aws

# Test locally first
npm run deploy:aws-local
```

### After Deployment
The deployment will give you an API Gateway URL like:
```
https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod
```

Update your Netlify configuration with this URL.

---

## Option 2: AWS Elastic Beanstalk (Traditional Server)

### Prerequisites
1. AWS Account
2. EB CLI installed

### Setup EB CLI
```bash
# Install EB CLI
pip install awsebcli --upgrade --user

# Initialize Elastic Beanstalk application
eb init

# Follow the prompts:
# - Select a default region: us-east-1
# - Application Name: absolute-tms
# - Platform: Node.js
# - Platform version: Node.js 18 running on 64bit Amazon Linux 2023
# - Do you want to set up SSH for your instances? Yes (optional)
```

### Configure Environment Variables
```bash
# Set environment variables for EB
eb setenv MONGODB_URI="mongodb+srv://andi_db_user:mfVEIDLWYj04uBPU@cluster0.cnhkiiz.mongodb.net/tms?retryWrites=true&w=majority&appName=Cluster0"
eb setenv JWT_SECRET="your_super_secure_jwt_secret_key_here_2024"
eb setenv CORS_ORIGIN="https://overdrivetms2025.netlify.app,http://localhost:3000"
eb setenv NODE_ENV="production"
# Add all other environment variables...
```

### Deploy to Elastic Beanstalk
```bash
# Create environment and deploy
eb create production-env

# Or deploy to existing environment
eb deploy
```

---

## Option 3: AWS EC2 (Manual Setup)

### Launch EC2 Instance
1. Go to AWS EC2 Console
2. Launch Instance:
   - AMI: Amazon Linux 2023
   - Instance Type: t3.micro (free tier)
   - Security Group: Allow HTTP (80), HTTPS (443), SSH (22)

### Setup Server on EC2
```bash
# Connect to your EC2 instance
ssh -i your-key.pem ec2-user@your-ec2-ip

# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs git

# Clone your repository
git clone https://github.com/andiyzeiri/absolute-tms.git
cd absolute-tms

# Install dependencies
npm install

# Create .env file with your environment variables
sudo nano .env

# Install PM2 for process management
sudo npm install -g pm2

# Start the application
pm2 start server.js --name "absolute-tms"
pm2 save
pm2 startup

# Install nginx for reverse proxy
sudo yum install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Nginx Configuration
Create `/etc/nginx/sites-available/absolute-tms`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Updating Frontend Configuration

After deploying to AWS, update your Netlify configuration:

### Update netlify.toml
```toml
[build.environment]
  REACT_APP_API_URL = "https://your-aws-api-url"
  CI = "false"
  NODE_VERSION = "18"
```

### Deployment URLs
- **Lambda**: `https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod`
- **Elastic Beanstalk**: `https://your-app-name.us-east-1.elasticbeanstalk.com`
- **EC2**: `https://your-domain.com` or `http://your-ec2-ip`

---

## Cost Comparison

| Service | Free Tier | Monthly Cost (After Free Tier) |
|---------|-----------|-------------------------------|
| Lambda | 1M requests/month | ~$0.20 per 1M requests |
| Elastic Beanstalk | 750 hours/month | ~$25-50/month |
| EC2 t3.micro | 750 hours/month | ~$8-15/month |

**Recommendation**: Start with AWS Lambda for lowest cost and automatic scaling.

---

## Monitoring and Logs

### Lambda Logs
```bash
# View logs
serverless logs -f api -t

# Or use AWS CloudWatch Console
```

### Elastic Beanstalk Logs
```bash
# Download logs
eb logs

# Or view in AWS Console
```

### EC2 Logs
```bash
# View PM2 logs
pm2 logs absolute-tms

# View nginx logs
sudo tail -f /var/log/nginx/error.log
```

---

## Security Best Practices

1. **Environment Variables**: Never commit `.env` files
2. **IAM Roles**: Use least privilege principle
3. **HTTPS**: Always use SSL certificates (use AWS Certificate Manager)
4. **VPC**: Consider placing resources in private subnets
5. **WAF**: Use AWS Web Application Firewall for production

---

## Troubleshooting

### Common Issues
1. **CORS Errors**: Ensure CORS_ORIGIN includes your Netlify domain
2. **MongoDB Connection**: Whitelist AWS IP ranges in MongoDB Atlas
3. **File Uploads**: Lambda has 10MB payload limit, use S3 for larger files
4. **Cold Starts**: Lambda may have initial latency, consider provisioned concurrency

### Testing Backend
```bash
# Test health endpoint
curl https://your-aws-url/health

# Test registration
curl -X POST https://your-aws-url/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com","password":"password123","companyName":"Test Company","phoneNumber":"555-123-4567"}'
```