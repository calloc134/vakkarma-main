import type { ReadResponseContent } from "../../src/conversation/domain/read/ReadResponseContent";
import type { ReadThreadId } from "../../src/conversation/domain/read/ReadThreadId";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const ResponseLineComponent = ({
  line,
  threadId,
}: {
  line: string;
  threadId: ReadThreadId;
}) => {
  // 正規表現を更新: >>数字 または URL にマッチさせる
  // グループ1: >>以降の数字 (レスアンカー用)
  // グループ2: URL全体 (URLリンク用)
  // URLのパターンは https?:// から始まり、空白、<, >, ", ' 以外の文字が続くものとする
  const regex = />>(\d+)|(https?:\/\/[^\s<>"']+)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(line)) !== null) {
    // マッチ位置より前のテキストを追加
    if (match.index > lastIndex) {
      parts.push(line.substring(lastIndex, match.index));
    }

    // マッチした内容に応じてリンクを生成
    if (match[1]) {
      // >>数字 (レスアンカー) の場合
      parts.push(
        <a
          key={match.index}
          className="text-blue-500 hover:underline"
          href={`#${threadId.val}-${match[1]}`}
        >
          {`>>${match[1]}`} {/* マッチした文字列全体を表示 */}
        </a>
      );
    } else if (match[2]) {
      // URL の場合
      const url = match[2];
      parts.push(
        <a
          key={match.index}
          className="text-blue-500 hover:underline"
          href={url}
          target="_blank" // 新しいタブで開く
          rel="noopener noreferrer" // セキュリティ対策
        >
          {url} {/* URL自体をリンクテキストとして表示 */}
        </a>
      );
    }

    // 最後のマッチ位置を更新
    lastIndex = match.index + match[0].length;
  }

  // 最後のマッチ以降のテキストを追加
  parts.push(line.substring(lastIndex));

  // <a>タグではなく<span>を使うことで、行全体のdiv不要になる可能性も
  // ただ、行ごとにブロック要素が必要な場合もあるのでdivのままにしておく
  return <div>{parts}</div>;
};

// ResponseContentComponent は変更不要
// eslint-disable-next-line @typescript-eslint/naming-convention
export const ResponseContentComponent = ({
  threadId,
  responseContent,
}: {
  threadId: ReadThreadId;
  responseContent: ReadResponseContent;
}) => {
  const lines = responseContent.val.split("\n");
  return (
    <div>
      {lines.map((line, i) => (
        <ResponseLineComponent key={i} line={line} threadId={threadId} />
      ))}
    </div>
  );
};
