/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_ENABLE_NSFW_CONTROLS: string
  readonly VITE_ENABLE_VIDEO_GENERATION: string
  readonly VITE_ENABLE_FACE_SWAP: string
  readonly VITE_MAX_FILE_SIZE: string
  readonly VITE_MAX_REFERENCE_PHOTOS: string
  readonly VITE_TASK_POLL_INTERVAL: string
  readonly VITE_TASK_POLL_MAX_ATTEMPTS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
