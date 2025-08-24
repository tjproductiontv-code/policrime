// app/eliminated/page.tsx
import RestartButton from "../../components/RestartButton";

export default function EliminatedPage() {
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-3xl font-bold">Schuldig bevonden aan corruptie</h1>
      <p className="text-gray-700">
        Je bent uitgeschakeld door tegenstanders. Je kunt niet langer deelnemen aan het spel.
      </p>

      <div className="mt-4">
        <RestartButton />
        <p className="text-xs text-gray-500 mt-2 leading-relaxed">
          • Je <b>privileges</b> blijven behouden.<br />
          • Je <b>passief inkomen</b> blijft, maar daalt met <b>10%</b>.<br />
          • Je <b>stemmen</b> worden aangepast: <b>-1000</b> (nooit onder 0).<br />
          • Je voortgang (level/progress) en status (HP/cooldowns) worden gereset.
        </p>
      </div>
    </main>
  );
}
