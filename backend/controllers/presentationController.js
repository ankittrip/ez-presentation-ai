import fs from 'fs';
import Groq from "groq-sdk";
import { generatePPTX } from '../utils/pptxBuilder.js';

export const parseMarkdown = async (req, res) => {
    try {
        const { markdownContent } = req.body;

        if (!markdownContent) {
            return res.status(400).json({ success: false, message: "Bhai, Markdown content missing hai!" });
        }

        console.log(" Agent 1 Active: Parsing Markdown with Groq (Llama-3.3-70b)...");

  
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const prompt = `
You are an Elite Strategy Consultant & Presentation Architect (ex-McKinsey/BCG). Your mission is to transform raw Markdown into a high-density, strategically structured JSON object. 

STRICT RULES FOR 100% QUALITY & CONTENT DENSITY (CRITICAL):

1. STRATEGIC STORYLINE & CHUNKING (Criteron 1): 
   - Analyze the markdown first. Plan a narrative flow: Context -> Market Reality -> Strategic Pillars -> Operational Analysis -> Future Roadmap[cite: 139, 158].
   - TARGET: Provide EXACTLY 10 to 15 slides based on input complexity[cite: 140, 159]. 
   - DO NOT fragment related points. If a topic has 6 points, keep them on ONE slide to maintain "Strategic Density."

2. THE "ANTI-EMPTY" EXPANSION POLICY (Rule 2):
   - STRICTLY PROHIBITED: Never use generic phrases like "Outcome analysis detailed in full report," "Details pending," or "Strategy to be defined"[cite: 288, 510].
   - If markdown data is sparse, use your expert strategic knowledge to expand on the *BUSINESS IMPLICATIONS* of existing data. Every bullet must be 12-18 words long.
   - Example: Instead of "Revenue up 7%", use "Achieved 7% YoY revenue growth to $69.7B, proving the M&A engine is effectively driving enterprise-wide reinvention"[cite: 325, 405].

3. VISUAL MAPPING & LAYOUT INTELLIGENCE (Criterion 7):
   - SEQUENTIAL DATA (Roadmaps/Steps): Map to "Infographic_Process". Provide 3-5 distinct steps with "title", "heading", and "text"[cite: 153, 242].
   - CATEGORICAL DATA (Risks/Successes/Challenges): Map to "Infographic_Grid". 
   - CRITICAL: If data shows mixed outcomes, group them into a 4-item grid (e.g., 2 Successes vs 2 Challenges) to ensure balanced slide distribution[cite: 244, 389, 394].

4. DATA VISUALIZATION & "SO-WHAT" INSIGHTS (Criterion 6):
   - Numerical tables MUST trigger "requiresChart": true[cite: 151, 152].
   - CHART INSIGHT: Provide a "Senior-Level Insight." Don't just describe numbers; explain the strategic meaning (e.g., "AI bookings tripled, signaling the platform is now the primary growth hedge against market volatility")[cite: 320, 413].

5. METRIC EXTRACTION (HERO NUMBERS): 
   - Proactively extract "Hero Numbers" into "highlightMetrics" array. Format: "NUMBER Description" (e.g., "$865M Restructuring Cost")[cite: 329, 399].

6. THE "HERO" MOMENT (NEGATIVE SPACE BALANCER):
   - Generate exactly ONE "HeroSlide" for the final strategic "Big Bet." This anchors the deck with one massive, bold statement[cite: 286].

LAYOUT TYPES: "TitleSlide", "Agenda", "StandardContent", "Infographic_Process", "Infographic_Grid", "Conclusion", "HeroSlide"

OUTPUT FORMAT (Strict JSON):
{
  "thought_process": "Detailed reasoning on how content was strategically expanded to ensure zero empty space and maximum insight coverage.",
  "slides": [
    {
      "slideNumber": 1,
      "layoutType": "TitleSlide",
      "title": "Strategic Roadmap: [Subject]",
      "subtitle": "Driving Value through [Key Strategic Lever]",
      "content": ["Strategic point 1", "Strategic point 2", "Strategic point 3", "Strategic point 4"],
      "highlightMetrics": ["$X.XB Targeted Impact"],
      "gridItems": [{"heading": "Success", "text": "Detail..."}, {"heading": "Challenge", "text": "Detail..."}], 
      "requiresChart": false,
      "chartType": "bar",
      "chartTitle": "",
      "chartLabels": [],
      "chartValues": [],
      "chartInsight": ""
    }
  ]
}

RAW MARKDOWN TO PARSE:
"""
${markdownContent}
"""
`;


    
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
           temperature: 0,      
        top_p: 1,
            response_format: { type: "json_object" }, 
        });

        
        const responseText = chatCompletion.choices[0].message.content;
        
        const verifiedData = agent4CleanJSON(responseText);
        
        if (!verifiedData || !verifiedData.slides) {
            console.error("❌ Agent 4 Blocked the execution: Invalid JSON or Mismatched Arrays");
            return res.status(500).json({ success: false, error: "AI generated invalid data format. Please try again." });
        }
        
        const slidesJSON = verifiedData.slides; 
        
        console.log(`Agent 4 Verified: Generated ${slidesJSON.length} slides!`);
        console.log("Sending Verified JSON to PPTX Engine...");
        
        // 5. Call our PptxGenJS engine
        const filePath = await generatePPTX(slidesJSON, `EZ_Presentation_${Date.now()}.pptx`);

        // 6. Send the file and Cleanup
        res.download(filePath, (err) => {
            if (err) {
                console.error("File download error:", err);
            }
            
            try {
                fs.unlinkSync(filePath);
                console.log("File Cleanup: Temporary PPTX deleted successfully.");
            } catch (unlinkErr) {
                console.error("Cleanup Error: Failed to delete file:", unlinkErr);
            }
        });

    } catch (error) {
        console.error("System Error:", error.message);
        return res.status(500).json({ success: false, error: "System failed: " + error.message });
    }
};


function agent4CleanJSON(rawResponse) {
    try {
        const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;
        
        const cleanedData = JSON.parse(jsonMatch[0]);

        if (cleanedData.slides) {
             cleanedData.slides.forEach(slide => {
                
                // 🛑 FIX: DUPLICATION BUG (Clear content if Grid/Cards exist)
                if ((slide.layoutType === "Infographic_Grid" || slide.layoutType === "Infographic_Comparison") && slide.gridItems && slide.gridItems.length > 0) {
                    slide.content = []; // Yeh bullets ko print hone se rokega
                }

                // 📊 FIX: CHART RAW NUMBERS BUG (Force numbers, remove text)
                if (slide.requiresChart) {
                    slide.content = []; // Clear text to avoid raw numbers printing
                    const labelsCount = slide.chartLabels?.length || 0;
                    const valuesCount = slide.chartValues?.length || 0;
                    
                    if (labelsCount === 0 || labelsCount !== valuesCount) {
                        console.log(`🛡️ Agent 4: Fixing slide ${slide.slideNumber} chart mismatch`);
                        slide.requiresChart = false; 
                    } else {
                        // FORCE NUMBERS: "5.9" string ko 5.9 number mein convert karega
                        slide.chartValues = slide.chartValues.map(v => parseFloat(v) || 0);
                    }
                }
            });
        }
        return cleanedData;
    } catch (e) {
        console.error("Agent 4 parsing error:", e);
        return null;
    }
}