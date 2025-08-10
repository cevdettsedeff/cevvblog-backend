import fs from "fs";
import path from "path";
import Minio from "minio";

const localStoragePath = path.join(__dirname, "../../../uploads");

// Local Storage Driver
const LocalStorage = {
  upload: async (filePath: string, buffer: Buffer) => {
    const dest = path.join(localStoragePath, filePath);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, buffer);
    console.log(`📁 [Local] File saved: ${dest}`);
  },
};

// MinIO Client
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_HOST || "localhost",
  port: Number(process.env.MINIO_PORT) || 9000,
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || "minio",
  secretKey: process.env.MINIO_SECRET_KEY || "minio123",
});

// MinIO Storage Driver
const MinioStorage = {
  upload: async (filePath: string, buffer: Buffer) => {
    await minioClient.putObject(process.env.MINIO_BUCKET!, filePath, buffer);
    console.log(`☁️ [MinIO] File uploaded: ${filePath}`);
  },
};

let storage: typeof MinioStorage | typeof LocalStorage = LocalStorage;
let usingMinio = false;

// Bağlantı testi fonksiyonu
async function tryConnectToMinio() {
  try {
    await minioClient.listBuckets();
    if (!usingMinio) {
      console.log("✅ MinIO connection established. Switching to cloud storage.");
      storage = MinioStorage;
      usingMinio = true;
    }
  } catch {
    if (usingMinio) {
      console.warn("⚠️ MinIO connection lost. Switching to local storage.");
      storage = LocalStorage;
      usingMinio = false;
    }
  }
}

// Başlangıçta ve periyodik kontrol
async function initStorage() {
  await tryConnectToMinio();
  setInterval(tryConnectToMinio, 30_000); // her 30 saniyede bir kontrol
}

export { initStorage, storage };
