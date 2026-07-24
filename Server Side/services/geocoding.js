// Use global fetch available natively in Node 18+

// Standard 64 Bangladesh Districts for matching & normalization
const BD_DISTRICTS = [
    "Bagerhat", "Bandarban", "Barguna", "Barisal", "Bhola", "Bogra", "Brahmanbaria",
    "Chandpur", "Chattogram", "Chuadanga", "Comilla", "Cox's Bazar", "Dhaka",
    "Dinajpur", "Faridpur", "Feni", "Gaibandha", "Gazipur", "Gopalganj", "Habiganj",
    "Jamalpur", "Jessore", "Jhalokati", "Jhenaidah", "Joypurhat", "Khagrachhari",
    "Khulna", "Kishoreganj", "Kurigram", "Kushtia", "Lakshmipur", "Lalmonirhat",
    "Madaripur", "Magura", "Manikganj", "Meherpur", "Moulvibazar", "Munshiganj",
    "Mymensingh", "Naogaon", "Narail", "Narayanganj", "Narsingdi", "Natore",
    "Nawabganj", "Netrokona", "Nilphamari", "Noakhali", "Pabna", "Panchagarh",
    "Patuakhali", "Pirojpur", "Rajbari", "Rajshahi", "Rangamati", "Rangpur",
    "Satkhira", "Shariatpur", "Sherpur", "Sirajganj", "Sunamganj", "Sylhet",
    "Tangail", "Thakurgaon"
];

/**
 * Extracts and normalizes district name from OSM address details or raw string.
 * @param {Object|string} addressObj Or location string
 * @returns {string|null} District name
 */
function extractDistrict(addressObj, rawString = '') {
    if (!addressObj && !rawString) return null;

    if (typeof addressObj === 'object' && addressObj !== null) {
        const rawDistrict = addressObj.state_district || 
                            addressObj.district || 
                            addressObj.county || 
                            addressObj.city || 
                            addressObj.state || '';
        
        // Match against known districts
        for (const dist of BD_DISTRICTS) {
            if (rawDistrict.toLowerCase().includes(dist.toLowerCase())) {
                return dist;
            }
        }

        if (rawDistrict) {
            // Clean up common suffixes like " District" or " Zilla"
            return rawDistrict.replace(/ district/i, '').replace(/ zilla/i, '').trim();
        }
    }

    // Fallback: search raw address string for district match
    if (rawString) {
        for (const dist of BD_DISTRICTS) {
            if (rawString.toLowerCase().includes(dist.toLowerCase())) {
                return dist;
            }
        }
    }

    return null;
}

/**
 * Geocodes a free-text location address using OpenStreetMap Nominatim API.
 * 
 * @param {string} locationAddress Free text address
 * @param {number|null} existingLat Optional pre-existing latitude (e.g. from GPS)
 * @param {number|null} existingLng Optional pre-existing longitude (e.g. from GPS)
 * @returns {Promise<Object>} Geocoding result { latitude, longitude, district, geocodingStatus }
 */
export async function geocodeAddress(locationAddress, existingLat = null, existingLng = null) {
    // If coordinates already provided (e.g. via client GPS)
    if (existingLat && existingLng && Number(existingLat) !== 0 && Number(existingLng) !== 0) {
        const dist = extractDistrict(null, locationAddress);
        return {
            latitude: Number(existingLat),
            longitude: Number(existingLng),
            district: dist || "Dhaka",
            geocodingStatus: "success"
        };
    }

    if (!locationAddress || typeof locationAddress !== 'string' || !locationAddress.trim()) {
        return {
            latitude: null,
            longitude: null,
            district: null,
            geocodingStatus: "failed"
        };
    }

    try {
        // Construct Nominatim API URL (restricted to Bangladesh countrycodes=bd)
        const encodedQuery = encodeURIComponent(locationAddress.trim());
        const url = `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&addressdetails=1&countrycodes=bd&limit=1`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'InfraReport-App/1.0 (contact@infrareport.gov.bd)'
            }
        });

        if (!response.ok) {
            console.warn(`[Geocoding] Nominatim HTTP error: ${response.status}`);
            return {
                latitude: null,
                longitude: null,
                district: extractDistrict(null, locationAddress),
                geocodingStatus: "failed"
            };
        }

        const results = await response.json();

        if (Array.isArray(results) && results.length > 0) {
            const firstMatch = results[0];
            const lat = parseFloat(firstMatch.lat);
            const lon = parseFloat(firstMatch.lon);
            const dist = extractDistrict(firstMatch.address, locationAddress);

            return {
                latitude: isNaN(lat) ? null : lat,
                longitude: isNaN(lon) ? null : lon,
                district: dist || extractDistrict(null, locationAddress),
                geocodingStatus: (isNaN(lat) || isNaN(lon)) ? "failed" : "success"
            };
        }

        // If Nominatim returns empty array for precise query, try broader search with district extracted from text
        const matchedDistrict = extractDistrict(null, locationAddress);
        if (matchedDistrict) {
            const districtUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(matchedDistrict + ', Bangladesh')}&format=json&addressdetails=1&countrycodes=bd&limit=1`;
            const fallbackResponse = await fetch(districtUrl, {
                headers: {
                    'User-Agent': 'InfraReport-App/1.0 (contact@infrareport.gov.bd)'
                }
            });

            if (fallbackResponse.ok) {
                const fallbackResults = await fallbackResponse.json();
                if (Array.isArray(fallbackResults) && fallbackResults.length > 0) {
                    const fallbackMatch = fallbackResults[0];
                    return {
                        latitude: parseFloat(fallbackMatch.lat),
                        longitude: parseFloat(fallbackMatch.lon),
                        district: matchedDistrict,
                        geocodingStatus: "success"
                    };
                }
            }
        }

        return {
            latitude: null,
            longitude: null,
            district: matchedDistrict,
            geocodingStatus: "failed"
        };
    } catch (error) {
        console.error('[Geocoding] Service error:', error.message);
        return {
            latitude: null,
            longitude: null,
            district: extractDistrict(null, locationAddress),
            geocodingStatus: "failed"
        };
    }
}
