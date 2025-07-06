import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    // 環境変数からパスワードを取得して検証
    if (password === process.env.ADMIN_PASSWORD) {
      const response = NextResponse.json({ success: true });

      // セッションクッキーを設定
      response.cookies.set("admin_session", "authenticated", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7日間
        path: "/",
      });

      console.log("🔍 ログイン成功 - セッションクッキーを設定");
      return response;
    }

    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  } catch (error) {
    console.error("🔍 ログイン認証エラー:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ログアウト機能
export async function DELETE(request: Request) {
  try {
    const response = NextResponse.json({
      success: true,
      message: "ログアウトしました",
    });

    // セッションクッキーを削除
    response.cookies.delete("admin_session");

    console.log("🔍 ログアウト成功 - セッションクッキーを削除");
    return response;
  } catch (error) {
    console.error("🔍 ログアウトエラー:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
