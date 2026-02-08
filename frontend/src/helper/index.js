import { toast } from "react-toastify";
import CryptoJS from "crypto-js";
const SECRET_KEY = import.meta.env.VITE_SECRET_KEY;

export const requestHandler = async (api, setLoading, onSuccess, onError, showToast = true) => {
  try {
    setLoading?.(true);
    const res = await api();
    const { data } = res;

    if (data.success) {
      onSuccess(data);
    }

  } catch (error) {
    if (!error.response) {
      toast.error("Server unreachable or CORS blocked");
      return;
    }

    const code = error.response?.data?.code;

    if (code === "INVALID_ACCESS_TOKEN" || code === "REFRESH_TOKEN_MISMATCH") {
      localStorage.removeItem("token");
      window.location.replace("/");
    }

    // if ([401, 403].includes(error.response?.status)) {
    //   localStorage.removeItem("token"),
    //     window.location.replace("/");
    // }
    if (showToast) {
      toast.error(error.response?.data?.message);
    }



    onError?.(error);
  } finally {
    setLoading?.(false);
  }
}


export const encryptAndStoreLocal = (key, value) => {
  try {
    const stringValue = JSON.stringify(value);

    const encryptedValue = CryptoJS.AES.encrypt(
      stringValue,
      SECRET_KEY
    ).toString();

    localStorage.setItem(key, encryptedValue);
  } catch (error) {
    console.error("Encryption error:", error);
  }
};

export const decryptAndGetLocal = (key) => {
  try {
    const encryptedValue = localStorage.getItem(key);
    if (!encryptedValue) return null;

    const bytes = CryptoJS.AES.decrypt(encryptedValue, SECRET_KEY);
    const decryptedValue = bytes.toString(CryptoJS.enc.Utf8);

    return decryptedValue ? JSON.parse(decryptedValue) : null;
  } catch (error) {
    console.error("Decryption error:", error);
    return null;
  }
};  
