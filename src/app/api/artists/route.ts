import { NextResponse } from "next/server";
import {
  getAllArtists,
  updateArtist,
  deleteArtist,
  createArtist,
  getArtistsWithLocation,
} from "@/db/queries";

export async function GET(request: Request) {
  try {
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
    return NextResponse.json(
      { error: "Failed to fetch artists" },
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
    const artist = await request.json();
    const now = new Date();
    const newArtist = await createArtist({
      ...artist,
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
