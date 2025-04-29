import type { FC } from "hono/jsx";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const PaginationLinks: FC<{ base: string; latest: number }> = ({
  base,
  latest,
}) => (
  <div className="flex gap-4 mt-4">
    <a href={`${base}`} className="text-blue-600 hover:underline">
      全部読む
    </a>
    <a href={`${base}/l50`} className="text-blue-600 hover:underline">
      最新50件
    </a>
    <a href={`${base}/1-100`} className="text-blue-600 hover:underline">
      1-100
    </a>
    <a href={`${base}/${latest}-`} className="text-blue-600 hover:underline">
      新着
    </a>
  </div>
);
export default PaginationLinks;
