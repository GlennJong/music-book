export const tuningInfo: { [key: string]: string[] } = {
  standard: ["E", "B", "G", "D", "A", "E"],
  dropD:   ["E", "B", "G", "D", "A", "D"],
  halfDown: ["Eb", "Bb", "Gb", "Db", "Ab", "Eb"],
  openG:   ["D", "B", "G", "D", "G", "D"],
  // 可依需求擴充更多調弦
};

export type TuningName = keyof typeof tuningInfo;
