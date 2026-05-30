import type {
  API1Request,
  API1Response,
  API2Request,
  API2Response,
  API3Request,
  API3Response,
  GenerationRoute,
  HealthResponse,
  InputMode,
  PipelineRequest,
  PipelineResponse,
  Result2OptionCard,
} from "../types/api";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ||
  "http://127.0.0.1:8080";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData?.detail) {
        detail = typeof errorData.detail === "string"
          ? errorData.detail
          : JSON.stringify(errorData.detail);
      }
    } catch {
      // ignore JSON parse failure for error response
    }
    throw new Error(detail);
  }

  return response.json() as Promise<T>;
}

export function mapInputModeToGenerationRoute(mode: InputMode): GenerationRoute {
  return mode === "script" ? "pro_script" : "ai_instruction";
}

export function getOptionById(
  result2: API2Response,
  optionId: "A" | "B" | "C"
): Result2OptionCard | null {
  const options = result2?.result2?.options ?? [];
  return options.find((item) => item.option_id === optionId) ?? null;
}

export async function callHealth(): Promise<HealthResponse> {
  return request<HealthResponse>("/health", {
    method: "GET",
  });
}

export async function callApi1(payload: API1Request): Promise<API1Response> {
  return request<API1Response>("/api1", {
    method: "POST",
    body: JSON.stringify({
      topic: payload.topic,
      goals: payload.goals ?? "",
      platforms: payload.platforms ?? "",
      duration: payload.duration ?? "",
      audiences: payload.audiences ?? "",
      presentation_mode: payload.presentation_mode ?? "",
      narration_mode: payload.narration_mode ?? "",
      materials: payload.materials ?? "",
      extra_notes: payload.extra_notes ?? "",
      image_paths: payload.image_paths ?? [],
    }),
  });
}

export async function callApi2(payload: API2Request): Promise<API2Response> {
  return request<API2Response>("/api2", {
    method: "POST",
    body: JSON.stringify({
      result1: payload.result1,
      generation_route: payload.generation_route,
      user_extra_request: payload.user_extra_request ?? "",
      edited_by_user_fields: payload.edited_by_user_fields ?? [],
      language: payload.language ?? "中文",
    }),
  });
}

export async function callApi3(payload: API3Request): Promise<API3Response> {
  return request<API3Response>("/api3", {
    method: "POST",
    body: JSON.stringify({
      result1: payload.result1,
      result2: payload.result2,
      selected_option_id: payload.selected_option_id,
      generation_route: payload.generation_route,
      selected_option_data: payload.selected_option_data ?? null,
      user_extra_request: payload.user_extra_request ?? "",
      edited_by_user_fields: payload.edited_by_user_fields ?? [],
      option_edited_by_user_fields: payload.option_edited_by_user_fields ?? [],
      language: payload.language ?? "中文",
    }),
  });
}

export async function callPipeline(
  payload: PipelineRequest
): Promise<PipelineResponse> {
  return request<PipelineResponse>("/pipeline", {
    method: "POST",
    body: JSON.stringify({
      topic: payload.topic,
      goals: payload.goals ?? "",
      platforms: payload.platforms ?? "",
      duration: payload.duration ?? "",
      audiences: payload.audiences ?? "",
      presentation_mode: payload.presentation_mode ?? "",
      narration_mode: payload.narration_mode ?? "",
      materials: payload.materials ?? "",
      extra_notes: payload.extra_notes ?? "",
      image_paths: payload.image_paths ?? [],
      selected_option_id: payload.selected_option_id,
      generation_route: payload.generation_route,
      user_extra_request: payload.user_extra_request ?? "",
      edited_by_user_fields: payload.edited_by_user_fields ?? [],
      option_edited_by_user_fields: payload.option_edited_by_user_fields ?? [],
      selected_option_data: payload.selected_option_data ?? null,
      language: payload.language ?? "中文",
    }),
  });
}

export { API_BASE_URL };