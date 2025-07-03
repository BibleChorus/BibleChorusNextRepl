import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// Base configuration shared across requests
const config: AxiosRequestConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  withCredentials: true,
  timeout: 30000,
};

// Create a typed Axios instance
const apiClient: AxiosInstance = axios.create(config);

// You can add interceptors here if needed
// apiClient.interceptors.response.use(
//   (response) => response,
//   (error) => Promise.reject(error)
// );

export default apiClient;