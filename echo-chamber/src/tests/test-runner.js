/**
 * Comprehensive Test Suite for Echo Chamber
 * Tests all pattern types and edge cases
 */

import { SequenceDetector } from '../sequence-detector.js';

const tests = [];
let passed = 0;
let failed = 0;

/**
 * Test helper function
 */
function test(name, fn) {
    tests.push({ name, fn });
}

/**
 * Assert helper functions
 */
const assert = {
    equal: (actual, expected, message = '') => {
        if (actual !== expected) {
            throw new Error(`${message}\nExpected: ${expected}\nActual: ${actual}`);
        }
    },
    deepEqual: (actual, expected, message = '') => {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
        }
    },
    true: (value, message = '') => {
        if (value !== true) {
            throw new Error(`${message}\nExpected: true\nActual: ${value}`);
        }
    },
    false: (value, message = '') => {
        if (value !== false) {
            throw new Error(`${message}\nExpected: false\nActual: ${value}`);
        }
    },
    closeTo: (actual, expected, tolerance = 0.0001, message = '') => {
        if (Math.abs(actual - expected) > tolerance) {
            throw new Error(`${message}\nExpected: ${expected} (±${tolerance})\nActual: ${actual}`);
        }
    }
};

// ===== ARITHMETIC PROGRESSION TESTS =====

test('Arithmetic: Basic positive sequence', () => {
    const result = SequenceDetector.analyze([3, 6, 9, 12]);
    assert.true(result.success);
    assert.equal(result.type, 'arithmetic');
    assert.equal(result.prediction, 15);
    assert.equal(result.parameters.difference, 3);
});

test('Arithmetic: Negative difference', () => {
    const result = SequenceDetector.analyze([10, 7, 4, 1]);
    assert.true(result.success);
    assert.equal(result.type, 'arithmetic');
    assert.equal(result.prediction, -2);
    assert.equal(result.parameters.difference, -3);
});

test('Arithmetic: Zero difference (constant)', () => {
    const result = SequenceDetector.analyze([5, 5, 5, 5]);
    assert.true(result.success);
    assert.equal(result.type, 'arithmetic');
    assert.equal(result.prediction, 5);
    assert.equal(result.parameters.difference, 0);
});

test('Arithmetic: Decimal numbers', () => {
    const result = SequenceDetector.analyze([1.5, 2.0, 2.5, 3.0]);
    assert.true(result.success);
    assert.equal(result.type, 'arithmetic');
    assert.closeTo(result.prediction, 3.5);
    assert.closeTo(result.parameters.difference, 0.5);
});

test('Arithmetic: Large numbers', () => {
    const result = SequenceDetector.analyze([100, 200, 300, 400]);
    assert.true(result.success);
    assert.equal(result.type, 'arithmetic');
    assert.equal(result.prediction, 500);
    assert.equal(result.parameters.difference, 100);
});

test('Arithmetic: Negative numbers', () => {
    const result = SequenceDetector.analyze([-10, -5, 0, 5]);
    assert.true(result.success);
    assert.equal(result.type, 'arithmetic');
    assert.equal(result.prediction, 10);
    assert.equal(result.parameters.difference, 5);
});

test('Arithmetic: Two elements only', () => {
    const result = SequenceDetector.analyze([1, 3]);
    assert.true(result.success);
    assert.equal(result.type, 'arithmetic');
    assert.equal(result.prediction, 5);
});

// ===== GEOMETRIC PROGRESSION TESTS =====

test('Geometric: Basic sequence', () => {
    const result = SequenceDetector.analyze([2, 4, 8, 16]);
    assert.true(result.success);
    assert.equal(result.type, 'geometric');
    assert.equal(result.prediction, 32);
    assert.equal(result.parameters.ratio, 2);
});

test('Geometric: Fractional ratio', () => {
    const result = SequenceDetector.analyze([32, 16, 8, 4]);
    assert.true(result.success);
    assert.equal(result.type, 'geometric');
    assert.equal(result.prediction, 2);
    assert.equal(result.parameters.ratio, 0.5);
});

test('Geometric: Ratio of 3', () => {
    const result = SequenceDetector.analyze([2, 6, 18, 54]);
    assert.true(result.success);
    assert.equal(result.type, 'geometric');
    assert.equal(result.prediction, 162);
    assert.equal(result.parameters.ratio, 3);
});

test('Geometric: Negative ratio', () => {
    const result = SequenceDetector.analyze([1, -2, 4, -8]);
    assert.true(result.success);
    assert.equal(result.type, 'geometric');
    assert.equal(result.prediction, 16);
    assert.equal(result.parameters.ratio, -2);
});

test('Geometric: Decimal ratio', () => {
    const result = SequenceDetector.analyze([100, 110, 121, 133.1]);
    assert.true(result.success);
    assert.equal(result.type, 'geometric');
    assert.closeTo(result.prediction, 146.41, 0.01);
});

// ===== POLYNOMIAL SEQUENCE TESTS =====

