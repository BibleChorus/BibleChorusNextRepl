import Head from 'next/head'
import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function Upload() {
  const [file, setFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Handle file upload logic here
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-8">
      <Head>
        <title>BibleChorus - Upload Songs</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8">Upload Songs</h1>
        
        <Tabs defaultValue="about" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
          </TabsList>
          <TabsContent value="about">
            <div className="prose dark:prose-invert">
              <h2>Why We Need Detailed Information</h2>
              <p>At BibleChorus, we believe in providing a comprehensive and transparent platform for sharing Bible-inspired music. The detailed information we collect serves several important purposes:</p>
              <ul>
                <li><strong>Accuracy and Attribution:</strong> We want to ensure that each song is properly credited to its artist and that the Bible passages used are correctly identified.</li>
                <li><strong>AI Transparency:</strong> In the age of AI-generated content, we believe it's important to disclose when AI has been used in the creation of lyrics or music.</li>
                <li><strong>Categorization:</strong> Detailed genre and style information helps users find the type of music they're looking for more easily.</li>
                <li><strong>Scripture Adherence:</strong> Understanding how closely the lyrics follow scripture helps users choose songs that align with their preferences for scriptural interpretation.</li>
                <li><strong>Educational Value:</strong> Information about the creative process, including AI prompts used, can be educational for other artists and curious listeners.</li>
                <li><strong>Quality Control:</strong> Knowing the Bible translation and whether a passage is continuous helps ensure the integrity of the scriptural content.</li>
              </ul>
              <p>By providing this information, you're contributing to a rich, informative database that serves both listeners and fellow artists in the Christian music community.</p>
            </div>
          </TabsContent>
          <TabsContent value="upload">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Choose a file
                </label>
                <Input
                  id="file-upload"
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                />
              </div>
              <Button type="submit">
                Upload
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}