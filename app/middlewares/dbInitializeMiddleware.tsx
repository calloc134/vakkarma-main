import { env, getRuntimeKey } from "hono/adapter"; // 環境判定と環境変数取得
import postgres from "postgres"; // postgres.js ライブラリ

import type { MiddlewareHandler } from "hono";
import type { Context, Env as HonoEnv } from "hono";

/**
 * postgres.js の Sql クライアントインスタンスの型エイリアス
 */
export type DbClient = postgres.Sql;

/**
 * ミドルウェアが Hono の Context に追加する変数の型定義 (デフォルトキー 'db')
 */
export type Env = {
  Variables: {
    db: DbClient;
  };
};

/**
 * カスタムコンテキストキーを使用する場合の型定義
 */
export type DbEnv<DbKey extends string = "db"> = {
  Variables: {
    [key in DbKey]: DbClient;
  };
};

/**
 * データベースクライアントミドルウェアのオプション
 */
export interface DbMiddlewareOptions<ContextKey extends string = "db"> {
  /**
   * HonoのContextにクライアントを設定する際のキー名 (リテラル文字列推奨)
   * @default "db"
   */
  contextKey?: ContextKey;

  /**
   * データベース接続文字列が格納されている環境変数名
   * @default "DATABASE_URL"
   */
  envKey?: string;

  /**
   * `postgres.js` に渡す追加オプション
   * 環境に応じて `max` オプションなどが内部で調整される可能性があります。
   * @default {}
   */
  postgresOptions?: postgres.Options<Record<string, postgres.PostgresType>>;
}

// --- グローバル変数 (非Workers環境でのインスタンス保持用) ---
// この変数は、Node.jsなどの環境でのみ、初期化後にインスタンスを保持するために使用されます。
let sharedDbClientInstance: DbClient | null = null;
// 非Workers環境での初期化重複を防ぐための簡易的なフラグ（ロック）
let isInitializingSharedDb = false;

/**
 * データベースクライアントを初期化する内部関数
 * エラーが発生した場合は null を返し、ログを出力します。
 *
 * @param c Hono Context (環境変数取得のため)
 * @param options 設定オプションと環境情報
 * @returns 初期化されたクライアントインスタンス、または失敗時 null
 */
const initializeDbClientInternal = (
  c: Context,
  options: {
    envKey: string;
    postgresOptions: postgres.Options<Record<string, postgres.PostgresType>>;
    contextKey: string;
    isCloudflareWorkers: boolean; // 現在の環境がWorkersかどうか
  }
): DbClient | null => {
  const { envKey, postgresOptions, contextKey, isCloudflareWorkers } = options;
  try {
    // 環境変数を取得 (Honoのアダプタを使用)
    const databaseUrl =
      // 本番環境の場合
      env<{ [key: string]: string }>(c)[envKey] ||
      // 開発環境の場合
      // prettier-ignore
      `postgresql://${import.meta.env.VITE_POSTGRES_USER}:${import.meta.env.VITE_POSTGRES_PASSWORD}@localhost:5432/${import.meta.env.VITE_POSTGRES_DB}?sslmode=disable`;

    if (!databaseUrl) {
      // 接続文字列が見つからない場合はエラーログを出力し、nullを返す
      console.error(
        `[${contextKey}] Error: Database connection string environment variable '${envKey}' not found.`
      );
      return null;
    }

    // postgres.js に渡す最終的なオプションを準備
    const finalOptions: postgres.Options<
      Record<string, postgres.PostgresType>
    > = {
      // 提供されたオプションをベースにする
      ...postgresOptions,
      // 環境に応じた調整 (例: Workersではデフォルトの最大接続数を調整)
      // 注意: Hyperdriveを使用する場合、maxはHyperdrive側で管理されるため、ここでの指定の影響は限定的です。
      //       Hyperdriveを使わない直接接続の場合、Workersでは少ない値(例: 1)が推奨されることがあります。
      max: isCloudflareWorkers
        ? postgresOptions?.max ?? 1
        : postgresOptions?.max, // Workers環境ではデフォルト1、それ以外は指定値 or デフォルト
      // --- その他の推奨オプション例 ---
      // idle_timeout: postgresOptions?.idle_timeout ?? 20, // アイドル接続のタイムアウト(秒)
      // connect_timeout: postgresOptions?.connect_timeout ?? 10, // 接続試行のタイムアウト(秒)
      // transform: { // 例: snake_case -> camelCase 変換
      //   column: postgres.toCamel,
      //   ...postgresOptions.transform,
      // },
      // ---------------------------------
    };

    // postgres クライアントを初期化
    const client = postgres(databaseUrl, finalOptions);

    // 成功ログ（環境と戦略を明記）
    console.log(
      `[${contextKey}] Database client initialized successfully. (Environment: ${
        isCloudflareWorkers ? "Cloudflare Workers" : "Other"
      }, Strategy: ${isCloudflareWorkers ? "Per-request" : "Shared Instance"})`
    );
    return client;
  } catch (error) {
    // エラーログを出力し、nullを返す
    console.error(
      `[${contextKey}] Failed to initialize database client:`,
      error
    );
    return null;
  }
};

