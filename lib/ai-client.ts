"use client";

type ErrorPayload = {
  error?: string;
};

export async function postAiJson<TResponse>({
  url,
  body,
  fallbackMessage
}: {
  url: string;
  body: unknown;
  fallbackMessage: string;
}) {
  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
  } catch {
    throw new Error(buildNetworkErrorMessage(fallbackMessage));
  }

  const rawText = await response.text();
  const payload = tryParseJson<TResponse & ErrorPayload>(rawText);

  if (!response.ok) {
    throw new Error(
      buildResponseErrorMessage({
        fallbackMessage,
        status: response.status,
        payload,
        rawText
      })
    );
  }

  if (!payload) {
    throw new Error(`${fallbackMessage}：服务端返回的内容格式不对，无法继续处理。`);
  }

  return payload;
}

function tryParseJson<T>(rawText: string) {
  const trimmed = rawText.trim();

  if (!trimmed) {
    return null;
  }

  try {
    return JSON.parse(trimmed) as T;
  } catch {
    return null;
  }
}

function buildNetworkErrorMessage(fallbackMessage: string) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;

  if (!origin) {
    return `${fallbackMessage}：当前页面没有连上可用服务，请确认本地项目已经启动。`;
  }

  return `${fallbackMessage}：当前页面没有连上可用服务（${origin}）。这通常是因为打开了旧端口，或本地 Next 服务没有正常运行。请切换到正在运行的地址后刷新重试。`;
}

function buildResponseErrorMessage({
  fallbackMessage,
  status,
  payload,
  rawText
}: {
  fallbackMessage: string;
  status: number;
  payload: ErrorPayload | null;
  rawText: string;
}) {
  if (payload?.error?.trim()) {
    return payload.error.trim();
  }

  const trimmed = rawText.trim();

  if (!trimmed || trimmed === "Internal Server Error") {
    return `${fallbackMessage}：服务端返回了 ${status} 错误，但没有给出详细说明。当前很像是连到了异常实例或旧端口，请刷新页面或重启本地服务后再试。`;
  }

  return `${fallbackMessage}：${trimmed}`;
}
