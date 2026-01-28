/**
 * Echo Chamber Web Application - Frontend JavaScript
 * Handles UI interactions, API calls, and visualizations
 */

// State management
const state = {
    currentChart: null,
    memories: [],
    stats: {}
};

// API base URL
const API_BASE = '/api';

/**
 * Initialize the application
 */
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    loadStats();
    loadMemories();
});

/**
 * Set up all event listeners
 */
function initializeEventListeners() {
    // Analyze button
    document.getElementById('analyzeBtn').addEventListener('click', analyzeSequence);

    // Enter key on input
    document.getElementById('sequenceInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') analyzeSequence();
    });

    // Example buttons
    document.querySelectorAll('.btn-example').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const sequence = e.target.dataset.sequence;
            document.getElementById('sequenceInput').value = sequence;
            analyzeSequence();
        });
    });

    // Memory controls
    document.getElementById('refreshMemories').addEventListener('click', loadMemories);
    document.getElementById('clearMemories').addEventListener('click', clearMemories);
    document.getElementById('exportMemories').addEventListener('click', exportMemories);

    // About modal
    const modal = document.getElementById('aboutModal');
    const aboutLink = document.getElementById('aboutLink');
    const closeModal = document.querySelector('.close');

    aboutLink.addEventListener('click', (e) => {
        e.preventDefault();
        modal.style.display = 'block';
    });

    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

/**
 * Analyze the entered sequence
 */
async function analyzeSequence() {
    const input = document.getElementById('sequenceInput').value.trim();
    
    if (!input) {
        showError('Please enter a sequence');
        return;
    }

    // Parse sequence
    const sequence = input.split(',').map(s => {
        const num = parseFloat(s.trim());
        if (isNaN(num)) {
            throw new Error('Invalid number in sequence');
        }
        return num;
    });

    try {
        showLoading();

        const predictMultiple = document.getElementById('predictMultiple').checked;
        const predictCount = parseInt(document.getElementById('predictCount').value) || 5;

        let result;
        if (predictMultiple) {
            result = await apiCall('/predict-multiple', 'POST', { sequence, count: predictCount });
        } else {
            result = await apiCall('/analyze', 'POST', { sequence });
        }

        displayResults(result);
        loadStats();
        loadMemories();

    } catch (error) {
        showError(error.message);
    }
}

/**
 * Display analysis results
 */
function displayResults(result) {
    const resultsSection = document.getElementById('resultsSection');
    const resultContent = document.getElementById('resultContent');

    resultsSection.style.display = 'block';

    if (!result.success) {
        resultContent.innerHTML = `
            <div class="result-item error">
                <div class="result-label">❌ Error</div>
                <div class="result-value">${result.error}</div>
            </div>
        `;
        return;
    }

    let html = `
        <div class="result-item success">
            <div class="result-label">Pattern Type</div>
            <div class="result-value">✨ ${result.pattern}</div>
        </div>
        
        <div class="result-item success">
            <div class="result-label">Formula</div>
            <div class="result-value" style="font-family: monospace; font-size: 1em;">${result.formula}</div>
        </div>

        <div class="prediction-highlight">
            🔊 Next Number: <strong>${formatNumber(result.prediction)}</strong>
        </div>
    `;

    // Show parameters
    if (result.type === 'arithmetic') {
        html += `
            <div class="result-item">
                <div class="result-label">Common Difference</div>
                <div class="result-value">${formatNumber(result.parameters.difference)}</div>
            </div>
        `;
    } else if (result.type === 'geometric') {
        html += `
            <div class="result-item">
                <div class="result-label">Common Ratio</div>
                <div class="result-value">${formatNumber(result.parameters.ratio)}</div>
            </div>
        `;
    } else if (result.type === 'polynomial') {
        html += `
            <div class="result-item">
                <div class="result-label">Polynomial Degree</div>
                <div class="result-value">${result.parameters.degree}</div>
            </div>
        `;
    }

    // Show multiple predictions if available
    if (result.predictions && result.predictions.length > 0) {
        html += `
            <div class="result-item">
                <div class="result-label">Next ${result.predictions.length} Terms</div>
                <div class="result-value">[${result.predictions.map(formatNumber).join(', ')}]</div>
            </div>
        `;
    }

    html += `
        <div class="result-item">
            <div class="result-label">Confidence</div>
            <div class="result-value">${(result.confidence * 100).toFixed(0)}%</div>
        </div>
    `;

    resultContent.innerHTML = html;

    // Draw chart
    drawChart(result);
}

/**
 * Draw visualization chart
 */
function drawChart(result) {
    const canvas = document.getElementById('sequenceChart');
    const ctx = canvas.getContext('2d');

    // Destroy previous chart
    if (state.currentChart) {
        state.currentChart.destroy();
    }

    const sequence = result.sequence;
    const labels = sequence.map((_, i) => `Term ${i + 1}`);
    const data = [...sequence];

    // Add prediction(s)
    if (result.predictions) {
        result.predictions.forEach((pred, i) => {
            labels.push(`Prediction ${i + 1}`);
            data.push(pred);
        });
    } else {
        labels.push('Prediction');
        data.push(result.prediction);
    }

    state.currentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Sequence Values',
                data: data,
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                borderWidth: 3,
                pointRadius: 6,
                pointBackgroundColor: data.map((_, i) => 
                    i < sequence.length ? '#8b5cf6' : '#f59e0b'
                ),
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: {
                        color: '#e9d5ff',
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(45, 36, 56, 0.95)',
                    titleColor: '#e9d5ff',
                    bodyColor: '#e9d5ff',
                    borderColor: '#8b5cf6',
                    borderWidth: 1
                }
            },
            scales: {
                y: {
                    ticks: {
                        color: '#e9d5ff'
                    },
                    grid: {
                        color: 'rgba(139, 92, 246, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#e9d5ff'
                    },
                    grid: {
                        color: 'rgba(139, 92, 246, 0.1)'
                    }
                }
            }
        }
    });
}

