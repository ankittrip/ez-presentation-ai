import pptxgen from "pptxgenjs";
import fs from "fs";
import path from "path";

import { validateAndNormalizeChart } from "./engineLogic.js";

const Logger = {
    info: (slideNum, msg) => console.log(`[🔵 INFO] Slide ${slideNum}: ${msg}`),
    success: (slideNum, msg) => console.log(`[🟢 SUCCESS] Slide ${slideNum}: ${msg}`),
    warn: (slideNum, msg) => console.warn(`[🟡 WARNING] Slide ${slideNum}: ${msg}`),
    error: (slideNum, msg, err) => console.error(`[🔴 ERROR] Slide ${slideNum}: ${msg}`, err)
};

// ==========================================
// 🎨 ELITE CONSULTING THEME
// ==========================================
const themeColors = {
    primary: "800020", // Dark Burgundy
    secondary: "F8F9FA", // Ultra Light Grey
    accent: "D84B6B", // Pink
    accentLight: "FFF0F5",
    textLight: "FFFFFF",
    textDark: "2B2D42", // Deep Navy/Charcoal
    shadow: "E0E0E0",
    darkCard: "1E2A38", // Premium Dark Blue/Grey
    chartPalette: ["FF4D6D", "C9184A", "4361EE", "4895EF", "4CC9F0", "3A0CA3"] 
};

// ==========================================
// 🛠️ 1. SMART AGENDA ENGINE
// ==========================================
function renderAgenda(slide, slideData, pptx) {
    if (!slideData.content || slideData.content.length === 0) return;

    const items = slideData.content;
    const totalItems = items.length;
    const activeIndex = slideData.activeIndex !== undefined ? slideData.activeIndex : Math.floor(totalItems / 2.5);

    const getDynamicFontSize = (text, baseSize) => {
        if (text.length > 60) return baseSize - 3; 
        if (text.length > 40) return baseSize - 1.5;
        return baseSize;
    };

    let layout = "single-column";
    if (totalItems <= 3) layout = "centered";
    else if (totalItems <= 6) layout = "single-column";
    else if (totalItems <= 10) layout = "two-column";
    else layout = "multi-grid"; 

    if (layout === "centered") {
        let startY = totalItems === 1 ? 2.5 : (totalItems === 2 ? 2.0 : 1.5);
        let stepY = 1.2; 
        let nodeSize = 0.55;
        let nodeX = 2.0; 

        if (totalItems > 1) {
            slide.addShape(pptx.shapes.LINE, { x: nodeX + (nodeSize / 2), y: startY + (nodeSize / 2), w: 0, h: (totalItems - 1) * stepY, line: { color: '#E0E0E0', width: 2, dashType: "dash" } });
        }

        items.forEach((item, i) => {
            let isCurrent = i === activeIndex;
            let fontSize = getDynamicFontSize(item, isCurrent ? 24 : 20);

            slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
                x: nodeX, y: startY + (i * stepY), w: nodeSize, h: nodeSize,
                fill: { color: isCurrent ? themeColors.primary : "F8F8F8" },
                line: isCurrent ? null : { color: '#CCCCCC', width: 1.5 },
                rectRadius: 0.15, shadow: isCurrent ? { type: 'outer', color: 'A0A0A0', blur: 5, offset: 3, angle: 45 } : null
            });
            slide.addText(String(i + 1), { x: nodeX, y: startY + (i * stepY), w: nodeSize, h: nodeSize, fontSize: 16, bold: true, color: isCurrent ? "FFFFFF" : themeColors.textDark, align: "center", valign: "middle" });
            slide.addText(item, { x: nodeX + 1.0, y: startY + (i * stepY), w: 5.5, h: nodeSize, fontSize: fontSize, color: isCurrent ? themeColors.primary : themeColors.textDark, bold: isCurrent, valign: "middle", wrap: true, autoFit: true, lineSpacing: 24 });
        });
    }
    else if (layout === "single-column") {
        let startY = 1.3;
        let stepY = totalItems === 6 ? 0.65 : 0.85; 
        let nodeSize = 0.45;
        let nodeX = 1.3;

        slide.addShape(pptx.shapes.LINE, { x: nodeX + (nodeSize / 2), y: startY + (nodeSize / 2), w: 0, h: (totalItems - 1) * stepY, line: { color: '#E0E0E0', width: 2, dashType: "dash" } });

        items.forEach((item, i) => {
            let isCurrent = i === activeIndex;
            let fontSize = getDynamicFontSize(item, isCurrent ? 20 : 18);

            slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
                x: nodeX, y: startY + (i * stepY), w: nodeSize, h: nodeSize,
                fill: { color: isCurrent ? themeColors.primary : "F8F8F8" },
                line: isCurrent ? null : { color: '#CCCCCC', width: 1.5 },
                rectRadius: 0.15, shadow: isCurrent ? { type: 'outer', color: 'A0A0A0', blur: 4, offset: 2, angle: 45 } : null
            });
            slide.addText(String(i + 1), { x: nodeX, y: startY + (i * stepY), w: nodeSize, h: nodeSize, fontSize: 14, bold: true, color: isCurrent ? "FFFFFF" : themeColors.textDark, align: "center", valign: "middle" });
            slide.addText(item, { x: nodeX + 0.9, y: startY + (i * stepY), w: 6.5, h: nodeSize, fontSize: fontSize, color: isCurrent ? themeColors.primary : themeColors.textDark, bold: isCurrent, valign: "middle", wrap: true, autoFit: true, lineSpacing: 22 });
        });
    }
    else {
        const mid = Math.ceil(totalItems / 2);
        const leftItems = items.slice(0, mid);
        const rightItems = items.slice(mid);

        let startY = 1.5;
        let stepY = layout === "multi-grid" ? 0.50 : 0.75; 
        let nodeSize = layout === "multi-grid" ? 0.35 : 0.40;
        let baseFontSize = layout === "multi-grid" ? 14 : 16;
        let activeSize = layout === "multi-grid" ? 16 : 18;

        const renderCol = (colItems, startX, startIndex) => {
            if (colItems.length === 0) return;
            slide.addShape(pptx.shapes.LINE, { x: startX + (nodeSize / 2), y: startY + (nodeSize / 2), w: 0, h: (colItems.length - 1) * stepY, line: { color: '#E0E0E0', width: 2, dashType: "dash" } });

            colItems.forEach((item, i) => {
                let absoluteIndex = startIndex + i;
                let isCurrent = absoluteIndex === activeIndex; 
                let fontSize = getDynamicFontSize(item, isCurrent ? activeSize : baseFontSize);

                slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
                    x: startX, y: startY + (i * stepY), w: nodeSize, h: nodeSize, fill: { color: isCurrent ? themeColors.primary : "F8F8F8" }, line: isCurrent ? null : { color: '#CCCCCC', width: 1.5 }, rectRadius: 0.15, shadow: isCurrent ? { type: 'outer', color: 'A0A0A0', blur: 3, offset: 2, angle: 45 } : null
                });
                slide.addText(String(absoluteIndex + 1), { x: startX, y: startY + (i * stepY), w: nodeSize, h: nodeSize, fontSize: 12, bold: true, color: isCurrent ? "FFFFFF" : themeColors.textDark, align: "center", valign: "middle" });
                slide.addText(item, { x: startX + nodeSize + 0.3, y: startY + (i * stepY), w: 3.2, h: nodeSize, fontSize: fontSize, color: isCurrent ? themeColors.primary : themeColors.textDark, bold: isCurrent, valign: "middle", wrap: true, autoFit: true, lineSpacing: 18 });
            });
        };
        renderCol(leftItems, 1.0, 0); 
        renderCol(rightItems, 5.2, mid); 
    }
}

