import iconv from "iconv-lite";

export const convertShiftJis = (text: string) => {
  const buffer = iconv.encode(text, "Shift_JIS");
  return new Response(buffer, {
    headers: { "Content-Type": "text/plain; charset=Shift_JIS" },
  });
};
