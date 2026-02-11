/**
 * Frontend service for video generation.
 * Uses API Gateway via Nginx route /api/ -> 127.0.0.1:8000
 */

const API_BASE_URL = "/api/v1";

function getAccessToken(): string | null {
  try {
    const raw = localStorage.getItem("auth_tokens");
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    // в localStorage лежит access_token (как в AuthProvider)
    return parsed.access_token ?? parsed.token ?? null;
  } catch {
    return null;
  }
}

export async function generateVideo(
  prompt: string,
  imageFile?: File | null
): Promise<string> {
  const token = getAccessToken();

  // если токена нет — сразу говорим, что нужно войти
  if (!token) {
    throw new Error("Authentication required");
  }

  const fd = new FormData();
  fd.append("prompt", prompt);

  if (imageFile) {
    fd.append("image", imageFile);
  }

  const res = await fetch(`${API_BASE_URL}/videos/generate-public`, {
    method: "POST",
    body: fd,
    credentials: "include", // можно оставить, куки всё равно почти не используются
    headers: {
      // важно: токен только в заголовке, не в body
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      msg = data?.detail || data?.message || JSON.stringify(data);
    } catch {
      // игнорируем, оставляем стандартное сообщение
    }
    throw new Error(msg);
  }

  const data: any = await res.json();

  const url =
    data?.video_url ||
    data?.videoUrl ||
    data?.file_url ||
    data?.fileUrl ||
    data?.url;

  if (typeof url === "string" && url.length > 0) return url;

  const id = data?.id || data?.video_id || data?.videoId;
  if (typeof id === "string" && id.length > 0) return `/${id}/file`;

  throw new Error("Unexpected API response: no video url/id");
}
