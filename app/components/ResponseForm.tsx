import FormEnhance from "../islands/FormEnhance";

import type { FC } from "hono/jsx";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const ResponseForm: FC<{ action: string }> = ({ action }) => (
  <section className="bg-white rounded-lg shadow-md p-6">
    <h2 className="text-2xl font-semibold mb-4">返信する</h2>
    <form method="post" action={action} className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row gap-4">
        <label className="block text-gray-700 text-sm font-bold mb-2 md:w-1/2">
          名前:
          <input
            type="text"
            name="name"
            className="border border-gray-400 rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
          />
        </label>
        <label className="block text-gray-700 text-sm font-bold mb-2 md:w-1/2">
          メールアドレス:
          <input
            name="mail"
            className="border border-gray-400 rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
          />
        </label>
      </div>
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2">
          本文:
          <textarea
            name="content"
            required
            className="border border-gray-400 rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline h-32"
          ></textarea>
        </label>
      </div>
      <button
        type="submit"
        className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
      >
        書き込む
      </button>
      <FormEnhance />
    </form>
  </section>
);
