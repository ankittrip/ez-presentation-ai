import pptxgen from "pptxgenjs";
import fs from "fs";
import path from "path";
import { validateAndNormalizeChart } from "./engineLogic.js";


// ==========================================
// 🕵️‍♂️ X-RAY LOGGER ENGINE
// ==========================================
const Logger = {
    info: (slideNum, msg) => console.log(`[🔵 INFO] Slide ${slideNum}: ${msg}`),
    success: (slideNum, msg) => console.log(`[🟢 SUCCESS] Slide ${slideNum}: ${msg}`),
    warn: (slideNum, msg) => console.warn(`[🟡 WARNING] Slide ${slideNum}: ${msg}`),
    error: (slideNum, msg, err) => console.error(`[🔴 ERROR] Slide ${slideNum}: ${msg}`, err),
    divider: () => console.log(`--------------------------------------------------`)
};


// ==========================================
// 🎨 ENTERPRISE CONFIG & CONSTANTS
// ==========================================
const themes = {
    "Ghost_Research_UAE": {
        primary: "D32F2F", secondary: "F8F9FA", accent: "1E2A38", accentLight: "FFEBEE",
        textLight: "FFFFFF", textDark: "1E2A38", darkCard: "1E2A38", bgFolder: "assets"
    },
    "Variation_Blue": {      
        primary: "005A9C", secondary: "F8F9FA", accent: "F2A900", accentLight: "E6F2FF",
        textLight: "FFFFFF", textDark: "2B2D42", darkCard: "003366", bgFolder: "assets_variation"
    }
};


const activeTheme = themes["Ghost_Research_UAE"];
const themeColors = activeTheme;


const LAYOUT = { marginX: 0.5, marginY: 1.2, maxW: 9.0, maxH: 5.625 };
const NEGATIVE_KEYWORDS = ["risk", "challenge", "issue", "problem", "failure", "loss", "delay", "overrun", "threat", "con"];


// ==========================================
// 🧠 HELPERS & SANITIZATION
// ==========================================
const extractText = (pt) => typeof pt === 'string' ? pt : (pt.text || pt.title || pt.heading || "");
const smartWrap = (text, maxChars = 20) => (!text) ? "" : (text.length <= maxChars ? text : text.substring(0, maxChars).trim() + "..");


