const express = require("express");
const cors = require("cors");
const path = require("path");
const { buildInsights } = require("./insights");

const app = express();
app.use(cors());
app.use(express.json());

// 1. Tell Express to serve everything inside the 'public' folder
app.use(express.static(path.join(__dirname, "public")));

// 2. API for the Trading App
app.get("/v1/instruments/:symbol/insights", async (req, res) => { 
  const data = await buildInsights(req.params.symbol); 
  res.json(data); 
});

// 3. API for the AI Elevate App
app.post("/api/generate-path", async (req, res) => {
  const { skills } = req.body;
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json" Fix static folder
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          { role: "system", content: "You are an elite career counselor for youth. Based on the user's skills, invent a fictional enterprise sponsor (like 'TechNova') and output a 3-step career roadmap. Return ONLY raw JSON with this structure: { 'sponsorName': 'Name', 'sponsorReason': 'Why they want you', 'salary': '$XX,000', 'steps': [{'title': 'Step 1', 'desc': 'Description'}, {'title': 'Step 2', 'desc': 'Description'}, {'title': 'Step 3', 'desc': 'Description'}] }. Do not include markdown formatting or backticks." },
          { role: "user", content: `My skills are: ${skills.join(", ")}` }
        ]
      })
    });
    const data = await response.json();
    const aiText = data.choices[0].message.content;
    res.json(JSON.parse(aiText));
  } catch (error) {
    res.status(500).json({ error: "AI failed to generate path." });
  }
});

app.listen(process.env.PORT || 8001, '0.0.0.0', () => { 
  console.log("Server running perfectly"); 
});
