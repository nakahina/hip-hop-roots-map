import { NextResponse } from "next/server";
import {
  getAllArtists,
  updateArtist,
  deleteArtist,
  createArtist,
  getArtistsWithLocation,
} from "@/db/queries";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import {
  mapProvidedDataToSchema,
  validateProvidedData,
} from "@/utils/data-mapper";

export async function GET(request: Request) {
  try {
    // データベース接続のテスト
    try {
      await db.execute(sql`SELECT 1`);
      console.log("Database connection successful");
    } catch (dbError) {
      console.error("Database connection error:", dbError);
      return NextResponse.json(
        {
          error: "Database connection failed",
          detail: dbError instanceof Error ? dbError.message : String(dbError),
          env: {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            database: process.env.DB_NAME,
            ssl: process.env.DB_SSL === "true" ? true : false,
          },
        },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const withLocation = searchParams.get("withLocation") === "true";
    const search = searchParams.get("search") || "";
    const style = searchParams.get("style") || "all";
    const sort = searchParams.get("sort") || "name";

    let artists = withLocation
      ? await getArtistsWithLocation()
      : await getAllArtists();

    // 検索クエリでフィルタリング
    if (search) {
      artists = artists.filter((artist) =>
        artist.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // スタイルでフィルタリング
    if (style !== "all") {
      artists = artists.filter((artist) =>
        artist.genres?.some(
          (genre) => genre.toLowerCase() === style.toLowerCase()
        )
      );
    }

    // 並び替え
    if (sort === "name") {
      artists.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === "prefecture") {
      artists.sort((a, b) => {
        const prefectureA = a.city?.split(" ")[0] || "";
        const prefectureB = b.city?.split(" ")[0] || "";
        return prefectureA.localeCompare(prefectureB);
      });
    }

    return NextResponse.json(artists);
  } catch (error) {
    console.error("API GET error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch artists",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { id, createdAt, updatedAt, ...artist } = await request.json();
    const updatedArtist = await updateArtist(id, {
      ...artist,
      updatedAt: new Date(),
    });
    return NextResponse.json(updatedArtist);
  } catch (error) {
    console.error("API PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update artist", detail: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await deleteArtist(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete artist" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const now = new Date();

    // 提供されたデータ形式をチェック
    const hasProvidedFormat = data.location && data.categories && data.bio;

    let artistData;

    if (hasProvidedFormat) {
      // 提供されたデータ形式の場合、検証してからマッピング
      const validationErrors = validateProvidedData(data);
      if (validationErrors.length > 0) {
        return NextResponse.json(
          { error: "データ検証エラー", errors: validationErrors },
          { status: 400 }
        );
      }

      artistData = mapProvidedDataToSchema(data);
    } else {
      // 既存のデータ形式の場合
      artistData = data;
    }

    const newArtist = await createArtist({
      ...artistData,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json(newArtist);
  } catch (error) {
    console.error("API POST error:", error);
    return NextResponse.json(
      { error: "Failed to create artist", detail: String(error) },
      { status: 500 }
    );
  }
}
