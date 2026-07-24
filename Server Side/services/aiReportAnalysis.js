import openai from '../config/openai.js';

/**
 * Helper to call OpenAI Chat Completions with a basic retry on failure.
 */
async function callOpenAIWithRetry(params, retries = 1) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await openai.chat.completions.create(params);
        } catch (error) {
            console.error(`⚠️ OpenAI API call failed (attempt ${attempt + 1}/${retries + 1}):`, error.message);
            if (attempt === retries) {
                throw error;
            }
            // Delay 1 second before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

/**
 * Build the message content for the OpenAI call.
 * Tries to attach the base64 image. If the image is invalid/broken,
 * gracefully falls back to text-only and logs a warning.
 *
 * @param {string} textBlock  The formatted text block to send as the user message.
 * @param {string|null} photoData  Base64 data URI (data:image/...) or null.
 * @returns {{ content: any, usedVision: boolean }}
 */
function buildUserContent(textBlock, photoData) {
    if (photoData && typeof photoData === 'string' && photoData.startsWith('data:image')) {
        // Basic sanity check — ensure there is a non-trivial base64 payload
        const base64Part = photoData.split(',')[1] || '';
        if (base64Part.length > 100) {
            return {
                content: [
                    { type: 'text', text: textBlock },
                    {
                        type: 'image_url',
                        image_url: {
                            url: photoData,
                            detail: 'low' // low = faster & cheaper; still sufficient for damage classification
                        }
                    }
                ],
                usedVision: true
            };
        }
    }
    // Fall back to text-only
    return { content: textBlock, usedVision: false };
}

/**
 * The full system prompt used for ALL analysis calls.
 * Exported so callers can log/display it for verification.
 */
export const SYSTEM_PROMPT = `You are an AI assistant that analyzes citizen-submitted public infrastructure issue reports for a government dashboard. You receive raw text (in ANY language) and optionally an image of the issue.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INPUT RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Accept input in ANY language: Bangla (বাংলা), English, Banglish (Bengali written in Latin script), or any mix of all three within a single report.
2. Understand intent even if grammar is broken, spelling is poor, or the text is very short.
3. CROSS-CHECK: If an image is provided, analyze its visual content carefully. The image may reveal an issue type that the text does not make explicit (e.g. text says "problem on road" but image clearly shows fire). Visual evidence MUST influence your classification AND your severity score. A photo of visible fire, flooding, gas leak, or structural collapse should always raise severity to at least 8.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLASSIFICATION — aiCategory (FIXED ENUM)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Classify the issue into exactly ONE of the following fixed enum values. These are used for dashboard filters and statistics — never invent new enum values here.

• "Pothole"          — Road holes, craters, cracks, broken asphalt, bumpy/damaged road surface.
• "Water Leak"       — Leaking/burst water pipes, flooding caused by pipe failure, running water wastage, open manholes flooding.
• "Illegal Dumping"  — Trash piles, garbage accumulation, overflowing bins, discarded furniture or waste dumped on roadsides/public spaces.
• "Broken Streetlight" — Unlit lampposts, flickering/broken street bulbs, damaged light poles, dark streets due to electrical failure.
• "Damaged Footpath" — Cracked/broken sidewalks, loose paving tiles, sunken footpaths, pedestrian path blockages or collapse.
• "Other"            — Anything not fitting the above: fire, gas leak, fallen tree, flooding (non-pipe-related), structural collapse, wall damage, illegal construction, noise, etc.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SPECIFIC LABEL — specificIssueLabel (DYNAMIC)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Always produce a human-readable 2–4 word label:
• If aiCategory is "Other": generate a SPECIFIC label based on text + image evidence. Examples: "Fire Hazard", "Gas Leak", "Fallen Tree", "Road Flooding", "Wall Collapse", "Illegal Construction", "Noise Pollution", "Stray Animals", "Electrical Hazard", "Sewage Overflow".
• If aiCategory is NOT "Other": set specificIssueLabel to the same value as aiCategory (e.g. "Pothole", "Water Leak").
This field is what admins will READ on the dashboard — make it clear and actionable.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SEVERITY SCORING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Score 1–10 based on: immediate danger to people, scale of hazard, proximity to schools/hospitals/main roads, and VISUAL evidence of severity if image is provided.
• 1–3  → "Low"      (cosmetic/minor issue, no immediate danger)
• 4–6  → "Medium"   (needs attention soon, moderate inconvenience or limited risk)
• 7–8  → "High"     (significant public safety risk, affects mobility or utilities)
• 9–10 → "Critical" (immediate danger to life, e.g. visible fire, structural collapse, gas leak, deep flooding)

IMPORTANT: If the image shows visible flames, thick smoke, flooding, or structural collapse, the minimum severityScore is 8.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OTHER FIELDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• detectedLanguage: Detect the citizen's input language: "bn", "en", "banglish", or "mixed".
• aiSummaryEn: A short, clear, professional English summary (2–4 sentences) for government officials. Include what the issue is, where it is (if mentioned), and any visual evidence from the photo.
• severityReason: 1–2 sentences in English explaining the score. Mention visual evidence if it influenced the score.
• isIncomplete: true ONLY if the report is too vague to dispatch a field team (e.g. no location hint AND no photo, or text is just one generic word like "help" or "broken").
• missingInfoNote: If isIncomplete is true, state briefly what is missing. Otherwise set to null.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT — Respond with ONLY this JSON object (no extra text):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  "detectedLanguage": "bn" | "en" | "banglish" | "mixed",
  "aiCategory": "Pothole" | "Water Leak" | "Illegal Dumping" | "Broken Streetlight" | "Damaged Footpath" | "Other",
  "specificIssueLabel": "string (2–4 words, human-readable, actionable)",
  "aiCategoryConfidence": number (0.0–1.0),
  "aiSummaryEn": "string",
  "severityScore": number (1–10),
  "severityLabel": "Low" | "Medium" | "High" | "Critical",
  "severityReason": "string",
  "isIncomplete": boolean,
  "missingInfoNote": "string" | null
}`;

/**
 * Analyzes a raw issue report using OpenAI gpt-4o-mini in JSON mode.
 * Supports optional image input (base64 data URI) for vision-based classification.
 *
 * @param {string}      rawText         The raw text submitted by the citizen (any language).
 * @param {string}      locationAddress The user-submitted location address string.
 * @param {string|null} photoData       Base64 data URI (data:image/...) or null/undefined.
 * @returns {Promise<Object>}           Normalized analysis result matching the schema.
 */
export async function analyzeReport(rawText, locationAddress, photoData) {
    // Guard: empty text
    if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
        return {
            detectedLanguage: 'en',
            aiCategory: 'Other',
            specificIssueLabel: 'Unknown Issue',
            aiCategoryConfidence: 0,
            aiSummaryEn: 'Empty report description submitted.',
            severityScore: 1,
            severityLabel: 'Low',
            severityReason: 'Report contains no description text.',
            isIncomplete: true,
            missingInfoNote: 'Description text is missing.'
        };
    }

    const textBlock = `Raw Report Text: "${rawText}"
Location Address Provided: "${locationAddress || 'Not specified'}"
Has Photo Uploaded: ${photoData ? 'Yes' : 'No'}`;

    // Attempt vision-enabled call first; fall back to text-only if image is bad
    const { content: primaryContent, usedVision } = buildUserContent(textBlock, photoData);

    try {
        const result = await runAnalysisCall(primaryContent);
        if (usedVision) {
            console.log(`[AI Analysis] Vision call succeeded for report.`);
        }
        return normalizeResult(result, rawText);
    } catch (visionError) {
        // If vision call failed AND we were using an image, retry text-only (req #4)
        if (usedVision) {
            console.warn(`[AI Analysis] Vision call failed, falling back to text-only. Error: ${visionError.message}`);
            try {
                const fallbackResult = await runAnalysisCall(textBlock);
                return normalizeResult(fallbackResult, rawText);
            } catch (textError) {
                console.error('❌ Text-only fallback also failed:', textError.message);
                return buildErrorFallback(rawText);
            }
        }
        console.error('❌ Error in AI Report Analysis Service:', visionError);
        return buildErrorFallback(rawText);
    }
}

