export type InputMode = "script" | "command";
export type GenerationRoute = "pro_script" | "ai_instruction";

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
}

export interface EditableField {
  field_path: string;
  field_label: string;
  current_value: string;
}

export interface Result1SourceTrace {
  from_user_input: boolean;
  has_uploaded_images: boolean;
  inferred_fields: string[];
}

export interface Result1InputDigest {
  topic: string;
  target_platform: string;
  duration_preference: string;
  target_audience: string;
  presentation_mode: string;
  narration_mode: string;
  user_goals: string[];
  extra_constraints: string[];
}

export interface Result1CoreDecision {
  core_expression: string;
  primary_goal: string;
  secondary_goal: string;
  content_angle_summary: string;
  primary_value_focus: string;
  recommended_opening_direction: string;
}

export interface Result1PlatformAdaptation {
  target_platform: string;
  platform_content_style: string;
  recommended_opening_style: string;
  recommended_rhythm_style: string;
  recommended_expression_style: string;
  platform_fit_reason: string;
  platform_risk_note: string;
}

export interface Result1AudienceFocus {
  primary_audience: string;
  audience_mindset: string;
  audience_value_expectation: string;
  communication_note: string;
}

export interface Result1PresentationDecision {
  primary_presentation_mode: string;
  presentation_reason: string;
  execution_note: string;
}

export interface Result1NarrationDecision {
  primary_narration_mode: string;
  narration_reason: string;
  tone_direction: string;
}

export interface Result1MaterialAnalysis {
  material_status: string;
  material_count_estimate: string;
  material_types: string[];
  available_elements: string[];
  usable_shot_directions: string[];
  supported_presentation_modes: string[];
  supported_narration_modes: string[];
  supported_content_directions: string[];
  material_risks: string[];
  material_gaps: string[];
  material_usage_suggestion: string;
  material_indexed_list: string[];
  inferred: boolean;
  confidence: string;
}

export interface VisualStyle {
  primary_style: string;
  secondary_style: string;
  style_summary: string;
}

export interface Result1MediaStyleInference {
  recommended_media_type: string;
  confidence_level: string;
  reasoning_summary: string;
  visual_style: VisualStyle;
  prompt_dimension_profile: string[];
}

export interface Result1ExecutionGuidance {
  recommended_structure_direction: string;
  material_usage_direction: string;
  execution_complexity: string;
  must_keep_elements: string[];
  avoid_elements: string[];
  risk_notes: string[];
}

export interface Result1RiskAndConfirmation {
  main_risk: string;
  needs_user_confirmation: string[];
  weak_assumptions: string[];
}

export interface Result1Inner {
  schema_version: string;
  source_trace: Result1SourceTrace;
  input_digest: Result1InputDigest;
  core_decision: Result1CoreDecision;
  platform_adaptation: Result1PlatformAdaptation;
  audience_focus: Result1AudienceFocus;
  presentation_decision: Result1PresentationDecision;
  narration_decision: Result1NarrationDecision;
  material_analysis: Result1MaterialAnalysis;
  media_style_inference: Result1MediaStyleInference;
  execution_guidance: Result1ExecutionGuidance;
  risk_and_confirmation: Result1RiskAndConfirmation;
  editable_fields: EditableField[];
}

export interface API1Response {
  result1: Result1Inner;
}

export interface Result2SourceTrace {
  from_result1: boolean;
  generation_route: GenerationRoute;
}

export interface Result2PlatformAdaptationSummary {
  target_platform: string;
  platform_content_style: string;
  platform_opening_preference: string;
  platform_rhythm_preference: string;
  platform_expression_note: string;
}

export interface Result2GlobalConstraintsSummary {
  core_expression: string;
  primary_goal: string;
  secondary_goal: string;
  duration_bucket: string;
  primary_audience: string;
  primary_presentation_mode: string;
  primary_narration_mode: string;
  material_status: string;
  recommended_media_type: string;
  main_style_note: string;
  main_risks: string[];
}

export interface ExpansionAnchor {
  opening_approach: string;
  core_structure_path: string[];
  ending_approach: string;
  rhythm_style: string;
  visual_organization: string;
  dialogue_tone: string;
  material_usage_plan: string;
  platform_fit_focus: string;
  media_fit_focus: string;
  style_fit_focus: string;
}

export interface Result2OptionCard {
  option_id: "A" | "B" | "C";
  card_title: string;
  card_summary: string;
  highlight_tags: string[];
  selection_reason: string;
  expansion_anchor: ExpansionAnchor;
}

export interface Result2SelectionHint {
  if_user_wants_fastest_grasp: string;
  if_user_wants_clearest_delivery: string;
  if_user_wants_strongest_style_or_memory: string;
}

