import axios from "axios";
import { decryptAndGetLocal, encryptAndStoreLocal } from "../helper";
import.meta.env.VITE_BACKEND_URL;

export const apiClient = axios.create({
    baseURL: `${import.meta.env.VITE_BACKEND_URL}/api`,
    timeout: 120000,
    withCredentials: true,
});

const isAuthRoute = (url) => {
    return url.includes("/auth/login") ||
        url.includes("/auth/register") ||
        url.includes("/auth/refresh-token") ||
        url.includes("/auth/send-otp") ||
        url.includes("/auth/verify-otp");
};


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

let isRefreshing = false;
let refreshSubscribers = [];

function onRefreshed(token) {
    refreshSubscribers.forEach(cb => cb(token));
    refreshSubscribers = [];
}

function addSubscriber(cb) {
    refreshSubscribers.push(cb);
}

function forceLogout() {
    localStorage.removeItem("token");
    window.location.href = "/";
}

apiClient.interceptors.response.use(
    (response) => response,

    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;
        const code = error.response?.data?.code;


        if (isAuthRoute(originalRequest.url)) {
            return Promise.reject(error);
        }

        if (
            status === 401 &&
            code === "ACCESS_TOKEN_EXPIRED" &&
            !originalRequest._retry
        ) {
            originalRequest._retry = true;

            if (isRefreshing) {
                return new Promise(resolve => {
                    addSubscriber((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        resolve(apiClient(originalRequest));
                    });
                });
            }

            isRefreshing = true;

            try {
                const res = await apiClient.post("/user/auth/refresh-token");

                const newToken = res.data.data.accessToken;
                encryptAndStoreLocal("token", { token: newToken });

                onRefreshed(newToken);

                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return apiClient(originalRequest);

            } catch (err) {
                forceLogout();
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);


// User Authentication APIs

export const userLogin = (data) => {
    return apiClient.post("/user/auth/login", data);
}

export const loginAndRegisterWithGoogle = (data) => {
    return apiClient.post("/user/auth/google", data);
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

// User Management APIs

export const getAllUsers = ({ page, perPage, search }) => {
    let url = `/user/users?page=${page}&limit=${perPage}`;
    if (search) {
        url += `&search=${search}`;
    }
    return apiClient.get(url);
}

// Chat Management APIs

export const getAllChats = ({ page, perPage, search }) => {
    let url = `/chats/chats-list?page=${page}&limit=${perPage}`;
    if (search) {
        url += `&search=${search}`;
    }
    return apiClient.get(url);
}

export const accessChat = (data) => {
    return apiClient.post("/chats/create-chat", data);
}

export const getChatMessages = (id, { page, perPage }) => {
    let url = `/chats/messages/${id}?page=${page}&limit=${perPage}`;
    return apiClient.get(url);
}

export const markAsRead = (id) => {
    let url = `/chats/messages/${id}/read`;
    return apiClient.put(url);
}