function deduplicateItems(items) {
    const seen = new Set();
    return items.filter(item => {
        const key = typeof item === 'string' ? item.trim().toLowerCase() : (item.heading || "").trim().toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}




//DECISION ENGINE
function chooseVisualLayout(slideData) {
    Logger.info(slideData.slideNumber, `[VISUAL ENGINE] Analyzing data for layout...`);


    const hasProcess = slideData.processItems && slideData.processItems.length > 0;
    const hasGrid = slideData.gridItems && slideData.gridItems.length > 0;
    const hasMetrics = slideData.highlightMetrics && slideData.highlightMetrics.length > 0;
   
    if (hasGrid) {
        const isVersus = slideData.gridItems.some(it => NEGATIVE_KEYWORDS.some(kw => (it.heading || "").toLowerCase().includes(kw)));
        if (isVersus) return "COMPARISON_SPLIT";
       
        const isExecutive = slideData.gridItems.length >= 4 || (slideData.title || "").toLowerCase().includes("summary");
        if (isExecutive) return "EXECUTIVE_CARDS";
       
        if (slideData.gridItems.length >= 4 && ((slideData.title || "").toLowerCase().includes("volume") || (slideData.title || "").toLowerCase().includes("investment"))) {
            return "ACCENTURE_DATA_GRID";
        }
       
        return "PREMIUM_GRID";
    }


    if (hasProcess) {
        if (slideData.processItems.length >= 4) return "ACCENTURE_RED_PILLARS";
        return "CHEVRON_FLOW";
    }


    if (slideData.requiresChart) return "CHART_SLIDE";
    if (slideData.layoutType === "Agenda") return "AGENDA_SLIDE";
    if (hasMetrics) return "WOW_SLIDE";
   
    return "STANDARD_CLEAN";
}

// ==========================================
// 🛠️ RENDER STANDARD CONTENT (FINAL CLEAN)
// ==========================================
function renderStandardContent(slide, slideData, pptx) {

    const safeContent = deduplicateItems(
        (slideData.content || []).map(extractText)
    ).filter(Boolean);

    const isLongParagraph =
        safeContent.length === 1 && safeContent[0].length > 120;

    const isSingleLine =
        safeContent.length === 1 && safeContent[0].length <= 120;

    // ==========================================
    // 🔥 CASE 1: LONG PARAGRAPH
    // ==========================================
    if (isLongParagraph) {

        let cleanText = safeContent[0].replace(/\s+/g, " ").trim();

        slide.addShape(pptx.ShapeType.rect, {
            x: 1,
            y: 1.8,
            w: 0.08,
            h: 2.5,
            fill: { color: themeColors.primary }
        });

        slide.addText(cleanText, {
            x: 1.3,
            y: 1.8,
            w: 7.5,
            h: 3.5,
            fontSize: 18,
            wrap: true,
            lineSpacing: 28,
            color: themeColors.textDark
        });

        return;
    }

    // ==========================================
    // 🔥 CASE 2: HERO TEXT
    // ==========================================
    if (isSingleLine) {

        slide.addText(safeContent[0], {
            x: 1.5,
            y: 2,
            w: 7,
            h: 2.5,
            fontSize: 28,
            bold: true,
            align: "center",
            color: themeColors.primary
        });

        return;
    }

    // ==========================================
    // 🔥 CASE 3: EXECUTIVE GRID (FINAL)
    // ==========================================

    const items = safeContent.slice(0, 4);

    const cardW = 4.2;
    const cardH = 1.4;
    const startY = 1.3;

    items.forEach((pt, i) => {

        let row = Math.floor(i / 2);
        let col = i % 2;

        let x = 0.6 + col * (cardW + 0.4);
        let y = startY + row * (cardH + 0.4);

        let clean = pt.replace(/^[•\-\s]+/, "").trim();

        // ==========================================
        // 🧠 SMART SPLIT
        // ==========================================

        let parts = clean.split(/[:\-]/);

        let rawTitle = (parts[0] || "").trim();
        let descText = parts.slice(1).join(" ").trim();

        // 🔥 Title short + clean
        let titleText = rawTitle.split(" ").slice(0, 4).join(" ").toUpperCase();

        // 🔥 Prevent duplication
        if (!descText || descText.toLowerCase() === rawTitle.toLowerCase()) {
            descText = rawTitle.split(" ").slice(4).join(" ");
        }

        // ==========================================
        // 🔹 CARD
        // ==========================================

        slide.addShape(pptx.ShapeType.roundRect, {
            x, y, w: cardW, h: cardH,
            fill: { color: "#F9FAFB" },
            rectRadius: 0.1,
            shadow: {
                type: "outer",
                blur: 6,
                offset: 2,
                angle: 45,
                color: "000000",
                opacity: 0.1
            }
        });

        // 🔴 NUMBER
        slide.addText(`0${i + 1}`, {
            x: x + 0.3,
            y: y + 0.3,
            w: 0.6,
            h: 0.6,
            fontSize: 16,
            bold: true,
            color: themeColors.primary
        });

        // 🔴 TITLE
        slide.addText(titleText, {
            x: x + 1,
            y: y + 0.3,
            w: 3,
            h: 0.5,
            fontSize: 16,
            bold: true,
            color: themeColors.primary
        });

        // 🔹 DESCRIPTION
        if (descText) {
            slide.addText(descText, {
                x: x + 1,
                y: y + 0.8,
                w: 3,
                h: 0.6,
                fontSize: 13,
                wrap: true,
                color: themeColors.textDark
            });
        }

    });
}



// ==========================================
// 🛡️ SAFE SHAPE WRAPPER (PRO VERSION)
// ==========================================
function safeShape(slide, type, config = {}, meta = {}) {
    try {

        // 🔹 Basic validation (prevent undefined crashes)
        if (!slide || !type) {
            throw new Error("Invalid slide or shape type");
        }

        // 🔹 Auto-fallback defaults (layout safety)
        const safeConfig = {
            x: config.x ?? 0,
            y: config.y ?? 0,
            w: config.w ?? 1,
            h: config.h ?? 1,
            ...config
        };

        // 🔹 Render shape
        return slide.addShape(type, safeConfig);

    } catch (err) {

        // 🔥 Structured logging (not random console.log)
        console.error("❌ [SAFE SHAPE ERROR]", {
            slide: meta.slideNumber || "unknown",
            type,
            config,
            message: err.message
        });

        // 🔹 Soft fallback → invisible placeholder (prevents layout break)
        try {
            return slide.addShape(type, {
                x: config?.x || 0,
                y: config?.y || 0,
                w: 0.01,
                h: 0.01,
                fill: { color: "FFFFFF", transparency: 100 }
            });
        } catch {
            return null; // final fail-safe
        }
    }
}

//DONE
// ==========================================
// 🛠️ SMART AGENDA ENGINE (ULTIMATE PRO FIXED)
// ==========================================
function renderAgenda(slide, slideData, pptx) {


    // 🔹 Debug log → helps track slide rendering in large pipelines
    Logger.info(slideData.slideNumber, `=> Executing [renderAgenda]`);


    // ==========================================
    // 🔹 STEP 1: CLEAN + PREPARE DATA
    // ==========================================
    let items = deduplicateItems(
        (slideData.content || []).map(extractText)
    )
    // Remove empty / very small strings (UI safety)
    .filter(it => it.length > 2);


    if (items.length === 0) return;


    // Limit items → UI design constraint (avoid overflow)
    const totalItems = Math.min(items.length, 8);


    // Decide layout → 1 column (simple) OR 2 column (grid)
    const maxPerRow = totalItems <= 3 ? 1 : 2;


    // ==========================================
    // 🔹 STEP 2: GRID SYSTEM (CORE LAYOUT ENGINE)
    // ==========================================
    const slideWidth = 10;


    // Dynamic margins → tighter for grid, wider for single column
    const sideMargin = maxPerRow === 2 ? 0.6 : 1.5;


    const gapX = 0.6; // horizontal spacing between cards


    const totalRows = Math.ceil(totalItems / maxPerRow);


    // Dynamic vertical scaling → prevents crowding
    let rowH = totalRows >= 4 ? 0.75 : 1.05;
    let gapY = totalRows >= 4 ? 0.15 : 0.28;
    let startY = totalRows >= 4 ? 1.3 : 1.6;


    // Total usable width inside slide
    const usableWidth = slideWidth - (sideMargin * 2);


    // Auto column width (IMPORTANT: no hardcoding)
    const baseColW = maxPerRow === 2
        ? (usableWidth - gapX) / 2
        : usableWidth;


    // Active agenda item (highlight)
    const activeIndex = slideData.activeIndex ?? 0;


    // Remove numbering like "1. Title"
    const cleanAgendaText = (text) => text.replace(/^\d+\.\s*/, '');


    // ==========================================
    // 🔹 STEP 3: RENDER LOOP (UI BUILDING)
    // ==========================================
    items.slice(0, 8).forEach((item, index) => {


        // Grid positioning
        let row = Math.floor(index / maxPerRow);
        let col = index % maxPerRow;


        // Special case → last item full width (odd count layout fix)
        const isLastSingle =
            (totalItems % 2 === 1) &&
            (index === totalItems - 1) &&
            maxPerRow === 2;


        const isActive = index === activeIndex;


        // Dynamic width handling
        let colW = isLastSingle ? usableWidth : baseColW;


        // Base X position
        let baseX = isLastSingle
            ? sideMargin
            : sideMargin + (col * (baseColW + gapX));


        // Base Y position
        let baseY = startY + (row * (rowH + gapY));


        // ==========================================
        // 🔹 STEP 4: ACTIVE STATE TRANSFORM SYSTEM
        // ==========================================
        // ⚠️ Keep values small → avoids layout breaking
        const shiftX = isActive ? -0.03 : 0;  // slight left shift
        const shiftY = isActive ? -0.02 : 0;  // slight upward shift
        const expandW = isActive ? 0.06 : 0;  // width increase
        const expandH = isActive ? 0.04 : 0;  // height increase


        const cX = baseX + shiftX;
        const cY = baseY + shiftY;


        // ==========================================
        // 🔹 STEP 5: CARD BACKGROUND
        // ==========================================
        // NOTE:
        // Outer border can break rounded corners → use carefully
        slide.addShape(pptx.ShapeType.roundRect, {
            x: cX,
            y: cY,
            w: colW + expandW,
            h: rowH + expandH,
            fill: { color: isActive ? "#FFF7F6" : "#FCFCFC" },


            // Active border only (visual hierarchy)
            line: {
                color: isActive ? themeColors.primary : "#FFFFFF",
                width: isActive ? 2 : 0
            },


            rectRadius: 0.06, // corner roundness


            // Shadow → depth + premium feel
            shadow: {
                type: 'outer',
                blur: isActive ? 14 : 6,
                offset: isActive ? 5 : 2,
                angle: 45,
                color: '000000',
                opacity: isActive ? 0.22 : 0.1
            }
        });


        // ==========================================
        // 🔹 STEP 6: LEFT ACCENT STRIP
        // ==========================================
        // Branding + visual anchor
        slide.addShape(pptx.ShapeType.rect, {
            x: cX + 0.015, // inset for premium alignment
            y: cY,
            w: isActive ? 0.055 : 0.035,
            h: rowH + expandH,
            fill: { color: themeColors.primary }
        });


        // ==========================================
        // 🔹 STEP 7: NUMBER (01, 02...)
        // ==========================================
        slide.addText(`0${index + 1}`, {
            x: cX + 0.18,
            y: cY,
            w: 0.7,
            h: rowH + expandH,
            fontSize: isActive ? 26 : (totalRows >= 4 ? 20 : 24),
            bold: true,
            color: themeColors.primary,
            opacity: isActive ? 1 : 0.8,
            align: "center",
            valign: "middle"
        });


        // ==========================================
        // 🔹 STEP 8: TEXT CONTENT
        // ==========================================
        let cleanText = cleanAgendaText(item);


        // Wrap text → prevents overflow
        let truncatedText = smartWrap(cleanText, 60);


        slide.addText(truncatedText, {
            x: cX + 0.95,
            y: cY,
            w: (colW + expandW) - 1.1,
            h: rowH + expandH,
            fontSize: isActive ? 14 : (totalRows >= 4 ? 11 : 13),
            bold: true,


            // Better contrast for active card
            color: isActive ? "#1F2937" : themeColors.textDark,


            align: "left",
            valign: "middle",
            wrap: true
        });


    });
}

// ==========================================
// 📊 SMART CHART RENDER (DYNAMIC LAYOUT FIXED)
// ==========================================
function renderChart(slide, slideData, pptx, slideIndex = 0) {

    Logger.info(slideData.slideNumber, `=> Executing [renderChart]`);

    let validatedData = validateAndNormalizeChart(
        slideData.chartLabels,
        slideData.chartValues,
        slideData.chartType || "bar",
        slideData.title,
        slideData.chartInsight
    );

    // 🔒 Fallback safety
    if (!validatedData) {
        renderStandardContent(slide, slideData, pptx);
        return;
    }

    // ===============================
    // 🔥 CHART TYPE
    // ===============================
    let cType =
        validatedData.type === "doughnut"
            ? pptx.charts.DOUGHNUT
            : validatedData.type === "line"
            ? pptx.charts.LINE
            : pptx.charts.BAR;

    // ===============================
    // 🔥 DATA PREP
    // ===============================
    const values = (validatedData.values || []).map(v => (v == null ? 0 : v));
    const labels = validatedData.labels || [];

    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const padding = (maxVal - minVal) * 0.1;

    // 🔥 WOW SLIDE CHECK
    const isFlat = new Set(values).size === 1;
    if (isFlat) {
        renderWowSlide(slide, slideData, pptx);
        return;
    }

    // ===============================
    // 🧠 AUTO INSIGHT
    // ===============================
    const maxIndex = values.indexOf(maxVal);
    const topLabel = labels[maxIndex];

    const insightText =
        validatedData.insight?.substring(0, 100) ||
        `${topLabel} dominates the distribution`;

    // ===============================
    // 🔥 🔥 DYNAMIC TITLE HEIGHT (MAIN FIX)
    // ===============================
    const titleLength = (slideData.title || "").length;

    const titleHeight =
        titleLength > 60 ? 1.4 :
        titleLength > 40 ? 1.1 :
        0.8;

    // ===============================
    // 🔥 DYNAMIC POSITIONS (NO OVERLAP)
    // ===============================
    const chartY = titleHeight + 0.6;
    const subtitleY = titleHeight + 0.2;

    // ===============================
    // 🔥 LAYOUT SWITCH (ALT SIDES)
    // ===============================
    const isAlt = slideIndex % 2 !== 0;

    const chartX = isAlt ? 5.2 : 0.5;
    const insightX = isAlt ? 0.5 : 5.8;

    // ===============================
    // 📊 CHART OPTIONS
    // ===============================
    let chartOptions = {
        showValue: cType !== pptx.charts.DOUGHNUT,
        showTitle: false,

        // 🔥 Highlight max value
        chartColors: values.map(v =>
            v === maxVal ? themeColors.primary : "E5E7EB"
        ),

        valAxisMinVal: Math.max(0, minVal - padding),
        valAxisMaxVal: maxVal + padding,

        valAxisLabelFontSize: 11,
        catAxisLabelFontSize: 12,
        dataLabelFontSize: 10,
        dataLabelPosition: "outEnd",

        valGridLine: {
            color: "E0E0E0",
            size: 1
        },

        x: chartX,
        y: chartY, // ✅ FIXED (dynamic)
        w: 5.0,
        h: 3.6
    };

    // ===============================
    // 🔥 LINE CHART FIX
    // ===============================
    if (cType === pptx.charts.LINE) {
        chartOptions.lineSize = 3;
        chartOptions.markerSize = 6;
        chartOptions.chartColors = [themeColors.primary];
        chartOptions.markerColor = themeColors.primary;
        chartOptions.dataLabelPosition = "t";
    }

    // ===============================
    // 🔥 DOUGHNUT FIX
    // ===============================
    if (cType === pptx.charts.DOUGHNUT) {
        chartOptions.holeSize = 60;
        chartOptions.showLegend = false;
    } else {
        chartOptions.showLegend = false;
    }

    // ===============================
    // 📊 RENDER CHART
    // ===============================
    slide.addChart(
        cType,
        [
            {
                name: slideData.chartTitle || "Metric",
                labels,
                values
            }
        ],
        chartOptions
    );

    // ===============================
    // 💎 INSIGHT CARD (DYNAMIC POSITION)
    // ===============================
    slide.addShape(pptx.ShapeType.rect, {
        x: insightX,
        y: chartY - 0.1, // ✅ FIXED
        w: 0.06,
        h: 3.8,
        fill: { color: themeColors.primary }
    });

    slide.addShape(pptx.ShapeType.roundRect, {
        x: insightX + 0.1,
        y: chartY - 0.1,
        w: 3.6,
        h: 3.8,
        fill: { color: "FFFFFF" },
        line: { color: "E5E7EB", width: 1 },
        rectRadius: 0.08,
        shadow: {
            type: "outer",
            blur: 10,
            offset: 2,
            opacity: 0.18
        }
    });

    // header
    slide.addText("💡 STRATEGIC INSIGHT", {
        x: insightX + 0.3,
        y: chartY + 0.2,
        w: 3.2,
        h: 0.4,
        fontSize: 12,
        bold: true,
        color: themeColors.primary
    });

    slide.addText(`"${insightText}"`, {
        x: insightX + 0.4,
        y: chartY + 0.8,
        w: 3.0,
        h: 2.4,
        fontSize: insightText.length > 60 ? 20 : 24,
        bold: true,
        color: themeColors.textDark,
        align: "left",
        valign: "middle",
        lineSpacing: 30
    });

    // ===============================
    // 🧠 SUBTITLE (DYNAMIC FIX)
    // ===============================
    slide.addText(`${topLabel} dominates key metrics`, {
        x: 0.5,
        y: subtitleY, // ✅ FIXED
        w: 6,
        h: 0.4,
        fontSize: 14,
        color: "6B7280"
    });

    // ===============================
    // 🔥 DOUGHNUT CENTER TEXT (ALREADY GOOD)
    // ===============================
    if (cType === pptx.charts.DOUGHNUT) {

        const centerX = chartX + (chartOptions.w / 2);
        const centerY = chartOptions.y + (chartOptions.h / 2);

        slide.addText(`${Math.round(maxVal * 100)}%`, {
            x: centerX - 0.75,
            y: centerY - 0.4,
            w: 1.5,
            h: 0.6,
            fontSize: 34,
            bold: true,
            color: themeColors.primary,
            align: "center"
        });

        slide.addText(topLabel, {
            x: centerX - 0.75,
            y: centerY + 0.2,
            w: 1.5,
            h: 0.4,
            fontSize: 13,
            color: "6B7280",
            align: "center"
        });
    }
}

// ==========================================
// 🚀 WOW SLIDE (ELITE DARK MODE - FINAL)
// ==========================================
function renderWowSlide(slide, slideData, pptx) {
    Logger.info(slideData.slideNumber, `=> Executing [renderWowSlide]`);

    // ===============================
    // 🧠 DATA PARSE
    // ===============================
    let metricStr =
        (slideData.highlightMetrics && slideData.highlightMetrics.length > 0)
            ? slideData.highlightMetrics[0]
            : "97% Growth";

    let parts = metricStr.split(" ");
    let bigNum = parts[0];
    let subText = parts.slice(1).join(" ") || slideData.title || "Core Metric";

    // ===============================
    // 🎨 FULL BACKGROUND (NO EMPTY SPACE)
    // ===============================
    slide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: 10,
        h: 5.63,
        fill: { color: themeColors.darkCard || "1E2A38" }
    });

    // ===============================
    // 🔥 LEFT ACCENT BAR (THICK + PREMIUM)
    // ===============================
    slide.addShape(pptx.ShapeType.rect, {
        x: 0.7,
        y: 1.0,
        w: 0.2,
        h: 3.8,
        fill: { color: themeColors.primary }
    });

    // ===============================
    // 💎 CARD LAYER (DEPTH EFFECT)
    // ===============================
    slide.addShape(pptx.ShapeType.roundRect, {
        x: 1.2,
        y: 1.0,
        w: 7.8,
        h: 3.8,
        fill: { color: "243447" },
        rectRadius: 0.08,
        shadow: {
            type: "outer",
            blur: 12,
            offset: 3,
            angle: 45,
            opacity: 0.25
        }
    });

    // ===============================
    // 🔢 BIG NUMBER (CENTERED PROPERLY)
    // ===============================
    let numSize = bigNum.length > 5 ? 72 : 96;

    slide.addText(bigNum, {
        x: 1.2,
        y: 1.6,
        w: 7.8,
        h: 1.8,
        fontSize: numSize,
        bold: true,
        color: "FFFFFF",
        align: "center",   // ✅ FIXED (centered)
        valign: "middle",
        shadow: {
            type: "outer",
            blur: 6,
            offset: 2,
            angle: 45,
            opacity: 0.4
        }
    });

    // ===============================
    // 🧾 SUBTITLE (BETTER HIERARCHY)
    // ===============================
    slide.addText(subText.toUpperCase(), {
        x: 1.2,
        y: 3.3,
        w: 7.8,
        h: 0.8,
        fontSize: 22,
        bold: true,
        color: themeColors.primary,
        align: "center",   // ✅ CENTERED for balance
        valign: "top",
        letterSpacing: 1.2
    });

    // ===============================
    // ✨ SMALL TOP LABEL (ADDED CONTEXT)
    // ===============================
    slide.addText("KEY HIGHLIGHT", {
        x: 1.2,
        y: 1.1,
        w: 7.8,
        h: 0.4,
        fontSize: 12,
        color: "9CA3AF",
        align: "center",
        letterSpacing: 2
    });
}