// ==========================================
// 🛠️ 2. SMART CHART ENGINE
// ==========================================
function renderChart(slide, slideData, pptx, index = 0) {
    let validatedData = validateAndNormalizeChart(
        slideData.chartLabels, 
        slideData.chartValues, 
        slideData.chartType || "bar", 
        slideData.title,
        slideData.chartInsight
    );
    let safeType = validatedData.type;
    let safeInsight = validatedData.insight;
    let chartData = [{ name: slideData.chartTitle || "Data", labels: validatedData.labels, values: validatedData.values }];
    
    let cType = pptx.charts.BAR; 
    if (safeType === "doughnut") cType = pptx.charts.DOUGHNUT;
    else if (safeType === "line") cType = pptx.charts.LINE;

    let styleLayout = "INSIGHT_TOP"; 

    if (slideData.content && slideData.content.length > 0) {
        styleLayout = "SPLIT_VIEW";
    } 
    else if (safeType === "doughnut") {
        styleLayout = "SPLIT_VIEW";
    } 
    else if (slideData.highlightMetrics && slideData.highlightMetrics.length > 0) {
        styleLayout = "METRIC_COMBO";
    } 
    else if (safeType === "line") {
        styleLayout = "MINIMAL_LINE";
    } 
    else if (safeInsight && safeInsight.length > 20) {
        styleLayout = "SPLIT_VIEW";
    }

    let chartOptions = {
        showValue: true, showTitle: false, chartColors: themeColors.chartPalette, 
        valAxisLabelFontSize: 11, catAxisLabelFontSize: 11, 
        valAxisLabelColor: themeColors.textDark, catAxisLabelColor: themeColors.textDark
    };

    switch(styleLayout) {
        case "SPLIT_VIEW":
            chartOptions.x = 0.5; chartOptions.y = 1.2; chartOptions.w = 5.0; chartOptions.h = 4.0;
            if (cType === pptx.charts.DOUGHNUT) {
                chartOptions.holeSize = 60; chartOptions.showLegend = false; chartOptions.dataLabelFormatCode = "0%";
            } else { chartOptions.barDir = "col"; }
            slide.addChart(cType, chartData, chartOptions);

            slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 5.8, y: 1.5, w: 3.8, h: 3.2, fill: { color: themeColors.darkCard }, rectRadius: 0.1 });
            slide.addText("💡 STRATEGIC FOCUS", { x: 6.0, y: 1.8, w: 3.4, h: 0.4, fontSize: 14, bold: true, color: "FF4D6D" });

            if (slideData.content && slideData.content.length > 0) {
                let safeBullets = slideData.content.map(pt => {
                    let cleanStr = (typeof pt === "string" ? pt : (pt.title || pt.text || ""));
                    if (cleanStr.length > 120) cleanStr = cleanStr.substring(0, 117) + "..."; 
                    return { text: cleanStr, options: { bullet: { color: "FF4D6D" } } };
                });
                slide.addText(safeBullets, { x: 6.0, y: 2.3, w: 3.4, h: 2.0, fontSize: 13, color: "FFFFFF", align: "left", valign: "top", lineSpacing: 18 });
            } else {
                slide.addText(safeInsight || "Strategic analysis based on data distribution.", { x: 6.0, y: 2.3, w: 3.4, h: 2.0, fontSize: 15, color: "FFFFFF", align: "left", valign: "top", lineSpacing: 22 });
            }
            break;

        case "METRIC_COMBO":
            let metricParts = slideData.highlightMetrics[0].split(" ");
            let bigNum = metricParts[0];
            let aggressiveLabel = metricParts.slice(1).join(" ").toUpperCase();

            // 🛡️ Y-AXIS PUSHED DOWN TO AVOID TITLE OVERLAPS
            slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { 
                x: 0.4, y: 1.45, w: 3.2, h: 2.2, fill: { color: themeColors.darkCard }, rectRadius: 0.1,
                shadow: { type: 'outer', color: 'A0A0A0', blur: 5, offset: 3, angle: 45 }
            });

            let heroFontSize = 56;
            if (bigNum.length > 8) heroFontSize = 34;      
            else if (bigNum.length > 5) heroFontSize = 42; 

            slide.addText(bigNum, { x: 0.4, y: 1.65, w: 3.2, h: 1.0, fontSize: heroFontSize, bold: true, color: "FF4D6D", align: "center" });
            slide.addShape(pptx.shapes.LINE, { x: 0.8, y: 2.55, w: 2.4, h: 0, line: { color: "FFFFFF", width: 2 } });
            slide.addText(aggressiveLabel, { x: 0.4, y: 2.75, w: 3.2, h: 0.6, fontSize: 14, bold: true, color: "FFFFFF", align: "center", wrap: true });

            // 🛡️ CHART Y-AXIS PUSHED DOWN
            chartOptions.x = 3.9; chartOptions.y = 1.35; chartOptions.w = 5.5; chartOptions.h = 3.3;
            chartOptions.barDir = "col";
            slide.addChart(cType, chartData, chartOptions);
            
            if (safeInsight) slide.addText(`Note: ${safeInsight}`, { x: 3.9, y: 4.75, w: 5.5, h: 0.3, fontSize: 10, italic: true, color: themeColors.textDark });
            break;

        case "MINIMAL_LINE":
            chartOptions.x = 0.5; chartOptions.y = 1.2; chartOptions.w = 9.0; chartOptions.h = 3.2;
            chartOptions.lineSmooth = true;
            slide.addChart(cType, chartData, chartOptions);
            if (safeInsight) {
                slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 4.6, w: 9.0, h: 0.5, fill: { color: themeColors.accentLight } });
                slide.addText(`📈 TREND: ${safeInsight}`, { x: 0.6, y: 4.6, w: 8.8, h: 0.5, fontSize: 14, bold: true, color: themeColors.primary, align: "center" });
            }
            break;

        default:
            if (safeInsight) {
                slide.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 1.0, w: 0.05, h: 0.6, fill: { color: themeColors.accent } }); 
                slide.addText(safeInsight, { x: 0.7, y: 1.0, w: 8.5, h: 0.6, fontSize: 19, bold: true, color: themeColors.textDark });
            }
            chartOptions.x = 0.5; chartOptions.y = 1.8; chartOptions.w = 9.0; chartOptions.h = 3.0;
            slide.addChart(cType, chartData, chartOptions);
            break;
    }
}

