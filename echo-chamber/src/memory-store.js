/**
 * Memory Store for historical sequence analysis
 * Provides analytics and statistics on processed sequences
 */

export class MemoryStore {
    constructor() {
        this.memories = [];
        this.stats = {
            totalProcessed: 0,
            byType: {},
            averageConfidence: 0,
            successRate: 0
        };
    }

    /**
     * Store a new sequence analysis result
     * @param {object} result - Analysis result from SequenceDetector
     * @returns {object} - Stored memory with ID
     */
    store(result) {
        const memory = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            result: result,
            sequence: result.sequence || [],
            type: result.type || 'unknown',
            success: result.success || false
        };

        this.memories.push(memory);
        this.updateStats();

        return memory;
    }

    /**
     * Retrieve all stored memories
     * @returns {array} - All memories
     */
    getAll() {
        return this.memories;
    }

    /**
     * Retrieve memories by type
     * @param {string} type - Sequence type (arithmetic, geometric, polynomial)
     * @returns {array} - Filtered memories
     */
    getByType(type) {
        return this.memories.filter(m => m.type === type);
    }

    /**
     * Get recent memories
     * @param {number} count - Number of recent memories to retrieve
     * @returns {array} - Recent memories
     */
    getRecent(count = 10) {
        return this.memories.slice(-count).reverse();
    }

    /**
     * Get statistics about stored sequences
     * @returns {object} - Statistics object
     */
    getStats() {
        return this.stats;
    }

    /**
     * Update statistics after adding new memory
     */
    updateStats() {
        this.stats.totalProcessed = this.memories.length;
        
        // Count by type
        this.stats.byType = {};
        let totalConfidence = 0;
        let successCount = 0;

        this.memories.forEach(memory => {
            const type = memory.type;
            this.stats.byType[type] = (this.stats.byType[type] || 0) + 1;
            
            if (memory.result.confidence) {
                totalConfidence += memory.result.confidence;
            }
            
            if (memory.success) {
                successCount++;
            }
        });

        this.stats.averageConfidence = this.memories.length > 0 
            ? totalConfidence / this.memories.length 
            : 0;
        
        this.stats.successRate = this.memories.length > 0 
            ? successCount / this.memories.length 
            : 0;
    }

    /**
     * Analyze patterns across all stored sequences
     * @returns {object} - Pattern analysis
     */
    analyzePatterns() {
        const analysis = {
            mostCommonType: null,
            averageSequenceLength: 0,
            sequenceLengthRange: { min: Infinity, max: 0 },
            typeDistribution: {},
            trends: []
        };

        if (this.memories.length === 0) {
            return analysis;
        }

        // Calculate average sequence length
        let totalLength = 0;
        this.memories.forEach(memory => {
            const length = memory.sequence.length;
            totalLength += length;
            analysis.sequenceLengthRange.min = Math.min(analysis.sequenceLengthRange.min, length);
            analysis.sequenceLengthRange.max = Math.max(analysis.sequenceLengthRange.max, length);
        });

        analysis.averageSequenceLength = totalLength / this.memories.length;

        // Find most common type
        let maxCount = 0;
        Object.entries(this.stats.byType).forEach(([type, count]) => {
            analysis.typeDistribution[type] = {
                count: count,
                percentage: (count / this.memories.length * 100).toFixed(2) + '%'
            };
            
            if (count > maxCount) {
                maxCount = count;
                analysis.mostCommonType = type;
            }
        });

        // Analyze recent trends
        const recent = this.getRecent(10);
        const recentTypes = recent.map(m => m.type);
        analysis.trends = this.identifyTrends(recentTypes);

        return analysis;
    }

    /**
     * Identify trends in recent sequence types
     * @param {array} types - Array of recent sequence types
     * @returns {array} - Identified trends
     */
    identifyTrends(types) {
        const trends = [];
        
        if (types.length < 3) {
            return trends;
        }

        // Check for consecutive same types
        let currentType = types[0];
        let count = 1;

        for (let i = 1; i < types.length; i++) {
            if (types[i] === currentType) {
                count++;
            } else {
                if (count >= 3) {
                    trends.push(`Streak of ${count} ${currentType} sequences`);
                }
                currentType = types[i];
                count = 1;
            }
        }

        if (count >= 3) {
            trends.push(`Current streak of ${count} ${currentType} sequences`);
        }

        return trends;
    }

    /**
     * Clear all memories
     */
    clear() {
        this.memories = [];
        this.stats = {
            totalProcessed: 0,
            byType: {},
            averageConfidence: 0,
            successRate: 0
        };
    }

    /**
     * Export memories to JSON
     * @returns {string} - JSON string of all memories
     */
    export() {
        return JSON.stringify({
            memories: this.memories,
            stats: this.stats,
            exportDate: new Date().toISOString()
        }, null, 2);
    }

    /**
     * Generate unique ID for memory
     * @returns {string} - Unique ID
     */
    generateId() {
        return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
