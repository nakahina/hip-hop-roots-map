import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // セッションクッキーをチェック
  const isAuthenticated = request.cookies.has("admin_session");

  // /admin/artistsへのアクセスをチェック
  if (request.nextUrl.pathname.startsWith("/admin/artists")) {
    if (!isAuthenticated) {
      // 未認証の場合はログインページにリダイレクト
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

// ミドルウェアを適用するパスを指定
export const config = {
  matcher: "/admin/artists/:path*",
};
