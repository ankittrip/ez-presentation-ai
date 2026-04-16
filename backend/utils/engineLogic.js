export function validateAndNormalizeChart(labels, values, suggestedType, title = "", originalInsight = "") {
    console.log(`\n==================================================`);
    console.log(`🚀 [CHART VALIDATOR] STARTING VALIDATION FOR: "${title || 'Untitled'}"`);
    console.log(`[INPUTS] Type: ${suggestedType}, Labels:`, labels, `| Values:`, values);
    console.log(`==================================================`);

    // 1. EMPTY DATA CHECK
    if (!values || !labels || !Array.isArray(values) || values.length === 0 || labels.length === 0) {
        console.log(`🛑 [CRITICAL ERROR] Empty or invalid arrays detected! LLM sent garbage. Returning empty fallback Bar chart.`);
        return { 
            type: "bar", 
            labels: labels || [], 
            values: [], 
            insight: originalInsight || "Strategic data distribution analysis pending." 
        };
    }
    
    const safeTitle = (title || "").toLowerCase();
    const safeSuggestedType = (suggestedType || "bar").toLowerCase();
    let finalInsight = (originalInsight || "").trim();

    console.log(`[SANITIZATION] Safe Title: "${safeTitle}", Safe Type: "${safeSuggestedType}"`);

    // 2. DATA TYPE CLEANING (Strings to Numbers)
    let cleanValues = values.map(v => {
        const num = Number(v);
        return isNaN(num) ? 0 : num;
    });
    console.log(`[DATA CLEANING] Original Values:`, values);
    console.log(`[DATA CLEANING] Cleaned Values (Numbers only):`, cleanValues);

    // 3. ARRAY LENGTH MISMATCH (LLM Hallucination fix)
    if (labels.length !== cleanValues.length) {
        console.log(`🟡 [WARNING] Array Length Mismatch! Labels: ${labels.length}, Values: ${cleanValues.length}. Truncating to match...`);
        const minLen = Math.min(labels.length, cleanValues.length);
        labels = labels.slice(0, minLen);
        cleanValues = cleanValues.slice(0, minLen);
        console.log(`[DATA ALIGNMENT] New Labels:`, labels);
        console.log(`[DATA ALIGNMENT] New Values:`, cleanValues);
    }

    // 4. PIE / DOUGHNUT CHART LOGIC
    if (safeSuggestedType === "pie" || safeSuggestedType === "doughnut") {
        console.log(`🍩 [PIE/DOUGHNUT LOGIC] Initiating 100% distribution check...`);
        
        let filteredData = cleanValues
            .map((v, i) => ({ label: labels[i] || `Category ${i+1}`, value: v }))
            .filter(item => item.value > 0);

        console.log(`[PIE FILTER] Data after removing <=0 values:`, filteredData);

        if (filteredData.length === 0) {
            console.log(`🟡 [WARNING] All values were 0 or negative. Pie chart impossible. Falling back to Bar chart.`);
            return { type: "bar", labels, values: cleanValues, insight: finalInsight };
        }

        const total = filteredData.reduce((sum, item) => sum + item.value, 0);
        console.log(`[PIE MATH] Total Sum = ${total}`);

        const normalizedItems = filteredData.map(item => ({
            label: item.label,
            val: Number(((item.value / total) * 100).toFixed(1))
        }));
        console.log(`[PIE MATH] Normalized % (0-100 range):`, normalizedItems);

        // Auto-Insight Generator for Pie
        if (finalInsight.length < 15) {
            const topItem = [...normalizedItems].sort((a, b) => b.val - a.val)[0];
            finalInsight = `Market Dominance: ${topItem.label} accounts for ${topItem.val}% of the total distribution, indicating a concentrated strategic focus.`;
            console.log(`🤖 [AI INSIGHT] Generated fallback insight: "${finalInsight}"`);
        }

        // PPTXGenJS requires 0.0 to 1.0 format for percentages
        const finalPieValues = normalizedItems.map(i => Number((i.val / 100).toFixed(3)));
        console.log(`✅ [FINAL RETURN - PIE] PPTX format values (0.0-1.0 range):`, finalPieValues);
        console.log(`==================================================\n`);
        
        return { 
            type: "doughnut", 
            labels: normalizedItems.map(i => i.label), 
            values: finalPieValues, 
            insight: finalInsight 
        }; 
    }

    // 5. LINE / BAR CHART LOGIC
    console.log(`📊 [LINE/BAR LOGIC] Analyzing best visual fit...`);
    let finalType = safeSuggestedType === "line" ? "line" : "bar";

    if (finalType === "line") {
        // Checking if x-axis has years (e.g., "2024", "FY26")
        const isTimeSeries = labels.some(l => l && /\d{2,4}/.test(String(l))); 
        console.log(`[LINE CHECK] Is Time Series (contains years/numbers)? : ${isTimeSeries}`);
        
        if (!isTimeSeries && labels.length < 4) {
            console.log(`🟡 [WARNING] Not a time series & data points < 4. Changing Line -> Bar.`);
            finalType = "bar";
        }

        if ((safeTitle.includes("revenue") || safeTitle.includes("financial")) && labels.length <= 4) {
            console.log(`🟡 [WARNING] Financial data with <= 4 points looks better as Bar. Changing Line -> Bar.`);
            finalType = "bar";
        }
    }

    // 6. FINAL INSIGHT FALLBACK
    if (finalInsight.toLowerCase().includes("processing") || finalInsight.length < 5) {
        finalInsight = `Strategic analysis of ${safeTitle || 'key metrics'} reveals significant growth opportunities in the current fiscal roadmap.`;
        console.log(`🤖 [AI INSIGHT] Replaced default/processing text with custom business insight.`);
    }

    console.log(`✅ [FINAL RETURN - ${finalType.toUpperCase()}]`);
    console.log(`Labels:`, labels, `| Values:`, cleanValues);
    console.log(`==================================================\n`);

    return { 
        type: finalType, 
        labels: labels, 
        values: cleanValues, 
        insight: finalInsight 
    };
}