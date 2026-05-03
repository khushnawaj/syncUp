require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // There isn't a direct listModels in the genAI object usually, 
    // it's often a separate discovery or restricted to certain models.
    // However, we can try to hit the API directly or use a known good model.
    console.log('Testing with a simple prompt on gemini-1.5-flash...');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent('Hi');
    console.log('Success:', (await result.response).text());
  } catch (err) {
    console.error('List/Test failed:', err.message);
  }
}
listModels();
