import { NewArtist } from "@/db/schema";

// 提供されたデータの型定義
interface ProvidedArtistData {
  name: string;
  location: {
    city: string;
    neighborhood?: string;
    coordinates: string; // "lng, lat" format
  };
  categories: string[];
  bio: {
    summary: string;
    url?: string;
    birthdate?: string | null;
    deathdate?: string | null;
    yearsActiveStart?: number;
    yearsActiveEnd?: number | null;
  };
  youtube?: {
    clipExampleUrl?: string;
  };
  spotify?: {
    trackId?: string;
  };
  images?: {
    original?: string;
    small?: string;
  };
  socialMedia?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    youtubeChannel?: string;
    tiktok?: string;
  };
}

/**
 * 提供されたデータ形式を現在のデータベーススキーマにマッピングする
 */
export function mapProvidedDataToSchema(data: ProvidedArtistData): NewArtist {
  // 座標を分割 - より堅牢な変換
  let lat = 0;
  let lng = 0;

  try {
    // 座標文字列を正規化（スペースを含む場合と含まない場合の両方をサポート）
    const coordStr = data.location.coordinates.replace(/\s+/g, "");
    const coords = coordStr.split(",").map((coord) => parseFloat(coord.trim()));

    if (coords.length >= 2) {
      lng = coords[0];
      lat = coords[1];

      // NaNチェック
      if (isNaN(lng) || isNaN(lat)) {
        console.warn(
          `座標変換に失敗: ${data.name} - ${data.location.coordinates}`
        );
        lng = 0;
        lat = 0;
      }
    } else {
      console.warn(
        `座標形式が不正: ${data.name} - ${data.location.coordinates}`
      );
    }
  } catch (error) {
    console.error(
      `座標変換エラー: ${data.name} - ${data.location.coordinates}`,
      error
    );
  }

  return {
    name: data.name,
    city: data.location.city,
    prefecture: data.location.city, // cityと同じ
    lat: lat,
    lng: lng,
    genres: data.categories,
    songTitle: "", // デフォルト値
    youtubeUrl: data.youtube?.clipExampleUrl || null,
    // バイオ情報
    bioSummary: data.bio.summary,
    bioUrl: data.bio.url || null,
    birthdate: data.bio.birthdate || null,
    deathdate: data.bio.deathdate || null,
    yearsActiveStart: data.bio.yearsActiveStart || null,
    yearsActiveEnd: data.bio.yearsActiveEnd || null,
    // その他のフィールド
    spotifyTrackId: data.spotify?.trackId || null,
    originalImage: data.images?.original || null,
    smallImage: data.images?.small || null,
    instagramUrl: data.socialMedia?.instagram || null,
    twitterUrl: data.socialMedia?.twitter || null,
    facebookUrl: data.socialMedia?.facebook || null,
    youtubeChannelUrl: data.socialMedia?.youtubeChannel || null,
    tiktokUrl: data.socialMedia?.tiktok || null,
  };
}

/**
 * 複数のアーティストデータを一度にマッピングする
 */
export function mapMultipleArtists(artists: ProvidedArtistData[]): NewArtist[] {
  return artists.map(mapProvidedDataToSchema);
}

/**
 * データの検証を行う
 */
export function validateProvidedData(data: ProvidedArtistData): string[] {
  const errors: string[] = [];

  if (!data.name || data.name.trim() === "") {
    errors.push("名前は必須です");
  }

  if (!data.location.city || data.location.city.trim() === "") {
    errors.push("都市名は必須です");
  }

  if (!data.location.coordinates || !data.location.coordinates.includes(",")) {
    errors.push("座標は 'lng, lat' 形式で指定する必要があります");
  }

  if (!data.categories || data.categories.length === 0) {
    errors.push("カテゴリは少なくとも1つ必要です");
  }

  if (!data.bio.summary || data.bio.summary.trim() === "") {
    errors.push("バイオサマリーは必須です");
  }

  return errors;
}
