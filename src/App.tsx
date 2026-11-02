const COMING_SOON = ['Coffee tracker', 'Reading list', 'To-do list']

export default function App() {
  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="text-2xl font-bold">{'<Daily Brad>'}</h1>
      <p className="mt-1 text-stone-600">It works. This page is live on the internet.</p>
      <h2 className="mt-4 font-semibold">Coming soon</h2>
      <ul className="mt-1 list-disc pl-5">
        {COMING_SOON.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </main>
  )
}
