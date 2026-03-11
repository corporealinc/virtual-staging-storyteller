import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import Database from "better-sqlite3";
import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";
import textToSpeech from "@google-cloud/text-to-speech";

// Initialize Database
const db = new Database("leads.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    phone TEXT,
    style TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Initialize Gemini AI
// Note: The API key is injected via process.env.GEMINI_API_KEY or process.env.API_KEY
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

if (!apiKey) {
  console.warn("Warning: GEMINI_API_KEY or API_KEY not found in environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey });

// Initialize Google Cloud TTS Client
const ttsClient = new textToSpeech.TextToSpeechClient({
  apiKey: apiKey,
});

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "3001", 10);

  // Middleware for parsing JSON and form data
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Multer setup for file uploads (in memory)
  const upload = multer({ storage: multer.memoryStorage() });

  // API Routes
  app.post("/api/stage-room", upload.single("image"), async (req, res) => {
    try {
      const { name, email, phone, style, roomType, fengShui } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "No image uploaded" });
      }

      // 1. Save Lead
      const stmt = db.prepare(
        "INSERT INTO leads (name, email, phone, style) VALUES (?, ?, ?, ?)"
      );
      stmt.run(name, email, phone, style);

      // 2. Call Gemini API for Virtual Staging
      // Resize image to max 1024px on longest side and compress to reduce payload
      const resizedBuffer = await sharp(file.buffer)
        .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 75 })
        .toBuffer();

      console.log(`Image resized: ${(file.buffer.length / 1024).toFixed(0)}KB -> ${(resizedBuffer.length / 1024).toFixed(0)}KB`);

      const base64Image = resizedBuffer.toString("base64");
      const mimeType = "image/jpeg";

      // Build prompt based on whether Feng Shui mode is enabled
      const useFengShui = fengShui === 'true';
      const basePrompt = `
        Act as a professional interior designer.
        Virtually stage the provided empty ${roomType} photo in a "${style}" style.
        
        IMAGE REQUIREMENTS:
        - Generate a highly photorealistic, high-resolution image.
        - Select furniture and decor that perfectly match the ${style} aesthetic.
        - Ensure perfect perspective, realistic scale, natural lighting, and accurate shadows.
        - Blend the new items seamlessly into the original room.
        
        TEXT REQUIREMENTS:
        - Provide a brief, enthusiastic 2-3 sentence description of your design.
        - Highlight the key features of the space.
        - Keep the tone inviting, simple to read, and highly appealing to home buyers.
      `;

      const fengShuiAddendum = `
        FENG SHUI REQUIREMENTS:
        - Qi Flow & Lighting: Keep pathways wide, open, and strictly clutter-free to allow energy (Qi) to meander freely. Maximize lighting and use neutral base tones with subtle, intentional color accents.
        - Commanding Position: Place the primary furniture (e.g., bed, desk, sofa) with a solid wall behind it, facing the door but not directly in line with it. NEVER place seating or beds directly under exposed ceiling beams.
        - Soft Shapes: Incorporate soft shapes, such as rounded furniture edges, circular rugs, or round light fixtures, to promote communication and a softer feeling.
        - Artwork & Harmony: Use artwork that depicts multiple subjects (e.g., pairs of items, groups of flowers) rather than a single, isolated subject to symbolize harmony.
        - Elements & Vitality: Subtly balance Wood, Fire, Earth, Metal, and Water. Incorporate living elements like healthy indoor plants to add vitality.
        - Room-Specific Rules:
          - If ${roomType} is a "kitchen": Ensure the stove (fire) and sink (water) are NOT directly across from or immediately next to each other. Add green/wood accents to balance the energy.
          - If ${roomType} is an "entryway": Create a welcoming "Bright Hall Effect" by keeping the space well-lit and unobstructed. Do NOT place a mirror directly facing the front door.
          - If ${roomType} is a "bedroom": Position the bed for restfulness, avoiding direct alignment with the door or bathroom.

        TEXT ADDITION:
        - Add one short, engaging sentence to your description explaining how a specific Feng Shui element used in this room (like the commanding position, soft shapes, or balanced elements) promotes harmony, wealth, or positive energy.
      `;

      const prompt = useFengShui ? basePrompt + fengShuiAddendum : basePrompt;

      // List of fast, cost-effective Gemini API native image models
      const models = [
        "gemini-3.1-flash-image-preview",
        "gemini-2.5-flash-image"
      ];

      const contentParts = [
        { text: prompt },
        { inlineData: { mimeType, data: base64Image } },
      ];

      // Try each model in order, with retry on transient network errors
      let response;
      for (const model of models) {
        let succeeded = false;
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            console.log(`Trying ${model} (attempt ${attempt})...`);
            response = await ai.models.generateContent({
              model,
              contents: { parts: contentParts },
            });
            succeeded = true;
            console.log(`Success with ${model}`);
            break;
          } catch (err: any) {
            const isSocketError = err?.cause?.code?.includes('UND_ERR');
            if (isSocketError && attempt < 3) {
              console.warn(`Attempt ${attempt} failed (${err.cause?.code}), retrying in 2s...`);
              await new Promise((r) => setTimeout(r, 2000));
              continue;
            }
            // If it's a model-not-found error, try next model
            if (err?.status === 404 || err?.message?.includes('not found') || err?.message?.includes('is not supported')) {
              console.warn(`Model ${model} not available, trying next...`);
              break;
            }
            // On last model, throw
            if (model === models[models.length - 1]) throw err;
            break;
          }
        }
        if (succeeded) break;
      }

      let generatedImageBase64 = null;
      let designStory = "";

      // Parse response for image and text
      if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            generatedImageBase64 = part.inlineData.data;
          } else if (part.text) {
            designStory += part.text;
          }
        }
      }

      if (!generatedImageBase64) {
        // Fallback or error handling if no image is returned
        // Sometimes the model might refuse or fail to generate an image
        console.error("No image generated by Gemini");
        return res.status(500).json({ 
          error: "Failed to generate staged image. The model might have refused the request or encountered an error." 
        });
      }

      res.json({
        image: `data:image/png;base64,${generatedImageBase64}`,
        story: designStory.trim(),
      });

    } catch (error) {
      console.error("Error in /api/stage-room:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  app.get("/api/leads", (req, res) => {
    const leads = db.prepare("SELECT * FROM leads ORDER BY timestamp DESC").all();
    res.json(leads);
  });

  // Text-to-Speech endpoint using Google Cloud TTS client library
  app.post("/api/tts", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Text payload is missing." });
      }

      const request = {
        input: { text },
        voice: { languageCode: "en-US", name: "en-US-Journey-F" },
        audioConfig: { audioEncoding: "MP3" as const },
      };

      const [response] = await ttsClient.synthesizeSpeech(request);
      res.json({ audioContent: Buffer.from(response.audioContent as Uint8Array).toString("base64") });
    } catch (error: any) {
      console.error("TTS Backend Error:", error);
      res.status(500).json({ error: "Internal Server Error during TTS generation" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static files from dist
    // (This part is for completeness, though in this env we mostly run dev)
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
