import { createArtist } from "@/db/queries";
import {
  mapProvidedDataToSchema,
  validateProvidedData,
} from "@/utils/data-mapper";

// 提供されたデータ
const litefootData = {
  name: "Litefoot",
  location: {
    city: "Tulsa",
    neighborhood: "",
    coordinates: "-95.95531084290067, 36.11460451750984",
  },
  categories: ["rapper"],
  bio: {
    summary:
      "Gary Paul Davis (11/09/1968), known as Litefoot, is a Native American (Cherokee Nation) rapper, actor, and businessman from Tulsa, Oklahoma.\r\n",
    url: "https://en.wikipedia.org/wiki/Litefoot",
    birthdate: "1987-09-11T00:00:00.000Z",
    deathdate: null,
    yearsActiveStart: 1992,
    yearsActiveEnd: null,
  },
  youtube: {
    clipExampleUrl: "https://www.youtube.com/embed/UNCYj2xh_tc",
  },
};

async function addLitefoot() {
  try {
    // データを検証
    const validationErrors = validateProvidedData(litefootData);
    if (validationErrors.length > 0) {
      console.error("データ検証エラー:", validationErrors);
      return;
    }

    // データをマッピング
    const mappedData = mapProvidedDataToSchema(litefootData);

    console.log("マッピングされたデータ:", mappedData);

    // データベースに保存
    const result = await createArtist(mappedData);
    console.log("Litefoot added successfully:", result);
  } catch (error) {
    console.error("Error adding Litefoot:", error);

    // エラーの詳細を確認
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
  }
}

// スクリプトを実行
if (require.main === module) {
  addLitefoot()
    .then(() => {
      console.log("スクリプト完了");
      process.exit(0);
    })
    .catch((error) => {
      console.error("スクリプトエラー:", error);
      process.exit(1);
    });
}

export { addLitefoot };
