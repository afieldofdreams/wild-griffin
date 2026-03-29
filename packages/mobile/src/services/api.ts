const API_BASE = __DEV__
  ? "http://localhost:3000/v1"
  : "https://api.wildgriffin.com/v1";

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const url = `${API_BASE}${path}`;
  console.log(`[API] ${options.method || "GET"} ${url}`, authToken ? "(authed)" : "(no auth)");

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    console.log(`[API] Error ${res.status}:`, body);
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

/**
 * Dev-only: auto-login by registering and verifying a test phone number.
 * Sets the auth token so all subsequent requests are authenticated.
 */
export async function devAutoLogin() {
  if (!__DEV__) return;
  try {
    await request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ phoneNumber: "+447000000000" }),
    });
    const result = await request<{ token: string }>("/auth/verify", {
      method: "POST",
      body: JSON.stringify({ phoneNumber: "+447000000000", otp: "123456" }),
    });
    authToken = result.token;
    console.log("Dev auto-login successful");
  } catch (err) {
    console.warn("Dev auto-login failed:", err);
  }
}

export const api = {
  getNearby: (lat: number, lon: number, radius = 1000) =>
    request<{ sites: any[] }>(`/sites/nearby?lat=${lat}&lon=${lon}&radius=${radius}`),

  getSite: (id: string) => request<{ site: any }>(`/sites/${id}`),

  getSiteTimeline: (id: string) =>
    request<{ timeline: any[] }>(`/sites/${id}/timeline`),

  register: (phoneNumber: string, referralCode?: string) =>
    request<{ message: string; devOtp?: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ phoneNumber, referralCode }),
    }),

  verify: (phoneNumber: string, otp: string) =>
    request<{ token: string; refreshToken: string; user: any }>("/auth/verify", {
      method: "POST",
      body: JSON.stringify({ phoneNumber, otp }),
    }),

  submitSurvey: (data: any) =>
    request<{ survey: any }>("/surveys", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getBalance: () => request<any>("/wallet/balance"),
  getEstimate: () => request<any>("/wallet/estimate"),
  getProfile: () => request<{ user: any }>("/user/profile"),
  getMySites: () => request<{ sites: any[] }>("/user/sites"),
  getStreaks: () => request<{ streaks: any[] }>("/user/streaks"),
};
