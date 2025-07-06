import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // 開発環境では認証をバイパス
  if (process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }

  // セッションクッキーをチェック
  const isAuthenticated = request.cookies.has("admin_session");

  // デバッグログ（本番環境でのトラブルシューティング用）
  console.log(
    `[Middleware] Path: ${request.nextUrl.pathname}, Auth: ${isAuthenticated}`
  );

  // 管理者向けページとAPIのパスをチェック
  if (
    request.nextUrl.pathname.startsWith("/admin/artists") ||
    request.nextUrl.pathname.startsWith("/api/artists") ||
    request.nextUrl.pathname.startsWith("/api/upload")
  ) {
    if (!isAuthenticated) {
      // APIへのアクセスの場合は401エラーを返す
      if (request.nextUrl.pathname.startsWith("/api/")) {
        console.log(
          `[Middleware] API access denied: ${request.nextUrl.pathname}`
        );
        return NextResponse.json(
          { error: "認証が必要です。管理者としてログインしてください。" },
          { status: 401 }
        );
      }

      // 管理者ページへのアクセスの場合はログインページにリダイレクト
      console.log(
        `[Middleware] Redirecting to login: ${request.nextUrl.pathname}`
      );
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

// ミドルウェアを適用するパスを指定
export const config = {
  matcher: ["/admin/artists/:path*", "/api/artists/:path*", "/api/upload"],
};
