export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoRARequest {
  userId: string;
  modelName: string;
  falLoraUrl?: string;
  triggerWord: string;
  enableNsfw: boolean;
}

export interface LoRAResponse {
  success?: boolean;
  ok?: boolean;
  loraId?: string;
  status?: string;
  falLoraUrl?: string;
  predictionId?: string | null;
  message?: string;
}

export interface LoRAStatus {
  loraId: string;
  modelName: string;
  status: 'pending' | 'training' | 'ready' | 'failed';
  progress: number;
  falLoraUrl?: string;
  triggerWord: string;
  enableNsfw: boolean;
  createdAt: string;
  updatedAt: string;
  thumbnailUrl?: string | null;
  referenceId?: string | null;
  provider?: string | null;
  referenceMedia?: string[];
}

export interface GenerationRequest {
  prompt: string;
  loraName: string;
  characterId?: string;
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

export interface ReferencePhotosUploadResponse {
  ok: boolean;
  saved: Array<{ path: string; publicUrl?: string; filename: string; size: number; contentType: string }>;
  message: string;
  userId: string;
  modelName: string;
  enableNsfw: boolean;
  totalUploaded: number;
  usedCount: number;
  ignoredCount: number;
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

export interface FaceSwapVideoResponse {
  ok: boolean;
  output_video_url?: string;
  message?: string;
}

export interface ImageFaceswapRequest {
  image_url: string;
  source_url: string;
  dest_url: string;
}

export interface ImageFaceswapResponse {
  ok: boolean;
  output_url?: string;
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

export interface VideoDirectRequest {
  audio_file: string;
  image_reference: string;
}

export interface VideoDirectResponse {
  ok: boolean;
  video_url?: string;
}

export interface UploadResponse {
  ok: boolean;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

export interface ReferencePhotosUpload {
  referencePhotos: File[];
  userId: string;
  modelName: string;
  enableNsfw: boolean;
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
  identities: number;
  imagesToday: number;
  generatedImagesToday: number;
  editedImagesToday: number;
  faceSwapsToday: number;
  videosToday: number;
  recentActivity: DashboardActivityItem[];
}

export interface AuthUser {
  id: number;
  email: string;
  name?: string | null;
  isActive?: boolean;
  licenseStatus?: string;
  licensePlan?: string | null;
  licenseKey?: string | null;
  licenseActivatedAt?: string | null;
  licenseExpiresAt?: string | null;
  createdAt?: string | null;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: AuthUser;
}

export interface PixCharge {
  id: number;
  provider: string;
  method: 'pix';
  status: string;
  amountCents: number;
  description?: string | null;
  txid?: string | null;
  pixCopyPaste?: string | null;
  qrCodeImage?: string | null;
  expiresAt?: string | null;
  paidAt?: string | null;
  createdAt?: string | null;
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
