<div align="center">
  <img src="./public/favicon.svg" width="100" height="80" />
  <h1>VakKarma</h1>
  <img src="./readme/screenshot1.png" />
  <p>2ちゃんねる風のスレッドフロート型BBS</p>
</div>

## 概要

VakKarma は、2 ちゃんねる風のスレッドフロート型 BBS です。  
ゼロちゃんねるプラスを参考に開発されました。

### 主な特徴

- [ゼロちゃんねるプラス](https://ja.osdn.net/projects/zerochplus/)に似た UI
- スレッドフロート型
- クライアントサイドで JavaScript を使用しない動作
- レスポンシブデザインへの対応(Tailwind CSS を採用)
- 1 コマンドでデプロイ(docker compose を採用)
- [ChMate](https://play.google.com/store/apps/details?id=jp.co.airfront.android.a2chMate&hl=ja)への対応
- モダンで開発体験の良い技術スタック
- DDD に基づいた設計とレイヤー分割

## インストール

### 本番環境 (Cloudflare Workers)

当システムは Cloudflare Workers にデプロイすることができます。

まず依存関係をインストールします。

```bash
pnpm install
```

必要となるデータベースを用意します。ここでは Neon を利用しますが、PostgreSQL 互換のデータベースであれば何でも構いません。
[この](https://neon.tech/docs/get-started-with-neon/signing-up)ガイドに従って、Neon のアカウントを作成し、データベースを作成してください。その際、データベースへの接続情報を取得する必要があります。

```bash
postgrest://username:password@hostname:port/database
```

次に、dbmate を用いてデータベースのマイグレーションを行います。dbmate は、データベースのスキーマを管理するためのツールです。

```bash
pnpm dbmate up --url (取得した接続情報)
```

Cloudflare Workers のアカウントを作成してください。[こちら](https://dash.cloudflare.com/sign-up)からアカウントを作成できます。すでに存在する場合は、ログインしてください。

デプロイを行ないます。内部で wrangler を使用しています。

```bash
pnpm run deploy:workers
```

デプロイが完了すると、デプロイされた URL が表示されます。

最後に、データベース接続情報・JWT のシークレットを環境変数として設定します。

```bash
pnpm wrangler secret put DATABASE_URL
pnpm wrangler secret put JWT_SECRET_KEY
```

それぞれの内容を受け付けるプロンプトが表示されるので、入力してください。正常に設定されると、再度デプロイされます。

完了後、デプロイされた URL にアクセスできるようになります。

### 本番環境 (ローカル環境・Docker)

Docker における本番環境では、以下のコンテナが起動します。

| サービス   | 概要                              |
| ---------- | --------------------------------- |
| Traefik    | リバースプロキシ                  |
| PostgreSQL | データベース                      |
| Bun        | アプリケーションサーバ (VakKarma) |
| DBMate     | マイグレーションツール            |

`.env`ファイルを編集してください。

```bash
# 本番用の環境変数
TRUSTED_PROXY_ID=proxy1
POSTGRES_USER=myuser
POSTGRES_PASSWORD=mypassword
POSTGRES_DB=myapp
JWT_SECRET_KEY=secret
```

- `TRUSTED_PROXY_ID`: リバースプロキシの識別子。ユーザに推測されないように設定してください。
- `POSTGRES_USER`: データベースのユーザ名
- `POSTGRES_PASSWORD`: データベースのパスワード
- `POSTGRES_DB`: データベース名
- `JWT_SECRET_KEY`: JWT の秘密鍵。ユーザに推測されないように設定してください。

次に、Docker の有効な環境で以下のコマンドを実行してください。

```bash
docker compose -f docker-compose.prod.yml up -d
```

アプリケーションは 80 ポートで起動します。
データベースへのマイグレーションは自動で行われます。

### 開発環境

開発環境では、データベースのみを Docker で起動します。
アプリケーション自体は Vite で起動します。

`.env`ファイルを編集してください。

```bash
# 開発環境用の環境変数
VITE_POSTGRES_USER=postgres
VITE_POSTGRES_PASSWORD=postgres
VITE_POSTGRES_DB=vakkarma-1
VITE_JWT_SECRET_KEY=secret
```

- `VITE_POSTGRES_USER`: データベースのユーザ名
- `VITE_POSTGRES_PASSWORD`: データベースのパスワード
- `VITE_POSTGRES_DB`: データベース名
- `VITE_JWT_SECRET_KEY`: JWT の秘密鍵。ユーザに推測されないように設定してください。

次に、以下のコマンドを実行してください。

```bash
docker compose -f docker-compose.dev.yml up -d
```

アプリケーションを起動するには、以下のコマンドを実行してください。

```bash
pnpm install # 依存関係のインストール
sudo pnpm run dev # 開発サーバーの起動
```

Vite が 80 ポートで起動します。
管理者権限が必要な場合は、`sudo`を付けてください。

なお、他のポートで動作させる場合や一般公開が必要ない場合は、`vite.config.ts`を編集してください。

## 使い方

VakKarma では、すべての画面がレスポンシブデザインに対応しています。

### トップ画面

![トップ画面](./readme/screenshot3.png)
![トップ画面](./readme/screenshot4.png)

上位のスレッド 30 件の一覧と、先頭スレッド 1 件&上位スレッド 10 件のレスを表示します。
レスポンスの返信フォームやスレッドの新規作成フォームも表示されます。
UI はゼロちゃんねるプラスのものに準拠しています。

### スレッド画面

![スレッド画面](./readme/screenshot5.png)

すべてのスレッドのレスを表示します。また、レスの返信フォームも表示されます。

### 管理者画面

![ログイン画面](./readme/screenshot6.png)

`/admin`にアクセスすると、管理者画面にアクセスできます。
ログイン していない状態では、`/login/admin`にリダイレクトされます。ここでパスワードを入力すると、管理者画面にアクセスできます。
パスワードはデフォルトで`password`です。

掲示板の名称やローカルルール、名無しの名前を変更できます。

![管理者画面](./readme/screenshot7.png)

また、パスワードの変更も可能です。

![パスワード変更画面](./readme/screenshot8.png)

デフォルトのパスワードから変更することを強く推奨します。

## その他関連情報

### スレッド作成・レス作成のルール

スレッド作成・レス作成時はどちらもコンテンツの入力が必須です。
ユーザ名は任意ですが、名無しの場合は管理者画面で設定した名前が表示されます。
ユーザ名に`#`を含めることで、`#`以降の文字列がトリップとして表示されます。

### 専ブラ(ChMate)での登録方法

`https://(ホスト)/senbura/`を URL に登録してください。

正常に読み込まれると、以下のように表示されます。

![専ブラ](./readme/senbura1.png)
![専ブラ](./readme/senbura2.png)

## 利用技術

| パッケージ名               | バージョン | 説明                                                                                                                  |
| :------------------------- | :--------- | :-------------------------------------------------------------------------------------------------------------------- |
| `hono`                     | `^4.7.0`   | 軽量ウェブフレームワークで、Express や Koa に似ており、HTTP リクエストとレスポンスを処理。                            |
| `honox`                    | `^0.1.34`  | Hono に基づくメタフレームワークで、Hono と Vite を使用したアプリケーション開発を簡素化。                              |
| `postgres`                 | `^3.4.5`   | Node.js で PostgreSQL データベースとインタラクション。クエリやデータ操作に使用。                                      |
| `neverthrow`               | `^8.1.1`   | Result 型を提供し、エラーを機能的に安全に処理。コードの信頼性と可読性を向上。                                         |
| `uuidv7`                   | `^1.0.2`   | 時間ベースのバージョン 7 UUID を生成。アプリケーション内で一意の識別子を生成。                                        |
| `bcrypt-ts`                | `^6.0.0`   | BCrypt アルゴリズムを使用したパスワードハッシュ化を TypeScript でサポート。パスワードの安全なハッシュ化と検証に使用。 |
| `iconv-lite`               | `^0.6.3`   | 幅広い文字エンコーディングの変換をサポート。テキストデータのエンコーディング変換に使用。                              |
| `encoding-japanese`        | `^2.2.0`   | 日本語文字エンコーディングの変換（例：Shift-JIS と UTF-8）を処理。テキストデータの多言語対応に役立つ。                |
| `tailwindcss`              | `^4.0.5`   | ユーティリティファーストの CSS フレームワーク。迅速かつ一貫したスタイリングに使用。                                   |
| `vite`                     | `^6.1.0`   | モダンウェブアプリケーションのビルドツール。ホットモジュールリプレイスメントと最適化を提供。                          |
| `@tailwindcss/vite`        | `^4.0.5`   | Vite との Tailwind CSS 統合。迅速なスタイリングのためのユーティリティクラスを使用可能。                               |
| `@ts-safeql/eslint-plugin` | `^3.6.6`   | PostgreSQL の生 SQL クエリから TypeScript 型を検証・自動生成する ESLint プラグイン。SQL クエリの型安全性を確保。      |

## ロードマップ

- [x] コンテンツの最大長制限への対応 (medium)
  - `createResponseContent`の非同期関数化  
    高階関数パターンの導入
- [x] パスワード更新機能の実装 (medium)
- [x] レスの範囲を指定するページの追加
- [ ] Config/Env をセットアップするシェルスクリプトの実装
- [ ] 信頼できる IP アドレスを外部から設定できるようにする
- [ ] https に対応するスクリプトの追加
- [ ] NG ワード機能の実装
- [ ] レス検索機能の実装
- [ ] Cloudflare Captcha(turnstile)への対応
- [ ] ログの出力
  - [ ] 適切な粒度がわからないので見直しが必要
- [ ] エラーハンドリングの見直し
  - [ ] エラーと例外の分離
- [ ] テストの記述
  - [x] ドメイン層のテスト
  - [ ] ユースケース層のテスト
  - [ ] リポジトリ層のテスト
- [ ] 複数板を扱う機能の実装(very hard)
- [ ] ログイン機能の実装(very hard)

## License

MIT

## 開発者

- [calloc134](https://github.com/calloc134)
