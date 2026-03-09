# Virtual Staging Storyteller

This project is a web application for virtual staging using Gemini AI.

## Tech Stack Note
This project was generated in a Node.js environment to ensure compatibility with the current runtime.
- **Backend**: Node.js with Express (instead of Python/FastAPI)
- **Frontend**: React with Tailwind CSS (instead of Vanilla JS)
- **AI SDK**: `@google/genai` for Node.js

## Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    Ensure `GEMINI_API_KEY` is set in your environment (or `.env` file).

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    This starts the Express server with Vite middleware on port 3000.

## API Endpoints

-   `POST /api/stage-room`: Upload an image and style preference to get a staged image and design story.
-   `GET /api/leads`: Retrieve captured leads.

## Project Structure

-   `server.ts`: Express backend and API routes.
-   `src/`: React frontend code.
-   `leads.db`: SQLite database for storing leads.
