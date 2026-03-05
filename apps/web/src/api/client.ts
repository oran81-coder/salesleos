export class APIClient {
    private static baseURL = '/api';
    private static token: string | null = localStorage.getItem('token');

    static setToken(token: string | null) {
        this.token = token;
        if (token) localStorage.setItem('token', token);
        else localStorage.removeItem('token');
    }

    private static async request<T>(path: string, options: RequestInit = {}): Promise<T> {
        const headers = new Headers(options.headers);
        if (this.token) {
            headers.set('Authorization', `Bearer ${this.token}`);
        }
        if (options.body && !(options.body instanceof FormData)) {
            headers.set('Content-Type', 'application/json');
        }

        const response = await fetch(`${this.baseURL}${path}`, {
            ...options,
            headers,
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'API request failed');
        }
        return data;
    }

    static get<T>(path: string) {
        return this.request<T>(path, { method: 'GET' });
    }

    static post<T>(path: string, body: any) {
        return this.request<T>(path, {
            method: 'POST',
            body: JSON.stringify(body),
        });
    }

    static patch<T>(path: string, body: any) {
        return this.request<T>(path, {
            method: 'PATCH',
            body: JSON.stringify(body),
        });
    }

    static async getBlob(path: string): Promise<Blob> {
        const headers = new Headers();
        if (this.token) {
            headers.set('Authorization', `Bearer ${this.token}`);
        }

        const response = await fetch(`${this.baseURL}${path}`, {
            method: 'GET',
            headers,
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.message || 'API request failed');
        }

        return response.blob();
    }
}
