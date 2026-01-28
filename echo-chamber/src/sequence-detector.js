/**
 * Advanced Sequence Detection Engine
 * Supports arithmetic, geometric, and polynomial progressions
 */

export class SequenceDetector {
    /**
     * Analyzes a sequence and determines its pattern type
     * @param {number[]} sequence - Array of numbers to analyze
     * @returns {object} - Detection result with pattern type and parameters
     */
    static analyze(sequence) {
        if (!Array.isArray(sequence) || sequence.length < 2) {
            return { 
                success: false, 
                error: 'Sequence must be an array with at least 2 elements',
                type: 'invalid'
            };
        }

        if (sequence.some(num => typeof num !== 'number' || isNaN(num))) {
            return { 
                success: false, 
                error: 'All elements must be valid numbers',
                type: 'invalid'
            };
        }

        // Try patterns in order of complexity
        const arithmeticResult = this.detectArithmetic(sequence);
        if (arithmeticResult.isValid) return arithmeticResult;

        const geometricResult = this.detectGeometric(sequence);
        if (geometricResult.isValid) return geometricResult;

        const polynomialResult = this.detectPolynomial(sequence);
        if (polynomialResult.isValid) return polynomialResult;

        return {
            success: false,
            error: 'Unable to detect a valid pattern in the sequence',
            type: 'unknown',
            sequence: sequence
        };
    }

    /**
     * Detects arithmetic progression (constant difference)
     * @param {number[]} sequence - Array of numbers
     * @returns {object} - Detection result
     */
    static detectArithmetic(sequence) {
        const differences = [];
        for (let i = 1; i < sequence.length; i++) {
            differences.push(sequence[i] - sequence[i - 1]);
        }

        const avgDifference = differences.reduce((a, b) => a + b, 0) / differences.length;
        const isConstant = differences.every(d => Math.abs(d - avgDifference) < 0.0001);

        if (isConstant) {
            const next = sequence[sequence.length - 1] + avgDifference;
            return {
                success: true,
                isValid: true,
                type: 'arithmetic',
                pattern: 'Arithmetic Progression',
                parameters: {
                    difference: avgDifference,
                    firstTerm: sequence[0]
                },
                formula: `a(n) = ${sequence[0]} + ${avgDifference} * (n - 1)`,
                prediction: next,
                confidence: 1.0,
                sequence: sequence
            };
        }

        return { isValid: false };
    }

    /**
     * Detects geometric progression (constant ratio)
     * @param {number[]} sequence - Array of numbers
     * @returns {object} - Detection result
     */
    static detectGeometric(sequence) {
        // Check for zeros which would invalidate geometric progression
        if (sequence.some(n => n === 0)) {
            return { isValid: false };
        }

        const ratios = [];
        for (let i = 1; i < sequence.length; i++) {
            ratios.push(sequence[i] / sequence[i - 1]);
        }

        const avgRatio = ratios.reduce((a, b) => a + b, 0) / ratios.length;
        const isConstant = ratios.every(r => Math.abs(r - avgRatio) < 0.0001);

        if (isConstant && Math.abs(avgRatio) > 0.0001) {
            const next = sequence[sequence.length - 1] * avgRatio;
            return {
                success: true,
                isValid: true,
                type: 'geometric',
                pattern: 'Geometric Progression',
                parameters: {
                    ratio: avgRatio,
                    firstTerm: sequence[0]
                },
                formula: `a(n) = ${sequence[0]} * ${avgRatio}^(n - 1)`,
                prediction: next,
                confidence: 1.0,
                sequence: sequence
            };
        }

        return { isValid: false };
    }

    /**
     * Detects polynomial sequences (quadratic, cubic, etc.)
     * @param {number[]} sequence - Array of numbers
     * @returns {object} - Detection result
     */
    static detectPolynomial(sequence) {
        if (sequence.length < 4) {
            return { isValid: false };
        }

        // Calculate successive differences
        const diffLevels = [sequence];
        let currentLevel = sequence;
        let degree = 0;

        for (let level = 0; level < 5 && currentLevel.length > 1; level++) {
            const nextLevel = [];
            for (let i = 1; i < currentLevel.length; i++) {
                nextLevel.push(currentLevel[i] - currentLevel[i - 1]);
            }
            diffLevels.push(nextLevel);
            currentLevel = nextLevel;

            // Check if this level is constant
            if (nextLevel.length > 0) {
                const avg = nextLevel.reduce((a, b) => a + b, 0) / nextLevel.length;
                const isConstant = nextLevel.every(d => Math.abs(d - avg) < 0.0001);
                
                if (isConstant) {
                    degree = level + 1;
                    break;
                }
            }
        }

        if (degree > 0 && degree <= 4) {
            // Use the difference method to predict next value
            const prediction = this.predictFromDifferences(diffLevels);
            
            return {
                success: true,
                isValid: true,
                type: 'polynomial',
                pattern: `Polynomial Sequence (Degree ${degree})`,
                parameters: {
                    degree: degree,
                    differences: diffLevels
                },
                formula: `Polynomial of degree ${degree}`,
                prediction: prediction,
                confidence: 0.9,
                sequence: sequence
            };
        }

        return { isValid: false };
    }

    /**
     * Predicts next value using the method of differences
     * @param {number[][]} diffLevels - Array of difference levels
     * @returns {number} - Predicted next value
     */
    static predictFromDifferences(diffLevels) {
        // Work backwards from the constant difference level
        const extendedLevels = diffLevels.map(level => [...level]);
        
        // Find the deepest level (constant differences)
        for (let i = extendedLevels.length - 1; i > 0; i--) {
            const currentLevel = extendedLevels[i];
            const parentLevel = extendedLevels[i - 1];
            
            if (currentLevel.length > 0) {
                // Extend current level with last value (constant)
                const lastValue = currentLevel[currentLevel.length - 1];
                currentLevel.push(lastValue);
                
                // Use it to extend parent level
                const parentLastValue = parentLevel[parentLevel.length - 1];
                parentLevel.push(parentLastValue + lastValue);
            }
        }
        
        return extendedLevels[0][extendedLevels[0].length - 1];
    }

    /**
     * Predicts multiple future terms in the sequence
     * @param {number[]} sequence - Original sequence
     * @param {number} count - Number of terms to predict
     * @returns {object} - Prediction results
     */
    static predictMultiple(sequence, count = 5) {
        const analysis = this.analyze(sequence);
        
        if (!analysis.success) {
            return analysis;
        }

        const predictions = [];
        let currentSequence = [...sequence];

        for (let i = 0; i < count; i++) {
            const result = this.analyze(currentSequence);
            if (!result.success) break;
            
            predictions.push(result.prediction);
            currentSequence.push(result.prediction);
        }

        return {
            ...analysis,
            predictions: predictions,
            extendedSequence: currentSequence
        };
    }
}
