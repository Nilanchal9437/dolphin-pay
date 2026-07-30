import { cookies } from "next/headers";
import axios, { InternalAxiosRequestConfig } from "axios";
import { generateVoucherToken } from "./generateToken";

const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString(),
    );
    return Date.now() > payload.exp * 1000;
  } catch {
    return true;
  }
};

export const getServerAccessToken = async (): Promise<string> => {
  const cookieStore = await cookies();
  const existing = cookieStore.get("token")?.value;

  if (existing && !isTokenExpired(existing)) {
    return existing;
  }

  return generateVoucherToken();
};

const VoucherAxios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_VOUCHER_BASE_URL,
});

VoucherAxios.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getServerAccessToken();
    config.headers.set("Authorization", `Bearer ${token}`);
    return config;
  },
  (error) => Promise.reject(error),
);

export default VoucherAxios;
