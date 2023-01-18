import axios from "axios";

/**
 * Base URL of the API.
 *
 * Read from the environment at module load so the same build can point at a
 * local server or a deployed one. The previous hardcoded `localhost:3002` did
 * not match the server's default port, so a fresh clone could not reach the API
 * at all.
 */
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3000/api/v1/";

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

/**
 * Turn an axios failure into a message worth showing a user.
 *
 * @param {unknown} error
 * @returns {string}
 */
export function describeError(error) {
  const apiMessage = error?.response?.data?.message;
  if (apiMessage) return apiMessage;
  if (error?.code === "ECONNABORTED") return "The request timed out.";
  if (error?.request) return "Could not reach the API. Is the server running?";
  return error?.message || "Something went wrong.";
}

/** Thin wrapper over axios so services deal in data, not responses. */
export default class GenericService {
  constructor(client = http) {
    this.client = client;
  }

  get = (url, config) => this.client.get(url, config).then((res) => res.data);

  post = (url, data, config) => this.client.post(url, data, config).then((res) => res.data);

  put = (url, data, config) => this.client.put(url, data, config).then((res) => res.data);

  delete = (url, config) => this.client.delete(url, config).then((res) => res.data);
}
