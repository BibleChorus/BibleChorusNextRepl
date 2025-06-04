import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import PdfUploadProgressBar from '@/components/UploadPage/PdfUploadProgressBar';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { THEMES } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const MAX_PDF_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().optional(),
  ai_assisted: z.boolean().default(false),
  themes: z.array(z.string()).min(1, 'Select at least one theme'),
  pdf_url: z.string().min(1, 'PDF upload required'),
});

type FormValues = z.infer<typeof formSchema> & { pdf_file?: File | null };

export default function UploadPdf() {
  const router = useRouter();
  const { user } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      author: '',
      ai_assisted: false,
      themes: [],
      pdf_url: '',
    },
  });

  const [themeSearch, setThemeSearch] = useState('');
  const [openTheme, setOpenTheme] = useState(false);
  const selectedThemes = form.watch('themes') as string[];

  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) {
    return null;
  }

  const filteredThemes = THEMES.filter(theme =>
    theme.toLowerCase().includes(themeSearch.toLowerCase())
  );

  const handleThemeToggle = (theme: string) => {
    let updated: string[];
    if (selectedThemes.includes(theme)) {
      updated = selectedThemes.filter(t => t !== theme);
    } else {
      updated = [...selectedThemes, theme];
    }
    form.setValue('themes', updated, { shouldValidate: true });
  };

  const clearThemes = () => {
    form.setValue('themes', [], { shouldValidate: true });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      return;
    }

    if (file.size > MAX_PDF_FILE_SIZE) {
      toast.error('PDF must be 10MB or smaller');
      return;
    }

    try {
      setUploadStatus('uploading');
      const { data } = await axios.post('/api/upload-url', {
        fileType: file.type,
        fileExtension: 'pdf',
        title: form.getValues('title') || file.name.replace(/\.pdf$/i, ''),
        userId: user.id,
        fileSize: file.size,
        uploadType: 'pdf',
      });

      await axios.put(data.signedUrl, file, {
        headers: { 'Content-Type': file.type },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setUploadProgress(progress);
        },
      });

      form.setValue('pdf_url', data.fileKey, { shouldValidate: true });
      setUploadStatus('success');
      toast.success('PDF uploaded');
    } catch (err: any) {
      console.error('Upload failed:', err);
      setUploadStatus('error');
      toast.error('Upload failed');
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (!user) {
      toast.error('Please log in');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await axios.post('/api/pdfs/upload', {
        ...values,
        uploaded_by: user.id,
      });
      if (response.status === 200 && response.data.id) {
        toast.success('PDF saved');
        router.push(`/pdfs/${response.data.id}`);
      } else {
        toast.error('Upload failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Upload failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Upload PDF</title>
      </Head>
      <div className="container mx-auto max-w-2xl py-8">
        <h1 className="text-2xl font-bold mb-4">Upload PDF</h1>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <PdfUploadProgressBar onProgressChange={() => {}} />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Document title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="author"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Author</FormLabel>
                <FormControl>
                  <Input placeholder="Optional" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ai_assisted"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2">
                <FormLabel>AI Assistance</FormLabel>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="themes"
            render={() => (
              <FormItem className="flex flex-col">
                <FormLabel>Themes/Tags</FormLabel>
                <Popover open={openTheme} onOpenChange={setOpenTheme}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" role="combobox" aria-expanded={openTheme} className="w-full justify-between">
                        {selectedThemes.length > 0 ? `${selectedThemes.length} selected` : 'Select themes...'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <div className="p-2">
                      <div className="flex items-center justify-between pb-2">
                        <Input placeholder="Search themes..." value={themeSearch} onChange={(e) => setThemeSearch(e.target.value)} className="mr-2" />
                        <Button variant="outline" size="sm" onClick={clearThemes}>Clear</Button>
                      </div>
                      <div className="max-h-[200px] overflow-y-auto">
                        {filteredThemes.map(theme => (
                          <div
                            key={theme}
                            className={cn('flex cursor-pointer items-center rounded-md px-2 py-1 hover:bg-accent',
                              selectedThemes.includes(theme) && 'bg-accent')}
                            onClick={() => handleThemeToggle(theme)}
                          >
                            <div className="mr-2 h-4 w-4 border border-primary rounded flex items-center justify-center">
                              {selectedThemes.includes(theme) && <Check className="h-3 w-3" />}
                            </div>
                            {theme}
                          </div>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedThemes.map(theme => (
                    <div key={theme} className="bg-secondary text-secondary-foreground rounded-full px-2 py-1 text-sm flex items-center">
                      {theme}
                      <Button variant="ghost" size="sm" className="ml-1 h-4 w-4 p-0" onClick={() => handleThemeToggle(theme)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {selectedThemes.length > 0 && (
                    <Button variant="outline" size="sm" onClick={clearThemes} className="mt-1">Clear All</Button>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pdf_url"
            render={() => (
              <FormItem>
                <FormLabel>PDF File</FormLabel>
                <FormControl>
                  <Input type="file" accept="application/pdf" onChange={handleFileChange} />
                </FormControl>
                {uploadStatus !== 'idle' && (
                  <div className="mt-2">
                    <PdfUploadProgressBar onProgressChange={setUploadProgress} />
                    <p className="text-sm mt-1">
                      {uploadStatus === 'uploading' && `Uploading: ${uploadProgress}%`}
                      {uploadStatus === 'success' && 'Upload successful!'}
                      {uploadStatus === 'error' && 'Upload failed. Please try again.'}
                    </p>
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </form>
      </div>
    </>
  );
}
