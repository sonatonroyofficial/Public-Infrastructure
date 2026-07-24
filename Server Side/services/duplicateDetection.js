import openai from '../config/openai.js';

/**
 * Compares two strings using the Dice Coefficient (bigram similarity).
 * This is a direct replacement for the deprecated `string-similarity` package.
 * Returns a value between 0 (no similarity) and 1 (identical).
 *
 * @param {string} first
 * @param {string} second
 * @returns {number} Similarity score between 0 and 1
 */
function compareTwoStrings(first, second) {
    const s1 = first.toLowerCase().trim();
    const s2 = second.toLowerCase().trim();
    if (s1 === s2) return 1;
    if (s1.length < 2 || s2.length < 2) return 0;

    const getBigrams = (str) => {
        const bigrams = new Map();
        for (let i = 0; i < str.length - 1; i++) {
            const bigram = str.substring(i, i + 2);
            bigrams.set(bigram, (bigrams.get(bigram) || 0) + 1);
        }
        return bigrams;
    };

    const bigrams1 = getBigrams(s1);
    const bigrams2 = getBigrams(s2);

    let intersectionSize = 0;
    for (const [bigram, count] of bigrams1) {
        const count2 = bigrams2.get(bigram) || 0;
        intersectionSize += Math.min(count, count2);
    }

    return (2.0 * intersectionSize) / (s1.length + s2.length - 2);
}

// Configuration for duplicate detection time window in hours
const TIME_WINDOW_HOURS = Number(process.env.DUPLICATE_TIME_WINDOW_HOURS) || 48;

/**
 * Calculates the cosine similarity between two vectors.
 *
 * @param {Array<number>} vecA
 * @param {Array<number>} vecB
 * @returns {number} Cosine similarity score between -1 and 1
 */
function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Fetches text embeddings using OpenAI text-embedding-3-small model.
 * 
 * @param {string} text 
 * @returns {Promise<Array<number>>} The embedding vector
 */
async function getEmbedding(text) {
    try {
        const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: text
        });
        return response.data[0].embedding;
    } catch (error) {
        console.error("❌ OpenAI Embeddings Error:", error.message);
        throw error;
    }
}

/**
 * Scans recent reports in the database to identify possible duplicate submissions.
 * 
 * @param {Object} newReport The report currently being submitted.
 * @param {Object} db The MongoDB database instance.
 * @returns {Promise<Array<{reportId: string, confidence: number, reason: string}>>} List of possible duplicates.
 */
export async function findPossibleDuplicates(newReport, db) {
    if (!db) {
        console.warn("⚠️ Warning: Database instance not provided to findPossibleDuplicates. Skipping scan.");
        return [];
    }

    try {
        // Query reports submitted within the configurable time window (default 48 hours)
        const timeLimit = new Date(Date.now() - TIME_WINDOW_HOURS * 60 * 60 * 1000);
        
        const candidates = await db.collection('issues').find({
            createdAt: { $gte: timeLimit }
        }).toArray();

        const possibleDuplicates = [];
        let newSummaryEmbedding = null;

        for (const candidate of candidates) {
            // Do not compare against itself if the report is already saved
            if (newReport._id && candidate._id.toString() === newReport._id.toString()) {
                continue;
            }

            // 1. LOCATION: Fuzzy string similarity on locationAddress
            const newAddress = newReport.location?.address || '';
            const candAddress = candidate.location?.address || '';

            // PHASE 3.5 PLACEHOLDER: Will be upgraded to real latitude/longitude geocoding calculation later.
            const locSimilarity = compareTwoStrings(
                newAddress.toLowerCase().trim(),
                candAddress.toLowerCase().trim()
            );
            const isLocationMatch = locSimilarity > 0.6;

            // 2. TIME: Already guaranteed by MongoDB query filter.
            const isTimeMatch = true;

            // 3. CATEGORY: Match exact AI categories
            const isCategoryMatch = newReport.aiCategory === candidate.aiCategory;

            // Pre-filtering: Only perform expensive embedding calls if location is a match.
            if (!isLocationMatch) {
                continue;
            }

            // Lazy fetch embedding for the new report's summary
            if (!newSummaryEmbedding) {
                const newTextToEmbed = newReport.aiSummaryEn || newReport.description;
                newSummaryEmbedding = await getEmbedding(newTextToEmbed);
            }

            // Fetch embedding for candidate summary
            const candTextToEmbed = candidate.aiSummaryEn || candidate.description;
            let candSummaryEmbedding;
            try {
                candSummaryEmbedding = await getEmbedding(candTextToEmbed);
            } catch (err) {
                console.error(`Skipping candidate ${candidate._id} due to embedding failure.`);
                continue;
            }

            // Calculate semantic similarity
            const semanticSimilarity = cosineSimilarity(newSummaryEmbedding, candSummaryEmbedding);
            const isSemanticMatch = semanticSimilarity > 0.85;

            // Calculate Duplicate Confidence & Status
            let duplicateConfidence = 0;
            let duplicateStatus = 'none';
            const reasons = [];

            // Strong match tracker
            let strongMatches = 0;
            if (isLocationMatch) {
                strongMatches++;
                reasons.push(`Location is very close (address match: ${(locSimilarity * 100).toFixed(0)}%)`);
            }
            if (isCategoryMatch) {
                strongMatches++;
                reasons.push(`Same issue category (${candidate.aiCategory})`);
            }
            if (isSemanticMatch) {
                strongMatches++;
                reasons.push(`High semantic similarity of description (${(semanticSimilarity * 100).toFixed(0)}%)`);
            }

            // Decision Engine:
            // - All three matches -> 0.85 to 1.0 -> confirmed_duplicate
            // - Two strong matches -> 0.5 to 0.84 -> possible_duplicate
            // - Otherwise -> none
            if (isLocationMatch && isCategoryMatch && isSemanticMatch) {
                duplicateConfidence = Math.max(0.85, (locSimilarity * 0.4) + (semanticSimilarity * 0.6));
                duplicateStatus = 'confirmed_duplicate';
            } else if (strongMatches >= 2) {
                duplicateConfidence = (locSimilarity * 0.4) + (semanticSimilarity * 0.6);
                // Normalize duplicateConfidence between 0.5 and 0.84
                duplicateConfidence = Math.min(0.84, Math.max(0.5, duplicateConfidence));
                duplicateStatus = 'possible_duplicate';
            }

            if (duplicateStatus !== 'none') {
                possibleDuplicates.push({
                    reportId: candidate._id.toString(),
                    confidence: Number(duplicateConfidence.toFixed(2)),
                    duplicateStatus: duplicateStatus,
                    reason: reasons.join(', ')
                });
            }
        }

        // Sort results by highest confidence descending
        return possibleDuplicates.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
        console.error("❌ Error in findPossibleDuplicates:", error);
        return [];
    }
}
