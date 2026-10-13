import api from "./api";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const uploadImages = async (files) => {
  if (!files || files.length === 0) return [];
  if (files.length > 5) {
    throw new Error("Please upload at most 5 images at a time");
  }
  for (const file of files) {
    if (!ALLOWED_TYPES.has(file.type)) {
      throw new Error("Only JPG, PNG, WebP or GIF images are allowed");
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error("Each image must be 5 MB or smaller");
    }
  }
  const fd = new FormData();
  files.forEach((f) => fd.append("images", f));
  const res = await api.post("/uploads", fd);
  return res.data.urls || [];
};

export default { uploadImages };
