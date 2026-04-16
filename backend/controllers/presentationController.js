import fs from 'fs';
import ModelClient from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import { generatePPTX } from '../utils/pptxBuilder.js';

// ==========================================
// 🕵️‍♂️ API LOGGER ENGINE
// ==========================================
const ApiLogger = {
    info: (agent, msg) => console.log(`[🔵 INFO] ${agent}: ${msg}`),
    success: (agent, msg) => console.log(`[🟢 SUCCESS] ${agent}: ${msg}`),
    warn: (agent, msg) => console.warn(`[🟡 WARNING] ${agent}: ${msg}`),
    error: (agent, msg, err) => console.error(`[🔴 ERROR] ${agent}: ${msg}`, err),
    divider: () => console.log(`==================================================`)
};

export const parseMarkdown = async (req, res) => {
    try {
        ApiLogger.divider();
        ApiLogger.info("API ROUTE", "New PPTX generation request received.");

        const { markdownContent } = req.body;

        if (!markdownContent) {
            ApiLogger.error("VALIDATION", "Markdown content is missing.");
            return res.status(400).json({ success: false, message: "Markdown content missing hai!" });
        }

        ApiLogger.info("VALIDATION", `Markdown input length: ${markdownContent.length} characters.`);
        
        // 🚀 Initialize AI via GitHub Models
        ApiLogger.info("AGENT 1", "Initializing gpt-4o-mini via GitHub Models...");
        const client = new ModelClient(
            "https://models.inference.ai.azure.com",
            new AzureKeyCredential(process.env.GITHUB_TOKEN)
        );

const prompt = `
You are an Elite Presentation Architect (ex-McKinsey/BCG). Your mission is to transform raw Markdown into a highly visual, structurally perfect JSON object for an automated PPTX engine.

CRITICAL HACKATHON RULES (FAILING THESE MEANS DISQUALIFICATION):

1. THE "INFOGRAPHIC-FIRST" MANDATE (NO WALLS OF TEXT):
   - Before writing any text, ask: "Can this be visualized?"
   - SEQUENTIAL DATA (Timelines, Steps, Phases, Roadmaps) MUST use "layoutType": "Infographic_Process". Put the data strictly inside the "processItems" array.
   - CATEGORICAL DATA (Pros/Cons, Risks/Rewards, Key Pillars, Success/Challenges) MUST use "layoutType": "Infographic_Grid" or "Infographic_Comparison". Put the data strictly inside the "gridItems" array.
   - NEVER dump process steps, phases, or comparisons into the generic "content" array.

2. CONTENT MINIMIZATION & HIERARCHY:
   - Limit to exactly ONE key message per slide.
   - Strict ban on long paragraphs. 
   - If you MUST use "StandardContent", you are restricted to a maximum of 3 short, punchy bullet points (10-15 words max per bullet).

3. STRATEGIC STORYLINE & LENGTH: 
   - TARGET: Generate exactly 10 to 15 slides based on input complexity. 
   - Ensure a logical flow: Title -> Agenda -> Insights/Data -> Visual Roadmaps -> Hero Moment -> Conclusion.

4. DATA VISUALIZATION INTELLIGENCE:
   - Any numerical trends, market shares, or tables MUST trigger "requiresChart": true.
   - Change the "layoutType" to "ChartSlide".
   - You MUST provide a strategic "chartInsight" (e.g., "AI bookings tripled, signaling rapid enterprise adoption").

5. METRIC EXTRACTION: 
   - Extract major "Hero Numbers" into the "highlightMetrics" array. Format MUST be: "NUMBER Description" (e.g., "$865M Total Acquisition Spend").

6. THE "HERO" MOMENT:
   - Generate exactly ONE "layoutType": "HeroSlide" for the final strategic "Big Bet" or most massive insight.

ALLOWED LAYOUTS: "TitleSlide", "Agenda", "StandardContent", "Infographic_Process", "Infographic_Grid", "Infographic_Comparison", "ChartSlide", "Conclusion", "HeroSlide"

OUTPUT FORMAT (Strict JSON):
{
  "thought_process": "Briefly state why you chose specific layouts (Process, Grid, Chart) over text.",
  "slides": [
    {
      "slideNumber": 1,
      "layoutType": "TitleSlide",
      "title": "Slide Title",
      "subtitle": "Slide Subtitle",
      "content": [], 
      "highlightMetrics": [],
      "gridItems": [{"heading": "Pillar 1", "text": "Short detail"}], 
      "processItems": [{"title": "Phase 1", "text": "Action detail"}], 
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

        ApiLogger.info("AGENT 1", "Sending Prompt to gpt-4o-mini API... Waiting for response.");
        const startTime = Date.now();
        
        // 🚀 Call GPT-4o-mini (128k token limit, ultra-fast)
        const response = await client.path("/chat/completions").post({
            body: {
                messages: [{ role: "user", content: prompt }],
                model: "gpt-4o-mini", 
                temperature: 0.2, 
                max_tokens: 4096,
                response_format: { type: "json_object" }
            }
        });

        if (response.status !== "200") {
            throw new Error(`GitHub Models API Error: ${JSON.stringify(response.body)}`);
        }

        const duration = Date.now() - startTime;
        ApiLogger.success("AGENT 1", `Received response from gpt-4o-mini in ${duration}ms.`);

        const responseText = response.body.choices[0].message.content;
        
        ApiLogger.info("AGENT 4", "Initiating Guardrail: Cleaning and Verifying JSON structure...");
        const verifiedData = agent4CleanJSON(responseText);
        
        if (!verifiedData || !verifiedData.slides) {
            ApiLogger.error("AGENT 4", "Blocked execution! Invalid JSON.");
            return res.status(500).json({ success: false, error: "AI generated invalid data format." });
        }
        
        const slidesJSON = verifiedData.slides; 
        ApiLogger.success("AGENT 4", `Verification Complete. Extracted ${slidesJSON.length} slides.`);
        ApiLogger.info("ORCHESTRATOR", "Passing Verified JSON to PPTX Engine...");
        
        const fileName = `EZ_Presentation_${Date.now()}.pptx`;
        const filePath = await generatePPTX(slidesJSON, fileName);

        ApiLogger.info("SYSTEM", `Preparing file stream for download: ${fileName}`);
        
        res.download(filePath, (err) => {
            if (err) {
                ApiLogger.error("SYSTEM", "Failed to stream file to client.", err);
            } else {
                ApiLogger.success("SYSTEM", "File downloaded successfully by client.");
            }
            try {
                fs.unlinkSync(filePath);
                ApiLogger.success("SYSTEM", `File Cleanup: PPTX deleted successfully.`);
            } catch (unlinkErr) {
                ApiLogger.error("SYSTEM", "Cleanup Error.", unlinkErr);
            }
        });

    } catch (error) {
        ApiLogger.error("SYSTEM FATAL", "Unhandled exception.", error);
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
                // FIX: DUPLICATION BUG
                if ((slide.layoutType === "Infographic_Grid" || slide.layoutType === "Infographic_Comparison") && slide.gridItems && slide.gridItems.length > 0) {
                    slide.content = []; 
                }
                // FIX: CHART RAW NUMBERS BUG
                if (slide.requiresChart) {
                    slide.content = []; 
                    const labelsCount = slide.chartLabels?.length || 0;
                    const valuesCount = slide.chartValues?.length || 0;
                    
                    if (labelsCount === 0 || labelsCount !== valuesCount) {
                        slide.requiresChart = false; 
                    } else {
                        slide.chartValues = slide.chartValues.map(v => parseFloat(v) || 0);
                    }
                }
            });
        }
        return cleanedData;
    } catch (e) {
        return null;
    }
}