/**
 * Executes a single OpenAI Chat Completions call with the given content.
 * @param {string|Array} content  The user message content (text string OR vision array).
 * @returns {Promise<Object>}     Parsed JSON result from OpenAI.
 */
async function runAnalysisCall(content) {
    const response = await callOpenAIWithRetry({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content }
        ],
        temperature: 0.1
    });

    const rawJsonString = response.choices[0].message.content;
    return JSON.parse(rawJsonString);
}

/**
 * Normalize & validate the raw JSON from OpenAI into a safe, typed output.
 * Falls back gracefully if any field is missing or wrong type.
 */
function normalizeResult(result, rawText) {
    const FIXED_CATEGORIES = ['Pothole', 'Water Leak', 'Illegal Dumping', 'Broken Streetlight', 'Damaged Footpath', 'Other'];
    const SEVERITY_LABELS = ['Low', 'Medium', 'High', 'Critical'];
    const LANGUAGES = ['bn', 'en', 'banglish', 'mixed'];

    const aiCategory = FIXED_CATEGORIES.includes(result.aiCategory) ? result.aiCategory : 'Other';

    // specificIssueLabel: if the AI returned one, use it; otherwise fall back sensibly
    let specificIssueLabel = (typeof result.specificIssueLabel === 'string' && result.specificIssueLabel.trim())
        ? result.specificIssueLabel.trim()
        : aiCategory; // fall back to the category name itself

    return {
        detectedLanguage: LANGUAGES.includes(result.detectedLanguage) ? result.detectedLanguage : 'mixed',
        aiCategory,
        specificIssueLabel,
        aiCategoryConfidence: Math.min(1, Math.max(0, Number(result.aiCategoryConfidence) || 0)),
        aiSummaryEn: typeof result.aiSummaryEn === 'string' ? result.aiSummaryEn : '',
        severityScore: Math.min(10, Math.max(1, Number(result.severityScore) || 5)),
        severityLabel: SEVERITY_LABELS.includes(result.severityLabel) ? result.severityLabel : 'Medium',
        severityReason: typeof result.severityReason === 'string' ? result.severityReason : '',
        isIncomplete: !!result.isIncomplete,
        missingInfoNote: (typeof result.missingInfoNote === 'string' && result.missingInfoNote) ? result.missingInfoNote : null
    };
}

/**
 * Safe error fallback returned when ALL OpenAI calls fail.
 * Ensures report submission never crashes.
 */
function buildErrorFallback(rawText) {
    return {
        detectedLanguage: 'mixed',
        aiCategory: 'Other',
        specificIssueLabel: 'Analysis Failed',
        aiCategoryConfidence: 0,
        aiSummaryEn: `AI Analysis failed. Raw text: "${rawText.substring(0, 100)}..."`,
        severityScore: 5,
        severityLabel: 'Medium',
        severityReason: 'AI analysis failed due to an API error or network issue. Assigned medium severity for manual review.',
        isIncomplete: true,
        missingInfoNote: 'System error: OpenAI analysis failed. Needs manual admin verification.'
    };
}
