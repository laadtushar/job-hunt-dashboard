
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API KEY found in .env.local");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    try {
        // For listing models, we can't use the helper directly as it is not exposed in the high level GoogleGenerativeAI class in older versions, 
        // but let's try the model.
        // Actually, checking docs/types, listModels might not be on the main class in this SDK version easily without looking at docs.
        // Let's try to just run a generation with "gemini-1.5-flash" again but logging the error fully.
        // Better: generic request to list models if possible, or just try a few known ones.

        // Changing strategy: The SDK usually exposes a ModelManager or similar.
        // Let's try to just generate content with a few variations and see which one hits.

        const models = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.0-pro", "models/gemini-1.5-flash"];

        for (const modelName of models) {
            console.log(`Testing model: ${modelName}`);
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Hello");
                console.log(`SUCCESS with ${modelName}`);
                console.log(result.response.text());
                break;
            } catch (e) {
                console.log(`FAILED ${modelName}: ${e.message.split('\n')[0]}`);
            }
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

listModels();
