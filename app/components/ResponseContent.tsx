import type { ReadResponseContent } from "../../src/conversation/domain/read/ReadResponseContent";
import type { ReadThreadId } from "../../src/conversation/domain/read/ReadThreadId";
import type { FC } from "hono/jsx";
import type { JSX } from "hono/jsx/jsx-runtime"; // JSX要素の型定義のために追加

// --- Helper Functions ---

// エスケープ文字と対応するプレースホルダーのマッピング
// Note: プレースホルダーは実際のテキストと衝突しにくいユニークなものにする
const escapeMap: Readonly<Record<string, string>> = {
  "\\```": "__ESC_BACKTICK__", // Note: コードブロックの開始/終了自体をエスケープする場合
  "\\***": "__ESC_BOLD__",
  "\\~~~": "__ESC_STRIKE__",
  "\\>>": "__ESC_ANCHOR_PREFIX__", // >>自体をエスケープする場合
  "\\http://": "__ESC_HTTP__", // URLのエスケープ
  "\\https://": "__ESC_HTTPS__", // URLのエスケープ
};
// Note: キーの長さが違うため、長いものからマッチさせる必要がある正規表現
// 引用処理を削除したため、 \> のエスケープは不要になった
const escapeRegex = /(\\```|\\\*\*\*|\\~~~|\\>>|\\https?:\/\/)/g;

// プレースホルダーから元の文字（エスケープ文字なし）に戻すマッピング
const unescapeMap = Object.fromEntries(
  Object.entries(escapeMap).map(([key, value]) => [value, key.substring(1)]) // 先頭の \ を削除
);
const unescapeRegex = new RegExp(Object.keys(unescapeMap).join("|"), "g");

// Markdownのエスケープ文字をプレースホルダーに置換する関数
const escapeMarkdown = (text: string): string => {
  // \\ のエスケープを最初に行う（他のエスケープ処理で \ が消費されないように）
  let escapedText = text.replace(/\\\\/g, "__ESC_BACKSLASH__");
  // 他のエスケープ対象を置換
  escapedText = escapedText.replace(
    escapeRegex,
    (match) => escapeMap[match] || match
  );
  return escapedText;
};

// プレースホルダーを元の文字に戻す関数 (JSX要素はそのまま返す)
const unescapeResult = (part: string | JSX.Element): string | JSX.Element => {
  if (typeof part === "string") {
    let unescapedText = part.replace(
      unescapeRegex,
      (match) => unescapeMap[match] || match
    );
    // 最後にバックスラッシュを戻す
    unescapedText = unescapedText.replace(/__ESC_BACKSLASH__/g, "\\");
    return unescapedText;
  }
  return part;
};

// --- Inline Decoration Processing ---

// 太字 (***) と 取り消し線 (~~~) を処理する関数
const processInlineDecorations = (text: string): (string | JSX.Element)[] => {
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  // 正規表現: ***...*** または ~~~...~~~ (non-greedy)
  // Note: エスケープされたものはプレースホルダーになっている想定
  const inlineRegex = /(\*\*\*(.*?)\*\*\*)|(~~~(.*?)~~~)/g;
  let match;

  while ((match = inlineRegex.exec(text)) !== null) {
    // マッチ前のテキストを追加
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // マッチ内容に応じてJSX要素を追加
    if (match[1]) {
      // ***...*** (太字)
      // 中身はプレーンテキストとして扱う (再帰パースしない)
      parts.push(
        <strong key={`strong-${match.index}`} className="font-black">
          {match[2]}
        </strong>
      );
    } else if (match[3]) {
      // ~~~...~~~ (取り消し線)
      parts.push(<s key={`s-${match.index}`}>{match[4]}</s>);
    }
    lastIndex = inlineRegex.lastIndex; // lastIndex を更新
  }

  // 最後のマッチ以降のテキストを追加
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  // 何もマッチしなかった場合は元のテキストを配列で返す
  return parts.length === 0 && lastIndex === 0 ? [text] : parts;
};

// --- ResponseLineComponent ---

// eslint-disable-next-line @typescript-eslint/naming-convention
export const ResponseLineComponent: FC<{
  line: string;
  threadId: ReadThreadId;
}> = ({ line, threadId }) => {
  // 1. エスケープ処理 (\記号をプレースホルダーに)
  const escapedLine = escapeMarkdown(line);

  // 2. 引用処理 (>記号) は削除。contentLineはエスケープ後の行をそのまま使用。
  const contentLine = escapedLine;

  // 3. レスアンカー (>>数字) と URL の処理
  //    正規表現: >>数字 または URL (エスケープされていないもの)
  //    エスケープ処理済みなので、プレースホルダーはマッチしない
  const linkRegex = />>(\d+)|(https?:\/\/[^\s<>"']+)/g;
  const linkParts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(contentLine)) !== null) {
    // マッチ前のテキストを追加
    if (match.index > lastIndex) {
      linkParts.push(contentLine.substring(lastIndex, match.index));
    }

    // マッチ内容に応じてリンクを生成
    if (match[1]) {
      // >>数字 (レスアンカー)
      linkParts.push(
        <a
          key={`anchor-${match.index}`}
          className="text-blue-500 hover:underline"
          href={`#${threadId.val}-${match[1]}`}
        >
          {`>>${match[1]}`}
        </a>
      );
    } else if (match[2]) {
      // URL
      const url = match[2];
      linkParts.push(
        <a
          key={`url-${match.index}`}
          className="text-blue-500 hover:underline"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {url}
        </a>
      );
    }
    lastIndex = linkRegex.lastIndex; // lastIndex を更新
  }

  // 最後のマッチ以降のテキストを追加
  if (lastIndex < contentLine.length) {
    linkParts.push(contentLine.substring(lastIndex));
  }

  // 4. 行内装飾 (太字、取り消し線) の処理
  const decoratedParts = linkParts.flatMap(
    (part) =>
      typeof part === "string" ? processInlineDecorations(part) : [part] // 文字列なら装飾処理、JSXならそのまま
  );

  // 5. エスケープ文字の復元 (プレースホルダーを元の文字に)
  const finalParts = decoratedParts.map(unescapeResult);

  // 6. 最終的なJSXを返す (引用装飾は削除)
  //    行ごとのラッパーdivは ResponseContentComponent 側で追加するため、Fragment で返す
  return <>{finalParts}</>;
};

