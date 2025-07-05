# Hip-Hop Map

日本のヒップホップアーティストの地図表示アプリケーション

## 概要

このプロジェクトは、日本のヒップホップアーティストの出身地を地図上に表示する Next.js アプリケーションです。アーティストの情報、音楽、画像を管理し、インタラクティブな地図上で視覚的に表示します。

## 機能

- 🗺️ インタラクティブな地図表示
- 🎵 Spotify 統合
- 📸 画像管理（S3 クラウドストレージ）
- 👤 アーティスト情報管理
- 📱 レスポンシブデザイン

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`env.example`を参考に環境変数を設定してください：

```bash
# データベース設定
DATABASE_URL=your_database_url_here

# AWS S3設定
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=ap-northeast-1
S3_BUCKET_NAME=your_s3_bucket_name

# CloudFront設定（オプション）
CLOUDFRONT_DOMAIN=https://your-cloudfront-domain.com
```

### 3. データベースの初期化

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)でアプリケーションが確認できます。

## 画像移行機能

外部 CDN（Spotify の CDN）から S3 バケットに画像を移行する機能を提供しています。

### コマンドライン実行

```bash
# 全アーティストの画像を移行
npm run migrate-images

# 特定のアーティストの画像を移行
npm run migrate-images --artist-id 123
```

### API 経由での実行

#### 移行状況の確認

```bash
GET /api/admin/migrate-images
```

レスポンス例：

```json
{
  "success": true,
  "summary": {
    "total": 100,
    "spotifyImages": 85,
    "s3Images": 15,
    "noImages": 0,
    "migrationNeeded": true
  }
}
```

#### 画像移行の実行

```bash
POST /api/admin/migrate-images
```

リクエストボディ：

```json
{
  "artistId": 123, // 特定のアーティストを指定（オプション）
  "batchSize": 5 // バッチサイズ（オプション、デフォルト：5）
}
```

### 移行処理の特徴

- **バッチ処理**: 複数の画像を効率的に処理
- **レート制限対策**: API レート制限を考慮した適切な間隔での実行
- **エラーハンドリング**: 失敗した移行の詳細ログ
- **重複回避**: 既に移行済みの画像はスキップ
- **画像最適化**: 元サイズと小サイズ（300x300）の両方を生成

## データベース操作

```bash
# マイグレーションの生成
npm run db:generate

# データベースに変更を適用
npm run db:push

# Drizzle Studioの起動
npm run db:studio

# データベースの初期化
npm run db:seed
```

## 技術スタック

- **フロントエンド**: Next.js 13, React, TypeScript
- **スタイリング**: Tailwind CSS, Chakra UI
- **地図**: Leaflet, React-Leaflet
- **データベース**: PostgreSQL, Drizzle ORM
- **クラウドストレージ**: AWS S3
- **CDN**: AWS CloudFront (オプション)
- **音楽**: Spotify API
- **画像処理**: Sharp

## プロジェクト構造

```
src/
├── app/                # Next.js App Router
│   ├── api/           # API ルート
│   ├── admin/         # 管理者画面
│   └── page.tsx       # メインページ
├── components/        # Reactコンポーネント
├── data/             # 静的データ
├── db/               # データベース関連
├── scripts/          # 実行スクリプト
└── utils/            # ユーティリティ関数
```

## 開発情報

### 新しいアーティストの追加

1. `src/data/artists.json`にアーティスト情報を追加
2. `npm run db:seed`でデータベースを更新
3. 画像移行が必要な場合は`npm run migrate-images`を実行

### 画像管理

- 画像は`artists/{アーティスト名}/`フォルダに整理されて保存
- オリジナル画像: `original_{filename}`
- 小さな画像: `small_{filename}` (300x300 にリサイズ)

## デプロイ

Vercel でのデプロイが推奨されています：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme)

## 参考リンク

- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM](https://orm.drizzle.team/)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [Leaflet Documentation](https://leafletjs.com/)
