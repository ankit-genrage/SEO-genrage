const { GoogleGenerativeAI } = require('@google/generative-ai');

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function testModels() {
  const modelsToTest = [
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-1.5-pro-latest',
    'gemini-1.5-flash-latest',
    'gemini-pro',
    'gemini-2.0-flash-exp'
  ];

  for (const modelName of modelsToTest) {
    try {
      const model = client.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Test');
      console.log(`✅ ${modelName} - WORKS`);
    } catch (error) {
      console.log(`❌ ${modelName} - ${error.message.split('\n')[0]}`);
    }
  }
}

testModels();
