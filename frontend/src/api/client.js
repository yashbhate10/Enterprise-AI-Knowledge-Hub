import axios from 'axios';

const API_BASE_URL = 'http://localhost:8081';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach the stored token to every outgoing request, if present.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('knowledgehub_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function register({ firstName, lastName, email, password }) {
  return client
    .post('/auth/register', { firstName, lastName, email, password })
    .then((res) => res.data);
}

export function login({ email, password }) {
  return client
    .post('/auth/login', { email, password })
    .then((res) => res.data);
}

export function extractErrorMessage(error) {
  if (error.response?.data?.fields) {
    const fields = error.response.data.fields;
    return Object.values(fields)[0] || 'Please check the form and try again.';
  }
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.message === 'Network Error') {
    return 'Could not reach the server. Is the backend running?';
  }
  return 'Something went wrong. Please try again.';
}

export default client;