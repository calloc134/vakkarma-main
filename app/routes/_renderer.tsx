import { jsxRenderer } from "hono/jsx-renderer";
import { Link } from "honox/server";

import { getBoardConfigUsecase } from "../../src/config/usecases/getBoardConfigUsecase";
import { ErrorMessage } from "../components/ErrorMessage";
import { sql } from "../db";

export default jsxRenderer(async ({ children }) => {
  if (!sql) {
    return <ErrorMessage error={new Error("DBに接続できませんでした")} />;
  }
  const configResult = await getBoardConfigUsecase({
    sql,
  });

  if (configResult.isErr()) {
    console.error(configResult.error.message);
    return <ErrorMessage error={configResult.error} />;
  }

  return (
    <html lang="ja">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{configResult.value.boardName.val}</title>
        <Link href="/app/style.css" rel="stylesheet" />
        <link rel="icon" href="favicon.svg" type="image/svg+xml" />
      </head>
      <body>
        <div className="flex flex-col min-h-screen bg-gray-100">
          <header className="bg-gradient-to-r from-purple-500 to-orange-200 text-white w-full py-4 px-6">
            <div className="container mx-auto">
              <a className="text-3xl font-bold" href="/">
                {configResult.value.boardName.val}
              </a>
              <p className="text-sm">{configResult.value.localRule.val}</p>
            </div>
          </header>

          {children}
        </div>
      </body>
    </html>
  );
});
