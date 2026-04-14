import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api';

// Create a central axios instance
const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// REQUEST INTERCEPTOR: Automatically attach JWT token to every request
apiClient.interceptors.request.use(
    (config: any) => {
        const token = localStorage.getItem('dgg_token');
        
        // Only attach token if it exists and the request doesn't explicitly skip it
        // (Internal metadata can be added to config to skip if needed)
        if (token && !config.headers.hasOwnProperty('Authorization')) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// RESPONSE INTERCEPTOR: Handle global errors like 401 Unauthorized
apiClient.interceptors.response.use(
    (response) => {
        // Handle the { success: true, data: ..., message: ... } wrapper from our Django backend
        if (response.data && response.data.hasOwnProperty('success')) {
            if (!response.data.success) {
                return Promise.reject({
                    message: response.data.message || 'Action failed',
                    data: response.data.data
                });
            }
            return response.data.data;
        }

        // Handle DRF global pagination wrappers invisibly
        if (response.data && response.data.hasOwnProperty('results') && Array.isArray(response.data.results)) {
            return response.data.results;
        }

        return response.data;
    },
    (error) => {
        // Handle 401: Unauthorized (Token expired or missing)
        if (error.response && error.response.status === 401) {
            console.error('Unauthorized session detected. Redirecting to login.');
            
            // Avoid infinite redirect loop if already on login page
            if (!window.location.pathname.includes('/signin') && !window.location.pathname.includes('/internal/login')) {
                localStorage.removeItem('dgg_token');
                localStorage.removeItem('dgg_role');
                window.location.href = window.location.pathname.startsWith('/staff') ? '/internal/login' : '/signin';
            }
        }
        
        return Promise.reject({
            status: error.response?.status,
            message: error.response?.data?.message || error.response?.data?.detail || 'An error occurred',
            data: error.response?.data?.data || error.response?.data
        });
    }
);

class API {
    // Auth
    static login(data: { email: string; password: string }) {
        return apiClient.post('/auth/login/', {
            email: data.email,
            password: data.password
        });
    }

    static register(data: any) {
        const payload = {
            email: data.email,
            password: data.password,
            full_name: `${data.firstName} ${data.lastName}`,
            phone: data.phone || '',
            role: data.role || 'student',
            dob: data.dob || '',
            beneficiary_number: data.beneficiaryNo || '',
            treaty_number: data.treatyNum || ''
        };
        return apiClient.post('/auth/register/', payload);
    }

    static getMe() {
        return apiClient.get('/auth/me/');
    }

    static updateMe(data: any) {
        return apiClient.put('/auth/me/', data);
    }

    // Programs
    static getPrograms() {
        return apiClient.get('/programs/');
    }

    static getProgram(id: number) {
        return apiClient.get(`/programs/${id}/`);
    }

    // Forms
    static getForms() {
        return apiClient.get('/forms/forms/');
    }

    static getForm(id: number) {
        return apiClient.get(`/forms/forms/${id}/`);
    }

    static submitForm(formId: number, answers: any[] | FormData) {
        const headers = answers instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
        return apiClient.post(`/forms/forms/${formId}/submit/`, 
            answers instanceof FormData ? answers : { answers },
            { headers }
        );
    }

    // Submissions
    static getSubmissions() {
        return apiClient.get('/forms/submissions/');
    }

    static getSubmission(id: number) {
        return apiClient.get(`/forms/submissions/${id}/`);
    }

    static updateSubmissionStatus(id: number, status: string, additionalData: any = {}) {
        return apiClient.put(`/forms/submissions/${id}/status/`, { status, ...additionalData });
    }

    static addSubmissionNote(id: number, text: string) {
        return apiClient.post(`/forms/submissions/${id}/notes/`, { text });
    }

    // Notifications
    static getNotifications() {
        const isInternal = window.location.pathname.startsWith('/staff');
        return apiClient.get('/notifications/notifications/', { params: { portal: isInternal ? 'internal' : 'student' } });
    }

    static markNotificationRead(id: number) {
        return apiClient.post(`/notifications/notifications/${id}/read/`);
    }

    static markAllNotificationsRead() {
        return apiClient.post('/notifications/notifications/read-all/');
    }

    // User Documents
    static getUserDocuments() {
        return apiClient.get('/user-documents/');
    }

    static uploadUserDocument(formData: FormData) {
        return apiClient.post('/user-documents/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }

    static deleteUserDocument(id: number) {
        return apiClient.delete(`/user-documents/${id}/`);
    }

    // Dashboard Stats (Admin)
    static getDashboardStats() {
        return apiClient.get('/dashboard/stats/');
    }

    // Support for complex wizards
    static async submitApplication(data: any) {
        const forms = await this.getForms() as any[];
        const form = forms.find((f: any) => f.title.toLowerCase().includes(data.form_type.toLowerCase()));
        
        if (!form) {
            throw new Error(`Form template '${data.form_type}' not found.`);
        }

        const answers = data.form_data instanceof FormData 
            ? data.form_data 
            : this.mapFormDataToAnswers(data.form_data);

        return this.submitForm(form.id, answers);
    }

    private static mapFormDataToAnswers(formData: any) {
        return Object.entries(formData).map(([key, value]) => ({
            field_label: key,
            answer_text: typeof value === 'object' ? JSON.stringify(value) : String(value)
        }));
    }
}

export default API;