// ==========================================
// 🛠️ 3. PREMIUM GRID & OUTCOME ENGINE (DYNAMIC OVERLAP FIX)
// ==========================================
function renderGridCards(slide, slideData, pptx) {
    // 🛡️ DYNAMIC Y-AXIS: Checks if title is long (2 lines) and pushes cards down!
    const isLongTitle = (slideData.title || "").length > 45;
    const startY = isLongTitle ? 1.8 : 1.4; 
    const cardH = isLongTitle ? 3.1 : 3.4; // Reduces height slightly to not hit bottom
    
    let rawItems = [];
    const source = (slideData.gridItems && slideData.gridItems.length > 0) ? slideData.gridItems : (slideData.content || []);
    
    rawItems = source.map(pt => {
        if (typeof pt === 'string') {
            const parts = pt.split(":");
            return { heading: parts[0]?.trim() || "Strategic Insight", text: parts.slice(1).join(":")?.trim() || pt };
        }
        return { heading: pt.title || pt.heading || "Key Pillar", text: pt.text || "" };
    }).filter(it => 
        !it.text.toLowerCase().includes("processing") && 
        !it.text.toLowerCase().includes("unavailable") &&
        it.text.length > 2
    );

    if (rawItems.length === 0) { renderStandardContent(slide, slideData, pptx); return; }

    const safeTitle = (slideData.title || "").toLowerCase();
    
    const isComparison = safeTitle.includes("outcome") || 
                         rawItems.some(it => {
                             const h = (it.heading || "").toLowerCase();
                             return h.includes("success") || h.includes("challenge") || h.includes("risk");
                         });

    if (isComparison && rawItems.length >= 2) {
        slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: startY, w: 4.3, h: cardH, fill: { color: "F8F9FA" }, line: { color: "28a745", width: 1.5 }, rectRadius: 0.05 });
        slide.addText("✅ KEY SUCCESSES", { x: 0.7, y: startY + 0.2, w: 3.8, fontSize: 15, bold: true, color: "28a745" });

        slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 5.2, y: startY, w: 4.3, h: cardH, fill: { color: "F8F9FA" }, line: { color: themeColors.accent, width: 1.5 }, rectRadius: 0.05 });
        slide.addText("⚠️ STRATEGIC CHALLENGES", { x: 5.4, y: startY + 0.2, w: 3.8, fontSize: 15, bold: true, color: themeColors.accent });

        if (slideData.highlightMetrics && slideData.highlightMetrics.length > 0) {
            slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 3.5, y: 0.9, w: 3.0, h: 0.7, fill: { color: themeColors.primary }, rectRadius: 0.5, shadow: { type: 'outer', color: 'A0A0A0', blur: 4, offset: 2, angle: 45 } });
            slide.addText(slideData.highlightMetrics[0], { x: 3.5, y: 0.9, w: 3.0, h: 0.7, fontSize: 16, bold: true, color: "FFFFFF", align: "center", valign: "middle" });
        }

        const left = rawItems.filter(it => !(it.heading || "").toLowerCase().includes("challenge")).slice(0, 3);
        const right = rawItems.filter(it => (it.heading || "").toLowerCase().includes("challenge")).slice(0, 3);
        
        slide.addText(left.map(it => ({ text: `• ${it.heading}: ${it.text}`, options: { fontSize: 11, lineSpacing: 20 } })), { x: 0.7, y: startY + 0.7, w: 3.9, valign: 'top', h: 2.3 });
        slide.addText(right.map(it => ({ text: `• ${it.heading}: ${it.text}`, options: { fontSize: 11, lineSpacing: 20 } })), { x: 5.4, y: startY + 0.7, w: 3.9, valign: 'top', h: 2.3 });
        return;
    }

    const items = rawItems.slice(0, 4);
    const count = items.length;

    if (count === 2) {
        items.forEach((item, i) => {
            const cX = 0.5 + (i * 4.6);
            slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: cX, y: startY, w: 4.4, h: cardH, fill: { color: "F8F9FA" }, line: { color: themeColors.primary, width: 1.5 }, rectRadius: 0.05 });
            slide.addShape(pptx.shapes.RECTANGLE, { x: cX, y: startY, w: 4.4, h: 0.5, fill: { color: themeColors.primary } });
            slide.addText(item.heading.toUpperCase(), { x: cX, y: startY, w: 4.4, h: 0.5, fontSize: 13, bold: true, color: "FFFFFF", align: "center" });
            slide.addText(item.text, { x: cX + 0.2, y: startY + 0.7, w: 4.0, h: cardH - 0.8, fontSize: 14, color: themeColors.textDark, lineSpacing: 22, valign: "top" });
        });
    } 
    else {
        items.forEach((item, index) => {
            let row = Math.floor(index / 2); let col = index % 2;
            let cX = 0.5 + (col * 4.6); 
            let stepY = isLongTitle ? 1.6 : 1.8; 
            let cY = startY + (row * stepY); 
            let cW = (count === 3 && index === 2) ? 8.8 : 4.2; 
            let cH = isLongTitle ? 1.4 : 1.6;
            if (count === 3 && index === 2) cX = 0.5;

            slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: cX, y: cY, w: cW, h: cH, fill: { color: "F8F9FA" }, line: { color: themeColors.primary, width: 1 }, rectRadius: 0.05, shadow: { type: 'outer', color: 'E5E5E5', blur: 3, offset: 2, angle: 45 } });
            slide.addShape(pptx.shapes.RECTANGLE, { x: cX, y: cY, w: cW, h: 0.06, fill: { color: themeColors.primary } }); 
            slide.addText(item.heading, { x: cX + 0.2, y: cY + 0.15, w: cW - 0.4, h: 0.3, fontSize: 14, bold: true, color: themeColors.primary });

            const detailText = item.text && item.text.length > 5 ? item.text : `Critical strategic pillar focusing on ${item.heading} to drive enterprise-wide transformation.`;
            slide.addText(detailText, { x: cX + 0.2, y: cY + 0.5, w: cW - 0.4, h: 0.9, fontSize: 11, color: themeColors.textDark, valign: "top", lineSpacing: 18 });
        });
    }
}

