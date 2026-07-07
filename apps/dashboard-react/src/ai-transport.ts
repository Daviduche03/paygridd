const DATA_PREFIX = "data: ";
const DONE_SIGNAL = "[DONE]";

type Resolvable<T> = T | (() => T) | (() => Promise<T>);

async function resolve<T>(value: Resolvable<T>): Promise<T> {
  if (typeof value === "function") {
    return await (value as () => T)();
  }
  return value;
}

function normalizeHeaders(
  headers: Record<string, string> | Headers | undefined,
): Record<string, string> {
  if (!headers) return {};
  if (headers instanceof Headers) {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }
  return headers;
}

function parseSSEStream(
  stream: ReadableStream<Uint8Array>,
): ReadableStream<any> {
  const decoder = new TextDecoder();
  let buffer = "";

  const processBuffer = (
    buffer: string,
    controller: ReadableStreamDefaultController<any>,
  ) => {
    const lines = buffer.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed === DONE_SIGNAL) {
        controller.close();
        return "";
      }

      if (trimmed.startsWith(DATA_PREFIX)) {
        const jsonStr = trimmed.slice(DATA_PREFIX.length);
        try {
          const data = JSON.parse(jsonStr);
          controller.enqueue(data);
        } catch {
          // Skip invalid JSON
        }
      }
    }

    // The last line might be incomplete, keep it in the buffer
    // (but we already consumed all complete lines above)
    return "";
  };

  return new ReadableStream({
    async start(controller) {
      const reader = stream.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (buffer) {
              processBuffer(buffer, controller);
            }
            controller.close();
            break;
          }
          buffer += decoder.decode(value, { stream: true });

          // Split by double newline (SSE standard)
          const parts = buffer.split("\n\n");
          // All complete messages (except the last part which may be incomplete)
          buffer = parts.pop() ?? "";

          for (const part of parts) {
            processBuffer(part, controller);
          }
        }
      } catch (error) {
        controller.error(error);
      } finally {
        reader.releaseLock();
      }
    },
  });
}

export class DefaultChatTransport {
  private api: string;
  private headers?: Resolvable<Record<string, string> | Headers>;
  private body?: Resolvable<object>;
  private credentials?: Resolvable<RequestCredentials>;
  private fetchFn?: typeof globalThis.fetch;

  constructor(options: {
    api?: string;
    headers?: Resolvable<Record<string, string> | Headers>;
    body?: Resolvable<object>;
    credentials?: Resolvable<RequestCredentials>;
    fetch?: typeof globalThis.fetch;
  } = {}) {
    this.api = options.api ?? "/api/chat";
    this.headers = options.headers;
    this.body = options.body;
    this.credentials = options.credentials;
    this.fetchFn = options.fetch;
  }

  async sendMessages(options: {
    trigger: "submit-message" | "regenerate-message";
    chatId: string;
    messageId: string | undefined;
    messages: any[];
    abortSignal: AbortSignal | undefined;
    headers?: Record<string, string> | Headers;
    body?: object;
    metadata?: unknown;
  }): Promise<any> {
    const resolvedBody = await resolve(this.body);
    const resolvedHeaders = await resolve(this.headers);
    const resolvedCredentials = await resolve(this.credentials);

    const headers = {
      "Content-Type": "application/json",
      ...normalizeHeaders(resolvedHeaders),
      ...normalizeHeaders(options.headers),
    };

    const body = JSON.stringify({
      ...resolvedBody,
      ...options.body,
      id: options.chatId,
      messages: options.messages,
      trigger: options.trigger,
      messageId: options.messageId,
    });

    const fetchFn = this.fetchFn ?? globalThis.fetch;
    const response = await fetchFn(this.api, {
      method: "POST",
      headers,
      body,
      credentials: resolvedCredentials,
      signal: options.abortSignal,
    });

    if (!response.ok) {
      throw new Error(
        (await response.text()) ?? "Failed to fetch the chat response.",
      );
    }

    if (!response.body) {
      throw new Error("The response body is empty.");
    }

    return parseSSEStream(response.body);
  }

  async reconnectToStream(options: {
    chatId: string;
    headers?: Record<string, string> | Headers;
    body?: object;
    metadata?: unknown;
  }): Promise<any | null> {
    const resolvedBody = await resolve(this.body);
    const resolvedHeaders = await resolve(this.headers);
    const resolvedCredentials = await resolve(this.credentials);

    const headers = {
      ...normalizeHeaders(resolvedHeaders),
      ...normalizeHeaders(options.headers),
    };

    const fetchFn = this.fetchFn ?? globalThis.fetch;
    const api = `${this.api}/${options.chatId}/stream`;
    const response = await fetchFn(api, {
      method: "GET",
      headers,
      credentials: resolvedCredentials,
    });

    if (response.status === 204) {
      return null;
    }

    if (!response.ok) {
      throw new Error(
        (await response.text()) ?? "Failed to fetch the chat response.",
      );
    }

    if (!response.body) {
      throw new Error("The response body is empty.");
    }

    return parseSSEStream(response.body);
  }
}
