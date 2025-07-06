import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";
import { sql } from "drizzle-orm";
import {
  mapProvidedDataToSchema,
  validateProvidedData,
} from "@/utils/data-mapper";
import artistsData from "@/data/rapworldmap-artists.json";

// 本番環境のデータベース設定
const PROD_DATABASE_URL =
  "postgresql://postgres.qzbktmcnlutvlkekhnfu:nfAdXEMA4IRIc8iE@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres";

// 本番環境のデータベース接続
const prodClient = postgres(PROD_DATABASE_URL, { prepare: false });
const prodDb = drizzle(prodClient, { schema });

async function testConnection() {
  console.log("本番環境への接続をテストしています...");
  try {
    await prodDb.execute(sql`SELECT 1`);
    console.log("✓ 本番環境への接続成功");
    return true;
  } catch (error) {
    console.error("✗ 本番環境への接続失敗:", error);
    return false;
  }
}

async function addBioFields() {
  console.log("本番環境にバイオフィールドを追加しています...");
  try {
    // 既存のフィールドが存在するかチェック
    const result = await prodDb.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'artists' AND column_name = 'bio_summary';
    `);

    if (result.length > 0) {
      console.log("バイオフィールドは既に存在します");
      return true;
    }

    // バイオフィールドを追加
    await prodDb.execute(sql`
      ALTER TABLE artists ADD COLUMN bio_summary text;
      ALTER TABLE artists ADD COLUMN bio_url varchar(500);
      ALTER TABLE artists ADD COLUMN birthdate date;
      ALTER TABLE artists ADD COLUMN deathdate date;
      ALTER TABLE artists ADD COLUMN years_active_start integer;
      ALTER TABLE artists ADD COLUMN years_active_end integer;
    `);

    console.log("✓ バイオフィールドの追加完了");
    return true;
  } catch (error) {
    console.error("✗ バイオフィールドの追加エラー:", error);
    return false;
  }
}

async function checkForDuplicates(artist: any) {
  try {
    // 座標を正しく分割
    const coordinates = artist.location.coordinates.split(", ");
    const lng = parseFloat(coordinates[0]);
    const lat = parseFloat(coordinates[1]);

    // NaNチェック
    if (isNaN(lat) || isNaN(lng)) {
      console.warn(
        `座標が無効です: ${artist.name} - ${artist.location.coordinates}`
      );
      return false;
    }

    const result = await prodDb.execute(sql`
      SELECT id, name FROM artists 
      WHERE name = ${artist.name} 
      OR (lat = ${lat} AND lng = ${lng})
    `);

    return result.length > 0;
  } catch (error) {
    console.error("重複チェックエラー:", error);
    return false;
  }
}

// エラーログを記録する関数
function logError(artistName: string, error: any) {
  const timestamp = new Date().toISOString();
  const errorMessage = error instanceof Error ? error.message : String(error);

  console.error(`[${timestamp}] エラー (${artistName}): ${errorMessage}`);

  // エラーの詳細をファイルに記録
  const fs = require("fs");
  const errorLog = `${timestamp}: ${artistName} - ${errorMessage}\n`;
  fs.appendFileSync("migration-errors.log", errorLog);
}

// 前回のエラーログからエラーアーティストを取得
function getErrorArtists(): string[] {
  const fs = require("fs");
  try {
    if (fs.existsSync("migration-errors.log")) {
      const content = fs.readFileSync("migration-errors.log", "utf8");
      const lines = content.split("\n").filter((line: string) => line.trim());
      const errorArtists = lines
        .map((line: string) => {
          const match = line.match(
            /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z: (.+?) -/
          );
          return match ? match[1] : null;
        })
        .filter((name: string | null): name is string => name !== null);

      return Array.from(new Set(errorArtists)); // 重複を除去
    }
  } catch (error) {
    console.error("エラーログの読み込みに失敗:", error);
  }
  return [];
}

async function migrateErrorDataOnly() {
  const errorArtists = getErrorArtists();

  if (errorArtists.length === 0) {
    console.log("エラーログが見つかりません。通常の移行を実行してください。");
    return;
  }

  console.log(
    `エラーデータのみ再移行: ${errorArtists.length} 件のアーティスト`
  );

  // エラーアーティストをフィルタリング
  const errorArtistData = artistsData.filter((artist) =>
    errorArtists.includes(artist.name)
  );

  console.log(`対象データ: ${errorArtistData.length} 件`);

  let successCount = 0;
  let errorCount = 0;
  const errors: Array<{ name: string; error: string }> = [];

  for (let i = 0; i < errorArtistData.length; i++) {
    const artist = errorArtistData[i];

    try {
      console.log(
        `処理中 (${i + 1}/${errorArtistData.length}): ${artist.name}`
      );

      // 重複チェック
      const isDuplicate = await checkForDuplicates(artist);
      if (isDuplicate) {
        console.log(`⚠️ スキップ（重複）: ${artist.name}`);
        continue;
      }

      // データを検証
      const validationErrors = validateProvidedData(artist);
      if (validationErrors.length > 0) {
        console.warn(`検証エラー (${artist.name}):`, validationErrors);
        errors.push({ name: artist.name, error: validationErrors.join(", ") });
        errorCount++;
        continue;
      }

      // データをマッピング
      const mappedData = mapProvidedDataToSchema(artist);

      // 座標のNaNチェック
      if (isNaN(mappedData.lat) || isNaN(mappedData.lng)) {
        const errorMsg = `座標が無効: lat=${mappedData.lat}, lng=${mappedData.lng}`;
        console.error(`✗ ${artist.name}: ${errorMsg}`);
        errors.push({ name: artist.name, error: errorMsg });
        errorCount++;
        continue;
      }

      // 本番環境のデータベースに保存
      await prodDb.insert(schema.artists).values({
        ...mappedData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      successCount++;
      console.log(`✓ 保存完了: ${artist.name}`);
    } catch (error) {
      errorCount++;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`✗ エラー (${artist.name}):`, errorMessage);
      errors.push({ name: artist.name, error: errorMessage });
      logError(artist.name, error);
    }
  }

  console.log("\n=== エラーデータ再移行完了 ===");
  console.log(`対象件数: ${errorArtistData.length}`);
  console.log(`成功: ${successCount}`);
  console.log(`エラー: ${errorCount}`);

  if (errors.length > 0) {
    console.log("\n=== 再発エラー詳細 ===");
    errors.forEach(({ name, error }) => {
      console.log(`${name}: ${error}`);
    });
  }
}

// データマッピング関数も修正
function fixDataMapping(artist: any) {
  try {
    const mappedData = mapProvidedDataToSchema(artist);

    // 座標のNaNチェックと修正
    if (isNaN(mappedData.lat) || isNaN(mappedData.lng)) {
      const coordinates = artist.location.coordinates.split(", ");
      const lng = parseFloat(coordinates[0]);
      const lat = parseFloat(coordinates[1]);

      if (!isNaN(lat) && !isNaN(lng)) {
        mappedData.lat = lat;
        mappedData.lng = lng;
      } else {
        // 座標が無効な場合はデフォルト値を設定
        mappedData.lat = 0;
        mappedData.lng = 0;
        console.warn(`座標が無効なため0,0に設定: ${artist.name}`);
      }
    }

    return mappedData;
  } catch (error) {
    console.error(`データマッピングエラー (${artist.name}):`, error);
    throw error;
  }
}

async function migrateDataToProduction() {
  console.log(
    `本番環境への移行開始: ${artistsData.length} 件のアーティストデータを処理します`
  );

  let successCount = 0;
  let errorCount = 0;
  let duplicateCount = 0;
  const errors: Array<{ name: string; error: string }> = [];
  const duplicates: Array<string> = [];

  for (let i = 0; i < artistsData.length; i++) {
    const artist = artistsData[i];

    try {
      console.log(`処理中 (${i + 1}/${artistsData.length}): ${artist.name}`);

      // 重複チェック
      const isDuplicate = await checkForDuplicates(artist);
      if (isDuplicate) {
        console.log(`⚠️ スキップ（重複）: ${artist.name}`);
        duplicates.push(artist.name);
        duplicateCount++;
        continue;
      }

      // データを検証
      const validationErrors = validateProvidedData(artist);
      if (validationErrors.length > 0) {
        console.warn(`検証エラー (${artist.name}):`, validationErrors);
        errors.push({ name: artist.name, error: validationErrors.join(", ") });
        errorCount++;
        continue;
      }

      // データをマッピング
      const mappedData = mapProvidedDataToSchema(artist);

      // 本番環境のデータベースに保存
      await prodDb.insert(schema.artists).values({
        ...mappedData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      successCount++;
      console.log(`✓ 保存完了: ${artist.name}`);
    } catch (error) {
      errorCount++;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`✗ エラー (${artist.name}):`, errorMessage);
      errors.push({ name: artist.name, error: errorMessage });
    }

    // 進捗表示
    if ((i + 1) % 50 === 0) {
      console.log(
        `進捗: ${i + 1}/${
          artistsData.length
        } 処理済み (成功: ${successCount}, 重複: ${duplicateCount}, エラー: ${errorCount})`
      );
    }
  }

  console.log("\n=== 本番環境移行完了 ===");
  console.log(`総件数: ${artistsData.length}`);
  console.log(`成功: ${successCount}`);
  console.log(`重複スキップ: ${duplicateCount}`);
  console.log(`エラー: ${errorCount}`);

  if (duplicates.length > 0) {
    console.log("\n=== 重複によりスキップされたアーティスト (最初の10件) ===");
    duplicates.slice(0, 10).forEach((name) => {
      console.log(`- ${name}`);
    });
    if (duplicates.length > 10) {
      console.log(`... その他 ${duplicates.length - 10} 件`);
    }
  }

  if (errors.length > 0) {
    console.log("\n=== エラー詳細 (最初の10件) ===");
    errors.slice(0, 10).forEach(({ name, error }) => {
      console.log(`${name}: ${error}`);
    });
    if (errors.length > 10) {
      console.log(`... その他 ${errors.length - 10} 件のエラー`);
    }
  }
}

async function checkExistingData() {
  console.log("本番環境の既存データを確認しています...");
  try {
    const result = await prodDb.execute(sql`
      SELECT COUNT(*) as count FROM artists;
    `);
    const count = Number(result[0]?.count) || 0;
    console.log(`既存のアーティスト数: ${count}`);

    if (count > 0) {
      console.log("⚠️  警告: 本番環境に既存データがあります");
      console.log("継続する場合は重複データが作成される可能性があります");
      return count;
    }
    return 0;
  } catch (error) {
    console.error("既存データの確認エラー:", error);
    return -1;
  }
}

// メイン実行関数を更新
async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--test-connection")) {
    await testConnection();
  } else if (args.includes("--add-bio-fields")) {
    const connected = await testConnection();
    if (connected) {
      await addBioFields();
    }
  } else if (args.includes("--check-data")) {
    const connected = await testConnection();
    if (connected) {
      await checkExistingData();
    }
  } else if (args.includes("--retry-errors")) {
    console.log("🔄 エラーデータのみ再移行を開始します");

    const connected = await testConnection();
    if (!connected) {
      console.error("本番環境への接続に失敗しました");
      process.exit(1);
    }

    await migrateErrorDataOnly();
  } else if (args.includes("--migrate")) {
    console.log("🚀 本番環境への移行を開始します");

    const connected = await testConnection();
    if (!connected) {
      console.error("本番環境への接続に失敗しました");
      process.exit(1);
    }

    const bioFieldsAdded = await addBioFields();
    if (!bioFieldsAdded) {
      console.error("バイオフィールドの追加に失敗しました");
      process.exit(1);
    }

    const existingCount = await checkExistingData();
    if (existingCount < 0) {
      console.error("既存データの確認に失敗しました");
      process.exit(1);
    }

    await migrateDataToProduction();
  } else {
    console.log("使用方法:");
    console.log("  --test-connection: 本番環境への接続テスト");
    console.log("  --add-bio-fields: バイオフィールドの追加");
    console.log("  --check-data: 既存データの確認");
    console.log("  --migrate: 本番環境への移行実行");
    console.log("  --retry-errors: エラーデータのみ再移行");
  }

  await prodClient.end();
}

if (require.main === module) {
  main().catch((error) => {
    console.error("スクリプトエラー:", error);
    process.exit(1);
  });
}

export { migrateDataToProduction, addBioFields, testConnection };
