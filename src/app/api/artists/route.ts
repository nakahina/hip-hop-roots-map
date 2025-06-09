import { NextResponse } from "next/server";
import { db } from "@/db";
import { artists } from "@/db/schema";
import { eq, like, and, asc, desc, sql, ilike } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get("search") || "";
    const selectedStyle = searchParams.get("style") || "all";
    const sortOrder = searchParams.get("sort") || "name";

    // 検索条件の構築
    const conditions = [];
    if (searchTerm) {
      conditions.push(ilike(artists.name, `%${searchTerm}%`));
    }
    if (selectedStyle !== "all") {
      conditions.push(
        sql`${artists.genres} && ARRAY[${selectedStyle}]::text[]`
      );
    }

    // ソート順の設定
    const orderByClause =
      sortOrder === "prefecture"
        ? sql`${artists.prefecture}, ${artists.name}`
        : sql`${artists.name}`;

    // クエリの実行
    const filteredArtists = await db
      .select()
      .from(artists)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(orderByClause);

    return NextResponse.json(filteredArtists);
  } catch (error) {
    console.error("Error fetching artists:", error);
    return NextResponse.json(
      { error: "Failed to fetch artists" },
      { status: 500 }
    );
  }
}