// ==========================================
// 💎 ELITE CARD GRID (REPLACES BROKEN CIRCLE LAYOUT)
// ==========================================
function renderCardGridSlide(slide, slideData, pptx) {
    Logger.info(slideData.slideNumber, `=> Executing [renderCardGridSlide]`);
    const items = (slideData.gridItems || slideData.content || []).slice(0, 4);
    if (items.length === 0) { renderStandardContent(slide, slideData, pptx); return; }

    const startY = 1.4; const cardW = 4.4; const cardH = 1.6; const gap = 0.3; const marginX = 0.45;

    slide.addShape(pptx.ShapeType.rect, { x: marginX, y: 0.3, w: 0.3, h: 0.05, fill: { color: themeColors.primary } });

    items.forEach((item, i) => {
        let col = i % 2; let row = Math.floor(i / 2);
        let cX = marginX + (col * (cardW + gap)); let cY = startY + (row * (cardH + gap));

        slide.addShape(pptx.ShapeType.roundRect, { x: cX, y: cY, w: cardW, h: cardH, fill: { color: "FFFFFF" }, line: { color: "#F0F0F0", width: 1 }, rectRadius: 0.04, shadow: { type: 'outer', blur: 8, offset: 3, angle: 45, color: '000000', opacity: 0.08 } });
        slide.addShape(pptx.ShapeType.roundRect, { x: cX + 0.2, y: cY + 0.3, w: 0.5, h: 0.5, fill: { color: themeColors.primary, transparency: 90 }, rectRadius: 0.1 });
        slide.addText(`0${i + 1}`, { x: cX + 0.2, y: cY + 0.3, w: 0.5, h: 0.5, fontSize: 14, bold: true, color: themeColors.primary, align: "center", valign: "middle" });

        let heading = (typeof item === 'string' ? "Key Driver" : (item.heading || item.title || "Feature")).toUpperCase();
        slide.addText(heading, { x: cX + 0.85, y: cY + 0.25, w: cardW - 1.1, h: 0.3, fontSize: 12, bold: true, color: themeColors.primary, align: "left", valign: "top" });

        let bodyText = typeof item === 'string' ? item : (item.text || item.description || "");
        slide.addText(smartWrap(bodyText, 100), { x: cX + 0.85, y: cY + 0.6, w: cardW - 1.1, h: 0.8, fontSize: 10, color: themeColors.textDark, align: "left", valign: "top", wrap: true });
    });
}
// ==========================================
// 💎 PREMIUM GRID CARDS (FIGMA LEVEL FINAL)
// ==========================================
function renderComparisonSplit(slide, slideData, pptx) {


    let items = (slideData.content || []).map(extractText);


    const successes = items.filter(i =>
        !/cost|risk|loss|challenge/i.test(i)
    ).slice(0, 3);


    const challenges = items.filter(i =>
        /cost|risk|loss|challenge/i.test(i)
    ).slice(0, 3);


    // 🔴 HERO CIRCLE
    slide.addShape(pptx.ShapeType.ellipse, {
        x: 1.5,
        y: -4.2,
        w: 7,
        h: 7,
        fill: { color: themeColors.primary },
        line: { width: 0 }
    });


    // ✅ SINGLE TITLE (no duplicate)
    slide.addText("SUCCESSES VS CHALLENGES", {
        x: 2,
        y: 1.0,
        w: 6,
        h: 1,
        fontSize: 28,
        bold: true,
        color: "FFFFFF",
        align: "center"
    });


    // ===============================
    // LEFT COLUMN (SUCCESS)
    // ===============================
    slide.addText("SUCCESS", {
        x: 1,
        y: 2.2,
        w: 4,
        h: 0.5,
        fontSize: 16,
        bold: true,
        color: "#2E7D32"
    });


    successes.forEach((text, i) => {
        slide.addText("✅ " + text, {
            x: 1,
            y: 2.8 + (i * 0.6),
            w: 4,
            h: 0.5,
            fontSize: 12,
            color: "#333333"
        });
    });


    // ===============================
    // RIGHT COLUMN (CHALLENGES)
    // ===============================
    slide.addText("CHALLENGES", {
        x: 5.5,
        y: 2.2,
        w: 4,
        h: 0.5,
        fontSize: 16,
        bold: true,
        color: "#C62828"
    });


    challenges.forEach((text, i) => {
        slide.addText("⚠️ " + text, {
            x: 5.5,
            y: 2.8 + (i * 0.6),
            w: 4,
            h: 0.5,
            fontSize: 12,
            color: "#333333"
        });
    });
}

