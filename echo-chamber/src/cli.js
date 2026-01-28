/**
 * Command Line Interface for Echo Chamber
 * Provides terminal-based access to sequence analysis
 */

import readline from 'readline';
import { SequenceDetector } from './sequence-detector.js';
import { MemoryStore } from './memory-store.js';

const memoryStore = new MemoryStore();

/**
 * Display the Echo Chamber story
 */
function displayStory() {
    console.log('\n' + '═'.repeat(70));
    console.log('🏰  Welcome to the Echo Chamber of Echo Castle! 🏰');
    console.log('═'.repeat(70));
    console.log('\nThe magical chamber echoes with ancient wisdom...\n');
    console.log('Perched atop the highest hill, overlooking the kingdom, stands the');
    console.log('majestic Echo Castle. Within its stone walls lies the Echo Room,');
    console.log('a chamber with the mystic power to echo numbers in sequence.\n');
    console.log('Legends tell of a wizard who enchanted this chamber to test the');
    console.log('intellect of visitors. Only those who can predict the next echo');
    console.log('are deemed worthy of the castle\'s hidden treasures.\n');
    console.log('═'.repeat(70) + '\n');
}

/**
 * Display analysis results
 */
function displayResults(result) {
    if (!result.success) {
        console.log('\n❌ The chamber remains silent...');
        console.log(`   Error: ${result.error}\n`);
        return;
    }

    console.log('\n✨ Analyzing the echo sequence...');
    console.log(`   Sequence: [${result.sequence.join(', ')}]`);
    console.log(`   Pattern: ${result.pattern}`);
    console.log(`   Formula: ${result.formula}`);
    console.log('\n🔊 The chamber echoes the next number: ' + result.prediction);
    console.log(`   Confidence: ${(result.confidence * 100).toFixed(0)}%`);
    console.log('\n🎉 Success! You have predicted the chamber\'s echo!');
    console.log(`   The treasure awaits those who can see the pattern...\n`);
}

/**
 * Display statistics
 */
function displayStats() {
    const stats = memoryStore.getStats();
    const analysis = memoryStore.analyzePatterns();

    console.log('\n' + '═'.repeat(70));
    console.log('📊 Chamber Statistics');
    console.log('═'.repeat(70) + '\n');

    console.log(`Total Sequences Processed: ${stats.totalProcessed}`);
    console.log(`Success Rate: ${(stats.successRate * 100).toFixed(2)}%`);
    console.log(`Average Confidence: ${(stats.averageConfidence * 100).toFixed(2)}%`);

    if (Object.keys(stats.byType).length > 0) {
        console.log('\nBy Type:');
        Object.entries(stats.byType).forEach(([type, count]) => {
            console.log(`  ${type}: ${count}`);
        });
    }

    if (analysis.mostCommonType) {
        console.log(`\nMost Common Pattern: ${analysis.mostCommonType}`);
    }

    console.log('\n' + '═'.repeat(70) + '\n');
}

/**
 * Interactive mode
 */
async function interactiveMode() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

    displayStory();

    let continueLoop = true;

    while (continueLoop) {
        console.log('Choose an option:');
        console.log('1. Analyze a sequence');
        console.log('2. Predict multiple terms');
        console.log('3. View statistics');
        console.log('4. View recent memories');
        console.log('5. Exit\n');

        const choice = await question('Enter your choice (1-5): ');

        switch (choice.trim()) {
            case '1': {
                const input = await question('\nEnter a sequence of numbers (comma-separated): ');
                try {
                    const sequence = input.split(',').map(num => {
                        const parsed = parseFloat(num.trim());
                        if (isNaN(parsed)) throw new Error('Invalid number');
                        return parsed;
                    });

                    const result = SequenceDetector.analyze(sequence);
                    memoryStore.store(result);
                    displayResults(result);
                } catch (error) {
                    console.log('\n❌ Invalid input. Please enter numbers separated by commas.\n');
                }
                break;
            }

            case '2': {
                const input = await question('\nEnter a sequence of numbers (comma-separated): ');
                const countInput = await question('How many terms to predict? (default 5): ');
                const count = parseInt(countInput) || 5;

                try {
                    const sequence = input.split(',').map(num => {
                        const parsed = parseFloat(num.trim());
                        if (isNaN(parsed)) throw new Error('Invalid number');
                        return parsed;
                    });

                    const result = SequenceDetector.predictMultiple(sequence, count);
                    memoryStore.store(result);
                    displayResults(result);

                    if (result.predictions) {
                        console.log(`\n📈 Next ${count} predictions: [${result.predictions.join(', ')}]\n`);
                    }
                } catch (error) {
                    console.log('\n❌ Invalid input. Please enter numbers separated by commas.\n');
                }
                break;
            }

            case '3':
                displayStats();
                break;

            case '4': {
                const memories = memoryStore.getRecent(10);
                console.log('\n' + '═'.repeat(70));
                console.log('📜 Recent Memories');
                console.log('═'.repeat(70) + '\n');

                if (memories.length === 0) {
                    console.log('No memories recorded yet.\n');
                } else {
                    memories.forEach((memory, i) => {
                        console.log(`${i + 1}. [${memory.sequence.join(', ')}]`);
                        console.log(`   Type: ${memory.type}`);
                        if (memory.result.prediction) {
                            console.log(`   Prediction: ${memory.result.prediction}`);
                        }
                        console.log(`   Time: ${new Date(memory.timestamp).toLocaleString()}\n`);
                    });
                }
                break;
            }

            case '5':
                console.log('\n🏰 Thank you for visiting the Echo Chamber!');
                console.log('   May the wisdom of the echoes guide your path...\n');
                continueLoop = false;
                break;

            default:
                console.log('\n❌ Invalid choice. Please enter 1-5.\n');
        }
    }

    rl.close();
}

// Run CLI
interactiveMode().catch(console.error);
