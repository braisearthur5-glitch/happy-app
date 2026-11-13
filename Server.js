const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Serve the frontend from the 'public' folder
app.use(express.static(path.join(__dirname, "public")));

// The Wealth Engine API
app.post("/api/generate-plan", async (req, res) => {
  const { age, income, savings, risk } = req.body;
  
  try {
    // 1. AI Analysis & Allocation
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          { role: "system", content: "You are an elite institutional wealth manager. Based on the client's profile, provide an asset allocation. Return ONLY raw JSON with this exact structure: { 'stocks': 60, 'bonds': 30, 'cash': 10, 'rationale': 'A 2-sentence explanation of why this fits their risk profile.' }. The percentages MUST add up to 100." },
          { role: "user", content: `Age: ${age}, Income: $${income}/yr, Current Savings: $${savings}, Risk Tolerance: ${risk}` }
        ]
      })
    });
    
    const data = await response.json();
    const aiText = data.choices[0].message.content;
    const aiPlan = JSON.parse(aiText);

    // 2. Financial Projection Math (Simple Compound Interest to Age 65)
    let projection = [];
    let currentSavings = parseFloat(savings);
    let yearsToRetire = 65 - parseInt(age);
    let annualContribution = parseFloat(income) * 0.15; // Assume 15% of income saved
    let expectedReturn = 0.07; // 7% average annual return

    for (let i = 0; i <= yearsToRetire; i++) {
      projection.push({ age: parseInt(age) + i, balance: Math.round(currentSavings) });
      currentSavings = (currentSavings + annualContribution) * (1 + expectedReturn);
    }

    res.json({ allocation: aiPlan, projection: projection });
  } catch (error) {
    res.status(500).json({ error: "Wealth Engine failed." });
  }
});

app.listen(process.env.PORT || 8001, '0.0.0.0', () => { 
  console.log("Apex Wealth Engine Running"); 
});