function renderExecutiveCards(slide, slideData, pptx) {
    Logger.info(slideData.slideNumber, `=> Executing [renderExecutiveCards]`);
    let items = deduplicateItems((slideData.gridItems || slideData.content || []).map(pt => typeof pt === 'string' ? { heading: "Insight", text: pt } : pt)).slice(0, 5);
    if (items.length === 0) { renderStandardContent(slide, slideData, pptx); return; }


    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 3.2, w: '100%', h: 2.4, fill: { color: "F4F5F7" } });
   
    // 🔥 BUG FIXED: oval -> ellipse
    slide.addShape(pptx.ShapeType.ellipse, { x: 2.5, y: -2.0, w: 5.0, h: 4.0, fill: { color: themeColors.primary } });
   
    slide.addText((slideData.title || "EXECUTIVE SUMMARY").toUpperCase(), { x: 2.5, y: 0.5, w: 5.0, h: 1.0, fontSize: 26, bold: true, color: "FFFFFF", align: "center", wrap: true });


    const cardW = (9.0 - ((items.length >= 4 ? 0.15 : 0.3) * (items.length - 1))) / items.length;
    const icons = ["🎯", "💰", "⚙️", "🤝", "📈"];
   
    items.forEach((item, i) => {
        let cX = 0.5 + i * (cardW + (items.length >= 4 ? 0.15 : 0.3));
        slide.addShape(pptx.ShapeType.roundRect, { x: cX, y: 2.0, w: cardW, h: 2.8, fill: { color: "FFFFFF" }, line: { color: "EAEAEA", width: 1 }, rectRadius: 0.05, shadow: { type: 'outer', color: 'D3D3D3', blur: 5, offset: 3, angle: 45 } });
        slide.addText(icons[i % icons.length], { x: cX, y: 2.1, w: cardW, h: 0.4, align: "center", fontSize: 24 });
        slide.addText(smartWrap(item.heading, 25), { x: cX + 0.1, y: 2.6, w: cardW - 0.2, h: 0.6, fontSize: 10, bold: true, color: themeColors.textDark, align: "center", wrap: true });
        slide.addText(smartWrap(item.text, 90), { x: cX + 0.1, y: 3.25, w: cardW - 0.2, h: 1.2, fontSize: 9, color: "555555", align: "center", valign: "top", wrap: true, lineSpacing: 14 });
        slide.addShape(pptx.ShapeType.rect, { x: cX + (cardW / 2) - 0.3, y: 4.6, w: 0.6, h: 0.03, fill: { color: themeColors.primary } });
    });
}

