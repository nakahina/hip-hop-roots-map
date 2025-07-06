import { NextRequest, NextResponse } from "next/server";

// sharpの動的インポート関数
async function loadSharp() {
  try {
    // 開発環境とVercel環境での異なるsharpの読み込み方法
    const sharp = await import("sharp");
    console.log("🔍 sharp読み込み成功 - バージョン:", sharp.default.versions);
    return sharp.default;
  } catch (error) {
    console.warn(
      "🔍 sharp読み込み失敗:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 アップロードAPI開始 - サムネイル生成付きバージョン");

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

    // AWS S3設定
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
    const originalKey = `artists/${sanitizedArtistName}/original_${fileName}`;
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
    console.log("🔍 オリジナル画像アップロード完了");

    // ベースURLを生成
    const baseUrl =
      process.env.CLOUDFRONT_DOMAIN ||
      `https://${bucketName}.s3.${
        process.env.AWS_REGION || "ap-northeast-1"
      }.amazonaws.com`;

    const originalUrl = `${baseUrl}/${originalKey}`;
    let smallUrl = originalUrl; // デフォルトはオリジナル画像を使用
    let thumbnailGenerated = false;

    // サムネイル画像を生成してアップロード
    const sharp = await loadSharp();
    if (sharp) {
      try {
        console.log("🔍 sharp読み込み成功、サムネイル生成開始");

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
        console.log("🔍 サムネイル画像アップロード完了");

        smallUrl = `${baseUrl}/${smallKey}`;
        thumbnailGenerated = true;
      } catch (sharpError) {
        console.warn(
          "🔍 サムネイル生成に失敗、オリジナル画像を使用:",
          sharpError
        );
        thumbnailGenerated = false;
      }
    } else {
      console.warn(
        "🔍 sharp読み込み失敗、オリジナル画像をサムネイルとして使用"
      );
      thumbnailGenerated = false;
    }

    return NextResponse.json({
      success: true,
      originalUrl,
      smallUrl,
      message: thumbnailGenerated
        ? "画像のアップロードとサムネイル生成が完了しました"
        : "画像のアップロードが完了しました（サムネイル生成はスキップされました）",
      thumbnailGenerated,
      sharpAvailable: sharp !== null,
    });
  } catch (error) {
    console.error("🔍 画像アップロードエラー:", error);
    return NextResponse.json(
      {
        error: "画像のアップロード中にエラーが発生しました",
        detail: error instanceof Error ? error.message : "不明なエラー",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const sharp = await loadSharp();

  return NextResponse.json({
    message: "アップロードAPIは稼働中です",
    method: "GET",
    timestamp: new Date().toISOString(),
    features: ["オリジナル画像アップロード", "サムネイル生成（300x300）"],
    sharpAvailable: sharp !== null,
    environment: process.env.NODE_ENV || "development",
  });
}
