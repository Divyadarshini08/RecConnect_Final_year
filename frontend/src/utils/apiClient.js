import { API } from "./api";

/**
 * Make an authenticated API request
 * Automatically includes JWT token in Authorization header
 */
export const apiRequest = async (endpoint, options = {}) => {
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;
  
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Add JWT token to Authorization header if available
  if (user?.token) {
    headers["Authorization"] = `Bearer ${user.token}`;
  }

  const response = await fetch(`${API}${endpoint}`, {
    ...options,
    headers,
  });

  return response;
};

/**
 * Helper for GET requests
 */
export const getAPI = (endpoint) => {
  return apiRequest(endpoint, { method: "GET" });
};

/**
 * Helper for POST requests
 */
export const postAPI = (endpoint, data) => {
  return apiRequest(endpoint, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

/**
 * Helper for PUT requests
 */
export const putAPI = (endpoint, data) => {
  return apiRequest(endpoint, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

/**
 * Helper for DELETE requests
 */
export const deleteAPI = (endpoint) => {
  return apiRequest(endpoint, { method: "DELETE" });
};
