import { HealthStatus } from './components/HealthStatus.jsx';

export default function App() {
  return (
    <main className="min-h-screen bg-slate-50 p-8 text-slate-900 dark:bg-slate-950 dark:text-white">
      <section className="mx-auto max-w-xl rounded-xl bg-white p-6 shadow dark:bg-slate-900">
        <h1 className="text-2xl font-semibold">TaskFlow setup</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">The client is checking the API health endpoint.</p>
        <HealthStatus />
      </section>
    </main>
  );
}
