import { analyzeReport } from './services/aiReportAnalysis.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const runTests = async () => {
    console.log("🚀 Starting AI Report Analysis Service tests...\n");

    const testCases = [
        {
            name: "Pure Bangla Input",
            text: "রাস্তায় বিশাল গর্ত হয়ে আছে, যেকোনো সময় বড় দুর্ঘটনা ঘটতে পারে। এটা ধানমন্ডি ৮ নম্বর রোডের মাথায়, মসজিদের পাশে।",
            address: "Dhanmondi Road 8, Dhaka",
            hasPhoto: true
        },
        {
            name: "Banglish Input",
            text: "amader ekhane rasta te pani jome ache onek din dhore, main line a leak hoise bodhoy, khub baje gondho. location: mirpur 10 circle er kache.",
            address: "Mirpur 10, Dhaka",
            hasPhoto: false
        },
        {
            name: "Vague/Short Input",
            text: "somossa",
            address: "",
            hasPhoto: false
        }
    ];

    for (const tc of testCases) {
        console.log(`--------------------------------------------------`);
        console.log(`🧪 Test Case: ${tc.name}`);
        console.log(`📝 Input Text: "${tc.text}"`);
        console.log(`📍 Address: "${tc.address || 'None'}"`);
        console.log(`📷 Has Photo: ${tc.hasPhoto ? 'Yes' : 'No'}`);
        console.log(`⏳ Analyzing...`);

        const result = await analyzeReport(tc.text, tc.address, tc.hasPhoto);

        console.log(`\n✅ Result:`);
        console.log(JSON.stringify(result, null, 2));
        console.log(`--------------------------------------------------\n`);
    }

    console.log("🏁 All tests completed.");
};

runTests().catch(err => {
    console.error("Test execution failed:", err);
});
