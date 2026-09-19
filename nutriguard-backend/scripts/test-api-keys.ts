import dotenv from 'dotenv';
import path from 'path';

// 1. Load the local .env file immediately, before importing any config-dependent clients
dotenv.config({ path: path.resolve('.env') });

// Set default dummy values for DB/Supabase validation so env.ts doesn't throw
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://placeholder-test-project.supabase.co';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'placeholder-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';
process.env.SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || 'placeholder-jwt-secret';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/nutriguard';

async function testKeys() {
  // 2. Dynamically import clients after environment is fully loaded
  const { geminiClient } = await import('../src/ai/clients/gemini.client.js');
  const { nvidiaClient } = await import('../src/ai/clients/nvidia.client.js');
  const { summaryAgentJsonSchema } = await import('../src/ai/schemas/summary-agent.schema.js');

  console.log('🚀 Testing Gemini API Key...');
  try {
    const embedding = await geminiClient.generateEmbedding('Sodium Nitrite');
    console.log(`\n✅ Gemini Embedding generated successfully! (dimensions: ${embedding.length})`);

    const structured = await geminiClient.generateStructured({
      systemPrompt: 'You are a test agent. Output ONLY a valid JSON matching the schema.',
      userPrompt: 'Generate a test analysis for a sausage containing Sodium Nitrite.',
      jsonSchema: summaryAgentJsonSchema,
      schemaName: 'test_summary_schema',
    });
    console.log('\n✅ Gemini Structured response generated successfully!');
    console.log(JSON.stringify(structured, null, 2));
  } catch (err: any) {
    console.error('\n❌ Gemini API Test failed:', err.message);
    if (err.cause) {
      console.error('Inner Error Cause:', err.cause);
    } else {
      console.error('Error Details:', err);
    }
  }

  console.log('\n🚀 Testing NVIDIA NIM API Key...');
  try {
    const structuredNvidia = await nvidiaClient.generateStructured({
      systemPrompt: 'You are a test agent. Output ONLY a valid JSON matching the schema.',
      userPrompt: 'Generate a test analysis for a sausage containing Sodium Nitrite.',
      jsonSchema: summaryAgentJsonSchema,
      schemaName: 'test_summary_schema',
    });
    console.log('\n✅ NVIDIA NIM Structured response generated successfully!');
    console.log(JSON.stringify(structuredNvidia, null, 2));
  } catch (err: any) {
    console.error('\n❌ NVIDIA NIM API Test failed:', err.message || err);
  }
}

testKeys();