// 🚀 4. SINGLE HERO LAYOUT 
function renderSingleHeroLayout(slide, slideData, pptx, fallbackItem) {
    let heroText = fallbackItem?.heading || slideData.title;
    let heroVal = "$865M"; 
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 2.0, y: 1.5, w: 6.0, h: 3.0, fill: { color: "F8F9FA" }, line: { color: themeColors.primary, width: 2 }, rectRadius: 0.1 });
    slide.addText(heroVal, { x: 2.0, y: 1.8, w: 6.0, h: 1.2, fontSize: 60, bold: true, color: themeColors.primary, align: "center" });
    slide.addText(heroText.toUpperCase(), { x: 2.0, y: 3.2, w: 6.0, h: 0.8, fontSize: 18, bold: true, color: themeColors.textDark, align: "center" });
}

// ==========================================
// 🛠️ 4. ROADMAP / TIMELINE ENGINE
// ==========================================
function renderProcessFlow(slide, slideData, pptx) {
    const contentArr = (slideData.content || []).filter(c => !String(c).toLowerCase().includes("unavailable"));

    if (contentArr.length === 0) {
        Logger.warn(slideData.slideNumber, "Fallback triggered.");
        renderStandardContent(slide, slideData, pptx);
        return;
    }

    const steps = contentArr.slice(0, 5);
    const gap = 0.2;
    const boxW = (9.0 - ((steps.length - 1) * gap)) / steps.length;
    let startX = 0.5;
    
    if (steps.length > 1) {
        slide.addShape(pptx.shapes.LINE, { x: startX + (boxW / 2), y: 2.2, w: (steps.length - 1) * (boxW + gap), h: 0, line: { color: themeColors.primary, width: 3 } });
    }

    steps.forEach((step, i) => {
        let currX = startX + i * (boxW + gap);
        
        let phase = `PHASE 0${i + 1}`;
        let heading = "Key Milestone";
        let impact = "Strategic initiative details.";

        if (typeof step === "string") {
            const parts = step.split(":");
            if (parts.length > 1) { heading = parts[0].trim(); impact = parts.slice(1).join(":").trim(); } 
            else { heading = step.substring(0, 25); impact = step; }
        } else {
            phase = (step.title || step.phase || `PHASE 0${i + 1}`).toUpperCase();
            heading = step.heading || step.title || "Milestone";
            impact = step.text || step.impact || "Analysis of process impact.";
        }

        let pillW = boxW - 0.2; 
        if (pillW < 1.2) pillW = 1.2; 
        
        let safePhase = phase.length > 25 ? phase.substring(0, 22) + "..." : phase;
        let pFontSize = safePhase.length > 15 ? 9 : 10; 

        slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { 
            x: currX + (boxW/2) - (pillW/2), y: 1.6, w: pillW, h: 0.35, 
            fill: { color: themeColors.accent }, rectRadius: 0.5 
        });
        slide.addText(safePhase, { 
            x: currX + (boxW/2) - (pillW/2), y: 1.6, w: pillW, h: 0.35, 
            fontSize: pFontSize, bold: true, color: "FFFFFF", align: "center" 
        });

        slide.addShape(pptx.shapes.OVAL, { x: currX + (boxW/2) - 0.08, y: 2.12, w: 0.16, h: 0.16, fill: { color: "FFFFFF" }, line: { color: themeColors.primary, width: 2 } });
        slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: currX, y: 2.4, w: boxW, h: 2.2, fill: { color: "F8F9FA" }, line: { color: themeColors.primary, width: 1.5 }, rectRadius: 0.05, shadow: { type: 'outer', color: 'E5E5E5', blur: 3, offset: 2, angle: 45 } });
        slide.addText(heading, { x: currX + 0.1, y: 2.5, w: boxW - 0.2, h: 0.5, fontSize: 12, bold: true, color: themeColors.primary, align: "center", valign: "middle" });
        slide.addText(impact, { x: currX + 0.1, y: 3.1, w: boxW - 0.2, h: 1.3, fontSize: 10, color: themeColors.textDark, align: "center", valign: "top", lineSpacing: 16 });
    });
}

