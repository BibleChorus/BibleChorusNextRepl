import { useState } from 'react';
import Router from 'next/router';
import { Button } from '@/components/ui/button';

export default function UploadTeaching() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pdf, setPdf] = useState<File | null>(null);
  const [basedOnType, setBasedOnType] = useState('theme');
  const [reference, setReference] = useState('');
  const [aiGenerated, setAiGenerated] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiModelUsed, setAiModelUsed] = useState('');
  const [tags, setTags] = useState('');
  const [language, setLanguage] = useState('en');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdf) return;
    const form = new FormData();
    form.append('title', title);
    form.append('description', description);
    form.append('pdf', pdf);
    form.append('based_on_type', basedOnType);
    form.append('reference', reference);
    form.append('ai_generated', String(aiGenerated));
    if (aiPrompt) form.append('ai_prompt', aiPrompt);
    if (aiModelUsed) form.append('ai_model_used', aiModelUsed);
    if (tags) form.append('tags', tags);
    form.append('language', language);
    const res = await fetch('/api/teachings', { method: 'POST', body: form });
    if (res.ok) {
      Router.push('/learn');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Upload Teaching</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="border p-2 w-full"
          required
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="border p-2 w-full"
        />
        <div>
          <label className="mr-2">
            <input type="radio" value="theme" checked={basedOnType==='theme'} onChange={()=>setBasedOnType('theme')} /> Theme
          </label>
          <label className="ml-4">
            <input type="radio" value="passage" checked={basedOnType==='passage'} onChange={()=>setBasedOnType('passage')} /> Passage
          </label>
        </div>
        <input
          type="text"
          placeholder="Theme or Passage"
          value={reference}
          onChange={e => setReference(e.target.value)}
          className="border p-2 w-full"
        />
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={aiGenerated} onChange={e=>setAiGenerated(e.target.checked)} />
          Created with AI assistance
        </label>
        {aiGenerated && (
          <>
            <input
              type="text"
              placeholder="AI Prompt"
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              className="border p-2 w-full"
            />
            <input
              type="text"
              placeholder="AI Model Used"
              value={aiModelUsed}
              onChange={e => setAiModelUsed(e.target.value)}
              className="border p-2 w-full"
            />
          </>
        )}
        <input
          type="text"
          placeholder="Tags (comma separated)"
          value={tags}
          onChange={e => setTags(e.target.value)}
          className="border p-2 w-full"
        />
        <input
          type="text"
          placeholder="Language code (e.g. en)"
          value={language}
          onChange={e => setLanguage(e.target.value)}
          className="border p-2 w-full"
        />
        <input
          type="file"
          accept="application/pdf"
          onChange={e => setPdf(e.target.files?.[0] || null)}
          required
        />
        <Button type="submit">Upload</Button>
      </form>
    </div>
  );
}
