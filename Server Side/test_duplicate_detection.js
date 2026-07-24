import { findPossibleDuplicates } from './services/duplicateDetection.js';
import dotenv from 'dotenv';

// Load env variables
dotenv.config();

const runDuplicateTests = async () => {
    console.log("🚀 Running Duplicate Detection Service tests...\n");

    // Mock Database Instance
    const mockDb = {
        collection: (collectionName) => {
            if (collectionName === 'issues') {
                return {
                    find: (query) => {
                        return {
                            toArray: async () => {
                                // Return mock existing reports that were submitted recently
                                return [
                                    {
                                        _id: "64bef7a8101a1c00222a0001",
                                        aiCategory: "Pothole",
                                        location: { address: "Dhanmondi Road 8, Dhaka" },
                                        aiSummaryEn: "There is a large pothole on Dhanmondi Road 8, near the mosque, which poses a risk of a serious accident.",
                                        description: "রাস্তায় বিশাল গর্ত হয়ে আছে, যেকোনো সময় বড় দুর্ঘটনা ঘটতে পারে। এটা ধানমন্ডি ৮ নম্বর রোডের মাথায়, মসজিদের পাশে।",
                                        createdAt: new Date()
                                    },
                                    {
                                        _id: "64bef7a8101a1c00222a0002",
                                        aiCategory: "Water Leak",
                                        location: { address: "Mirpur 10, Dhaka" },
                                        aiSummaryEn: "There is a water leak on the road in Mirpur 10, Dhaka, causing water to accumulate for several days and producing a bad smell.",
                                        description: "amader ekhane rasta te pani jome ache onek din dhore, main line a leak hoise bodhoy, khub baje gondho. location: mirpur 10 circle er kache.",
                                        createdAt: new Date()
                                    },
                                    {
                                        _id: "64bef7a8101a1c00222a0003",
                                        aiCategory: "Pothole",
                                        location: { address: "Gulshan 2, Dhaka" },
                                        aiSummaryEn: "A small pothole in Gulshan 2 is causing minor discomfort for drivers.",
                                        description: "Gulshan 2 e ekti choto gorto holeche rastay.",
                                        createdAt: new Date()
                                    }
                                ];
                            }
                        };
                    }
                };
            }
        }
    };

    // Test cases for new submissions
    const testSubmissions = [
        {
            name: "Confirmed Duplicate (Same area, category, and semantic summary)",
            report: {
                aiCategory: "Pothole",
                location: { address: "Dhanmondi Road 8, Dhaka" },
                aiSummaryEn: "A big pothole is on Dhanmondi Road 8, near the local mosque, making it dangerous for cars.",
                description: "Dhanmondi road 8 e boro gorto, masjid er pashe. Gari cholte somosha hocche."
            }
        },
        {
            name: "Possible Duplicate (Same category and high semantic similarity, but slightly different address string)",
            report: {
                aiCategory: "Water Leak",
                location: { address: "Mirpur Section 10, Dhaka" }, // Slightly different spelling
                aiSummaryEn: "Water leakage is reported near the Mirpur 10 roundabout. The street is flooded and smells bad.",
                description: "Mirpur 10 e rasta te pani jome ache, smelly water."
            }
        },
        {
            name: "Non-Duplicate (Different category or location)",
            report: {
                aiCategory: "Broken Streetlight",
                location: { address: "Dhanmondi Road 8, Dhaka" }, // Same location, different event
                aiSummaryEn: "Streetlights are broken on Dhanmondi Road 8, making it completely dark at night.",
                description: "Light kaj korche na Dhanmondi 8 e."
            }
        }
    ];

    for (const tc of testSubmissions) {
        console.log(`--------------------------------------------------`);
        console.log(`🧪 Test Case: ${tc.name}`);
        console.log(`📌 New Submission Category: "${tc.report.aiCategory}"`);
        console.log(`📍 New Submission Address: "${tc.report.location.address}"`);
        console.log(`📝 New Submission Summary: "${tc.report.aiSummaryEn}"`);
        console.log(`⏳ Scanning for duplicates...`);

        const duplicates = await findPossibleDuplicates(tc.report, mockDb);

        console.log(`\n🔍 Scan Result:`);
        if (duplicates.length === 0) {
            console.log("❌ No duplicates found.");
        } else {
            console.log(JSON.stringify(duplicates, null, 2));
        }
        console.log(`--------------------------------------------------\n`);
    }

    console.log("🏁 All tests completed.");
};

runDuplicateTests().catch(err => {
    console.error("Test execution failed:", err);
});
