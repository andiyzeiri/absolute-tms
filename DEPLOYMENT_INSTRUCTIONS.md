# Backend Deployment Instructions

## Option 1: Deploy to Render.com (Recommended - Free)

1. Go to [render.com](https://render.com) and create an account
2. Connect your GitHub account
3. Click "New" → "Web Service"
4. Select this repository: `andiyzeiri/absolute-tms`
5. Configure the service:
   - **Name**: `absolute-tms-backend` (or any name you prefer)
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
6. Add environment variables (use the values from `.env` file):
   - `NODE_ENV=production`
   - `MONGODB_URI=mongodb+srv://andi_db_user:mfVEIDLWYj04uBPU@cluster0.cnhkiiz.mongodb.net/tms?retryWrites=true&w=majority&appName=Cluster0`
   - `JWT_SECRET=your_super_secure_jwt_secret_key_here_2024`
   - `CORS_ORIGIN=https://overdrivetms2025.netlify.app,http://localhost:3000`
   - (Add all other environment variables from `.env`)
7. Deploy the service
8. Copy the service URL (e.g., `https://absolute-tms-backend.onrender.com`)

## Option 2: Deploy to Railway.app

1. Go to [railway.app](https://railway.app) and create an account
2. Create a new project from GitHub
3. Select this repository
4. Add environment variables from `.env`
5. Deploy

## Option 3: Deploy to Heroku

1. Install Heroku CLI
2. Run: `heroku create your-app-name`
3. Set environment variables: `heroku config:set VARIABLE_NAME=value`
4. Deploy: `git push heroku main`

## After Deployment

1. Copy your backend URL (e.g., `https://your-app-name.onrender.com`)
2. Update `netlify.toml` file:
   ```toml
   [build.environment]
   REACT_APP_API_URL = "https://your-actual-backend-url.onrender.com"
   ```
3. Commit and push the changes
4. Netlify will automatically redeploy with the correct backend URL

## Testing

Once deployed, test your backend:
```bash
curl https://your-backend-url.onrender.com/health
```

Should return:
```json
{"success":true,"message":"Server is healthy","timestamp":"..."}
```

## Local Development

To run locally:
```bash
# Start backend
npm run server

# Start frontend (in another terminal)
cd client
npm start
```

Backend will be available at `http://localhost:5000`
Frontend will be available at `http://localhost:3000`