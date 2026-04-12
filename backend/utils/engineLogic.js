
export function validateAndNormalizeChart(labels, values, suggestedType, title = "", originalInsight = "") {
  
    if (!values || !labels || !Array.isArray(values) || values.length === 0 || labels.length === 0) {
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

  
    let cleanValues = values.map(v => {
        const num = Number(v);
        return isNaN(num) ? 0 : num;
    });

    if (labels.length !== cleanValues.length) {

        const minLen = Math.min(labels.length, cleanValues.length);
        labels = labels.slice(0, minLen);
        cleanValues = cleanValues.slice(0, minLen);
    }


    if (safeSuggestedType === "pie" || safeSuggestedType === "doughnut") {

        let filteredData = cleanValues
            .map((v, i) => ({ label: labels[i] || `Category ${i+1}`, value: v }))
            .filter(item => item.value > 0);

        if (filteredData.length === 0) {
            return { type: "bar", labels, values: cleanValues, insight: finalInsight };
        }

        const total = filteredData.reduce((sum, item) => sum + item.value, 0);
        const normalizedItems = filteredData.map(item => ({
            label: item.label,
            val: Number(((item.value / total) * 100).toFixed(1))
        }));


        if (finalInsight.length < 15) {
            const topItem = normalizedItems.sort((a, b) => b.val - a.val)[0];
            finalInsight = `Market Dominance: ${topItem.label} accounts for ${topItem.val}% of the total distribution, indicating a concentrated strategic focus.`;
        }

        return { 
            type: "doughnut", 
            labels: normalizedItems.map(i => i.label), 
            values: normalizedItems.map(i => Number((i.val / 100).toFixed(3))), // pptxgen expects 0-1 range for 100%
            insight: finalInsight 
        }; 
    }


    let finalType = safeSuggestedType === "line" ? "line" : "bar";

    if (finalType === "line") {

        const isTimeSeries = labels.some(l => l && /\d{2,4}/.test(String(l))); 
        if (!isTimeSeries && labels.length < 4) {
            finalType = "bar";
        }

        if ((safeTitle.includes("revenue") || safeTitle.includes("financial")) && labels.length <= 4) {
            finalType = "bar";
        }
    }


    if (finalInsight.toLowerCase().includes("processing") || finalInsight.length < 5) {
        finalInsight = `Strategic analysis of ${safeTitle || 'key metrics'} reveals significant growth opportunities in the current fiscal roadmap.`;
    }

    return { 
        type: finalType, 
        labels: labels, 
        values: cleanValues, 
        insight: finalInsight 
    };
}