export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface GenerationRequest {
  prompt: string;
  aspectRatio: '9:16' | '16:9' | '4:3' | '3:4' | '1:1' | '2:3' | '3:2';
  resolution: '720p' | '1080p';
  resultImages: 1 | 4;
  referenceImageUrls: string[];
}

export interface GenerationResponse {
  ok: boolean;
  taskId: string;
  status: 'pending' | 'processing' | 'queued' | 'in_progress' | 'completed' | 'failed' | 'canceled' | 'nsfw';
  imageUrl?: string;
  imageUrls?: string[];
  message?: string;
  progress?: number;
}

export interface ImageEditRequest {
  userId: string;
  images: string[];
  prompt: string;
  size?: string;
  seed: number;
}

export interface ImageEditResponse {
  ok: boolean;
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  imageUrl?: string;
  message?: string;
}

export interface EditImagesUploadResponse {
  ok: boolean;
  message: string;
  batchId: string;
  userId: string;
  saved: Array<{ path: string; publicUrl?: string; filename: string; size: number; contentType: string }>;
}

export interface GenerateReferenceImagesUploadResponse {
  ok: boolean;
  message: string;
  batchId: string;
  userId: string;
  saved: Array<{
    path: string;
    filename: string;
    size: number;
    contentType: string;
    publicUrl: string;
  }>;
}

export interface UploadResponse {
  ok: boolean;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

export interface FaceSwapImageRequest {
  source_image_url: string;
  target_image_url: string;
  lora_strength: number;
}

export interface FaceSwapVideoRequest {
  source_video_url: string;
  target_image_url: string;
  lora_strength: number;
}

export interface FaceSwapResponse {
  ok: boolean;
  output_url?: string;
  message?: string;
}

export interface VideoMotionRequest {
  image_prompt: string;
  lora_name?: string;
  lora_strength: number;
}

export interface VideoMotionResponse {
  ok: boolean;
  video_url?: string;
}

export interface HealthResponse {
  status: string;
  version: string;
}

export interface DashboardActivityItem {
  id: string;
  type: string;
  title: string;
  status: string;
  createdAt: string;
  imageUrl?: string;
}

export interface DashboardStatsResponse {
  imagesToday: number;
  generatedImagesToday: number;
  editedImagesToday: number;
  recentActivity: DashboardActivityItem[];
}

export interface AuthUser {
  id: number;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  authProvider?: string | null;
  isActive?: boolean;
  licenseStatus?: string;
  licensePlan?: string | null;
  licenseActivatedAt?: string | null;
  licenseExpiresAt?: string | null;
  trialEditCreditsRemaining?: number;
  trialBlockedReason?: string | null;
  createdAt?: string | null;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: AuthUser;
}

export interface OAuthStartResponse {
  authorizationUrl: string;
}

export interface SmsVerificationResponse {
  ok: boolean;
  message: string;
}

export interface SmsVerificationCheckResponse extends SmsVerificationResponse {
  verificationToken: string;
}

export type GallerySourceType = 'image_edit' | 'image_generation' | 'legacy'

export interface GalleryItem {
  id: string
  clientId: string
  sourceType: GallerySourceType
  imageUrl: string
  prompt: string
  size: string
  createdAt: string
  updatedAt?: string
  favorite?: boolean
}