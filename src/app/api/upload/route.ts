import { NextRequest, NextResponse } from "next/server";
import { uploadImageToS3, generateFileNameFromUrl } from "@/utils/s3-upload";
import sharp from "sharp";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const artistName = formData.get("artistName") as string;

    if (!file) {
      return NextResponse.json(
        { error: "ファイルが選択されていません" },
        { status: 400 }
      );
    }

    if (!artistName) {
      return NextResponse.json(
        { error: "アーティスト名が必要です" },
        { status: 400 }
      );
    }

    // ファイルタイプの検証
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "画像ファイルのみアップロード可能です" },
        { status: 400 }
      );
    }

    // ファイルサイズの検証 (5MB制限)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "ファイルサイズが大きすぎます（5MB以下にしてください）" },
        { status: 400 }
      );
    }

    // ファイルをBufferに変換
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ファイル名を生成（拡張子を保持）
    const fileExtension = file.name.split(".").pop() || "jpg";
    const fileName = `${Date.now()}.${fileExtension}`;

    // アーティスト名をファイル名に使用（特殊文字を削除）
    const sanitizedArtistName = artistName
      .replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, "_")
      .replace(/_{2,}/g, "_")
      .replace(/^_|_$/g, "");

    // オリジナル画像をS3にアップロード
    const originalKey = `artists/${sanitizedArtistName}/original_${fileName}`;
    const { Upload } = await import("@aws-sdk/lib-storage");
    const { S3Client } = await import("@aws-sdk/client-s3");

    const s3Client = new S3Client({
      region: process.env.AWS_REGION || "ap-northeast-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const bucketName = process.env.S3_BUCKET_NAME!;

    // オリジナル画像をアップロード
    const originalUpload = new Upload({
      client: s3Client,
      params: {
        Bucket: bucketName,
        Key: originalKey,
        Body: buffer,
        ContentType: file.type,
        CacheControl: "max-age=31536000", // 1年
      },
    });

    await originalUpload.done();

    // 小さな画像を作成してアップロード
    const smallImageBuffer = await sharp(buffer)
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
        Bucket: bucketName,
        Key: smallKey,
        Body: smallImageBuffer,
        ContentType: "image/jpeg",
        CacheControl: "max-age=31536000", // 1年
      },
    });

    await smallUpload.done();

    // URLを生成
    const baseUrl =
      process.env.CLOUDFRONT_DOMAIN ||
      `https://${bucketName}.s3.${
        process.env.AWS_REGION || "ap-northeast-1"
      }.amazonaws.com`;

    const originalUrl = `${baseUrl}/${originalKey}`;
    const smallUrl = `${baseUrl}/${smallKey}`;

    return NextResponse.json({
      success: true,
      originalUrl,
      smallUrl,
      message: "画像のアップロードが完了しました",
    });
  } catch (error) {
    console.error("画像アップロードエラー:", error);
    return NextResponse.json(
      {
        error: "画像のアップロード中にエラーが発生しました",
        detail: error instanceof Error ? error.message : "不明なエラー",
      },
      { status: 500 }
    );
  }
}
