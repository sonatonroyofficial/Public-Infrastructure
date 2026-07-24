import { ObjectId } from 'mongodb';
import { analyzeReport } from './aiReportAnalysis.js';
import { findPossibleDuplicates } from './duplicateDetection.js';
import { geocodeAddress } from './geocoding.js';

/**
 * Background async pipeline for AI processing and duplicate detection.
 * 
 * @param {string} reportId 
 * @param {string} title 
 * @param {string} description 
 * @param {string} locationAddress 
 * @param {string|null} photoData 
 * @param {string} userSelectedCategory 
 * @param {Object} db 
 */
export async function processReportAI(reportId, title, description, locationAddress, photoData, userSelectedCategory, db) {
    try {
        const rawText = `${title} ${description}`;
        
        // Step 1: Run AI analysis with optional base64 photo data
        const aiResult = await analyzeReport(rawText, locationAddress, photoData);

        // Map AI Category to DB Category keys
        const categoryMap = {
            "Pothole": "pothole",
            "Water Leak": "water_leakage",
            "Illegal Dumping": "garbage",
            "Broken Streetlight": "streetlight",
            "Damaged Footpath": "footpath",
            "Other": "other"
        };

        const mappedCategory = categoryMap[aiResult.aiCategory] || "other";

        // Category is purely determined by the AI
        let finalCategory = mappedCategory;

        // Step 2: Run Geocoding & District Resolution
        let existingLat = null;
        let existingLng = null;
        try {
            const currentDoc = await db.collection('issues').findOne({ _id: new ObjectId(reportId) });
            if (currentDoc && currentDoc.location) {
                existingLat = currentDoc.location.latitude;
                existingLng = currentDoc.location.longitude;
            }
        } catch (e) {
            // Ignore error
        }

        const geoResult = await geocodeAddress(locationAddress, existingLat, existingLng);

        // Prepare the update payload
        const updateData = {
            category: finalCategory,
            originalText: rawText,
            detectedLanguage: aiResult.detectedLanguage,
            aiCategory: aiResult.aiCategory,
            specificIssueLabel: aiResult.specificIssueLabel || aiResult.aiCategory,
            aiCategoryConfidence: aiResult.aiCategoryConfidence,
            aiSummaryEn: aiResult.aiSummaryEn,
            severityScore: aiResult.severityScore,
            severityLabel: aiResult.severityLabel,
            severityReason: aiResult.severityReason,
            isIncomplete: aiResult.isIncomplete,
            missingInfoNote: aiResult.missingInfoNote,
            latitude: geoResult.latitude,
            longitude: geoResult.longitude,
            district: geoResult.district,
            geocodingStatus: geoResult.geocodingStatus,
            location: {
                address: locationAddress,
                latitude: geoResult.latitude,
                longitude: geoResult.longitude
            },
            aiProcessedAt: new Date(),
            aiProcessingStatus: 'done'
        };

        // Construct a mock document of this report to check for duplicates
        const tempReport = {
            _id: new ObjectId(reportId),
            category: finalCategory,
            aiCategory: aiResult.aiCategory,
            aiSummaryEn: aiResult.aiSummaryEn,
            location: { address: locationAddress },
            description: description
        };

        // Step 3: Run Duplicate Detection
        const duplicates = await findPossibleDuplicates(tempReport, db);
        if (duplicates && duplicates.length > 0) {
            const bestMatch = duplicates[0];
            updateData.duplicateOf = new ObjectId(bestMatch.reportId);
            updateData.duplicateConfidence = bestMatch.confidence;
            updateData.duplicateStatus = bestMatch.duplicateStatus;
        } else {
            updateData.duplicateOf = null;
            updateData.duplicateConfidence = null;
            updateData.duplicateStatus = 'none';
        }

        // Step 4: Save final AI results back to MongoDB
        await db.collection('issues').updateOne(
            { _id: new ObjectId(reportId) },
            { $set: updateData }
        );
        console.log(`[AI Pipeline] Success for report: ${reportId}`);
    } catch (error) {
        console.error(`[AI Pipeline] Failed for report ${reportId}:`, error);
        
        // Save fallback failure status
        try {
            await db.collection('issues').updateOne(
                { _id: new ObjectId(reportId) },
                { 
                    $set: { 
                        aiProcessingStatus: 'failed',
                        aiCategory: 'Other',
                        severityLabel: 'Medium',
                        isIncomplete: true,
                        missingInfoNote: "System error: OpenAI analysis failed. Needs manual admin review."
                    } 
                }
            );
        } catch (dbErr) {
            console.error("Critical: Failed to save fallback status to DB:", dbErr);
        }
    }
}
