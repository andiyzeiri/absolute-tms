# 🚀 Absolute TMS Deployment Guide

## Quick Deploy Options

### Option 1: Railway + Netlify (Recommended - Free Tier)

#### Step 1: Deploy Backend to Railway
1. **Go to [Railway](https://railway.app)**
2. **Connect GitHub** and create new project
3. **Import your repository** 
4. **Add Environment Variables:**
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/absolute-tms
   JWT_SECRET=your-super-secure-jwt-secret
   PORT=5000
   ```
5. **Deploy automatically** - Railway detects Node.js and builds

#### Step 2: Setup MongoDB Atlas
1. **Go to [MongoDB Atlas](https://cloud.mongodb.com)**
2. **Create free cluster** (512MB free)
3. **Create database user** and whitelist all IPs (0.0.0.0/0)
4. **Get connection string** and update Railway environment

#### Step 3: Deploy Frontend to Netlify
1. **Go to [Netlify](https://netlify.com)**
2. **Connect GitHub** and select repository
3. **Build settings:**
   - Base directory: `client`
   - Build command: `npm run build`
   - Publish directory: `build`
4. **Environment variables:**
   ```
   REACT_APP_API_URL=https://your-railway-app.railway.app
   ```
5. **Deploy site** - gets automatic HTTPS and custom domain

### Option 2: Vercel Full-Stack (Easy)

1. **Go to [Vercel](https://vercel.com)**
2. **Import GitHub repository**
3. **Set environment variables** in Vercel dashboard
4. **Deploy** - Vercel handles both frontend and API routes

### Option 3: DigitalOcean App Platform (Professional)

1. **Go to [DigitalOcean](https://digitalocean.com)**
2. **Create App** from GitHub
3. **Configure components:**
   - **Web Service**: Node.js (backend)
   - **Static Site**: React (frontend)
4. **Add managed database** (MongoDB)
5. **Deploy with custom domain**

## 🔧 Pre-Deployment Checklist

- [ ] Update API URLs in frontend to use environment variables
- [ ] Set strong JWT secrets in production
- [ ] Configure MongoDB Atlas with proper security
- [ ] Test production build locally: `npm run build`
- [ ] Update CORS origins to your domain
- [ ] Set up SSL certificates (automatic with most platforms)
- [ ] Configure file uploads for cloud storage (optional)

## 📝 Environment Variables Needed

### Backend (.env)
```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret
JWT_REFRESH_SECRET=your-refresh-secret
CORS_ORIGIN=https://your-domain.com
```

### Frontend (.env.production)
```
REACT_APP_API_URL=https://your-api-domain.com
GENERATE_SOURCEMAP=false
```

## 🌐 Custom Domain Setup

1. **Purchase domain** (Namecheap, GoDaddy, etc.)
2. **Configure DNS:**
   - Frontend: Point to Netlify/Vercel
   - API: Point to Railway/Render
3. **Set up subdomains:**
   - `www.yourdomain.com` → Frontend
   - `api.yourdomain.com` → Backend

## 💳 Cost Estimates

### Free Tier (Good for testing)
- **Frontend**: Netlify/Vercel - Free
- **Backend**: Railway/Render - Free (with limitations)
- **Database**: MongoDB Atlas - Free (512MB)
- **Total**: $0/month

### Professional Tier
- **Frontend**: Netlify Pro - $19/month
- **Backend**: Railway Pro - $20/month  
- **Database**: MongoDB Atlas - $57/month
- **Domain**: $10-15/year
- **Total**: ~$60-70/month

## 🚀 One-Click Deploy Links

Once you push to GitHub, you can use these:

[![Deploy to Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/your-username/tms-prototype)

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/your-username/tms-prototype)

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/tms-prototype)

## 🔍 Monitoring & Analytics

1. **Add Google Analytics** to track usage
2. **Set up Sentry** for error tracking
3. **Monitor performance** with Railway/Vercel analytics
4. **Set up uptime monitoring** (UptimeRobot)

## 📞 Support

If you need help with deployment:
1. Check platform documentation
2. Join their Discord/Slack communities  
3. Most platforms have excellent support

Your TMS is production-ready! 🎉