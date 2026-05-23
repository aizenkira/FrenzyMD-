const axios = require("axios");
const FormData = require("form-data");

/**
 * Upload buffer to tmpfiles.org
 * @param {Buffer} buffer - isi file
 * @param {Object} opts
 * @param {string} opts.filename - required, mis: "image.jpg" / "video.mp4" / "audio.mp3"
 * @param {string} [opts.contentType] - optional, mis: "image/jpeg"
 * @param {number} [opts.timeoutMs=60000]
 * @returns {Promise<{url:string,directUrl:string}>}
 */
async function uploadToTmpFiles(buffer, opts) {
  if (!Buffer.isBuffer(buffer)) throw new Error("buffer must Buffer");
  if (!opts?.filename) throw new Error("opts.filename required (example: image.jpg)");

  const form = new FormData();
  form.append("file", buffer, {
    filename: opts.filename,
    contentType: opts.contentType || "application/octet-stream",
    knownLength: buffer.length,
  });

  const res = await axios.post("https://tmpfiles.org/api/v1/upload", form, {
    headers: {
      ...form.getHeaders(),
      Accept: "application/json",
    },
    timeout: opts.timeoutMs ?? 60_000,
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    validateStatus: () => true,
  })
  if (res.status < 200 || res.status >= 300) {
    throw new Error(
      `Upload failed (HTTP ${res.status}): ${
        typeof res.data === "string" ? res.data : JSON.stringify(res.data)
      }`
    );
  }
  const url = res.data?.data?.url;
  if (!url) throw new Error("Response no there is data.url");
  const directUrl = url.replace("http://tmpfiles.org/", "https://tmpfiles.org/dl/");
  return { url, directUrl };
}

module.exports = { uploadToTmpFiles };