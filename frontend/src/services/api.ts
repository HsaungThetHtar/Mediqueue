// API configuration and helper functions
const API_BASE_URL = 'http://localhost:5001/api';

// Get token from localStorage
const getToken = () => {
  return localStorage.getItem('authToken');
};

// Generic fetch wrapper with error handling
async function apiCall(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

if (!response.ok) {
  const text = await response.text();   // ✅ safer
  console.error('Server response:', text);

  try {
    const error = JSON.parse(text);
    throw new Error(error.msg || `API Error: ${response.statusText}`);
  } catch {
    throw new Error(`API Error: ${response.statusText}`);
  }
}

  return await response.json();
}

// Auth APIs
export const authApi = {
  register: (name: string, email: string, password: string, phone: string, dateOfBirth: string) =>
    apiCall('/patients/register', 'POST', { name, email, password, phone, dateOfBirth }),
  
  login: (email: string, password: string) =>
    apiCall('/patients/login', 'POST', { email, password }),
  
  getProfile: () =>
    apiCall('/patients/profile', 'GET'),
};

// Doctor APIs
export const doctorApi = {
  getAllDepartments: () =>
    apiCall('/doctors/departments/all', 'GET'),
  
  getDoctorsByDepartment: (departmentName: string) =>
    apiCall(`/doctors/by-department/${departmentName}`, 'GET'),
  
  getDoctorById: (doctorId: string) =>
    apiCall(`/doctors/${doctorId}`, 'GET'),
};

// Patient Queue APIs
export const queueApi = {
  getDepartments: () =>
    apiCall('/patients/departments', 'GET'),
  
  getDoctorsByDepartment: (departmentId: string) =>
    apiCall(`/patients/departments/${departmentId}/doctors`, 'GET'),
  
  checkAvailability: (departmentId: string, doctorId: string, appointmentDate: string) =>
    apiCall('/patients/check-availability', 'POST', {
      departmentId,
      doctorId,
      appointmentDate,
    }),
  
  createBooking: (departmentId: string, doctorId: string, session: 'MORNING' | 'AFTERNOON', appointmentDate: string) =>
    apiCall('/patients/book-queue', 'POST', {
      departmentId,
      doctorId,
      session,
      appointmentDate,
    }),
  
  getMyBookings: () =>
    apiCall('/patients/my-bookings', 'GET'),
  
  getBookingDetails: (bookingId: string) =>
    apiCall(`/patients/booking/${bookingId}`, 'GET'),
  
  cancelBooking: (bookingId: string) =>
    apiCall(`/patients/booking/${bookingId}/cancel`, 'PUT'),
  
  getQueueStatus: (bookingId: string) =>
    apiCall(`/patients/queue-status/${bookingId}`, 'GET'),
};

// Utility function to save token
export const saveAuthToken = (token: string) => {
  localStorage.setItem('authToken', token);
};

// Utility function to clear token
export const clearAuthToken = () => {
  localStorage.removeItem('authToken');
};

// Utility function to check if user is authenticated
export const isAuthenticated = () => {
  return !!getToken();
};
