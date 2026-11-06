function App() {
  return (
    <main className="min-h-screen bg-surface px-6 py-12 text-ink">
      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
        <span className="rounded-full bg-brand-100 px-4 py-2 text-sm font-semibold text-brand-800">
          T01 · Esqueleto listo
        </span>
        <div className="rounded-card bg-white p-10 shadow-xl shadow-slate-200/70">
          <p className="mb-3 text-5xl" aria-hidden="true">🛒</p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">SmartCart</h1>
          <p className="mt-4 text-xl text-muted">
            Tu compra inteligente para supermercados de Guatemala.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm font-medium">
            <span className="rounded-full bg-brand-50 px-4 py-2 text-brand-700">React 19</span>
            <span className="rounded-full bg-brand-50 px-4 py-2 text-brand-700">TypeScript</span>
            <span className="rounded-full bg-brand-50 px-4 py-2 text-brand-700">Tailwind v4</span>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