// --- ResponseContentComponent ---

// eslint-disable-next-line @typescript-eslint/naming-convention
export const ResponseContentComponent: FC<{
  threadId: ReadThreadId;
  responseContent: ReadResponseContent;
}> = ({ threadId, responseContent }) => {
  const lines = responseContent.val.split("\n");
  const resultComponents: JSX.Element[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // エスケープされた ``` は無視する
    const trimmedLine = line.trim();
    const isCodeBlockFence =
      trimmedLine === "```" && !line.trimStart().startsWith("\\```");

    if (isCodeBlockFence) {
      if (inCodeBlock) {
        // コードブロック終了
        // 空のコードブロックは無視しない（ ``` ``` の場合）
        resultComponents.push(
          <pre
            key={`code-${i}`}
            className="bg-gray-200 p-2 rounded overflow-x-auto"
          >
            <code className="text-sm">{codeBlockLines.join("\n")}</code>
          </pre>
        );
        codeBlockLines = []; // クリア
        inCodeBlock = false;
      } else {
        // コードブロック開始
        inCodeBlock = true;
      }
    } else {
      if (inCodeBlock) {
        // コードブロック内の行を追加
        // Note: コードブロック内はエスケープも Markdown パースもせず、生の line を使うのが正しい。
        codeBlockLines.push(line);
      } else {
        // 通常の行 -> ResponseLineComponent で処理
        resultComponents.push(
          // 各行を div でラップして、改行を表現しつつ block 要素とする
          <div key={i}>
            <ResponseLineComponent line={line} threadId={threadId} />
          </div>
        );
      }
    }
  }

  // ループ終了時にコードブロックが閉じられていない場合
  if (inCodeBlock) {
    resultComponents.push(
      <pre
        key={`code-final`}
        className="bg-gray-200 p-2 rounded overflow-x-auto"
      >
        <code className="text-sm">{codeBlockLines.join("\n")}</code>
      </pre>
    );
  }

  return <div>{resultComponents}</div>;
};
