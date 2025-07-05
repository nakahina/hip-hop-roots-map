import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import sharp from "sharp";
import axios from "axios";
import * as dotenv from "dotenv";

// 環境変数をロード
dotenv.config({ path: ".env.local" });
if (!process.env.AWS_ACCESS_KEY_ID) {
  dotenv.config(); // fallback to .env
}

// S3クライアントの設定
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-northeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME!;
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN;

export interface ImageUploadResult {
  originalUrl: string;
  smallUrl: string;
  success: boolean;
  error?: string;
}

/**
 * 画像URLから画像をダウンロードしてS3にアップロード
 */
export async function uploadImageToS3(
  imageUrl: string,
  fileName: string,
  artistName: string
): Promise<ImageUploadResult> {
  try {
    // 画像をダウンロード
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: 30000,
    });

    const imageBuffer = Buffer.from(response.data);
    const contentType = response.headers["content-type"] || "image/jpeg";

    // アーティスト名をファイル名に使用（特殊文字を削除）
    const sanitizedArtistName = artistName
      .replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, "_")
      .replace(/_{2,}/g, "_")
      .replace(/^_|_$/g, "");

    // オリジナル画像をアップロード
    const originalKey = `artists/${sanitizedArtistName}/original_${fileName}`;
    const originalUpload = new Upload({
      client: s3Client,
      params: {
        Bucket: BUCKET_NAME,
        Key: originalKey,
        Body: imageBuffer,
        ContentType: contentType,
        CacheControl: "max-age=31536000", // 1年
      },
    });

    await originalUpload.done();

    // 小さな画像を作成してアップロード
    const smallImageBuffer = await sharp(imageBuffer)
      .resize(300, 300, {
        fit: "cover",
        position: "center",
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    const smallKey = `artists/${sanitizedArtistName}/small_${fileName}`;
    const smallUpload = new Upload({
      client: s3Client,
      params: {
        Bucket: BUCKET_NAME,
        Key: smallKey,
        Body: smallImageBuffer,
        ContentType: "image/jpeg",
        CacheControl: "max-age=31536000", // 1年
      },
    });

    await smallUpload.done();

    // URLを生成
    const baseUrl =
      CLOUDFRONT_DOMAIN ||
      `https://${BUCKET_NAME}.s3.${
        process.env.AWS_REGION || "ap-northeast-1"
      }.amazonaws.com`;
    const originalUrl = `${baseUrl}/${originalKey}`;
    const smallUrl = `${baseUrl}/${smallKey}`;

    return {
      originalUrl,
      smallUrl,
      success: true,
    };
  } catch (error) {
    console.error("S3アップロードエラー:", error);
    return {
      originalUrl: "",
      smallUrl: "",
      success: false,
      error: error instanceof Error ? error.message : "不明なエラー",
    };
  }
}

/**
 * 複数の画像を並行してアップロード
 */
export async function uploadMultipleImages(
  images: Array<{
    url: string;
    fileName: string;
    artistName: string;
  }>
): Promise<ImageUploadResult[]> {
  const uploadPromises = images.map(({ url, fileName, artistName }) =>
    uploadImageToS3(url, fileName, artistName)
  );

  return Promise.all(uploadPromises);
}

/**
 * ファイル名を生成（URLから）
 */
export function generateFileNameFromUrl(url: string): string {
  try {
    const urlParts = new URL(url);
    const pathParts = urlParts.pathname.split("/");
    const lastPart = pathParts[pathParts.length - 1];

    // 拡張子がない場合は.jpgを追加
    if (!lastPart.includes(".")) {
      return `${lastPart}.jpg`;
    }

    return lastPart;
  } catch {
    // URLが無効な場合はタイムスタンプを使用
    return `image_${Date.now()}.jpg`;
  }
}
