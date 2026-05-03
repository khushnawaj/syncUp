require('dotenv').config();
const Groq = require('groq-sdk');

async function testGroq() {
  try {
    console.log('Testing Groq API key...');
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
    
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: 'Say hello' }],
      model: 'llama-3.3-70b-versatile',
    });
    
    console.log('Success! Response:', completion.choices[0].message.content);
    process.exit(0);
  } catch (error) {
    console.error('Error testing Groq key:');
    console.error('Message:', error.message);
    process.exit(1);
  }
}

testGroq();
