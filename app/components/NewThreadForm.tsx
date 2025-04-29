import FormEnhance from "../islands/FormEnhance";

import type { FC } from "hono/jsx";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const NewThreadForm: FC<{ action: string }> = ({ action }) => (
  <section className="bg-white rounded-lg shadow-md p-6">
    <h2 className="text-2xl font-semibold mb-4">新規スレッド作成</h2>
    <form method="post" action={action} className="flex flex-col gap-4">
      <label className="block">
        タイトル:
        <input
          type="text"
          name="title"
          required
          className="border rounded w-full p-2"
        />
      </label>
      <div className="flex gap-4">
        <input
          name="name"
          placeholder="名前"
          className="border rounded p-2 flex-1"
        />
        <input
          name="mail"
          placeholder="メール"
          className="border rounded p-2 flex-1"
        />
      </div>
      <label className="block">
        本文:
        <textarea
          name="content"
          required
          className="border rounded w-full p-2 h-32"
        />
      </label>
      <button type="submit" className="bg-purple-500 text-white py-2 rounded">
        新規作成
      </button>
      <FormEnhance />
    </form>
  </section>
);
