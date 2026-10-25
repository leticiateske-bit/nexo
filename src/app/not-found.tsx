import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <div className="font-display text-6xl font-semibold text-green">4<span className="text-pink">0</span>4</div>
      <p className="mt-2 text-sm text-ink-soft">Página não encontrada.</p>
      <Link href="/" className="mt-4 rounded-full bg-pink px-5 py-2 text-sm text-white">Voltar à visão geral</Link>
    </div>
  );
}
