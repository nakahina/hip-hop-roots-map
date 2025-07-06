import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import artistsData from "@/data/rapworldmap-artists.json";

// 本番環境のデータベース設定
const PROD_DATABASE_URL =
  "postgresql://postgres.qzbktmcnlutvlkekhnfu:nfAdXEMA4IRIc8iE@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres";

// 本番環境のデータベース接続
const prodClient = postgres(PROD_DATABASE_URL, { prepare: false });
const prodDb = drizzle(prodClient, {});

async function findMissingArtists() {
  try {
    console.log("本番環境の既存アーティストを取得中...");

    // 本番環境の全アーティスト名を取得
    const prodArtists = await prodDb.execute(sql`
      SELECT DISTINCT name FROM artists ORDER BY name;
    `);

    const prodArtistNames = new Set(prodArtists.map((row) => row.name));

    console.log(`本番環境のアーティスト数: ${prodArtistNames.size}`);
    console.log(`ローカルデータのアーティスト数: ${artistsData.length}`);

    // 不足しているアーティストを特定
    const missingArtists = artistsData.filter(
      (artist) => !prodArtistNames.has(artist.name)
    );

    console.log(`\n不足しているアーティスト数: ${missingArtists.length}`);

    if (missingArtists.length > 0) {
      console.log("\n不足しているアーティスト一覧:");
      missingArtists.forEach((artist, index) => {
        console.log(`${index + 1}. ${artist.name} (${artist.location.city})`);
      });

      // 不足しているアーティストの詳細をファイルに保存
      const fs = require("fs");
      const missingArtistNames = missingArtists.map((artist) => artist.name);
      fs.writeFileSync(
        "missing-artists.json",
        JSON.stringify(missingArtistNames, null, 2)
      );
      console.log(
        "\n不足しているアーティスト名を missing-artists.json に保存しました"
      );

      // エラーログファイルを更新
      const errorLogEntries = missingArtists
        .map(
          (artist) =>
            `2025-07-06T10:00:00.000Z: ${artist.name} - Missing from production database`
        )
        .join("\n");

      fs.writeFileSync("migration-errors.log", errorLogEntries);
      console.log("エラーログファイルを更新しました");
    } else {
      console.log("すべてのアーティストが本番環境に存在します！");
    }

    // 詳細統計
    const categories: { [key: string]: number } = {};
    missingArtists.forEach((artist) => {
      artist.categories.forEach((category) => {
        categories[category] = (categories[category] || 0) + 1;
      });
    });

    console.log("\n不足しているアーティストのカテゴリ別統計:");
    Object.entries(categories).forEach(([category, count]) => {
      console.log(`- ${category}: ${count}件`);
    });

    await prodClient.end();
  } catch (error) {
    console.error("エラー:", error);
    await prodClient.end();
  }
}

if (require.main === module) {
  findMissingArtists();
}
