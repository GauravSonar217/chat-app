import axios from "axios";
import.meta.env.VITE_BACKEND_URL;

export const apiClient = axios.create({
    baseURL: `${import.meta.env.VITE_BACKEND_URL}/api`,
    timeout: 120000,
});

apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);


export const userLogin = (data) => {
    return apiClient.post("/user/auth/login", data);
}

export const userRegister = (data) => {
    return apiClient.post("/user/auth/register", data);
}

export const userLogout = () => {
    return apiClient.post("/user/auth/logout");
}

export const verifyEmail = (data) => {
    return apiClient.post("/user/auth/verify-email", data);
}