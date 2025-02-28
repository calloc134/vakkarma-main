import type { NotFoundHandler } from "hono";

const handler: NotFoundHandler = (c) => {
  return c.render(
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-purple-500 text-lg font-bold">404 Not Found</h1>
      <p className="text-gray-700">存在しないページのようです。</p>
      <p className="text-gray-700">URLを確認してください。</p>
      <a
        href="javascript:history.back()"
        className="text-blue-500 hover:underline mt-4"
      >
        戻る
      </a>
    </div>
  );
};

export default handler;
