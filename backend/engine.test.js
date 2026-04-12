// backend/engine.test.js
import { validateAndNormalizeChart } from './utils/engineLogic.js';

describe('🚀 PPTX Engine: Chart Normalization (Final + UI Stress Tests)', () => {


    test('Handles negative values and zeros', () => {
        const result = validateAndNormalizeChart(["A", "B", "C"], [1000, 0, -500], 'pie');
        expect(result.labels).toEqual(["A"]);
        expect(result.type).toBe('doughnut');
    });


    test('Fallback for empty data', () => {
        const result = validateAndNormalizeChart([], [], 'pie');
        expect(result.type).toBe('bar');
        expect(result.values).toEqual([]);
    });


    test('Mismatch between labels and values', () => {
        const result = validateAndNormalizeChart(["A", "B", "C"], [10, 20], 'pie');
        expect(result.type).toBe('bar');
    });


    test('Updates insight when normalization triggers', () => {
        const result = validateAndNormalizeChart(
            ["Large", "Small"], 
            [15000, 450], 
            'pie', 
            "Title", 
            "Old Insight"
        );
        expect(result.insight).not.toBe("Old Insight");
    });


    test('Handles invalid numeric values', () => {
        const result = validateAndNormalizeChart(["A", "B"], ["abc", null], 'bar');
        expect(result.values).toEqual([0, 0]);
    });


    test('Short revenue line becomes bar', () => {
        const result = validateAndNormalizeChart(["2021", "2022"], [10, 20], 'line', 'Revenue');
        expect(result.type).toBe('bar');
    });


    test('All values filtered out for pie', () => {
        const result = validateAndNormalizeChart(["A", "B"], [0, -5], 'pie');
        expect(result.type).toBe('bar');
    });

    test('Handles null inputs safely', () => {
        const result = validateAndNormalizeChart(null, null, 'pie');
        expect(result.type).toBe('bar');
    });


    test('Defaults to bar when type is undefined', () => {
        const result = validateAndNormalizeChart(["A", "B"], [10, 20]);
        expect(result.type).toBe('bar');
    });


    test('Handles empty labels with values', () => {
        const result = validateAndNormalizeChart([], [10, 20], 'bar');
        expect(result.type).toBe('bar');
    });

    test('Valid time series remains line', () => {
        const result = validateAndNormalizeChart(
            ["2020","2021","2022","2023","2024","2025"],
            [10,20,30,40,50,60],
            'line',
            'Growth'
        );
        expect(result.type).toBe('line');
    });

    test('Handles extremely long labels without crash', () => {
        const result = validateAndNormalizeChart(
            [
                "This is an extremely long label that can break UI layout badly",
                "Another very very long label to test overflow handling in charts"
            ],
            [100, 200],
            'bar'
        );

        expect(result.labels.length).toBe(2);
    });

  
    test('Handles extremely large values safely', () => {
        const result = validateAndNormalizeChart(
            ["A", "B", "C"],
            [999999999, 888888888, 777777777],
            'bar'
        );

        expect(result.values.length).toBe(3);
    });

  
    test('Handles single data point correctly', () => {
        const result = validateAndNormalizeChart(
            ["Only One"],
            [100],
            'line'
        );

        expect(result.type).toBe('bar');
    });

  
    test('Handles identical values correctly', () => {
        const result = validateAndNormalizeChart(
            ["A", "B", "C"],
            [50, 50, 50],
            'bar'
        );

        expect(result.values).toEqual([50, 50, 50]);
    });

   
    test('Handles large dataset without crash', () => {
        const labels = Array.from({ length: 50 }, (_, i) => `Item ${i}`);
        const values = Array.from({ length: 50 }, (_, i) => i * 10);

        const result = validateAndNormalizeChart(labels, values, 'bar');

        expect(result.labels.length).toBe(50);
    });

});