/**
 * Load and display statistics
 */
async function loadStats() {
    try {
        const stats = await apiCall('/stats', 'GET');
        const analysis = await apiCall('/analysis', 'GET');

        state.stats = stats;

        let html = '';

        if (stats.totalProcessed === 0) {
            html = '<p class="loading">No sequences analyzed yet...</p>';
        } else {
            html = `
                <div class="stats-grid">
                    <div class="stat-card">
                        <span class="stat-value">${stats.totalProcessed}</span>
                        <span class="stat-label">Total Sequences</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">${(stats.successRate * 100).toFixed(0)}%</span>
                        <span class="stat-label">Success Rate</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">${(stats.averageConfidence * 100).toFixed(0)}%</span>
                        <span class="stat-label">Avg Confidence</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">${analysis.mostCommonType || 'N/A'}</span>
                        <span class="stat-label">Most Common</span>
                    </div>
                </div>

                <div style="margin-top: 20px;">
                    <h3>Type Distribution</h3>
                    <div class="stats-grid" style="margin-top: 15px;">
            `;

            Object.entries(analysis.typeDistribution || {}).forEach(([type, data]) => {
                html += `
                    <div class="stat-card">
                        <span class="stat-value">${data.count}</span>
                        <span class="stat-label">${type} (${data.percentage})</span>
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;

            if (analysis.trends && analysis.trends.length > 0) {
                html += `
                    <div style="margin-top: 20px;">
                        <h3>📈 Recent Trends</h3>
                        <ul style="margin-left: 20px; margin-top: 10px;">
                            ${analysis.trends.map(trend => `<li>${trend}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }
        }

        document.getElementById('statsContent').innerHTML = html;

    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

/**
 * Load and display memories
 */
async function loadMemories() {
    try {
        const memories = await apiCall('/memories/recent', 'GET');
        state.memories = memories;

        let html = '';

        if (memories.length === 0) {
            html = '<p class="loading">No memories recorded yet...</p>';
        } else {
            memories.forEach(memory => {
                const typeIcon = getTypeIcon(memory.type);
                const timestamp = new Date(memory.timestamp).toLocaleString();
                
                html += `
                    <div class="memory-item">
                        <div class="memory-header">
                            <span class="memory-type">${typeIcon} ${memory.type}</span>
                            <span class="memory-time">${timestamp}</span>
                        </div>
                        <div class="memory-sequence">
                            Sequence: [${memory.sequence.join(', ')}]
                        </div>
                        ${memory.result.prediction ? `
                            <div class="memory-sequence">
                                Prediction: <strong style="color: #f59e0b;">${formatNumber(memory.result.prediction)}</strong>
                            </div>
                        ` : ''}
                    </div>
                `;
            });
        }

        document.getElementById('memoriesContent').innerHTML = html;

    } catch (error) {
        console.error('Failed to load memories:', error);
    }
}

/**
 * Clear all memories
 */
async function clearMemories() {
    if (!confirm('Are you sure you want to clear all memories?')) {
        return;
    }

    try {
        await apiCall('/memories/clear', 'POST');
        loadMemories();
        loadStats();
        showSuccess('Memories cleared successfully');
    } catch (error) {
        showError('Failed to clear memories');
    }
}

/**
 * Export memories to JSON file
 */
async function exportMemories() {
    try {
        const data = await apiCall('/memories/export', 'GET');
        
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `echo-chamber-memories-${new Date().toISOString()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showSuccess('Memories exported successfully');
    } catch (error) {
        showError('Failed to export memories');
    }
}

/**
 * Make API call
 */
async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
    }

    const response = await fetch(API_BASE + endpoint, options);
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'API request failed');
    }

    // Handle text responses (like export)
    if (endpoint === '/memories/export') {
        return await response.text();
    }

    return await response.json();
}

/**
 * Utility functions
 */
function formatNumber(num) {
    if (Number.isInteger(num)) {
        return num.toString();
    }
    return num.toFixed(2);
}

function getTypeIcon(type) {
    const icons = {
        arithmetic: '➕',
        geometric: '✖️',
        polynomial: '📈',
        unknown: '❓',
        invalid: '❌'
    };
    return icons[type] || '🔮';
}

function showLoading() {
    const resultContent = document.getElementById('resultContent');
    resultContent.innerHTML = '<p class="loading">🔮 Analyzing sequence...</p>';
    document.getElementById('resultsSection').style.display = 'block';
}

function showError(message) {
    const resultContent = document.getElementById('resultContent');
    resultContent.innerHTML = `
        <div class="result-item error">
            <div class="result-label">❌ Error</div>
            <div class="result-value">${message}</div>
        </div>
    `;
    document.getElementById('resultsSection').style.display = 'block';
}

function showSuccess(message) {
    // Could implement a toast notification here
    console.log('Success:', message);
}
