import axios from 'axios';

// Create an axios instance
const api = axios.create({
	baseURL: 'http://localhost:5001/api', // Change to your backend URL
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem('authToken');
		if (token) {
			config.headers['Authorization'] = `Bearer ${token}`;
		}
		return config;
	},
	(error) => Promise.reject(error)
);

export default api;
