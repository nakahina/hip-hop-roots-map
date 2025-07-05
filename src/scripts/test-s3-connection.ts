import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";

// 環境変数をロード
dotenv.config({ path: ".env.local" });

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-northeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME!;

async function testS3Connection() {
  try {
    console.log("🔍 S3接続テストを開始します...");
    console.log(`バケット名: ${BUCKET_NAME}`);
    console.log(`リージョン: ${process.env.AWS_REGION}`);

    // 1. バケットの存在確認
    console.log("\n1. バケットの存在確認...");
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      MaxKeys: 1,
    });

    const listResponse = await s3Client.send(listCommand);
    console.log("✅ バケットへのアクセス成功");

    // 2. テストファイルのアップロード
    console.log("\n2. テストファイルのアップロード...");
    const testContent = `テスト実行日時: ${new Date().toISOString()}`;
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: "test/connection-test.txt",
      Body: testContent,
      ContentType: "text/plain",
    });

    await s3Client.send(uploadCommand);
    console.log("✅ ファイルのアップロード成功");

    // 3. URL生成
    const baseUrl =
      process.env.CLOUDFRONT_DOMAIN ||
      `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;
    const testUrl = `${baseUrl}/test/connection-test.txt`;

    console.log("\n📋 テスト結果:");
    console.log(`✅ S3接続: 正常`);
    console.log(`✅ アップロード: 正常`);
    console.log(`📄 テストファイルURL: ${testUrl}`);
    console.log("\n🎉 すべてのテストが成功しました！");
  } catch (error) {
    console.error("\n❌ S3接続テストに失敗しました:");
    console.error(error);
    console.log("\n🔧 確認項目:");
    console.log("- AWS_ACCESS_KEY_ID が正しく設定されているか");
    console.log("- AWS_SECRET_ACCESS_KEY が正しく設定されているか");
    console.log("- S3_BUCKET_NAME が正しく設定されているか");
    console.log("- IAMユーザーに適切な権限が付与されているか");
    console.log("- バケットポリシーが正しく設定されているか");
  }
}

// 実行
testS3Connection();
