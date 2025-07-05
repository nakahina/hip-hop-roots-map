import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { artists } from "../db/schema";
import { uploadImageToS3, generateFileNameFromUrl } from "../utils/s3-upload";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";

// 環境変数をロード
dotenv.config({ path: ".env.local" });
if (!process.env.DATABASE_URL) {
  dotenv.config(); // fallback to .env
}

// データベース接続
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

interface MigrationResult {
  artistId: number;
  artistName: string;
  success: boolean;
  error?: string;
  originalUrl?: string;
  smallUrl?: string;
}

/**
 * 単一のアーティストの画像を移行
 */
async function migrateArtistImages(artist: {
  id: number;
  name: string;
  originalImage: string | null;
  smallImage: string | null;
}): Promise<MigrationResult> {
  try {
    console.log(`画像移行開始: ${artist.name}`);

    // 既にS3のURLの場合はスキップ
    if (artist.originalImage && !artist.originalImage.includes("i.scdn.co")) {
      console.log(`スキップ: ${artist.name} - 既に移行済み`);
      return {
        artistId: artist.id,
        artistName: artist.name,
        success: true,
      };
    }

    // 画像URLがない場合はスキップ
    if (!artist.originalImage) {
      console.log(`スキップ: ${artist.name} - 画像URLがありません`);
      return {
        artistId: artist.id,
        artistName: artist.name,
        success: true,
      };
    }

    // ファイル名を生成
    const fileName = generateFileNameFromUrl(artist.originalImage);

    // S3にアップロード
    const uploadResult = await uploadImageToS3(
      artist.originalImage,
      fileName,
      artist.name
    );

    if (!uploadResult.success) {
      throw new Error(uploadResult.error || "不明なエラー");
    }

    // データベースを更新
    await db
      .update(artists)
      .set({
        originalImage: uploadResult.originalUrl,
        smallImage: uploadResult.smallUrl,
        updatedAt: new Date(),
      })
      .where(eq(artists.id, artist.id));

    console.log(`移行完了: ${artist.name}`);
    return {
      artistId: artist.id,
      artistName: artist.name,
      success: true,
      originalUrl: uploadResult.originalUrl,
      smallUrl: uploadResult.smallUrl,
    };
  } catch (error) {
    console.error(`移行エラー: ${artist.name}`, error);
    return {
      artistId: artist.id,
      artistName: artist.name,
      success: false,
      error: error instanceof Error ? error.message : "不明なエラー",
    };
  }
}

/**
 * 全アーティストの画像を移行
 */
async function migrateAllImages(): Promise<void> {
  try {
    console.log("画像移行を開始します...");

    // 全アーティストを取得
    const allArtists = await db.select().from(artists);
    console.log(`${allArtists.length}人のアーティストが見つかりました`);

    // 移行が必要なアーティストを抽出
    const artistsToMigrate = allArtists.filter(
      (artist) =>
        artist.originalImage && artist.originalImage.includes("i.scdn.co")
    );

    console.log(`${artistsToMigrate.length}人のアーティストの画像を移行します`);

    if (artistsToMigrate.length === 0) {
      console.log("移行が必要な画像はありません");
      return;
    }

    // バッチ処理（5件ずつ）
    const batchSize = 5;
    const results: MigrationResult[] = [];

    for (let i = 0; i < artistsToMigrate.length; i += batchSize) {
      const batch = artistsToMigrate.slice(i, i + batchSize);
      console.log(
        `バッチ ${Math.floor(i / batchSize) + 1}/${Math.ceil(
          artistsToMigrate.length / batchSize
        )} を処理中...`
      );

      const batchResults = await Promise.all(batch.map(migrateArtistImages));

      results.push(...batchResults);

      // 少し待機（レート制限対策）
      if (i + batchSize < artistsToMigrate.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // 結果を表示
    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    console.log("\n=== 移行結果 ===");
    console.log(`成功: ${successCount}件`);
    console.log(`失敗: ${failureCount}件`);

    if (failureCount > 0) {
      console.log("\n=== 失敗した移行 ===");
      results
        .filter((r) => !r.success)
        .forEach((r) => {
          console.log(`- ${r.artistName} (ID: ${r.artistId}): ${r.error}`);
        });
    }

    console.log("\n画像移行が完了しました！");
  } catch (error) {
    console.error("移行処理中にエラーが発生しました:", error);
  } finally {
    await client.end();
  }
}

/**
 * 特定のアーティストの画像を移行
 */
async function migrateSingleArtist(artistId: number): Promise<void> {
  try {
    console.log(`アーティスト ID ${artistId} の画像移行を開始します...`);

    // アーティストを取得
    const artist = await db
      .select()
      .from(artists)
      .where(eq(artists.id, artistId))
      .limit(1);

    if (artist.length === 0) {
      console.log(`アーティスト ID ${artistId} が見つかりませんでした`);
      return;
    }

    const result = await migrateArtistImages(artist[0]);

    if (result.success) {
      console.log(`移行成功: ${result.artistName}`);
      if (result.originalUrl) {
        console.log(`オリジナル画像: ${result.originalUrl}`);
        console.log(`小さな画像: ${result.smallUrl}`);
      }
    } else {
      console.log(`移行失敗: ${result.artistName} - ${result.error}`);
    }
  } catch (error) {
    console.error("移行処理中にエラーが発生しました:", error);
  } finally {
    await client.end();
  }
}

// コマンドライン実行
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // 全アーティスト移行
    migrateAllImages();
  } else if (args[0] === "--artist-id" && args[1]) {
    // 特定のアーティスト移行
    const artistId = parseInt(args[1]);
    if (isNaN(artistId)) {
      console.error("無効なアーティストIDです");
      process.exit(1);
    }
    migrateSingleArtist(artistId);
  } else {
    console.log("使用方法:");
    console.log("  全アーティスト移行: npm run migrate-images");
    console.log("  特定のアーティスト: npm run migrate-images --artist-id 123");
  }
}
