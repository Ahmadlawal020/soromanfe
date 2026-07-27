import axios from 'axios'
import { useAuthStore } from '#/modules/auth/stores/store'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api'

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 30000,
})

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

function isPlainObject(o: any) {
  return Object.prototype.toString.call(o) === '[object Object]'
}

function normalizeIds(obj: any): any {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj
  }
  if (Array.isArray(obj)) {
    return obj.map(normalizeIds)
  }
  if (!isPlainObject(obj)) {
    return obj
  }
  const newObj: any = {}
  for (const key of Object.keys(obj)) {
    newObj[key] = normalizeIds(obj[key])
  }
  if (newObj.id !== undefined && newObj._id === undefined) {
    newObj._id = newObj.id
  } else if (newObj._id !== undefined && newObj.id === undefined) {
    newObj.id = newObj._id
  }
  return newObj
}

api.interceptors.response.use(
  (response) => {
    if (response.data) {
      response.data = normalizeIds(response.data)
    }
    return response
  },
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest.url?.includes('/auth/login')) {
      if (!originalRequest._retry) {
        originalRequest._retry = true
        try {
          const { refreshToken, setSession, clearSession } =
            useAuthStore.getState()
          if (!refreshToken) {
            clearSession()
            window.location.href = '/login'
            return Promise.reject(error)
          }

          const response = await axios.post(
            `${API_URL}/auth/refresh`,
            { refreshToken },
            { withCredentials: true }
          )

          const { data } = response.data
          if (data && data.accessToken && data.refreshToken) {
            setSession({
              user: data.user,
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
            })

            originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
            return api(originalRequest)
          }
        } catch (refreshError) {
          useAuthStore.getState().clearSession()
          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      } else {
        // If we already retried and still got 401, clear session and redirect
        useAuthStore.getState().clearSession()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export default api
