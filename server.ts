import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";
import textToSpeech from "@google-cloud/text-to-speech";

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in environment variables.");
}

const supabase = createClient(supabaseUrl || "", supabaseKey || "");

// Initialize Gemini AI
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

if (!apiKey) {
  console.warn("Warning: GEMINI_API_KEY or API_KEY not found in environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey });

// Initialize Google Cloud TTS Client
const ttsClient = new textToSpeech.TextToSpeechClient({
  apiKey: apiKey,
});

// Helper function to force a timeout on stalled API requests
const fetchWithTimeout = async (model: string, contentParts: any[], timeoutMs: number) => {
  const timeoutPromise = new Promise<any>((_, reject) => {
    setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs);
  });

  return Promise.race([
    ai.models.generateContent({
      model,
      contents: { parts: contentParts },
    }),
    timeoutPromise
  ]);
};

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
      const { name, email, phone, style, roomType, fengShui, leadId } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "No image uploaded" });
      }

      // 1. Update lead with selected style
      if (leadId) {
        await supabase.from("leads").update({ style }).eq("id", leadId);
      }

      // 2. Call Gemini API for Virtual Staging
      const resizedBuffer = await sharp(file.buffer)
        .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 75 })
        .toBuffer();

      console.log(`Image resized: ${(file.buffer.length / 1024).toFixed(0)}KB -> ${(resizedBuffer.length / 1024).toFixed(0)}KB`);

      const base64Image = resizedBuffer.toString("base64");
      const mimeType = "image/jpeg";

      // --- 1. PROMPTS SETUP ---
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

      // The Image Prompt: instructions for generating the staged image
      const imagePrompt = useFengShui ? basePrompt + fengShuiAddendum : basePrompt;

      // The Text Prompt: based on imagePrompt for consistency, but only requesting text output
      const storyPrompt = `
        You are the designer who just completed the following staging job:

        ${imagePrompt}

        Now write a brief, enthusiastic 2-3 sentence description of your design.
        Highlight the key features of the space.
        Keep the tone inviting, simple to read, and highly appealing to home buyers.
        Do NOT generate an image. Only provide text.
      `;

      const models = [
        "gemini-3.1-flash-image-preview",
        "gemini-2.5-flash-image"
      ];

      const imageContentParts = [
        { text: imagePrompt },
        { inlineData: { mimeType, data: base64Image } },
      ];

      let response;
      let modelSucceeded = false;

      // --- 2. GENERATE IMAGE ---
      // Try each model in order, with retry on transient network errors
      for (const model of models) {
        let succeeded = false;
        
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            console.log(`Trying ${model} (attempt ${attempt})...`);
            
            // Generate the image with a strict 60-second timeout wrapper
            response = await fetchWithTimeout(model, imageContentParts, 60000);
            
            succeeded = true;
            modelSucceeded = true;
            console.log(`Success with ${model}`);
            break;
            
          } catch (err: any) {
            const isTimeout = err.message === 'TIMEOUT';
            const isSocketError = err?.cause?.code?.includes('UND_ERR') || err?.code === 'ECONNRESET';
            
            if ((isSocketError || isTimeout) && attempt < 3) {
              console.warn(`Attempt ${attempt} failed (${isTimeout ? 'Timeout' : 'Socket Error'}), retrying in 2s...`);
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

      // Safety check: if all models failed and threw no hard errors, response is undefined
      if (!modelSucceeded || !response) {
         throw new Error("All image generation models failed to respond.");
      }

      let generatedImageBase64 = null;

      // Parse response for image safely
      if (response?.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            generatedImageBase64 = part.inlineData.data;
          }
        }
      }

      if (!generatedImageBase64) {
        console.error("No image generated by Gemini");
        return res.status(500).json({ 
          error: "Failed to generate staged image. The model might have refused the request or encountered an error." 
        });
      }

      // --- 3. GENERATE TEXT STORY ---
      console.log("Image complete! Now generating the designer vision...");
      let designStory = "";
      
      try {
        // Use gemini-2.5-flash to rapidly write the story based on the original room context
        const textResponse = await ai.models.generateContent({
          model: "gemini-2.5-flash", 
          contents: { 
            parts: [
              { text: storyPrompt },
              { inlineData: { mimeType, data: base64Image } }
            ] 
          }
        });
        
        if (textResponse?.candidates?.[0]?.content?.parts) {
           for (const part of textResponse.candidates[0].content.parts) {
             if (part.text) designStory += part.text;
           }
        }
      } catch (textErr) {
        console.error("Text generation failed, using fallback:", textErr);
        designStory = `Welcome to your beautifully staged new ${roomType}. We designed this space in a stunning ${style} style to help you envision your future here!`;
      }

      // --- 4. RETURN EVERYTHING TO FRONTEND ---
      res.json({
        image: `data:image/png;base64,${generatedImageBase64}`,
        story: designStory.trim(),
      });

    } catch (error: any) {
      console.error("Error in /api/stage-room:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  app.post("/api/leads", async (req, res) => {
    try {
      const { name, email, phone } = req.body;

      if (!name || !email) {
        return res.status(400).json({ error: "Name and email are required." });
      }

      // 1. Check if this email is already in the database
      const { data: existingLead, error: searchError } = await supabase
        .from("leads")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (searchError) {
        throw searchError;
      }

      // 2. If the lead already exists, return their id and skip the insert
      if (existingLead) {
        console.log(`Lead ${email} already exists. Skipping insert.`);
        return res.json({ success: true, id: existingLead.id, message: "Lead already exists." });
      }

      // 3. If they don't exist, insert them safely
      const { data, error: insertError } = await supabase
        .from("leads")
        .insert({ name, email, phone })
        .select("id")
        .single();

      if (insertError) {
        return res.status(500).json({ error: insertError.message });
      }

      console.log(`Successfully saved new lead: ${email}`);
      res.json({ success: true, id: data.id });

    } catch (error) {
      console.error("Error saving lead:", error);
      res.status(500).json({ error: "Failed to save lead." });
    }
  });

  app.get("/api/leads", async (req, res) => {
    const { data: leads, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
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
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();