// index.js — AWS Lambda handler for Dumb This Down
// Runtime: Node.js 20.x | Handler: index.handler | Timeout: 30s

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({ region: "us-east-1" });

const MODEL_ID = "amazon.nova-lite-v1:0";

export const handler = async (event) => {
  // CORS preflight — API Gateway should handle this, but just in case
  if (event.requestContext?.http?.method === "OPTIONS") {
    return corsResponse(200, {});
  }

  let text;

  try {
    // event.body is a JSON string when using HTTP API proxy integration
    const body = JSON.parse(event.body || "{}");
    text = body.text?.trim();
  } catch {
    return corsResponse(400, { error: "Invalid JSON body." });
  }

  if (!text) {
    return corsResponse(400, { error: "Missing 'text' field in request body." });
  }

  const prompt = `Rewrite the following text so a 5th grader can understand it.
Keep it short. Do not explain what you are doing, just rewrite it.

Text: ${text}`;

  const bedrockPayload = {
    messages: [
      {
        role: "user",
        content: [{ text: prompt }],
      },
    ],
    inferenceConfig: {
      max_new_tokens: 300,
    },
  };

  let simplified;

  try {
    const command = new InvokeModelCommand({
      modelId: MODEL_ID,
      // Bedrock expects the body as a JSON string encoded to bytes
      body: JSON.stringify(bedrockPayload),
      contentType: "application/json",
      accept: "application/json",
    });

    const response = await client.send(command);

    // response.body is a Uint8Array — decode it first
    const raw = new TextDecoder().decode(response.body);
    const parsed = JSON.parse(raw);

    // Nova Lite response shape: output.message.content[0].text
    simplified = parsed.output.message.content[0].text;
  } catch (err) {
    console.error("Bedrock error:", err);
    return corsResponse(500, { error: `Bedrock call failed: ${err.message}` });
  }

  return corsResponse(200, { simplified });
};

// Builds the proxy integration response shape API Gateway expects
function corsResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      // Required in Lambda response even when CORS is enabled in API Gateway
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
    },
    body: JSON.stringify(body),
  };
}
