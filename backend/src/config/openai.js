const { AzureOpenAI } = require('openai');

const openai = new AzureOpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2023-05-15',
  deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
});

module.exports = openai;
