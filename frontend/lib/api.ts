import axios from "axios";

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
});

export const analyzeProfile = async (payload: any) => {
  const res = await API.post("/api/analysis/analyze", payload);
  return res.data;
};

export const saveProfile = async (payload: any) => {
  const res = await API.post("/api/profile/save", payload);
  return res.data;
};

export const exportPdf = async (payload: any) => {
  const res = await API.post("/api/export/pdf", payload, {
    responseType: "blob",
  });
  return res;
};

export const exportDocx = async (payload: any) => {
  const res = await API.post("/api/export/docx", payload, {
    responseType: "blob",
  });
  return res;
};

export const discoverJobs = async (payload: any) => {
  const res = await API.post("/api/jobs/discover", payload);
  return res.data;
};

export const prepareForJob = async (payload: any) => {
  const res = await API.post("/api/preparation/plan", payload);
  return res.data;
};
