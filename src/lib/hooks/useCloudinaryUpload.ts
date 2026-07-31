import api from '#/lib/api/http'

export interface CloudinarySignature {
  timestamp: number
  signature: string
  apiKey: string
  cloudName: string
  folder: string
  resourceType: string
}

export interface CloudinaryUploadResult {
  url: string
  publicId: string
}

/**
 * Fetch a signed upload signature from the backend.
 */
export async function getUploadSignature(
  folder = 'soroman'
): Promise<CloudinarySignature> {
  const res = await api.get('/uploads/signature', { params: { folder } })
  return res.data.data
}

/**
 * Upload a file directly to Cloudinary using a signed signature.
 *
 * @param file  The file to upload
 * @param signature  Signed params from getUploadSignature()
 * @returns  The uploaded file's URL and public ID
 */
export async function uploadToCloudinary(
  file: File,
  signature: CloudinarySignature
): Promise<CloudinaryUploadResult> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('api_key', signature.apiKey)
  formData.append('timestamp', String(signature.timestamp))
  formData.append('signature', signature.signature)
  formData.append('folder', signature.folder)

  const endpoint = `https://api.cloudinary.com/v1_1/${signature.cloudName}/${signature.resourceType}/upload`

  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || 'Cloudinary upload failed')
  }

  const data = await response.json()
  return {
    url: data.secure_url,
    publicId: data.public_id,
  }
}

/**
 * Convenience: fetch signature + upload in one call.
 */
export async function uploadFile(
  file: File,
  folder = 'soroman'
): Promise<CloudinaryUploadResult> {
  const signature = await getUploadSignature(folder)
  return uploadToCloudinary(file, signature)
}