function renderAccentureRedPillars(slide, slideData, pptx) {
    Logger.info(slideData.slideNumber, `=> Executing [renderAccentureRedPillars]`);
    let items = deduplicateItems((slideData.processItems || slideData.gridItems || slideData.content || []).map(pt => typeof pt === 'string' ? { heading: "Step", text: pt } : pt)).slice(0, 5);
    if (items.length === 0) { renderStandardContent(slide, slideData, pptx); return; }


    const colW = 9.0 / items.length;
    slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.6, w: 9.0, h: 3.6, fill: { color: themeColors.primary } });


    items.forEach((item, i) => {
        let cX = 0.5 + (i * colW);
        if (i > 0) slide.addShape(pptx.ShapeType.line, { x: cX, y: 1.8, w: 0, h: 3.2, line: { color: "FFFFFF", width: 1, dashType: "dash" }, opacity: 0.5 });
        let circleW = 0.6; let circleX = cX + (colW / 2) - (circleW / 2);
       
        // 🔥 BUG FIXED: oval -> ellipse
        slide.addShape(pptx.ShapeType.ellipse, { x: circleX, y: 1.8, w: circleW, h: circleW, fill: { color: "FFFFFF" } });
       
        slide.addText(`0${i + 1}`, { x: circleX, y: 1.8, w: circleW, h: circleW, fontSize: 16, bold: true, color: themeColors.primary, align: "center", valign: "middle" });
        slide.addShape(pptx.ShapeType.triangle, { x: circleX + 0.15, y: 2.4, w: 0.3, h: 0.2, fill: { color: "FFFFFF" }, flipV: true });
        slide.addText(smartWrap(item.heading || item.title, 22), { x: cX + 0.1, y: 2.7, w: colW - 0.2, h: 0.6, fontSize: 12, bold: true, color: "FFFFFF", align: "center", wrap: true });
        slide.addText(smartWrap(item.text || item.impact, 80), { x: cX + 0.1, y: 3.4, w: colW - 0.2, h: 1.6, fontSize: 10, color: "FFFFFF", align: "center", valign: "top", wrap: true, lineSpacing: 14 });
    });
}

