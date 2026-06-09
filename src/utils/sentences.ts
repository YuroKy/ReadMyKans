// Splits text into sentences for sentence-by-sentence shadowing. Breaks after
// Japanese/Latin sentence terminators (keeping the terminator with its
// sentence) and on line breaks; trims and drops empty pieces.
export const splitSentences = (text: string): string[] =>
  text
    .split(/(?<=[。．！？!?])|[\n\r]+/u)
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