// ==========================================
// 🛠️ 5. STANDARD CONTENT (DYNAMIC OVERLAP & HERO FIX)
// ==========================================
function renderStandardContent(slide, slideData, pptx) {
    // 🛡️ DYNAMIC Y-AXIS
    const isLongTitle = (slideData.title || "").length > 45;
    let startY = isLongTitle ? 1.8 : 1.4;

    if ((!slideData.content || slideData.content.length === 0) && (!slideData.highlightMetrics || slideData.highlightMetrics.length === 0)) {
        slide.addText("Data processing in progress...", { x: 0.5, y: 2.0, w: 9.0, h: 2.0, fontSize: 24, color: '#A0A0A0', align: 'center', italic: true });
        return;
    }

    if (slideData.highlightMetrics && slideData.highlightMetrics.length > 0) {
        const metrics = slideData.highlightMetrics.slice(0, 4);
        if (metrics.length === 1) {
            const parts = metrics[0].split(" "); const bigNum = parts[0]; const desc = parts.slice(1).join(" ").toUpperCase();
            
            // 🛡️ DABBE KI HEIGHT AUR WIDTH BADHA DI HAI (OVERFLOW FIX)
            slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { 
                x: 1.5, y: startY, w: 6.0, h: 3.4, // Height increased to 3.4, Width to 6.0
                fill: { color: "F8F9FA" }, rectRadius: 0.1, 
                line: { color: themeColors.primary, width: 2 }, 
                shadow: { type: 'outer', color: 'DDDDDD', blur: 5, offset: 3, angle: 45 } 
            });
            
            slide.addText(bigNum, { 
                x: 1.5, y: startY + 0.3, w: 6.0, h: 1.2, 
                fontSize: 72, bold: true, color: themeColors.primary, align: "center" 
            });
            
            slide.addShape(pptx.shapes.LINE, { 
                x: 2.5, y: startY + 1.8, w: 4.0, h: 0, 
                line: { color: themeColors.accent, width: 3 } 
            });
            
            // 🛡️ Text Box ki height badha di (h: 1.2) aur wrap: true hai
            slide.addText(desc, { 
                x: 1.7, y: startY + 2.0, w: 5.6, h: 1.2, 
                fontSize: 16, bold: true, color: themeColors.textDark, align: "center", wrap: true 
            });
            
            return; 
        } 
        else {
            const kpiW = 9.0 / metrics.length - 0.2;
            metrics.forEach((metric, i) => {
                const parts = metric.split(" "); const bigNum = parts[0]; const desc = parts.slice(1).join(" ");
                let kpiX = 0.5 + i * (kpiW + 0.2);
                slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: kpiX, y: startY, w: kpiW, h: 1.8, fill: { color: "F8F9FA" }, rectRadius: 0.05, line: { color: "EAEAEA", width: 1 }, shadow: { type: 'outer', color: 'DDDDDD', blur: 3, offset: 2, angle: 45 } });
                slide.addShape(pptx.shapes.RECTANGLE, { x: kpiX, y: startY, w: kpiW, h: 0.06, fill: { color: themeColors.primary } }); 
                slide.addText(bigNum, { x: kpiX, y: startY + 0.4, w: kpiW, h: 0.6, fontSize: 40, bold: true, color: themeColors.primary, align: "center" });
                slide.addText(desc, { x: kpiX + 0.1, y: startY + 1.1, w: kpiW - 0.2, h: 0.6, fontSize: 12, color: themeColors.textDark, align: "center", valign: "top", wrap: true });
            });
            return;
        }
    }

    const contentLength = slideData.content ? slideData.content.length : 0;
    if (contentLength === 1) {
        slide.addShape(pptx.shapes.RECTANGLE, { x: 1.0, y: startY + 0.8, w: 0.08, h: 1.5, fill: { color: themeColors.accent } }); 
        slide.addText(slideData.content[0], { x: 1.3, y: startY + 0.4, w: 7.5, h: 2.5, fontSize: 26, color: themeColors.primary, bold: true, valign: "middle", lineSpacing: 36, align: "center" });
    } 
    else if (contentLength === 2 || contentLength === 3) {
        let stepY = contentLength === 2 ? 1.4 : 1.1; 
        slideData.content.forEach((pt, i) => {
            let rowY = startY + 0.2 + (i * stepY);
            slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: rowY, w: 9.0, h: 0.9, fill: { color: "F8F9FA" }, rectRadius: 0.05, line: { color: "EAEAEA", width: 1 }, shadow: { type: 'outer', color: 'E5E5E5', blur: 4, offset: 2, angle: 90 } });
            slide.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: rowY, w: 0.1, h: 0.9, fill: { color: themeColors.accent } }); 
            slide.addText(pt, { x: 0.8, y: rowY, w: 8.0, h: 0.9, fontSize: 16, color: themeColors.textDark, valign: "middle", bold: true });
        });
    } 
    else {
        const half = Math.ceil(contentLength / 2);
        const leftContent = slideData.content.slice(0, half).map(pt => ({ text: pt, options: { bullet: { color: themeColors.primary } } }));
        const rightContent = slideData.content.slice(half).map(pt => ({ text: pt, options: { bullet: { color: themeColors.accent } } }));

        slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: startY, w: 4.2, h: 3.5, fill: { color: "F8F9FA" }, rectRadius: 0.05, line: { color: '#EAEAEA', width: 1 }, shadow: { type: 'outer', color: 'E5E5E5', blur: 4, offset: 2, angle: 45 } });
        slide.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: startY, w: 4.2, h: 0.06, fill: { color: themeColors.primary } }); 
        slide.addText(leftContent, { x: 0.7, y: startY + 0.3, w: 3.8, h: 3.0, fontSize: 15, color: themeColors.textDark, valign: "top", lineSpacing: 26 });

        slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 4.8, y: startY, w: 4.2, h: 3.5, fill: { color: "F8F9FA" }, rectRadius: 0.05, line: { color: '#EAEAEA', width: 1 }, shadow: { type: 'outer', color: 'E5E5E5', blur: 4, offset: 2, angle: 45 } });
        slide.addShape(pptx.shapes.RECTANGLE, { x: 4.8, y: startY, w: 4.2, h: 0.06, fill: { color: themeColors.accent } }); 
        slide.addText(rightContent, { x: 5.0, y: startY + 0.3, w: 3.8, h: 3.0, fontSize: 15, color: themeColors.textDark, valign: "top", lineSpacing: 26 });
    }
}

