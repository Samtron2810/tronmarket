import api from "./api";

const uploadImages = async (files) => {
  if (!files || files.length === 0) return [];
  const fd = new FormData();
  files.forEach((f) => fd.append("images", f));
  const res = await api.post("/uploads", fd);
  return res.data.urls || [];
};

export default { uploadImages };
