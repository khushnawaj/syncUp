require('dotenv').config();
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testKey() {
  try {
    console.log('Testing OpenAI key...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Say hello' }],
      max_tokens: 5,
    });
    console.log('Success! Response:', completion.choices[0].message.content);
    process.exit(0);
  } catch (error) {
    console.error('Error testing OpenAI key:');
    console.error('Status:', error.status);
    console.error('Message:', error.message);
    process.exit(1);
  }
}

testKey();
