# Debugging Vercel Deployments for Express

## 1. The Root Cause of Timeouts
The error `Vercel Runtime Timeout Error: Task timed out` typically happens because:
1.  **Cold Start Latency**: Your database connection takes too long to initialize (serverless functions sleep when not used).
2.  **Missing Env Vars**: If `DATABASE_URL` is missing, the code waits indefinitely or crashes silently.
3.  **App Listen**: You should **NEVER** use `app.listen()` in Vercel. It expects a precise function export.

## 2. Solutions Provided

### Solution 1: Vercel Serverless Function (No Express)
Use this to verifying your deployment is working at all.
- **Endpoint**: `/api/dummy`
- **File**: `api/dummy.ts`
- **Why**: It has 0 dependencies. If this fails, Vercel is broken. If this works, your Express App is the problem.

### Solution 2: Express Adapter
We wrapped your Express app in `api/index.ts`.
- **Endpoint**: `/api/...` (e.g., `/api/auth/login`)
- **Key Change**: Added proper error logging. If the DB fails to connect, you will now see a specific error in Vercel Logs instead of a generic "Timeout".

## 3. Debug Checklist (If it still fails)
1.  **Check Environment Variables**: Go to Vercel Dashboard > Settings > Environment Variables. Ensure `DATABASE_URL` is set.
2.  **Check Logs**: Go to Vercel Dashboard > Deployments > [Latest] > Functions.
    - Look for `[Vercel] Initializing Express App...`
    - Look for `[Vercel] Critical Initialization Error:`
3.  **Database Access**: Ensure your Database accepts connections from Vercel IPs (0.0.0.0/0 aka "Allow All" is often needed for serverless).
