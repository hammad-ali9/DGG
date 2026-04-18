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
        
        if (token && !config.headers.hasOwnProperty('Authorization')) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Track whether a token refresh is already in progress to avoid parallel refresh calls
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
    refreshSubscribers.push(cb);
};

const onTokenRefreshed = (newToken: string) => {
    refreshSubscribers.forEach(cb => cb(newToken));
    refreshSubscribers = [];
};

const redirectToLogin = () => {
    localStorage.removeItem('dgg_token');
    localStorage.removeItem('dgg_refresh');
    localStorage.removeItem('dgg_role');
    const isStaff = window.location.pathname.startsWith('/staff');
    window.location.href = isStaff ? '/internal/login' : '/signin';
};

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
    async (error) => {
        const originalRequest = error.config;

        // Handle 401: attempt token refresh before giving up
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Don't try to refresh if we're already on a login page or this is the refresh call itself
            const isAuthEndpoint = originalRequest.url?.includes('/auth/login/') || originalRequest.url?.includes('/auth/token/refresh/');
            if (isAuthEndpoint) {
                redirectToLogin();
                return Promise.reject(error);
            }

            if (isRefreshing) {
                // Queue this request until the refresh completes
                return new Promise((resolve) => {
                    subscribeTokenRefresh((newToken: string) => {
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        resolve(apiClient(originalRequest));
                    });
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = localStorage.getItem('dgg_refresh');
            if (!refreshToken) {
                isRefreshing = false;
                redirectToLogin();
                return Promise.reject(error);
            }

            try {
                const refreshResponse = await axios.post(`${BASE_URL}/auth/token/refresh/`, {
                    refresh: refreshToken,
                });

                // Handle our api_response wrapper
                const responseData = refreshResponse.data?.data || refreshResponse.data;
                const newAccessToken = responseData?.access;

                if (!newAccessToken) {
                    throw new Error('No access token in refresh response');
                }

                localStorage.setItem('dgg_token', newAccessToken);
                apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
                onTokenRefreshed(newAccessToken);
                isRefreshing = false;

                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return apiClient(originalRequest);
            } catch (refreshError) {
                isRefreshing = false;
                refreshSubscribers = [];
                redirectToLogin();
                return Promise.reject(refreshError);
            }
        }
        
        return Promise.reject({
            status: error.response?.status,
            message: error.response?.data?.message || error.response?.data?.detail || 'An error occurred',
            data: error.response?.data?.data || error.response?.data
        });
    }
);

// The axios interceptor unwraps the response body at runtime, so all API calls
// resolve to `any` (the actual data) rather than AxiosResponse. We cast the
// return type here so TypeScript agrees with what the interceptor produces.
type ApiPromise<T = any> = Promise<T>;

class API {
    // Auth
    static login(data: { email: string; password: string }): ApiPromise {
        return apiClient.post('/auth/login/', {
            email: data.email,
            password: data.password
        }) as ApiPromise;
    }

    static register(data: any): ApiPromise {
        const payload = {
            email: data.email,
            password: data.password,
            full_name: `${data.firstName} ${data.lastName}`,
            phone: data.phone || '',
            // role is intentionally omitted — backend forces 'student'
            dob: data.dob || '',
            beneficiary_number: data.beneficiaryNo || '',
            treaty_number: data.treatyNum || ''
        };
        return apiClient.post('/auth/register/', payload) as ApiPromise;
    }

    static getMe(): ApiPromise<{ full_name: string; role: string; email: string; beneficiary_number?: string; [key: string]: any }> {
        return apiClient.get('/auth/me/') as ApiPromise;
    }

    static updateMe(data: any): ApiPromise {
        return apiClient.put('/auth/me/', data) as ApiPromise;
    }

    // Programs
    static getPrograms(): ApiPromise<any[]> {
        return apiClient.get('/programs/') as ApiPromise;
    }

    static getProgram(id: number): ApiPromise {
        return apiClient.get(`/programs/${id}/`) as ApiPromise;
    }

    // Forms
    static getForms(): ApiPromise<any[]> {
        return apiClient.get('/forms/forms/') as ApiPromise;
    }

    static getForm(id: number): ApiPromise {
        return apiClient.get(`/forms/forms/${id}/`) as ApiPromise;
    }

    static submitForm(formId: number, answers: any[] | FormData): ApiPromise {
        const headers = answers instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
        return apiClient.post(`/forms/forms/${formId}/submit/`, 
            answers instanceof FormData ? answers : { answers },
            { headers }
        ) as ApiPromise;
    }

    // Submissions
    static getSubmissions(): ApiPromise<any[]> {
        return apiClient.get('/forms/submissions/') as ApiPromise;
    }

    static getSubmission(id: number): ApiPromise {
        return apiClient.get(`/forms/submissions/${id}/`) as ApiPromise;
    }

    static updateSubmissionStatus(id: number, status: string, additionalData: any = {}): ApiPromise {
        return apiClient.put(`/forms/submissions/${id}/status/`, { status, ...additionalData }) as ApiPromise;
    }

    static addSubmissionNote(id: number, text: string): ApiPromise {
        return apiClient.post(`/forms/submissions/${id}/notes/`, { text }) as ApiPromise;
    }

    static escalateAppeal(id: number, escalationLevel: string, reason: string = ''): ApiPromise {
        return apiClient.post(`/forms/submissions/${id}/escalate/`, { escalation_level: escalationLevel, reason }) as ApiPromise;
    }

    // Policy Endpoints
    static calculateFunding(stream: string, status: string, dependentCount: number = 0): ApiPromise {
        return apiClient.post('/forms/calculate-funding/', {
            stream,
            status,
            dependent_count: dependentCount
        }) as ApiPromise;
    }

    static validateCompliance(formType: string, submissionData: any): ApiPromise {
        return apiClient.post('/forms/validate-compliance/', {
            form_type: formType,
            submission_data: submissionData
        }) as ApiPromise;
    }

    static getPaymentSchedule(submissionId: number): ApiPromise<any[]> {
        return apiClient.get(`/forms/payment-schedule/?submission_id=${submissionId}`) as ApiPromise;
    }

    static getFormBTracking(submissionId: number): ApiPromise {
        return apiClient.get(`/forms/form-b-tracking/?submission_id=${submissionId}`) as ApiPromise;
    }

    static getDecisionLetter(submissionId: number): ApiPromise {
        return apiClient.get(`/forms/submissions/${submissionId}/decision-letter/`) as ApiPromise;
    }

    static approveLateSubmission(submissionId: number): ApiPromise {
        return apiClient.post(`/forms/submissions/${submissionId}/approve-late/`) as ApiPromise;
    }

    static escalateAppealToLevel(submissionId: number, escalationLevel: string): ApiPromise {
        return apiClient.post(`/forms/submissions/${submissionId}/escalate/`, {
            escalation_level: escalationLevel
        }) as ApiPromise;
    }

    static getBudgetStatus(): ApiPromise {
        return apiClient.get('/forms/budget-status/') as ApiPromise;
    }

    // Notifications
    static getNotifications(): ApiPromise<any[]> {
        const isInternal = window.location.pathname.startsWith('/staff');
        return apiClient.get('/notifications/notifications/', { params: { portal: isInternal ? 'internal' : 'student' } }) as ApiPromise;
    }

    static markNotificationRead(id: number): ApiPromise {
        return apiClient.post(`/notifications/notifications/${id}/read/`) as ApiPromise;
    }

    static markAllNotificationsRead(): ApiPromise {
        return apiClient.post('/notifications/notifications/read-all/') as ApiPromise;
    }

    // User Documents
    static getUserDocuments(): ApiPromise<any[]> {
        return apiClient.get('/user-documents/') as ApiPromise;
    }

    static uploadUserDocument(formData: FormData): ApiPromise {
        return apiClient.post('/user-documents/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }) as ApiPromise;
    }

    static deleteUserDocument(id: number): ApiPromise {
        return apiClient.delete(`/user-documents/${id}/`) as ApiPromise;
    }

    // Dashboard Stats (Admin)
    static getDashboardStats(): ApiPromise {
        return apiClient.get('/dashboard/stats/') as ApiPromise;
    }

    // Support for complex wizards
    static async submitApplication(data: any): ApiPromise {
        const forms = await this.getForms();
        // Use exact case-insensitive match to avoid fuzzy title collisions
        const form = forms.find((f: any) => f.title.toLowerCase() === data.form_type.toLowerCase())
            ?? forms.find((f: any) => f.title.toLowerCase().includes(data.form_type.toLowerCase()));
        
        if (!form) {
            throw new Error(`Form template '${data.form_type}' not found. Available forms: ${forms.map((f: any) => f.title).join(', ')}`);
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
