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
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Head>
        <title>BibleChorus - How To</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4 sm:mb-8 pt-4 sm:pt-6 md:pt-8 lg:pt-10 xl:pt-12">How To Use BibleChorus</h1>
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