function renderAccentureDataGrid(slide, slideData, pptx) {
    Logger.info(slideData.slideNumber, `=> Executing [renderAccentureDataGrid]`);
    let items = deduplicateItems((slideData.gridItems || slideData.content || []).map(pt => typeof pt === 'string' ? { heading: "Item", text: pt } : pt)).slice(0, 4);
    if (items.length === 0) { renderStandardContent(slide, slideData, pptx); return; }


    // 🔥 BUG FIXED: oval -> ellipse
    slide.addShape(pptx.ShapeType.ellipse, { x: 1.0, y: -2.5, w: 8.0, h: 4.0, fill: { color: themeColors.primary } });
   
    slide.addText(slideData.title || "Data Volume", { x: 1.5, y: 0.4, w: 7.0, h: 0.8, fontSize: 24, bold: true, color: "FFFFFF", align: "center", wrap: true });


    items.forEach((item, i) => {
        let rowY = 1.8 + i * 0.9;
        slide.addShape(pptx.ShapeType.rect, { x: 1.5, y: rowY, w: 2.0, h: 0.8, fill: { color: themeColors.primary } });
        slide.addText((item.heading || "").toUpperCase(), { x: 1.5, y: rowY, w: 2.0, h: 0.8, fontSize: 12, bold: true, color: "FFFFFF", align: "center", valign: "middle" });
        slide.addShape(pptx.ShapeType.rect, { x: 3.6, y: rowY, w: 5.0, h: 0.8, fill: { color: "FFFFFF" }, line: { color: "E0E0E0", width: 1 } });
        slide.addText(item.text, { x: 3.8, y: rowY, w: 4.6, h: 0.8, fontSize: 11, color: themeColors.textDark, align: "left", valign: "middle", wrap: true });
        slide.addShape(pptx.ShapeType.rightArrow, { x: 3.4, y: rowY + 0.3, w: 0.2, h: 0.2, fill: { color: themeColors.textDark } });
    });
}

//done for SMART AGENDA ENGINE
// ==========================================
// 💎 PREMIUM INFOGRAPHIC: CHEVRON FLOW (ELITE VERSION - MAX 5)
// ==========================================
function renderPremiumProcessFlow(slide, slideData, pptx) {
    Logger.info(slideData.slideNumber, `=> Executing [renderPremiumProcessFlow] (ELITE)`);


    let items = deduplicateItems(
        (slideData.processItems || slideData.content || [])
        .map(pt => typeof pt === 'string' ? { heading: "Phase", text: pt } : pt)
    );


    // 🔥 FIX: Locked to max 5 items for the ultimate premium breathable UI
    const maxItems = Math.min(items.length, 5);
    items = items.slice(0, maxItems);


    if (items.length === 0) {
        renderStandardContent(slide, slideData, pptx);
        return;
    }


    // ===============================
    // 🔥 AUTO WIDTH + SAFETY
    // ===============================
    const gap = 0.08;
    const startX = 0.4;
    const availableW = 9.2;


    let rawBoxW = (availableW - (gap * (maxItems - 1))) / maxItems;


    // 🔥 Prevent collapse
    const minWidth = 1.4;
    const boxW = Math.max(rawBoxW, minWidth);


    // ===============================
    // POSITION
    // ===============================
    const startY = 1.6;
    const boxH = 1.0;
    const connectorH = 0.3;


    const textStartY = startY + boxH + connectorH + 0.1;
    const textBoxH = maxItems >= 5 ? 0.9 : 1.2;


    // ===============================
    // 🎨 PREMIUM COLORS
    // ===============================
    const gradientColors = [
        themeColors.primary,
        "E53935",
        "EF5350",
        "F48FB1",
        "B0BEC5",
        "CFD8DC"
    ];


    items.forEach((step, i) => {


        let currX = startX + i * (boxW + gap);


        // ===============================
        // CHEVRON
        // ===============================
        slide.addShape(pptx.ShapeType.chevron, {
            x: currX,
            y: startY,
            w: boxW,
            h: boxH,
            fill: {
                color: i === 0 ? themeColors.primary : gradientColors[i]
            },
            shadow: {
                type: 'outer',
                blur: 4,
                offset: 1,
                angle: 45,
                color: '000000',
                opacity: 0.1
            }
        });


        // ===============================
        // NUMBER (FIXED POSITION)
        // ===============================
        let numSize = boxW < 1.6 ? 20 : 26;


        slide.addText(`0${i + 1}`, {
            x: currX + 0.15,
            y: startY,
            w: 0.4,
            h: boxH,
            fontSize: numSize,
            bold: true,
            color: "FFFFFF",
            align: "center",
            valign: "middle"
        });


        // ===============================
        // HEADING
        // ===============================
        let headSize = boxW < 1.6 ? 8 : 10;


        let safeHeading = smartWrap(
            (step.heading || step.title || "PHASE").toUpperCase(),
            18
        );


        slide.addText(safeHeading, {
            x: currX + 0.5,
            y: startY,
            w: boxW - 0.6,
            h: boxH,
            fontSize: headSize,
            bold: true,
            color: "FFFFFF",
            align: "left",
            valign: "middle",
            wrap: true
        });


        // ===============================
        // CONNECTOR
        // ===============================
        slide.addShape(pptx.ShapeType.line, {
            x: currX + (boxW / 2),
            y: startY + boxH,
            w: 0,
            h: connectorH,
            line: {
                color: "B0BEC5",
                width: 1.5,
                transparency: 30
            }
        });


        // ===============================
        // DESCRIPTION
        // ===============================
        let textSize = boxW < 1.6 ? 9 : 11;


        let safeText = smartWrap(
            step.text || step.impact || step.description,
            60
        );


        slide.addText(safeText, {
            x: currX,
            y: textStartY,
            w: boxW - 0.1,
            h: textBoxH,
            fontSize: textSize,
            color: themeColors.textDark,
            align: "center",
            valign: "top",
            wrap: true,
            lineSpacing: 14
        });
    });
}

