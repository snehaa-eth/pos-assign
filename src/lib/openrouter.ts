const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function queryLLM(prompt: string) {
  if (!OPENROUTER_API_KEY) {
    console.error("Error: OpenRouter API key is missing.");
    throw new Error("OpenRouter API key is missing.");
  }

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.1-70b-instruct",
        messages: [
          {
            role: "system",
            content:
              "You are Scout, a friendly AI career copilot helping product designers and developers find jobs that truly fit them.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(
        errorData.error?.message || `API request failed with status ${response.status}`,
      );
      (error as any).status = response.status;
      throw error;
    }

    const data = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string | null;
        };
      }>;
    };

    return data.choices?.[0]?.message?.content?.trim() ?? "";
  } catch (error: any) {
    if (error?.status) {
      throw error;
    }
    const enhancedError = new Error(error.message || "API request failed");
    (enhancedError as any).status = error.status || 500;
    throw enhancedError;
  }
}

