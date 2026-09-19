import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config({ path: path.resolve('.env') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function list() {
  console.log('API Key:', process.env.GEMINI_API_KEY);
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
    );
    const json = await response.json();
    console.log('Models listed:', JSON.stringify(json, null, 2));
  } catch (err: any) {
    console.error('List failed:', err);
  }
}

list();
