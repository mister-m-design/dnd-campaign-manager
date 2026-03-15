import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8 animate-in fade-in zoom-in duration-1000">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-[120px] rounded-full" />
        <div className="size-32 bg-primary/10 border border-primary/20 rounded-3xl flex items-center justify-center relative backdrop-blur-2xl">
          <span className="material-symbols-outlined text-6xl text-primary drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]">castle</span>
        </div>
      </div>

      <div className="text-center space-y-2">
        <h1 className="text-5xl font-black text-slate-100 uppercase tracking-tighter">Welcome to StitchDM</h1>
        <p className="text-slate-500 font-medium tracking-widest uppercase text-xs">The Ultimate Campaign Orchestrator</p>
      </div>

      <div className="flex gap-4">
        <Link href="/campaign" className="bg-primary text-background-dark px-8 py-3 rounded-xl font-black uppercase text-xs tracking-[0.2em] hover:scale-105 active:scale-95 transition-all primary-glow">
          Resume Campaign
        </Link>
        <Link href="/characters/create" className="bg-white/5 border border-white/10 text-slate-300 px-8 py-3 rounded-xl font-black uppercase text-xs tracking-[0.2em] hover:bg-white/10 transition-all">
          New Hero
        </Link>
      </div>
    </div>
  );
}
