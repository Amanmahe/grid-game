import OpenAI from "openai";
import { NextResponse } from "next/server";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET() {
  const response = await client.responses.create({
    model: "gpt-5-nano",
    input: "Say hello in one short sentence"
  });

  return NextResponse.json({
    text: response.output_text,
  });
}
