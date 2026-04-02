type MiniMaxMessageContent = string | Array<{ type?: string; text?: string }>;

const MINIMAX_API_KEY_ENV_NAMES = [
  "MINIMAX_API_KEY",
  "MINIMAX_API_TOKEN",
  "MINIMAX_TOKEN",
  "NEXT_PUBLIC_MINIMAX_API_KEY"
] as const;

const MINIMAX_BASE_URL_ENV_NAMES = [
  "MINIMAX_BASE_URL",
  "NEXT_PUBLIC_MINIMAX_BASE_URL"
] as const;

const MINIMAX_MODEL_ENV_NAMES = [
  "MINIMAX_MODEL",
  "NEXT_PUBLIC_MINIMAX_MODEL"
] as const;

export async function callMiniMaxJson<T>({
  systemPrompt,
  userPrompt,
  temperature = 0.2,
  maxTokens = 1800,
  model
}: {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
}) {
  const apiKey = readEnvValue(MINIMAX_API_KEY_ENV_NAMES);

  if (!apiKey) {
    throw new Error(`服务端缺少 MiniMax 密钥，已检查：${MINIMAX_API_KEY_ENV_NAMES.join("、")}。`);
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(getMiniMaxApiUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model ?? getMiniMaxModel(),
          temperature,
          max_tokens: maxTokens,
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: userPrompt
            }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`MiniMax 调用失败：${response.status} ${errorText}`);
      }

      const payload = (await response.json()) as {
        choices?: Array<{
          message?: {
            content?: MiniMaxMessageContent;
          };
        }>;
      };

      const rawContent = payload.choices?.[0]?.message?.content;
      const contentText = normalizeContent(rawContent);

      return parseJsonObject(contentText) as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("未知错误");
    }
  }

  throw lastError ?? new Error("MiniMax 调用失败");
}

function getMiniMaxApiUrl() {
  const baseUrl = readEnvValue(MINIMAX_BASE_URL_ENV_NAMES);

  if (!baseUrl) {
    return "https://api.minimaxi.com/v1/chat/completions";
  }

  if (baseUrl.endsWith("/chat/completions")) {
    return baseUrl;
  }

  return `${baseUrl.replace(/\/+$/, "")}/chat/completions`;
}

function getMiniMaxModel() {
  return readEnvValue(MINIMAX_MODEL_ENV_NAMES) || "MiniMax-M2.7";
}

function readEnvValue(names: readonly string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) {
      return value;
    }
  }

  return "";
}

function normalizeContent(content: MiniMaxMessageContent | undefined) {
  if (typeof content === "string") {
    return stripThinkTags(content).trim();
  }

  if (Array.isArray(content)) {
    return stripThinkTags(content.map((item) => item.text ?? "").join("\n")).trim();
  }

  return "";
}

function stripThinkTags(input: string) {
  return input.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}

function parseJsonObject(input: string) {
  const cleaned = input.replace(/```json|```/gi, "").trim();
  const candidates = [cleaned];

  const unwrapped = tryUnwrapJsonString(cleaned);
  if (typeof unwrapped === "string") {
    candidates.push(unwrapped);
  }

  for (const candidate of candidates) {
    const parsed = tryParseObject(candidate);
    if (parsed) {
      return parsed;
    }
  }

  throw new Error("模型返回内容里没有可解析的 JSON。");
}

function tryUnwrapJsonString(input: string) {
  if (!input.startsWith("\"")) {
    return null;
  }

  try {
    const parsed = JSON.parse(input);
    return typeof parsed === "string" ? parsed : null;
  } catch {
    return null;
  }
}

function tryParseObject(input: string) {
  const direct = tryParseDirectObject(input);
  if (direct) {
    return direct;
  }

  const extracted = extractBalancedJsonObject(input);
  if (extracted) {
    const parsed = tryParseDirectObject(extracted);
    if (parsed) {
      return parsed;
    }
  }

  const arrayWrapped = extractFirstObjectFromArray(input);
  if (arrayWrapped) {
    const parsed = tryParseDirectObject(arrayWrapped);
    if (parsed) {
      return parsed;
    }
  }

  return null;
}

function tryParseDirectObject(input: string) {
  try {
    const parsed = JSON.parse(input);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function extractBalancedJsonObject(input: string) {
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === "\\") {
        escaped = true;
        continue;
      }

      if (char === "\"") {
        inString = false;
      }

      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }

    if (char === "{") {
      if (depth === 0) {
        start = index;
      }
      depth += 1;
      continue;
    }

    if (char === "}") {
      if (depth === 0) {
        continue;
      }

      depth -= 1;
      if (depth === 0 && start !== -1) {
        return input.slice(start, index + 1);
      }
    }
  }

  return null;
}

function extractFirstObjectFromArray(input: string) {
  try {
    const parsed = JSON.parse(input);
    if (Array.isArray(parsed)) {
      const firstObject = parsed.find((item) => item && typeof item === "object" && !Array.isArray(item));
      return firstObject ? JSON.stringify(firstObject) : null;
    }
    return null;
  } catch {
    return null;
  }
}