export interface Result2Inner {
  schema_version: string;
  source_trace: Result2SourceTrace;
  generation_route: GenerationRoute;
  based_on_edited_result1: boolean;
  platform_adaptation_summary: Result2PlatformAdaptationSummary;
  global_constraints_summary: Result2GlobalConstraintsSummary;
  options: Result2OptionCard[];
  selection_hint: Result2SelectionHint;
}

export interface API2Response {
  result2: Result2Inner;
}

export interface Result3SourceTrace {
  from_result1: boolean;
  from_result2: boolean;
  selected_option_id: string;
  generation_route: GenerationRoute;
}

export interface StoryboardShot {
  shot_no: number;
  timecode: string;
  visual_description: string;
  camera_position: string;
  shooting_method: string;
  shot_size: string;
  dialogue: string;
  sound_effect: string;
}

export interface SegmentGroup {
  segment_id: string;
  segment_name: string;
  shot_range: string;
  related_shot_numbers: number[];
  segment_goal: string;
  segment_summary: string;
}

export interface BaseStoryboardScript {
  script_title: string;
  one_line_concept: string;
  target_platform: string;
  total_duration: string;
  recommended_media_type: string;
  visual_style: VisualStyle;
  prompt_dimension_profile: string[];
  table_columns: string[];
  shots: StoryboardShot[];
  segment_groups: SegmentGroup[];
}

export interface ProScriptDisplayData {
  display_type: "storyboard_table";
  page_title: string;
  page_subtitle: string;
  primary_data_binding: {
    table_columns_path: string;
    table_rows_path: string;
  };
  table_presentation: {
    table_name: string;
    default_view_mode: string;
    show_full_table_directly: boolean;
    column_order: string[];
  };
  editing_config: {
    editable: boolean;
    edit_entry: string;
    editable_scope: string;
    editable_fields: string[];
  };
  export_config: {
    export_enabled: boolean;
    supported_formats: string[];
    default_file_name: string;
  };
}

export interface InstructionSegment {
  segment_id: string;
  segment_name: string;
  shot_range: string;
  related_shot_numbers: number[];
  segment_goal: string;
  instruction_text: string;
  spoken_lines: string[];
  subtitle_focus: string[];
  copy_enabled: boolean;
}

export interface AIInstructionDisplayData {
  display_type: "segmented_ai_instructions";
  page_title: string;
  page_subtitle: string;
  primary_source_binding: {
    segments_path: string;
    shots_path: string;
  };
  instruction_segments: InstructionSegment[];
  full_instruction_package: {
    title: string;
    full_instruction_text: string;
    copy_enabled: boolean;
  };
}

export type RouteDisplayData = ProScriptDisplayData | AIInstructionDisplayData;

export interface Result3Inner {
  schema_version: string;
  source_trace: Result3SourceTrace;
  generation_route: GenerationRoute;
  selected_option_id: string;
  selected_option_name: string;
  based_on_edited_result1: boolean;
  based_on_selected_option: boolean;
  base_storyboard_script: BaseStoryboardScript;
  route_display_data: RouteDisplayData;
}

export interface API3Response {
  result3: Result3Inner;
}

export interface API1Request {
  topic: string;
  goals?: string;
  platforms?: string;
  duration?: string;
  audiences?: string;
  presentation_mode?: string;
  narration_mode?: string;
  materials?: string;
  extra_notes?: string;
  image_paths?: string[];
}

export interface API2Request {
  result1: API1Response | Result1Inner | Record<string, unknown>;
  generation_route: GenerationRoute;
  user_extra_request?: string;
  edited_by_user_fields?: unknown[];
  language?: string;
}

export interface API3Request {
  result1: API1Response | Result1Inner | Record<string, unknown>;
  result2: API2Response | Result2Inner | Record<string, unknown>;
  selected_option_id: "A" | "B" | "C";
  generation_route: GenerationRoute;
  selected_option_data?: Result2OptionCard | Record<string, unknown> | null;
  user_extra_request?: string;
  edited_by_user_fields?: unknown[];
  option_edited_by_user_fields?: unknown[];
  language?: string;
}

export interface PipelineRequest extends API1Request {
  selected_option_id: "A" | "B" | "C";
  generation_route: GenerationRoute;
  user_extra_request?: string;
  edited_by_user_fields?: unknown[];
  option_edited_by_user_fields?: unknown[];
  selected_option_data?: Result2OptionCard | Record<string, unknown> | null;
  language?: string;
}

export interface PipelineResponse {
  schema_version: string;
  generation_route: GenerationRoute;
  selected_option_id: "A" | "B" | "C";
  result1: API1Response;
  result2: API2Response;
  result3: API3Response;
}