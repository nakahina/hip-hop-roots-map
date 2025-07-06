import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // 開発環境の判定を改善
  const isDevEnvironment =
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV === undefined ||
    request.nextUrl.hostname === "localhost" ||
    request.nextUrl.hostname === "127.0.0.1" ||
    request.nextUrl.port === "3000" ||
    request.nextUrl.port === "3001";

  // 🚨 一時的に本番環境でも認証をバイパス（テスト用）
  const bypassAuth = true; // テスト後はfalseに変更

  // 開発環境または一時的バイパスの場合は認証をスキップ
  if (isDevEnvironment || bypassAuth) {
    console.log(
      `[Middleware] 認証をバイパス - 環境: ${
        isDevEnvironment ? "dev" : "prod(テスト)"
      } (${request.nextUrl.hostname}:${request.nextUrl.port})`
    );
    return NextResponse.next();
  }

  // セッションクッキーをチェック
  const isAuthenticated = request.cookies.has("admin_session");

  // デバッグログ（本番環境でのトラブルシューティング用）
  console.log(
    `[Middleware] 本番環境 - Path: ${request.nextUrl.pathname}, Auth: ${isAuthenticated}`
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
