import OpenAI from 'openai';
import dotenv from 'dotenv';

// Ensure env variables are loaded
dotenv.config();

if (!process.env.OPENAI_API_KEY) {
    console.warn("⚠️ Warning: OPENAI_API_KEY environment variable is not defined.");
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || ''
});

export default openai;
