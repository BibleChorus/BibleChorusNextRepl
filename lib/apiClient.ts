import { attachApiToken } from './client-auth';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// Base configuration shared across requests
const config: AxiosRequestConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  withCredentials: true,
  timeout: 30000,
};

// Create a typed Axios instance
const apiClient: AxiosInstance = axios.create(config);

apiClient.interceptors.request.use(attachApiToken);

export default apiClient;
