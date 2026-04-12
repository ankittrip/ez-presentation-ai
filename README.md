🚀 Code EZ: Master of Agents - Intelligent Markdown to PPTX Pipeline
Created by: Ankit Tripathi

📌 Executive Overview
Building a basic LLM wrapper is easy, but building a reliable, enterprise-grade presentation system is hard. LLMs frequently hallucinate data structures or choose inappropriate visualization formats.

To solve this, I didn't just wrap an API. I built an intelligent orchestration system where AI generates structured layout decisions, and my custom Node.js engine enforces strict design rules, visual hierarchy, and mathematical validation.

This system converts unstructured Markdown into McKinsey-grade, visually stunning, and logically sound PPTX presentations.

🧠 System Architecture & The "Validation Guardrail"
My core design philosophy centers around Fault Tolerance and Data Integrity. The system is composed of several intelligent layers:

Agentic Parsing Layer (Groq / Llama-3.3-70b): Analyzes the raw Markdown, extracts key narratives, highlights metrics, and generates a structured JSON blueprint.

The "Validation Guardrail" (engineLogic.js): * LLMs often make mistakes—like suggesting a Pie Chart for non-percentage data.

My engine intercepts the LLM's suggested chart type, mathematically verifies if the values sum up to ~100% for a Pie/Doughnut chart, and uses regex patterns to ensure labels represent a time-series for Line charts.

If the AI makes an illogical choice, my code mathematically corrects it and safely falls back to an appropriate layout (e.g., a Bar chart). It is 100% fault-tolerant.

Dynamic Layout Engine: Automatically routes content to the most impactful visual representation (Standard, Grid, Comparison, Process Flow, or Metric Hero layouts).

Presentation Engine (PptxGenJS): Renders the final .pptx file enforcing a strict, premium consulting theme.

🧪 Key Technical Innovations & Smart Features
1. Adaptive Negative-Space Optimization
The system dynamically scales UI elements based on content density. If an AI generates only 2 key points, the layout engine abandons the standard 4-grid layout and dynamically renders a large, side-by-side "Comparison Layout" to eliminate negative space.

2. Smart Overflow Protection (Dynamic Y-Axis Shifting)
Long, multi-line slide titles often overlap with content boxes. My system calculates string length and dynamically shifts the Y-axis coordinates of grid cards, charts, and metrics downward to ensure pixel-perfect rendering without overlaps.

3. Graceful Fallbacks & Anti-Fluff Filtering
AI models sometimes output placeholder text like "Data processing in progress..." or "Unavailable". I implemented an interception layer that filters out these generic strings before rendering. If data is sparse, it safely falls back to rendering high-impact "Strategic Insight" footers instead of broken UI elements.

4. Rate-Limit Interceptor (The 429 Handler)
Relying on the free tier of the Groq API meant hitting the Tokens Per Day (TPD) limit was a real risk. Instead of allowing the app to crash, I built a custom error parser that catches 429 Rate Limit Exceeded errors, extracts the exact token usage and cooldown time via regex, and gracefully informs the user.

⚙️ Tech Stack
AI Provider: Groq API (Llama-3.3-70b-versatile)

Backend: Node.js

PPT Generation: PptxGenJS

Testing: Jest + Supertest (100% statement coverage, robust handling of invalid/extreme data inputs)

▶️ Setup & Execution Instructions
1. Clone the Repository
Bash
git clone (https://github.com/ankittrip/ez-presentation-ai)](https://github.com/ankittrip/ez-presentation-ai)
cd ez-presentation-ai
2. Install Dependencies
Bash
npm install
3. Environment Configuration
Create a .env file in the root directory and add your Groq API Key:

Code snippet
GROQ_API_KEY
4. Run the Generator
Bash
npm start
# or
node index.js 
(The system will parse the input markdown files and generate the output in the /output folder).

5. Run the Test Suite
Bash
npm test
📁 Deliverables Included
/samples/ Directory: Contains the input .md files and the beautifully generated, final .pptx outputs representing different use cases (e.g., AI Strategy Report, Market Analysis).

/demo-video/demo.mp4: A comprehensive 3-8 minute walkthrough demonstrating the system's ability to handle complex inputs, showcase the adaptive layouts, and explain the core architectural decisions.

🏁 Conclusion
This submission is not just a prompt-to-PPT script; it is a demonstration of how to build reliable, scalable, and visually intelligent software around unpredictable LLM outputs.

Thank you for this incredible challenge!
