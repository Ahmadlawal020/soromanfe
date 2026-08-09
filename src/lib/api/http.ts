import axios from "axios";
import { useAuthStore } from "#/modules/auth/stores/store";

const RAW_API_URL = import.meta.env.VITE_API_URL || "http://localhost:5002/api";
const API_URL = RAW_API_URL.replace(/\/$/, "");

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

function isPlainObject(o: any) {
  return Object.prototype.toString.call(o) === "[object Object]";
}

function normalizeIds(obj: any): any {
  if (obj === null || obj === undefined || typeof obj !== "object") {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(normalizeIds);
  }
  if (!isPlainObject(obj)) {
    return obj;
  }
  const newObj: any = {};
  for (const key of Object.keys(obj)) {
    newObj[key] = normalizeIds(obj[key]);
  }
  if (newObj.id !== undefined && newObj._id === undefined) {
    newObj._id = newObj.id;
  } else if (newObj._id !== undefined && newObj.id === undefined) {
    newObj.id = newObj._id;
  }
  return newObj;
}


/**
 * Refresh is single-flight.
 *
 * When the access token expires, every request in flight 401s at the same
 * moment — a dashboard page has several queries running plus the notification
 * poll. Previously each one fired its own POST /auth/refresh, which broke in
 * two ways: the endpoint is rate limited to 10/minute so the surplus came back
 * 429, and every refresh rotated the token again, so slower callers stored one
 * that had already been superseded.
 *
 * Now the first 401 starts the refresh and everyone else awaits the same
 * promise, then retries with whatever token it produced. One network call, one
 * rotation, no burst.
 */
let refreshInFlight: Promise<string | null> | null = null;

function runRefresh(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const { refreshToken, csrfToken, user, setSession } = useAuthStore.getState();

    // The refresh token lives in an httpOnly cookie — login returns only
    // accessToken, csrfToken and user. Sending it in the body is the legacy
    // path, kept for a native client that has one. Requiring it here is what
    // logged everyone out at the 15-minute mark: the field is always
    // undefined in the browser, so refresh bailed before it ever ran.
    const res = await axios.post(
      `${API_URL}/auth/refresh`,
      refreshToken ? { refreshToken } : {},
      {
        withCredentials: true,
        // Double-submit: the cookie cannot be read cross-origin, so echoing
        // the value in a header proves the caller is us.
        headers: csrfToken ? { "x-csrf-token": csrfToken } : undefined,
      },
    );

    const data = res.data?.data;
    if (!data?.accessToken) return null;

    setSession({
      // A refresh response need not resend the user; keep the one we have.
      user: data.user ?? user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      csrfToken: data.csrfToken,
    });
    return data.accessToken as string;
  })();

  // Cleared whether it resolved or threw, so the next 401 can try again.
  refreshInFlight.finally(() => { refreshInFlight = null; });
  return refreshInFlight;
}

/**
 * Only a rejected refresh means the session is actually gone.
 *
 * A 429 from the rate limiter, a 5xx, or a dropped connection all say
 * "couldn't ask right now" — logging out on those throws away a perfectly
 * valid session because the network hiccuped.
 */
function isSessionDead(err: unknown): boolean {
  const status = (err as { response?: { status?: number } })?.response?.status;
  return status === 401 || status === 403;
}

function endSession() {
  useAuthStore.getState().clearSession();
  try { sessionStorage.setItem('soroman-session-expired', '1') } catch { /* private mode */ }
  window.location.href = "/login";
}

api.interceptors.response.use(
  (response) => {
    if (response.data) {
      response.data = normalizeIds(response.data);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/refresh") &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        const token = await runRefresh();
        if (!token) {
          endSession();
          return Promise.reject(error);
        }
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // A refused refresh ends the session. Anything else — rate limit,
        // server error, offline — leaves it intact and surfaces the original
        // failure, so a blip does not evict someone mid-task.
        if (isSessionDead(refreshError)) {
          endSession();
          return Promise.reject(refreshError);
        }
        return Promise.reject(error);
      }
    }

    // Handle 403 Forbidden - Insufficient permissions
    if (error.response?.status === 403) {
      const message = error.response?.data?.message || 'You do not have permission to perform this action';
      // Create a custom error with the permission message
      const permissionError = new Error(message);
      permissionError.name = 'PermissionError';
      (permissionError as any).status = 403;
      (permissionError as any).isPermissionError = true;
      return Promise.reject(permissionError);
    }

    return Promise.reject(error);
  },
);

export default api;
