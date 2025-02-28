// eslint-disable-next-line @typescript-eslint/naming-convention
export const ErrorMessage = ({ error }: { error: Error }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <p className="text-red-500 text-lg font-bold">エラーが発生しました</p>
      <p className="text-gray-700">{error.message}</p>
      <a
        href="javascript:history.back()"
        className="text-blue-500 hover:underline mt-4"
      >
        戻る
      </a>
    </div>
  );
};