//DONE
// ==========================================
// 💎 THE GRAND FINALE: CONCLUSION SLIDE
// ==========================================
function renderConclusionSlide(slide, slideData, pptx) {
    Logger.info(slideData.slideNumber, `=> Executing [renderConclusionSlide]`);
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 3.5, h: '100%', fill: { color: themeColors.primary } });
    slide.addShape(pptx.ShapeType.rect, { x: 3.5, y: 0, w: 6.5, h: '100%', fill: { color: "F4F5F7" } });
   slide.addText((slideData.title || "Conclusion").toUpperCase(), {
    x: 0.5,
    y: 1.7,
    w: 2.8,        // 🔥 1.4 NAHI, 2.8 RAKH!
    h: 1.5,
    fontSize: 30,  
    bold: true,
    color: "FFFFFF",
    align: "left",
    letterSpacing: 2,
    valign: "middle",
    wrap: true,    // 🔥 WRAP TRUE RAKH, WARNA CUT JAYEGA!
    autoFit: true  // 🔥 YEH BHI ZAROORI HAI
});
    slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 3.6, w: 1.0, h: 0.05, fill: { color: themeColors.accent } });


    const safeContent = deduplicateItems((slideData.content || []).map(extractText)).filter(it => it.length > 2).slice(0, 3);
    if (safeContent.length > 0) {
        slide.addText("KEY TAKEAWAYS & ACTION ITEMS", { x: 4.2, y: 1.2, w: 5.0, h: 0.5, fontSize: 14, bold: true, color: themeColors.primary, letterSpacing: 1 });
        safeContent.forEach((text, i) => {
            let rowY = 2.0 + (i * 1.2);
           
            // 🔥 BUG FIXED: oval -> ellipse
            slide.addShape(pptx.ShapeType.ellipse, { x: 4.2, y: rowY + 0.1, w: 0.35, h: 0.35, fill: { color: themeColors.primary } });
           
            slide.addText("✓", { x: 4.2, y: rowY + 0.1, w: 0.35, h: 0.35, fontSize: 14, bold: true, color: "FFFFFF", align: "center", valign: "middle" });
            slide.addText(smartWrap(text, 115), { x: 4.8, y: rowY, w: 4.5, h: 0.8, fontSize: 14, color: themeColors.textDark, valign: "top", wrap: true, lineSpacing: 22 });
        });
    } else {
        slide.addText("Ready for Execution.", { x: 4.2, y: 2.5, w: 5.0, h: 1.5, fontSize: 54, bold: true, color: themeColors.textDark, align: "center", valign: "middle" });
    }
}


