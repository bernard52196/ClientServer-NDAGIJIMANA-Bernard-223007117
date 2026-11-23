import { supabase } from "@/lib/supabase";

const API_BASE_URL = "http://127.0.0.1:8000/api";

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
) {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error("Unable to retrieve authentication session.");
  }

  const token = data.session?.access_token;

  if (!token) {
    throw new Error("Please log in to continue.");
  }

  const headers = new Headers(options.headers);

  headers.set("Authorization", `Bearer ${token}`);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const responseBody = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      responseBody?.error ||
      responseBody?.detail ||
      `API request failed: ${response.status}`
    );
  }

  return responseBody;
}

export async function apiGet(endpoint: string) {
  return apiRequest(endpoint, {
    method: "GET",
  });
}

export async function apiPost(endpoint: string, body: unknown) {
  return apiRequest(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function apiPatch(endpoint: string, body: unknown) {
  return apiRequest(endpoint, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function apiDelete(endpoint: string, body: unknown) {
  return apiRequest(endpoint, {
    method: "DELETE",
    body: JSON.stringify(body),
  });
}