/**
 * Honoミドルウェア: 環境に応じてデータベースクライアントを初期化/再利用し、Contextに設定します。
 *
 * - **Cloudflare Workers環境**: リクエストごとに新しいクライアントインスタンスを初期化します。
 *   これにより `Cannot perform I/O...` エラーを回避しますが、接続オーバーヘッドが発生する可能性があります。
 *   **Cloudflare Hyperdrive の利用を強く推奨します。** Hyperdriveが接続プーリングを管理するため、
 *   Worker側で毎回初期化しても効率的に動作します。
 *
 * - **その他の環境 (Node.jsなど)**: 初回リクエスト時にクライアントを初期化し、以降は
 *   グローバルに保持された同じインスタンスを効率的に再利用します。
 *
 * @param options ミドルウェアの設定オプション
 * @returns Honoミドルウェアハンドラ
 */
export const dbClientMiddlewareConditional = <ContextKey extends string = "db">(
  options?: DbMiddlewareOptions<ContextKey>
): MiddlewareHandler<DbEnv<ContextKey> & HonoEnv> => {
  const contextKey = options?.contextKey ?? ("db" as ContextKey);
  const envKey = options?.envKey ?? "DATABASE_URL";
  const postgresOptions = options?.postgresOptions ?? {};

  // この関数がリクエストごとに呼び出されます
  return async (c, next) => {
    // Honoのアダプタを使って現在のランタイム環境を取得
    const runtime = getRuntimeKey();
    const isCloudflareWorkers = runtime === "workerd";

    let clientToUse: DbClient | null = null; // このリクエストで使用するクライアントインスタンス

    if (isCloudflareWorkers) {
      // --- Cloudflare Workers環境: 毎回新しいインスタンスを初期化 ---
      // console.log(`[${contextKey}] Initializing DB client for Worker request...`);
      clientToUse = initializeDbClientInternal(c, {
        envKey,
        postgresOptions,
        contextKey,
        isCloudflareWorkers,
      });
      // 注意: Hyperdriveを使わない場合、毎回接続コストがかかります。
    } else {
      // --- 非Workers環境: 初回初期化 & 以降は共有インスタンスを再利用 ---
      if (sharedDbClientInstance === null) {
        // グローバルインスタンスがまだ存在しない場合 (初回リクエスト or 初期化失敗後)
        if (!isInitializingSharedDb) {
          // 他のリクエストが初期化中でなければ、初期化処理を開始
          isInitializingSharedDb = true; // 簡易ロックを取得
          try {
            console.log(
              `[${contextKey}] Initializing shared database client (non-worker)...`
            );
            // グローバル変数に初期化結果を格納
            sharedDbClientInstance = initializeDbClientInternal(c, {
              envKey,
              postgresOptions,
              contextKey,
              isCloudflareWorkers,
            });
            clientToUse = sharedDbClientInstance; // 初期化したインスタンスを使用
          } finally {
            isInitializingSharedDb = false; // 処理完了後、ロックを解除
          }
        } else {
          // 他のリクエストが初期化中の場合 -> 待機（簡易ポーリング）
          console.log(
            `[${contextKey}] Waiting for shared database client initialization (non-worker)...`
          );
          let waitCount = 0;
          const maxWaitCount = 100; // 約5秒待機 (50ms * 100)
          while (isInitializingSharedDb && waitCount < maxWaitCount) {
            await new Promise((resolve) => setTimeout(resolve, 50)); // 短時間待機
            waitCount++;
          }
          if (isInitializingSharedDb) {
            // 待機しても初期化が終わらない場合 (タイムアウト)
            console.error(
              `[${contextKey}] Shared database client initialization timed out (non-worker).`
            );
            clientToUse = null; // 利用可能なクライアントなし
          } else {
            // 初期化が終わったはずなので、グローバル変数から取得
            clientToUse = sharedDbClientInstance;
            if (clientToUse) {
              console.log(
                `[${contextKey}] Obtained shared database client after waiting (non-worker).`
              );
            } else {
              // 初期化が終わったのにnull -> 初期化に失敗した可能性
              console.error(
                `[${contextKey}] Shared database client is null after initialization finished (non-worker).`
              );
            }
          }
        }
      } else {
        // 既に初期化済みの場合は、グローバルインスタンスを再利用
        // console.log(`[${contextKey}] Reusing shared database client (non-worker).`);
        clientToUse = sharedDbClientInstance;
      }
    }

    // --- Contextへの設定 ---
    if (clientToUse) {
      // Hono v4以降推奨の c.set() を使用
      // @ts-expect-error Honoでは動的キーの型推論が難しい場合があるためエラーを抑制
      c.set(contextKey, clientToUse);
    } else {
      // 初期化に失敗した場合など、クライアントが利用不可
      console.error(
        `[${contextKey}] Database client is not available for this request.`
      );
      // 必要に応じてここでエラーレスポンスを返し、処理を中断することも可能
      // 例: return c.text('Database service unavailable', 503);
    }

    // 次のミドルウェアまたはルートハンドラを実行
    await next();

    // --- リクエスト後処理 ---
    // Workers環境で毎回初期化した場合、リソースリークを防ぐために `client.end()` を呼ぶべきか検討。
    // postgres.js は比較的自動で管理するが、明示的な終了が安全な場合もある。
    // Hyperdrive利用時は通常不要。ドキュメントや負荷テストで確認推奨。
    // if (isCloudflareWorkers && clientToUse && typeof clientToUse.end === 'function') {
    //   // console.log(`[${contextKey}] Attempting to end per-request DB client (Worker)...`);
    //   // 非同期だが、レスポンス返却をブロックしないように await しない方が良い場合も
    //   clientToUse.end({ timeout: 2000 }) // 短いタイムアウトを設定
    //     .then(() => /* console.log(`[${contextKey}] Per-request DB client ended.`) */)
    //     .catch(err => console.error(`[${contextKey}] Error ending per-request DB client:`, err));
    // }
  };
};
