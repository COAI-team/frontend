export const DIFFICULTY_COLORS = {
  BRONZE: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-200" },
  SILVER: { bg: "bg-gray-100", text: "text-gray-800", border: "border-gray-200" },
  GOLD: { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-200" },
  PLATINUM: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200" },
};

export function getDifficultyColorClasses(difficulty) {
  const key = typeof difficulty === "string" ? difficulty.toUpperCase() : difficulty;
  return (
    DIFFICULTY_COLORS[key] || { bg: "bg-gray-100", text: "text-gray-800", border: "border-gray-200" }
  );
}
