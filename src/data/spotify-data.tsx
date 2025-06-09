const axios = require("axios");
const qs = require("qs");
const fs = require("fs").promises;
const path = require("path");

const clientId = "608640dc4a5c4ce58edbee26375ec995";
const clientSecret = "2db8da00c72c4c588e44e405b52d8cac";

// リトライ用の遅延関数
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// アクセストークンを取得する関数
async function getAccessToken() {
  const tokenUrl = "https://accounts.spotify.com/api/token";
  const data = qs.stringify({ grant_type: "client_credentials" });

  const response = await axios.post(tokenUrl, data, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${clientId}:${clientSecret}`
      ).toString("base64")}`,
    },
  });

  return response.data.access_token;
}

// APIリクエストを実行する関数（リトライロジック付き）
async function makeRequest(
  url: string,
  params: any,
  accessToken: string,
  retries = 3
) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: params,
      });
      return response;
    } catch (error: any) {
      if (error.response?.status === 429) {
        // レート制限に達した場合
        const retryAfter = parseInt(error.response.headers["retry-after"]) || 5;
        console.log(`Rate limited. Waiting ${retryAfter} seconds...`);
        await delay(retryAfter * 1000);
        continue;
      }

      if (error.response?.status === 502 && i < retries - 1) {
        // 502エラーの場合、少し待ってからリトライ
        console.log(`Received 502 error. Retrying in 2 seconds...`);
        await delay(2000);
        continue;
      }

      if (i === retries - 1) {
        throw error;
      }
    }
  }
}

// アーティスト情報を取得する関数
async function searchAllArtistsByGenre(genre: string) {
  const accessToken = await getAccessToken();
  const searchUrl = `https://api.spotify.com/v1/search`;
  const query = `genre:"${genre}"`;
  let offset = 0;
  const limit = 50;
  let allArtists: any[] = [];

  while (true) {
    try {
      const response = await makeRequest(
        searchUrl,
        {
          q: query,
          type: "artist",
          limit: limit,
          offset: offset,
        },
        accessToken
      );

      const artists = response.data.artists.items;
      allArtists = allArtists.concat(artists);

      if (artists.length < limit) {
        break;
      }

      offset += limit;
      // APIレート制限を考慮して少し待機
      await delay(1000);
    } catch (error) {
      console.error("Error fetching artists:", error);
      break;
    }
  }

  // "j-rap"がgenresに含まれているアーティストをフィルタリング
  const jRapArtistsWithFollowers = allArtists.filter(
    (artist) =>
      artist.genres.includes("j-rap") && artist.followers.total >= 10000
  );

  // Artist型の形式に変換
  const formattedArtists = jRapArtistsWithFollowers.map((artist) => ({
    name: artist.name,
    city: "", // この情報はSpotify APIからは取得できないため、空文字列としておく
    lat: 0, // この情報はSpotify APIからは取得できないため、0としておく
    lng: 0, // この情報はSpotify APIからは取得できないため、0としておく
    genres: artist.genres,
    songTitle: "", // この情報は別途取得が必要
    spotifyTrackId: artist.id, // この情報は別途取得が必要
    originalImage: artist.images[0]?.url || "",
    smallImage: artist.images[2]?.url || "",
    youtubeUrl: "", // この情報は別途取得が必要
  }));

  console.log(formattedArtists.length);

  return formattedArtists;
}

// 使用例
searchAllArtistsByGenre("j-rap")
  .then(async (artists) => {
    // JSONファイルとして保存
    const outputPath = path.join(__dirname, "artists.json");
    await fs.writeFile(outputPath, JSON.stringify(artists, null, 2));
    console.log(`Saved ${artists.length} artists to ${outputPath}`);
  })
  .catch((error) => console.error("Final error:", error));

// async function getArtistInfo(artistId: string) {
//   const accessToken = await getAccessToken();
//   const artistUrl = `https://api.spotify.com/v1/artists/${artistId}`;

//   const response = await axios.get(artistUrl, {
//     headers: {
//       Authorization: `Bearer ${accessToken}`,
//     },
//   });

//   return response.data;
// }

// // 使用例
// getArtistInfo("2yttiOh6BTB10iOYtH0Fyq")
//   .then((artist) => console.log(artist))
//   .catch((error) => console.error(error));
