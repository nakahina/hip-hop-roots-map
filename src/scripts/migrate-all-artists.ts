import { createArtist } from "@/db/queries";
import {
  mapProvidedDataToSchema,
  validateProvidedData,
} from "@/utils/data-mapper";
import artistsData from "@/data/rapworldmap-artists.json";

async function migrateAllArtists() {
  console.log(
    `移行開始: ${artistsData.length} 件のアーティストデータを処理します`
  );

  let successCount = 0;
  let errorCount = 0;
  const errors: Array<{ name: string; error: string }> = [];

  for (let i = 0; i < artistsData.length; i++) {
    const artist = artistsData[i];

    try {
      console.log(`処理中 (${i + 1}/${artistsData.length}): ${artist.name}`);

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

      // データベースに保存
      await createArtist(mappedData);
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
    if ((i + 1) % 10 === 0) {
      console.log(
        `進捗: ${i + 1}/${
          artistsData.length
        } 処理済み (成功: ${successCount}, エラー: ${errorCount})`
      );
    }
  }

  console.log("\n=== 移行完了 ===");
  console.log(`総件数: ${artistsData.length}`);
  console.log(`成功: ${successCount}`);
  console.log(`エラー: ${errorCount}`);

  if (errors.length > 0) {
    console.log("\n=== エラー詳細 ===");
    errors.forEach(({ name, error }) => {
      console.log(`${name}: ${error}`);
    });
  }
}

// 重複チェック関数
async function checkDuplicates() {
  const names = artistsData.map((artist) => artist.name);
  const duplicates = names.filter(
    (name, index) => names.indexOf(name) !== index
  );

  if (duplicates.length > 0) {
    console.log("重複するアーティスト名が見つかりました:");
    [...new Set(duplicates)].forEach((name) => {
      console.log(`- ${name}`);
    });
  } else {
    console.log("重複するアーティスト名は見つかりませんでした");
  }
}

// データの概要を表示
function showDataSummary() {
  console.log("=== データ概要 ===");
  console.log(`総アーティスト数: ${artistsData.length}`);

  // カテゴリ別の統計
  const categoryStats: Record<string, number> = {};
  artistsData.forEach((artist) => {
    artist.categories.forEach((category) => {
      categoryStats[category] = (categoryStats[category] || 0) + 1;
    });
  });

  console.log("\nカテゴリ別統計:");
  Object.entries(categoryStats)
    .sort(([, a], [, b]) => b - a)
    .forEach(([category, count]) => {
      console.log(`  ${category}: ${count}`);
    });

  // 都市別の統計（上位10位）
  const cityStats: Record<string, number> = {};
  artistsData.forEach((artist) => {
    const city = artist.location.city;
    cityStats[city] = (cityStats[city] || 0) + 1;
  });

  console.log("\n都市別統計（上位10位）:");
  Object.entries(cityStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .forEach(([city, count]) => {
      console.log(`  ${city}: ${count}`);
    });
}

// スクリプトのメイン実行
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes("--summary")) {
    showDataSummary();
  } else if (args.includes("--check-duplicates")) {
    checkDuplicates();
  } else if (args.includes("--migrate")) {
    migrateAllArtists()
      .then(() => {
        console.log("移行スクリプト完了");
        process.exit(0);
      })
      .catch((error) => {
        console.error("移行スクリプトエラー:", error);
        process.exit(1);
      });
  } else {
    console.log("使用方法:");
    console.log("  --summary: データの概要を表示");
    console.log("  --check-duplicates: 重複チェック");
    console.log("  --migrate: データを移行");
  }
}

export { migrateAllArtists, checkDuplicates, showDataSummary };
