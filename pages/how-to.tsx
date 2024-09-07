import Head from 'next/head'

export default function HowTo() {
  const steps = [
    { title: 'Create an Account', description: 'Sign up for a free BibleChorus account to access all features.' },
    { title: 'Upload Songs', description: 'Share your favorite Bible songs by uploading them to our platform.' },
    { title: 'Create Playlists', description: 'Organize your favorite songs into custom playlists.' },
    { title: 'Listen and Enjoy', description: 'Stream Bible songs anytime, anywhere on your devices.' },
    { title: 'Vote on Songs', description: 'Help the community by voting on your favorite songs.' },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-8">
      <Head>
        <title>BibleChorus - How To</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8">How To Use BibleChorus</h1>
        <ol className="space-y-6">
          {steps.map((step, index) => (
            <li key={index} className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md shadow-md">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                {index + 1}. {step.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{step.description}</p>
            </li>
          ))}
        </ol>
      </main>
    </div>
  )
}