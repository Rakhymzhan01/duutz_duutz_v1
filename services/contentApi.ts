// services/contentApi.ts
import { AuthTokens } from "../types";

// тот же подход, что и в services/api.ts
// пример dev: VITE_API_BASE_URL="http://localhost:8000/api/v1"
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

export type Section = "information" | "news" | "blog" | "instruction" | "payment";
export type Lang = "en" | "ar";

export type ContentItem = {
  id: string;
  section: Section;
  lang: Lang;
  title: string;
  body: string;
  image_data_url?: string | null;
  video_url?: string | null;

  // с бэка приходят ISO-строки дат (например "2026-01-22T10:15:00Z") или null
  created_at: string | null;
  updated_at: string | null;

  author_id?: string | null;
};

type ContentPayload = {
  section: Section;
  lang: Lang;
  title: string;
  body: string;
  image_data_url?: string | null;
  video_url?: string;
};

async function request<T>(
  path: string,
  options: RequestInit = {},
  tokens?: AuthTokens | null
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  // если есть body и не указан Content-Type → ставим JSON
  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  // если есть access_token — добавляем Authorization
  if (tokens?.access_token) {
    headers["Authorization"] = `Bearer ${tokens.access_token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    // чтобы браузер отправлял куку access_token на api-gateway
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Content API error ${res.status}: ${text || res.statusText}`);
  }

  if (res.status === 204) {
    // нет содержимого
    return null as unknown as T;
  }

  return (await res.json()) as T;
}

export const contentApi = {
  // публичный список (для страниц Information / News / Blog / Instruction / Payment)
  async list(section: Section, lang: Lang): Promise<ContentItem[]> {
    return request<ContentItem[]>(
      `/content?section=${encodeURIComponent(section)}&lang=${encodeURIComponent(
        lang
      )}`
    );
  },

  // админский список (если нужно грузить все посты для таблички)
  async adminList(
    params: { section?: Section; lang?: Lang } = {},
    tokens?: AuthTokens | null
  ): Promise<ContentItem[]> {
    const qs = new URLSearchParams();
    if (params.section) qs.set("section", params.section);
    if (params.lang) qs.set("lang", params.lang);

    const q = qs.toString();
    return request<ContentItem[]>(
      `/admin/content${q ? `?${q}` : ""}`,
      {},
      tokens
    );
  },

  // создать контент (только для админки)
  async create(
    payload: ContentPayload,
    tokens?: AuthTokens | null
  ): Promise<ContentItem> {
    return request<ContentItem>(
      "/admin/content",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      tokens
    );
  },

  // обновить контент (в твоём бэке PUT ожидает полный ContentIn)
  async update(
    id: string,
    payload: ContentPayload,
    tokens?: AuthTokens | null
  ): Promise<ContentItem> {
    return request<ContentItem>(
      `/admin/content/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
      tokens
    );
  },

  // удалить
  async remove(
    id: string,
    tokens?: AuthTokens | null
  ): Promise<{ status: string; id: string }> {
    return request<{ status: string; id: string }>(
      `/admin/content/${encodeURIComponent(id)}`,
      { method: "DELETE" },
      tokens
    );
  },
};
