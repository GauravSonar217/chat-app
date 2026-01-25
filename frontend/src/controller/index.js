import axios from "axios";
import { decryptAndGetLocal } from "../helper";
import.meta.env.VITE_BACKEND_URL;

export const apiClient = axios.create({
    baseURL: `${import.meta.env.VITE_BACKEND_URL}/api`,
    timeout: 120000,
});

apiClient.interceptors.request.use(
    (config) => {
        const data = decryptAndGetLocal("token");
        const token = data ? data.token : null;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// User Authentication APIs

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

export const sendOTP = (data) => {
    return apiClient.post("/user/auth/send-otp", data);
}

export const verifyOtp = (data) => {
    return apiClient.post("/user/auth/verify-otp", data);
}

export const resetPassword = (data) => {
    return apiClient.post("/user/auth/change-password", data);
}