interface ScoreCardProps {
  label: string;
  score: number;
}

function scoreColor(score: number) {
  if (score >= 90) return "text-green-400";
  if (score >= 50) return "text-yellow-400";
  return "text-red-400";
}

function scoreBorder(score: number) {
  if (score >= 90) return "border-green-500/30";
  if (score >= 50) return "border-yellow-500/30";
  return "border-red-500/30";
}

export default function ScoreCard({ label, score }: ScoreCardProps) {
  return (
    <div className={`border ${scoreBorder(score)} bg-neutral-900 p-6 text-center`}>
      <div className={`text-5xl font-black ${scoreColor(score)}`}>{score}</div>
      <div className="mt-2 text-xs font-semibold uppercase tracking-widest text-neutral-500">{label}</div>
    </div>
  );
}
