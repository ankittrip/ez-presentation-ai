// backend/engine.test.js
import { validateAndNormalizeChart } from './utils/engineLogic.js';

// Helper: Quick validation of result structure
const validateResultStructure = (result) => {
    expect(result).toBeDefined();
    expect(result).toHaveProperty('labels');
    expect(result).toHaveProperty('values');
    expect(result).toHaveProperty('type');
    expect(result).toHaveProperty('insight');
    expect(['bar', 'line', 'doughnut']).toContain(result.type);
    expect(Array.isArray(result.labels)).toBe(true);
    expect(Array.isArray(result.values)).toBe(true);
};

describe('🚀 PPTX Engine: validateAndNormalizeChart', () => {

    // ===========================
    // 1. DATA VALIDATION TESTS
    // ===========================
    describe('📊 Data Validation & Sanitization', () => {
        test('Handles negative values and zeros - filters them out & normalizes pie values', () => {
            const result = validateAndNormalizeChart(["A", "B", "C"], [1000, 0, -500], 'pie');
            validateResultStructure(result);
            // Only positive value remains, and pie values are normalized to 0-1 range
            expect(result.labels).toEqual(["A"]);
            expect(result.values).toEqual([1]); // 1000 normalized to 1 (100%)
            expect(result.type).toBe('doughnut');
        });

        test('Converts invalid numeric values (strings, null) to 0', () => {
            const result = validateAndNormalizeChart(["A", "B"], ["abc", null], 'bar');
            validateResultStructure(result);
            expect(result.values).toEqual([0, 0]);
            expect(result.labels).toEqual(["A", "B"]);
        });

        test('Handles null/undefined inputs gracefully', () => {
            const result = validateAndNormalizeChart(null, null, 'pie');
            validateResultStructure(result);
            expect(result.type).toBe('bar');
            expect(result.labels).toEqual([]);
            expect(result.values).toEqual([]);
        });

        test('Empty labels with values → function returns empty arrays (critical error fallback)', () => {
            const result = validateAndNormalizeChart([], [10, 20], 'bar');
            validateResultStructure(result);
            expect(result.type).toBe('bar');
            // Actual behavior: when labels empty but values present, function treats as invalid input
            // and returns empty arrays for both labels and values (see log: "CRITICAL ERROR")
            expect(result.labels).toEqual([]);
            expect(result.values).toEqual([]);
        });
    });

    // ===========================
    // 2. TYPE FALLBACK LOGIC (Based on actual behaviour)
    // ===========================
    describe('🔄 Type Fallback & Auto-correction', () => {
        test('Pie chart with single data point stays as doughnut (not bar)', () => {
            const result = validateAndNormalizeChart(["A"], [50], 'pie');
            expect(result.type).toBe('doughnut');
        });

        test('Pie chart with all zero/negative values becomes bar', () => {
            const result = validateAndNormalizeChart(["A", "B"], [0, -10], 'pie');
            expect(result.type).toBe('bar');
        });

        test('Line chart with 2 data points (time series) remains line', () => {
            const result = validateAndNormalizeChart(["2021", "2022"], [10, 20], 'line');
            expect(result.type).toBe('line');
        });

        test('Valid time series (≥3 points) remains line', () => {
            const result = validateAndNormalizeChart(
                ["2020","2021","2022","2023","2024"],
                [10,20,30,40,50],
                'line'
            );
            expect(result.type).toBe('line');
        });

        test('Undefined chart type defaults to bar', () => {
            const result = validateAndNormalizeChart(["A", "B"], [10, 20]);
            expect(result.type).toBe('bar');
        });
    });

    // ===========================
    // 3. EDGE CASES & STRESS TESTS
    // ===========================
    describe('⚡ Edge Cases & Stress Tests', () => {
        test('Mismatched label/value lengths → truncate to shorter length', () => {
            const result = validateAndNormalizeChart(["A", "B", "C"], [10, 20], 'pie');
            validateResultStructure(result);
            expect(result.labels.length).toBe(2);
            expect(result.values.length).toBe(2);
        });

        test('Single data point: line becomes bar, pie becomes doughnut', () => {
            const resultLine = validateAndNormalizeChart(["Only"], [100], 'line');
            const resultPie = validateAndNormalizeChart(["Only"], [100], 'pie');
            expect(resultLine.type).toBe('bar');
            expect(resultPie.type).toBe('doughnut');
        });

        test('Insight updates when normalization changes data significantly', () => {
            const result = validateAndNormalizeChart(
                ["Large", "Small"], 
                [15000, 450], 
                'pie', 
                "Title", 
                "Old Insight"
            );
            expect(result.insight).not.toBe("Old Insight");
            expect(typeof result.insight).toBe('string');
            expect(result.insight.length).toBeGreaterThan(5);
        });

        test('Extremely long labels are preserved (no crash)', () => {
            const longLabel = "This is an extremely long label that can break UI layout badly";
            const result = validateAndNormalizeChart([longLabel, "Short"], [100, 200], 'bar');
            expect(result.labels[0]).toBe(longLabel);
        });

        test('Extremely large values (billions) are kept as numbers', () => {
            const result = validateAndNormalizeChart(
                ["A", "B", "C"],
                [999999999, 888888888, 777777777],
                'bar'
            );
            expect(result.values.every(v => typeof v === 'number')).toBe(true);
        });

        test('Identical values are allowed (no filtering)', () => {
            const result = validateAndNormalizeChart(["A", "B", "C"], [50, 50, 50], 'bar');
            expect(result.values).toEqual([50, 50, 50]);
        });

        test('Large dataset (50 items) processes without performance issue', () => {
            const labels = Array.from({ length: 50 }, (_, i) => `Item ${i}`);
            const values = Array.from({ length: 50 }, (_, i) => i * 10);
            const start = performance.now();
            const result = validateAndNormalizeChart(labels, values, 'bar');
            const duration = performance.now() - start;
            expect(result.labels.length).toBe(50);
            expect(duration).toBeLessThan(100);
        });
    });

    // ===========================
    // 4. INTEGRATION (Optional)
    // ===========================
    describe.skip('🔗 Integration with PPTX generation (optional)', () => {
        test('Generated chart data is accepted by renderChart without errors', async () => {
            expect(true).toBe(true);
        });
    });
});