test('Polynomial: Quadratic (squares)', () => {
    const result = SequenceDetector.analyze([1, 4, 9, 16, 25]);
    assert.true(result.success);
    assert.equal(result.type, 'polynomial');
    assert.equal(result.prediction, 36);
    assert.equal(result.parameters.degree, 2);
});

test('Polynomial: Cubic', () => {
    const result = SequenceDetector.analyze([1, 8, 27, 64, 125]);
    assert.true(result.success);
    assert.equal(result.type, 'polynomial');
    assert.equal(result.prediction, 216);
});

test('Polynomial: Triangular numbers', () => {
    const result = SequenceDetector.analyze([1, 3, 6, 10, 15]);
    assert.true(result.success);
    assert.equal(result.type, 'polynomial');
    assert.equal(result.prediction, 21);
});

test('Polynomial: Quadratic with offset', () => {
    const result = SequenceDetector.analyze([2, 5, 10, 17, 26]);
    assert.true(result.success);
    assert.equal(result.type, 'polynomial');
    assert.equal(result.prediction, 37);
});

// ===== MULTIPLE PREDICTIONS TEST =====

test('Multiple predictions: Arithmetic', () => {
    const result = SequenceDetector.predictMultiple([3, 6, 9], 5);
    assert.true(result.success);
    assert.equal(result.predictions.length, 5);
    assert.deepEqual(result.predictions, [12, 15, 18, 21, 24]);
});

test('Multiple predictions: Geometric', () => {
    const result = SequenceDetector.predictMultiple([2, 4, 8], 3);
    assert.true(result.success);
    assert.equal(result.predictions.length, 3);
    assert.deepEqual(result.predictions, [16, 32, 64]);
});

// ===== ERROR HANDLING TESTS =====

test('Error: Invalid input - not an array', () => {
    const result = SequenceDetector.analyze("not an array");
    assert.false(result.success);
    assert.equal(result.type, 'invalid');
});

test('Error: Empty array', () => {
    const result = SequenceDetector.analyze([]);
    assert.false(result.success);
});

test('Error: Single element', () => {
    const result = SequenceDetector.analyze([5]);
    assert.false(result.success);
});

test('Error: Contains NaN', () => {
    const result = SequenceDetector.analyze([1, NaN, 3]);
    assert.false(result.success);
});

test('Error: Contains non-number', () => {
    const result = SequenceDetector.analyze([1, "two", 3]);
    assert.false(result.success);
});

test('Error: Geometric with zero', () => {
    const result = SequenceDetector.analyze([1, 0, 2]);
    // Should not be detected as geometric, might be unknown
    assert.false(result.success || result.type !== 'geometric');
});

test('Error: No pattern detected', () => {
    const result = SequenceDetector.analyze([1, 2, 4, 7, 13]);
    assert.false(result.success);
    assert.equal(result.type, 'unknown');
});

// ===== EDGE CASE TESTS =====

test('Edge: Very large numbers', () => {
    const result = SequenceDetector.analyze([1e10, 2e10, 3e10]);
    assert.true(result.success);
    assert.equal(result.type, 'arithmetic');
    assert.equal(result.prediction, 4e10);
});

test('Edge: Very small numbers', () => {
    const result = SequenceDetector.analyze([0.001, 0.002, 0.003]);
    assert.true(result.success);
    assert.equal(result.type, 'arithmetic');
    assert.closeTo(result.prediction, 0.004);
});

test('Edge: Mixed positive and negative', () => {
    const result = SequenceDetector.analyze([-5, -2, 1, 4]);
    assert.true(result.success);
    assert.equal(result.type, 'arithmetic');
    assert.equal(result.prediction, 7);
});

test('Edge: Long sequence', () => {
    const sequence = [];
    for (let i = 1; i <= 100; i++) {
        sequence.push(i * 2);
    }
    const result = SequenceDetector.analyze(sequence);
    assert.true(result.success);
    assert.equal(result.type, 'arithmetic');
    assert.equal(result.prediction, 202);
});

// ===== RUN ALL TESTS =====

console.log('\n' + '═'.repeat(70));
console.log('🧪 Running Echo Chamber Test Suite');
console.log('═'.repeat(70) + '\n');

for (const { name, fn } of tests) {
    try {
        fn();
        console.log(`✅ PASS: ${name}`);
        passed++;
    } catch (error) {
        console.log(`❌ FAIL: ${name}`);
        console.log(`   ${error.message}\n`);
        failed++;
    }
}

console.log('\n' + '═'.repeat(70));
console.log(`📊 Test Results: ${passed} passed, ${failed} failed out of ${tests.length} total`);
console.log('═'.repeat(70));

if (failed === 0) {
    console.log('\n🎉 All tests passed! The Echo Chamber is working perfectly!\n');
    process.exit(0);
} else {
    console.log(`\n❌ ${failed} test(s) failed. Please review the errors above.\n`);
    process.exit(1);
}
