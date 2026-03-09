import axios from 'axios'

// ðŸ” LOG 1: Verificar variÃ¡vel de ambiente durante o build
const envApiUrl = process.env.NEXT_PUBLIC_API_URL;
const finalBaseUrl = envApiUrl || '/api';

console.log('ðŸ” [API Config] Environment variable:', envApiUrl);
console.log('ðŸ” [API Config] Final base URL:', finalBaseUrl);
console.log('ðŸ” [API Config] Node env:', process.env.NODE_ENV);

const api = axios.create({
  baseURL: finalBaseUrl,
})

// ðŸ” LOG 2: Interceptar todas as requisiÃ§Ãµes
api.interceptors.request.use(config => {
  const fullUrl = `${config.baseURL}${config.url}`;
  console.log('ðŸš€ [REQUEST] Method:', config.method?.toUpperCase());
  console.log('ðŸš€ [REQUEST] Base URL:', config.baseURL);
  console.log('ðŸš€ [REQUEST] Endpoint:', config.url);
  console.log('ðŸš€ [REQUEST] Full URL:', fullUrl);
  
  const token = localStorage.getItem('valora_token')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  const companyId = localStorage.getItem('valora_company_id')
  if (companyId && config.headers && !config.headers['X-Company-Id']) {
    config.headers['X-Company-Id'] = companyId
  }
  return config
});

// ðŸ” LOG 3: Interceptar todas as respostas (incluindo erros)
api.interceptors.response.use(
  response => {
    console.log('âœ… [RESPONSE] Status:', response.status);
    console.log('âœ… [RESPONSE] URL:', response.config.url);
    console.log('âœ… [RESPONSE] Data:', response.data);
    return response;
  },
  error => {
    console.error('âŒ [ERROR] Status:', error.response?.status);
    console.error('âŒ [ERROR] URL:', error.config?.url);
    console.error('âŒ [ERROR] Full URL:', `${error.config?.baseURL}${error.config?.url}`);
    console.error('âŒ [ERROR] Response:', error.response?.data);
    console.error('âŒ [ERROR] Message:', error.message);
    return Promise.reject(error);
  }
);

export default api