// ==========================================
// 🚀 MAIN EXECUTION ENGINE
// ==========================================
export const generatePPTX = async (slidesJSON, fileName = "EZ_Presentation.pptx") => {
    let pptx = new pptxgen();
    const getBgPath = (name) => path.resolve(`./assets/${name}.png`);

    pptx.defineSlideMaster({ title: "TITLE_MASTER", background: fs.existsSync(getBgPath("bg-title")) ? { path: getBgPath("bg-title") } : { color: "FFE4E1" } });
    pptx.defineSlideMaster({ title: "AGENDA_MASTER", background: fs.existsSync(getBgPath("bg-agenda")) ? { path: getBgPath("bg-agenda") } : { color: "FFFFFF" } });
    pptx.defineSlideMaster({ title: "STANDARD_MASTER", background: fs.existsSync(getBgPath("bg-standard")) ? { path: getBgPath("bg-standard") } : { color: "FFFFFF" }, objects: [{ text: { text: "Generated by EZ AI Agent", options: { x: 0.5, y: 5.25, w: 3, h: 0.3, color: "A0A0A0", fontSize: 10 } } }] });
    pptx.defineSlideMaster({ title: "VISUAL_MASTER", background: fs.existsSync(getBgPath("bg-visual")) ? { path: getBgPath("bg-visual") } : { color: "FFFFFF" }, objects: [{ text: { text: "Generated by EZ AI Agent", options: { x: 0.5, y: 5.25, w: 3, h: 0.3, color: "A0A0A0", fontSize: 10 } } }] });
    pptx.defineSlideMaster({ title: "CONCLUSION_MASTER", background: fs.existsSync(getBgPath("bg-conclusion")) ? { path: getBgPath("bg-conclusion") } : { color: "FFE4E1" } });
    pptx.defineSlideMaster({ title: "HERO_MASTER", background: { color: themeColors.primary }, objects: [{ text: { text: "Generated by EZ AI Agent", options: { x: 0.5, y: 5.25, w: 3, h: 0.3, color: "FFFFFF", fontSize: 10 } } }] });

    const heroSlides = slidesJSON.filter(s => s.layoutType === "HeroSlide");
    const otherSlides = slidesJSON.filter(s => s.layoutType !== "HeroSlide");
    const finalSlidesJSON = [...otherSlides, ...heroSlides]; 

    finalSlidesJSON.forEach((slideData) => {
        let masterTemplate = "STANDARD_MASTER";
        
        if (slideData.layoutType === "TitleSlide") masterTemplate = "TITLE_MASTER";
        else if (slideData.layoutType === "Agenda") masterTemplate = "AGENDA_MASTER";
        else if (["Infographic_Process", "ChartSlide", "Infographic_Comparison", "Infographic_Grid"].includes(slideData.layoutType)) masterTemplate = "VISUAL_MASTER";
        else if (slideData.layoutType === "HeroSlide") masterTemplate = "HERO_MASTER";
        else if (slideData.layoutType === "Conclusion") masterTemplate = "CONCLUSION_MASTER";

        let slide = pptx.addSlide({ masterName: masterTemplate });

        if (slideData.layoutType === "TitleSlide") {
            let titleText = slideData.title || "";
            // 🛠️ CRITICAL FIX: Width (w) reduced from 5.5 to 4.4 to avoid overlapping the right-side graphic.
            slide.addText(titleText, { 
                x: 0.8, y: 1.2, w: 4.4, h: 1.8, 
                fontSize: titleText.length > 40 ? 30 : 38, 
                bold: true, color: themeColors.accent, 
                align: "left", valign: "bottom", wrap: true 
            });
            if (slideData.subtitle) {
                slide.addText(slideData.subtitle, { 
                    x: 0.8, y: 3.2, w: 4.4, h: 1.2, 
                    fontSize: 18, color: themeColors.textDark, 
                    align: "left", valign: "top", wrap: true 
                });
            }
        } 
        else if (slideData.layoutType === "HeroSlide") {
            slide.addText(`"${slideData.title}"`, { x: 0.5, y: 1.8, w: 9.0, h: 1.5, fontSize: 48, bold: true, color: "FFFFFF", align: "center", valign: "middle" });
            slide.addShape(pptx.shapes.RECTANGLE, { x: 4.0, y: 3.4, w: 2.0, h: 0.05, fill: { color: themeColors.accent } });
            if (slideData.subtitle) slide.addText(slideData.subtitle, { x: 1.0, y: 3.7, w: 8.0, h: 1.0, fontSize: 20, color: themeColors.accentLight, align: "center", italic: true });
        }
        else {
            slide.addText(slideData.title, { x: 0.5, y: 0.2, w: 9, h: 0.8, fontSize: 32, bold: true, color: themeColors.primary, valign: "top" });

            switch (true) {
                case slideData.layoutType === "Agenda":
                    renderAgenda(slide, slideData, pptx);
                    break;
                case slideData.requiresChart === true:
                    renderChart(slide, slideData, pptx);
                    break;
                case slideData.layoutType === "Infographic_Process":
                    renderProcessFlow(slide, slideData, pptx);
                    break;
                case slideData.layoutType === "Infographic_Grid" || slideData.layoutType === "Infographic_Comparison":
                    renderGridCards(slide, slideData, pptx);
                    break;
                default:
                    renderStandardContent(slide, slideData, pptx);
                    break;
            }
        }
    });

    const outputDir = path.resolve("./output");
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
    const filePath = path.join(outputDir, fileName);
    await pptx.writeFile({ fileName: filePath });
    return filePath;
};

export { 
    validateAndNormalizeChart, 
    renderChart, 
    renderProcessFlow 
};