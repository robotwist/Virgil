# Virgil Deployment Guide

This guide will help you deploy Virgil to production using Heroku for the backend and Netlify for the frontend.

## Deploying the Backend to Heroku

1. **Prepare Your Heroku Account**:
   - Install the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) if you haven't already
   - Log in to your Heroku account:
     ```bash
     heroku login
     ```
   - This will open a browser where you can complete the login process

2. **Initialize a Git Repository** (if you haven't already):
   ```bash
   cd backend
   git init
   echo "venv/" >> .gitignore
   echo "__pycache__/" >> .gitignore
   echo ".env" >> .gitignore
   git add .
   git commit -m "Initial commit"
   ```

3. **Create a Heroku App**:
   ```bash
   heroku create virgil-ai-guide
   ```
   Note: Replace `virgil-ai-guide` with your preferred app name. If the name is taken, Heroku will suggest alternatives.

4. **Set Environment Variables**:
   ```bash
   heroku config:set OPENAI_API_KEY=your_openai_api_key
   heroku config:set ENV=production
   ```

5. **Deploy the Backend**:
   ```bash
   git push heroku main
   ```
   If you're on a different branch: `git push heroku your-branch:main`

   Note: If this is your first deployment and you're having issues, you can try:
   ```bash
   heroku git:remote -a your-app-name
   git push heroku main
   ```

6. **Verify Deployment**:
   ```bash
   heroku open
   ```
   You should see the FastAPI documentation page.

7. **Check Logs if Needed**:
   ```bash
   heroku logs --tail
   ```

## Deploying the Frontend to Netlify

1. **Update Environment Variables**:
   - Edit `.env.production` to point to your Heroku app URL:
     ```
     VITE_API_URL=https://your-heroku-app-name.herokuapp.com
     ```

2. **Deploy Using Netlify CLI** (Option 1):
   ```bash
   cd frontend/frontend
   npm install netlify-cli -g
   netlify login
   netlify init
   netlify deploy --prod
   ```

3. **Deploy Using Netlify UI** (Option 2):
   - Build your project locally:
     ```bash
     cd frontend/frontend
     npm run build
     ```
   - Drag and drop the `dist` folder to Netlify's UI.

4. **Set Up Continuous Deployment**:
   - Connect your GitHub repository to Netlify
   - Configure build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`
     - Set environment variables in the Netlify UI

## Verifying the Deployment

1. Open your Netlify URL
2. Try sending a message to Virgil
3. Check the Heroku logs to verify the backend is processing requests:
   ```bash
   heroku logs --tail
   ```

## Troubleshooting

- **CORS Issues**: Verify that your Heroku app domain is added to the CORS allowed origins in `main.py`.
- **Environment Variables**: Make sure all required environment variables are set on both platforms.
- **API Connection**: Check browser console for any API connection errors.

## Next Steps

Once the basic deployment is working:

1. **Set Up a Custom Domain** (optional):
   - Configure a custom domain in both Netlify and Heroku

2. **Set Up Monitoring**:
   - Add application monitoring through Heroku add-ons or external services

3. **Implement Analytics**:
   - Consider adding simple analytics to understand usage patterns

Remember to monitor your OpenAI API usage to avoid unexpected charges. 