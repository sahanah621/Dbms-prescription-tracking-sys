const BASE_URL = 'http://127.0.0.1:8000/api';

async function handleResponse(response) {
  if (!response.ok) {
    let errorDetail = 'Request failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || JSON.stringify(errJson);
    } catch {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }
  return response.json();
}

export const api = {
  async get(endpoint) {
    const res = await fetch(`${BASE_URL}${endpoint}`);
    return handleResponse(res);
  },

  async post(endpoint, data) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async put(endpoint, data) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async delete(endpoint) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },
};
