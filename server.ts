import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API routes FIRST
app.post("/api/decide", async (req, res) => {
  const { dilemma, optionA, optionB, context } = req.body;

  if (!dilemma) {
    return res.status(400).json({ error: "Dilemma description is required" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "GEMINI_API_KEY is missing. Please configure it in your AI Studio secrets panel."
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    // Construct detailed prompt
    let prompt = `Analyze this decision dilemma: "${dilemma}".`;
    if (optionA && optionB) {
      prompt += ` Compare Option A ("${optionA}") and Option B ("${optionB}").`;
    } else if (optionA) {
      prompt += ` Specifically evaluate Option A ("${optionA}") against its alternatives.`;
    }
    if (context) {
      prompt += ` Additional context or personal constraints: "${context}".`;
    }

    prompt += ` Provide a comprehensive analysis containing a verdict recommendation, detailed pros/cons for each option (with impact scores from 1 to 5), a structured comparison table evaluating criteria, and a SWOT analysis.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are 'The Tie Breaker', a highly analytical, objective decision therapist and strategist. Your purpose is to cut through analysis paralysis and help the user resolve critical choices with confidence. You score the importance/impact of pros and cons from 1 (minor) to 5 (critical factor). Keep your descriptions of pros and cons concise but descriptive. In the SWOT analysis, ensure strengths/weaknesses are internal to the decision maker/options, and opportunities/threats are external factors.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "A clear, condensed title summarizing this decision" },
            verdict: {
              type: Type.OBJECT,
              properties: {
                recommendedOption: { type: Type.STRING, description: "The recommended path, option, or balanced solution" },
                confidenceScore: { type: Type.INTEGER, description: "Confidence score from 1 to 100" },
                summary: { type: Type.STRING, description: "Clear, reassuring reasoning of why this option is superior" },
                keyDecidingFactor: { type: Type.STRING, description: "The single most important tie-breaking factor" }
              },
              required: ["recommendedOption", "confidenceScore", "summary", "keyDecidingFactor"]
            },
            options: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Name of the option" },
                  pros: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        point: { type: Type.STRING },
                        impact: { type: Type.INTEGER, description: "Impact rating from 1 (low) to 5 (high)" }
                      },
                      required: ["point", "impact"]
                    }
                  },
                  cons: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        point: { type: Type.STRING },
                        impact: { type: Type.INTEGER, description: "Impact rating from 1 (low) to 5 (high)" }
                      },
                      required: ["point", "impact"]
                    }
                  }
                },
                required: ["name", "pros", "cons"]
              }
            },
            comparisonTable: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  criterion: { type: Type.STRING, description: "The dimension of comparison (e.g., Cost, Time, Joy, Growth)" },
                  optionA_val: { type: Type.STRING, description: "Brief evaluation for Option A" },
                  optionB_val: { type: Type.STRING, description: "Brief evaluation for Option B" },
                  winner: { type: Type.STRING, description: "Which option performs better on this criterion" }
                },
                required: ["criterion", "optionA_val", "optionB_val", "winner"]
              }
            },
            swotAnalysis: {
              type: Type.OBJECT,
              properties: {
                strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Strengths of taking action / making this choice" },
                weaknesses: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Weaknesses or internal limitations" },
                opportunities: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Opportunities or positive external factors" },
                threats: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Threats or potential risks/external blockages" }
              },
              required: ["strengths", "weaknesses", "opportunities", "threats"]
            }
          },
          required: ["title", "verdict", "options", "comparisonTable", "swotAnalysis"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from the decision analysis model.");
    }

    const decisionData = JSON.parse(text);
    return res.json(decisionData);

  } catch (error: any) {
    console.error("Gemini decision service failure:", error);
    return res.status(500).json({
      error: error.message || "An unexpected error occurred during analysis. Please try again."
    });
  }
});

// Vite middleware configuration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[The Tie Breaker] Server started on http://0.0.0.0:${PORT}`);
  });
}

startServer();