// ==========================================
// 🚀 MAIN EXECUTION ENGINE (THE $10K EXECUTIVE UPGRADE)
// ==========================================
export const generatePPTX = async (slidesJSON, fileName = "EZ_Presentation.pptx") => {
    Logger.divider(); Logger.info("SYSTEM", `Generating ${slidesJSON.length} slides.`); Logger.divider();
    let pptx = new pptxgen();
   
    const bgPaths = {
        title: path.resolve(`./${themeColors.bgFolder}/bg-title.png`),
        agenda: path.resolve(`./${themeColors.bgFolder}/bg-agenda.png`),
        standard: path.resolve(`./${themeColors.bgFolder}/bg-standard.png`),
        visual: path.resolve(`./${themeColors.bgFolder}/bg-visual.png`),
        conclusion: path.resolve(`./${themeColors.bgFolder}/bg-conclusion.png`)
    };


    pptx.defineSlideMaster({ title: "TITLE_MASTER", background: fs.existsSync(bgPaths.title) ? { path: bgPaths.title } : { color: "F8F9FA" } });
    pptx.defineSlideMaster({ title: "AGENDA_MASTER", background: fs.existsSync(bgPaths.agenda) ? { path: bgPaths.agenda } : { color: "FFFFFF" } });
    pptx.defineSlideMaster({ title: "STANDARD_MASTER", background: fs.existsSync(bgPaths.standard) ? { path: bgPaths.standard } : { color: "FFFFFF" } });
    pptx.defineSlideMaster({ title: "VISUAL_MASTER", background: fs.existsSync(bgPaths.visual) ? { path: bgPaths.visual } : { color: "FFFFFF" } });
    pptx.defineSlideMaster({ title: "CONCLUSION_MASTER", background: fs.existsSync(bgPaths.conclusion) ? { path: bgPaths.conclusion } : { color: "F8F9FA" } });
    pptx.defineSlideMaster({ title: "HERO_MASTER", background: { color: themeColors.primary } });


    const heroSlides = slidesJSON.filter(s => s.layoutType === "HeroSlide");
    const otherSlides = slidesJSON.filter(s => s.layoutType !== "HeroSlide");
    const finalSlidesJSON = [...otherSlides, ...heroSlides];


    finalSlidesJSON.forEach((slideData, index) => {
        slideData.slideNumber = slideData.slideNumber || (index + 1);
        let visualLayout = chooseVisualLayout(slideData);
        let masterTemplate = "STANDARD_MASTER";
       
        if (slideData.layoutType === "TitleSlide") masterTemplate = "TITLE_MASTER";
        else if (visualLayout === "AGENDA_SLIDE") masterTemplate = "AGENDA_MASTER";
        else if (["CHEVRON_FLOW", "TIMELINE_TRACKER", "CHART_SLIDE", "COMPARISON_SPLIT", "PREMIUM_GRID", "WOW_SLIDE", "EXECUTIVE_CARDS", "ACCENTURE_RED_PILLARS", "ACCENTURE_DATA_GRID"].includes(visualLayout)) masterTemplate = "VISUAL_MASTER";
        else if (slideData.layoutType === "HeroSlide") masterTemplate = "HERO_MASTER";
        else if (slideData.layoutType === "Conclusion") masterTemplate = "CONCLUSION_MASTER";


        let slide = pptx.addSlide({ masterName: masterTemplate });


        if (slideData.layoutType === "TitleSlide") {
            slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 3.5, h: '100%', fill: { color: themeColors.primary }, shadow: { type: "outer", color: "000000", blur: 8, offset: 3, angle: 45, opacity: 0.4 } });
           
            // 🔥 BUG FIXED: rightTriangle -> rtTriangle
            slide.addShape(pptx.ShapeType.rtTriangle, { x: 0, y: 0, w: 3.5, h: 2.5, fill: { color: "FFFFFF", transparency: 92 }, flipV: true });
           
            slide.addShape(pptx.ShapeType.rect, { x: 3.4, y: 0, w: 0.1, h: '100%', fill: { color: themeColors.accent } });
            slide.addShape(pptx.ShapeType.roundRect, { x: 3.8, y: 1.2, w: 5.8, h: 3.6, fill: { color: "000000", transparency: 70 }, rectRadius: 0.05, shadow: { type: "outer", color: "000000", blur: 6, offset: 2, angle: 45, opacity: 0.3 } });


            let titleText = slideData.title || "PROJECT TITAN:\nTHE ULTIMATE OVERHAUL";
            slide.addText(titleText.toUpperCase(), {
                x: 4.2, y: 1.5, w: 5.2, h: 2.0, fontSize: titleText.length > 30 ? 36 : 42,
                bold: true, color: "FFFFFF", align: "left", valign: "middle",
                wrap: true, autoFit: true, shadow: { type: "outer", color: "000000", blur: 3, offset: 1, angle: 45, opacity: 0.5 }
            });


            let fallbackSubtitle = "Driving scalable transformation in a high-growth environment.";
            let subtitleText = (slideData.subtitle && slideData.subtitle.length > 5 && !slideData.subtitle.toLowerCase().includes("chaos")) ? slideData.subtitle : fallbackSubtitle;
            slide.addText(subtitleText, { x: 4.2, y: 3.6, w: 5.0, h: 1.0, fontSize: 16, color: "EAEAEA", align: "left", valign: "top", wrap: true });


            let today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            slide.addText("✦", { x: 0.3, y: 0.5, w: 0.4, h: 0.5, fontSize: 24, color: themeColors.accent, align: "left" });
            slide.addText(`EZ AI AGENT`, { x: 0.7, y: 0.5, w: 2.5, h: 0.5, fontSize: 13, bold: true, color: "FFFFFF", align: "left", letterSpacing: 1 });
            slide.addText(`DATE: ${today}`, { x: 0.4, y: 4.4, w: 2.8, h: 0.3, fontSize: 10, bold: true, color: "FFFFFF", align: "left", letterSpacing: 1 });
            slide.addText(`STATUS: CONFIDENTIAL`, { x: 0.4, y: 4.7, w: 2.8, h: 0.3, fontSize: 10, bold: true, color: "FFCDD2", align: "left", letterSpacing: 1 });
        }
        else if (slideData.layoutType === "Conclusion") {
            renderConclusionSlide(slide, slideData, pptx);
        }
        else {
            // ==========================================
// 🧠 SMART TITLE CONTROL
// ==========================================
if (
    slideData.layoutType !== "HeroSlide" &&
    visualLayout !== "COMPARISON_SPLIT" && // 🔥 important
    visualLayout !== "PREMIUM_GRID"        // optional
) {
    slide.addText(slideData.title, {
        x: LAYOUT.marginX,
        y: 0.2,
        w: LAYOUT.maxW,
        h: 0.8,
        fontSize: 32,
        bold: true,
        color: themeColors.primary,
        valign: "top"
    });
}


        // ==========================================
        // 🔥 VISUAL RENDER ROUTING (CLEAN & FIXED)
        // ==========================================
        switch (visualLayout) {


    case "AGENDA_SLIDE":
        renderAgenda(slide, slideData, pptx);
        break;


    case "CHART_SLIDE":
        renderChart(slide, slideData, pptx);
        break;


    case "ACCENTURE_RED_PILLARS":
        renderAccentureRedPillars(slide, slideData, pptx);
        break;


    case "ACCENTURE_DATA_GRID":
        renderAccentureDataGrid(slide, slideData, pptx);
        break;


    case "EXECUTIVE_CARDS":
        renderExecutiveCards(slide, slideData, pptx);
        break;


    case "CHEVRON_FLOW":
    case "TIMELINE_TRACKER":
        renderPremiumProcessFlow(slide, slideData, pptx);
        break;


    // ✅ FIXED (separate functions)
    case "COMPARISON_SPLIT":
        renderComparisonSplit(slide, slideData, pptx);
        break;


    case "PREMIUM_GRID":
    renderCardGridSlide(slide, slideData, pptx);
    break;


    case "WOW_SLIDE":
        renderWowSlide(slide, slideData, pptx);
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
    Logger.success("SYSTEM", `File saved at: ${filePath}`);
    return filePath;
};


export { validateAndNormalizeChart, renderChart, renderPremiumProcessFlow as renderProcessFlow };

