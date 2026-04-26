const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: 'e:/FYP/backend/.env' });

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  try {
    const models = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_AI_API_KEY}`);
    const data = await models.json();
    console.log("Available models:");
    data.models.forEach(m => console.log(m.name, m.supportedGenerationMethods));
  } catch (err) {
    console.error("Error fetching models:", err);
  }
}
listModels();
