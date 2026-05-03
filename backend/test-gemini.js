require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  try {
    console.log('Testing Gemini API key...');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const result = await model.generateContent('Say hello');
    const response = await result.response;
    console.log('Success! Response:', response.text());
    process.exit(0);
  } catch (error) {
    console.error('Error testing Gemini key:');
    console.error('Message:', error.message);
    process.exit(1);
  }
}

testGemini();
