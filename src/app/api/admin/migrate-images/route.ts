import { NextRequest, NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { artists } from "@/db/schema";
import { uploadImageToS3, generateFileNameFromUrl } from "@/utils/s3-upload";
import { eq } from "drizzle-orm";

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
      return {
        artistId: artist.id,
        artistName: artist.name,
        success: true,
      };
    }

    // 画像URLがない場合はスキップ
    if (!artist.originalImage) {
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

export async function POST(request: NextRequest) {
  try {
    const { artistId, batchSize = 5 } = await request.json();

    if (artistId) {
      // 特定のアーティストの画像を移行
      const artist = await db
        .select()
        .from(artists)
        .where(eq(artists.id, artistId))
        .limit(1);

      if (artist.length === 0) {
        return NextResponse.json(
          { error: "アーティストが見つかりません" },
          { status: 404 }
        );
      }

      const result = await migrateArtistImages(artist[0]);

      return NextResponse.json({
        success: true,
        message: result.success ? "移行が完了しました" : "移行に失敗しました",
        result,
      });
    } else {
      // 全アーティストの画像を移行
      const allArtists = await db.select().from(artists);

      // 移行が必要なアーティストを抽出
      const artistsToMigrate = allArtists.filter(
        (artist) =>
          artist.originalImage && artist.originalImage.includes("i.scdn.co")
      );

      if (artistsToMigrate.length === 0) {
        return NextResponse.json({
          success: true,
          message: "移行が必要な画像はありません",
          results: [],
        });
      }

      // バッチ処理
      const results: MigrationResult[] = [];
      for (let i = 0; i < artistsToMigrate.length; i += batchSize) {
        const batch = artistsToMigrate.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(migrateArtistImages));
        results.push(...batchResults);

        // 少し待機（レート制限対策）
        if (i + batchSize < artistsToMigrate.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.filter((r) => !r.success).length;

      return NextResponse.json({
        success: true,
        message: `移行が完了しました（成功: ${successCount}件, 失敗: ${failureCount}件）`,
        results,
        summary: {
          total: results.length,
          success: successCount,
          failure: failureCount,
        },
      });
    }
  } catch (error) {
    console.error("画像移行API エラー:", error);
    return NextResponse.json(
      { error: "画像移行中にエラーが発生しました" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // 移行状況を確認
    const allArtists = await db.select().from(artists);

    const spotifyImages = allArtists.filter(
      (artist) =>
        artist.originalImage && artist.originalImage.includes("i.scdn.co")
    ).length;

    const s3Images = allArtists.filter(
      (artist) =>
        artist.originalImage &&
        !artist.originalImage.includes("i.scdn.co") &&
        artist.originalImage.length > 0
    ).length;

    const noImages = allArtists.filter(
      (artist) => !artist.originalImage
    ).length;

    return NextResponse.json({
      success: true,
      summary: {
        total: allArtists.length,
        spotifyImages,
        s3Images,
        noImages,
        migrationNeeded: spotifyImages > 0,
      },
    });
  } catch (error) {
    console.error("移行状況確認エラー:", error);
    return NextResponse.json(
      { error: "移行状況の確認中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
