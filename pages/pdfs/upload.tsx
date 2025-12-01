import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';

import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import PdfUploadProgressBar from '@/components/UploadPage/PdfUploadProgressBar';
import { Check, ChevronsUpDown, X, FileUp } from 'lucide-react';
import { THEMES } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Modal } from '@/components/Modal';
import { ImageCropper, CropResultMetadata } from '@/components/UploadPage/ImageCropper';
import { uploadFile } from '@/lib/uploadUtils';
import { extractFileExtension, getExtensionFromMimeType, stripFileExtension } from '@/lib/imageUtils';

const MAX_PDF_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().optional(),
  ai_assisted: z.boolean().default(false),
  is_bible_book: z.boolean().default(false),
  themes: z.array(z.string()).min(1, 'Select at least one theme'),
  pdf_url: z.string().min(1, 'PDF upload required'),
  image_url: z.string().optional(),
  notebook_lm_url: z
    .string()
    .url('Invalid URL')
    .regex(/^https?:\/\/notebooklm\.google\.com\//, 'Must be a notebooklm.google.com link')
    .optional(),
  summary: z.string().max(500, 'Summary too long').optional(),
});

type FormValues = z.infer<typeof formSchema> & { pdf_file?: File | null; image_file?: File | null };

export default function UploadPdf() {
  const router = useRouter();
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const theme = {
    bg: isDark ? '#050505' : '#f8f5f0',
    bgCard: isDark ? '#0a0a0a' : '#ffffff',
    text: isDark ? '#e5e5e5' : '#161616',
    textSecondary: isDark ? '#a0a0a0' : '#4a4a4a',
    accent: isDark ? '#d4af37' : '#bfa130',
    accentHover: isDark ? '#e5c349' : '#d4af37',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    borderHover: isDark ? 'rgba(212, 175, 55, 0.3)' : 'rgba(191, 161, 48, 0.3)',
    hoverBg: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
    accentBgLight: isDark ? 'rgba(212, 175, 55, 0.1)' : 'rgba(191, 161, 48, 0.1)',
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      author: '',
      ai_assisted: false,
      is_bible_book: false,
      themes: [],
      pdf_url: '',
      image_url: '',
      notebook_lm_url: '',
      summary: '',
    },
  });

  const [themeSearch, setThemeSearch] = useState('');
  const [openTheme, setOpenTheme] = useState(false);
  const selectedThemes = form.watch('themes') as string[];

  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const [imageUploadStatus, setImageUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed');
      return;
    }
    const url = URL.createObjectURL(file);
    setCropImageUrl(url);
    setIsCropperOpen(true);
    setPendingImageFile(file);
  };

  const handleCropComplete = async (blob: Blob, metadata?: CropResultMetadata) => {
    const mimeType = metadata?.mimeType || blob.type || pendingImageFile?.type || 'image/jpeg';
    const suggestedName = metadata?.suggestedFileName || pendingImageFile?.name;
    const fallbackBase = pendingImageFile?.name ? stripFileExtension(pendingImageFile.name) : `pdf-image-${Date.now()}`;
    const extension = extractFileExtension(suggestedName) || getExtensionFromMimeType(mimeType);
    const fileName = suggestedName || `${fallbackBase}.${extension}`;
    const croppedFile = new File([blob], fileName, { type: mimeType });
    form.setValue('image_file', croppedFile);
    setIsCropperOpen(false);
    setImageUploadStatus('uploading');
    try {
      const result = await uploadFile(croppedFile, 'image', user.id, 'pdf_image');
      if (typeof result === 'string') throw new Error(result);
      form.setValue('image_url', result.fileKey, { shouldValidate: true });
      setImageUploadStatus('success');
    } catch (err) {
      console.error('Image upload failed:', err);
      setImageUploadStatus('error');
      toast.error('Failed to upload image');
    }

    setPendingImageFile(null);
  };

  const handleCropCancel = () => {
    setCropImageUrl(null);
    setIsCropperOpen(false);
    setPendingImageFile(null);
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
      <div 
        className="min-h-screen py-8"
        style={{ backgroundColor: theme.bg }}
      >
        <div className="container mx-auto max-w-2xl px-4">
          <div 
            className="p-6 md:p-8"
            style={{ 
              backgroundColor: theme.bgCard, 
              border: `1px solid ${theme.border}` 
            }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div 
                className="p-2"
                style={{ 
                  backgroundColor: theme.accentBgLight, 
                  border: `1px solid ${theme.borderHover}` 
                }}
              >
                <FileUp className="h-6 w-6" style={{ color: theme.accent }} />
              </div>
              <div>
                <h1 
                  className="text-2xl font-bold"
                  style={{ color: theme.accent, fontFamily: "'Italiana', serif" }}
                >
                  Upload PDF
                </h1>
                <p 
                  className="text-sm"
                  style={{ color: theme.textSecondary, fontFamily: "'Manrope', sans-serif" }}
                >
                  Share a document with the community
                </p>
              </div>
            </div>

            <FormProvider {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <PdfUploadProgressBar onProgressChange={() => {}} />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel 
                        style={{ color: theme.text, fontFamily: "'Manrope', sans-serif" }}
                      >
                        Title
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Document title" 
                          {...field}
                          style={{
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                            border: `1px solid ${theme.border}`,
                            color: theme.text,
                            fontFamily: "'Manrope', sans-serif",
                          }}
                        />
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
                      <FormLabel 
                        style={{ color: theme.text, fontFamily: "'Manrope', sans-serif" }}
                      >
                        Author
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Optional" 
                          {...field}
                          style={{
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                            border: `1px solid ${theme.border}`,
                            color: theme.text,
                            fontFamily: "'Manrope', sans-serif",
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ai_assisted"
                  render={({ field }) => (
                    <FormItem 
                      className="flex items-center space-x-3 p-3"
                      style={{ 
                        backgroundColor: theme.hoverBg, 
                        border: `1px solid ${theme.border}` 
                      }}
                    >
                      <FormLabel 
                        style={{ color: theme.text, fontFamily: "'Manrope', sans-serif" }}
                        className="mb-0"
                      >
                        AI Assistance
                      </FormLabel>
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
                      <FormLabel 
                        style={{ color: theme.text, fontFamily: "'Manrope', sans-serif" }}
                      >
                        Themes/Tags
                      </FormLabel>
                      <Popover open={openTheme} onOpenChange={setOpenTheme}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button 
                              variant="outline" 
                              role="combobox" 
                              aria-expanded={openTheme} 
                              className="w-full justify-between"
                              style={{
                                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                                border: `1px solid ${theme.border}`,
                                color: theme.text,
                                fontFamily: "'Manrope', sans-serif",
                              }}
                            >
                              {selectedThemes.length > 0 ? `${selectedThemes.length} selected` : 'Select themes...'}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent 
                          className="w-full p-0"
                          style={{
                            backgroundColor: isDark ? 'rgba(10, 10, 10, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                            border: `1px solid ${theme.border}`,
                          }}
                        >
                          <div className="p-2">
                            <div className="flex items-center justify-between pb-2">
                              <Input 
                                placeholder="Search themes..." 
                                value={themeSearch} 
                                onChange={(e) => setThemeSearch(e.target.value)} 
                                className="mr-2"
                                style={{
                                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                                  border: `1px solid ${theme.border}`,
                                  color: theme.text,
                                }}
                              />
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={clearThemes}
                                style={{
                                  border: `1px solid ${theme.border}`,
                                  color: theme.text,
                                }}
                              >
                                Clear
                              </Button>
                            </div>
                            <div className="max-h-[200px] overflow-y-auto">
                              {filteredThemes.map(themeItem => (
                                <div
                                  key={themeItem}
                                  className="flex cursor-pointer items-center px-2 py-1 transition-colors duration-150"
                                  style={{
                                    backgroundColor: selectedThemes.includes(themeItem) ? theme.accentBgLight : 'transparent',
                                    color: theme.text,
                                    fontFamily: "'Manrope', sans-serif",
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.accentBgLight}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedThemes.includes(themeItem) ? theme.accentBgLight : 'transparent'}
                                  onClick={() => handleThemeToggle(themeItem)}
                                >
                                  <div 
                                    className="mr-2 h-4 w-4 flex items-center justify-center"
                                    style={{ border: `1px solid ${theme.border}` }}
                                  >
                                    {selectedThemes.includes(themeItem) && (
                                      <Check className="h-3 w-3" style={{ color: theme.accent }} />
                                    )}
                                  </div>
                                  {themeItem}
                                </div>
                              ))}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedThemes.map(themeItem => (
                          <div 
                            key={themeItem} 
                            className="px-2 py-1 text-sm flex items-center"
                            style={{ 
                              backgroundColor: theme.accentBgLight, 
                              color: theme.accent,
                              border: `1px solid ${theme.borderHover}`,
                              fontFamily: "'Manrope', sans-serif",
                            }}
                          >
                            {themeItem}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="ml-1 h-4 w-4 p-0" 
                              onClick={() => handleThemeToggle(themeItem)}
                            >
                              <X className="h-3 w-3" style={{ color: theme.accent }} />
                            </Button>
                          </div>
                        ))}
                        {selectedThemes.length > 0 && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={clearThemes} 
                            className="mt-1"
                            style={{
                              border: `1px solid ${theme.border}`,
                              color: theme.text,
                              fontFamily: "'Manrope', sans-serif",
                            }}
                          >
                            Clear All
                          </Button>
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
                      <FormLabel 
                        style={{ color: theme.text, fontFamily: "'Manrope', sans-serif" }}
                      >
                        PDF File
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="file" 
                          accept="application/pdf" 
                          onChange={handleFileChange}
                          style={{
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                            border: `1px solid ${theme.border}`,
                            color: theme.text,
                          }}
                        />
                      </FormControl>
                      {uploadStatus !== 'idle' && (
                        <div className="mt-2">
                          <PdfUploadProgressBar onProgressChange={setUploadProgress} />
                          <p 
                            className="text-sm mt-1"
                            style={{ 
                              color: uploadStatus === 'success' ? theme.accent : 
                                     uploadStatus === 'error' ? '#ef4444' : 
                                     theme.textSecondary,
                              fontFamily: "'Manrope', sans-serif",
                            }}
                          >
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

                <FormField
                  control={form.control}
                  name="image_url"
                  render={() => (
                    <FormItem>
                      <FormLabel 
                        style={{ color: theme.text, fontFamily: "'Manrope', sans-serif" }}
                      >
                        Cover Image
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleImageChange}
                          style={{
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                            border: `1px solid ${theme.border}`,
                            color: theme.text,
                          }}
                        />
                      </FormControl>
                      {imageUploadStatus !== 'idle' && (
                        <div className="mt-2">
                          <Progress value={imageUploadProgress} className="w-full" />
                          <p 
                            className="text-sm mt-1"
                            style={{ 
                              color: imageUploadStatus === 'success' ? theme.accent : 
                                     imageUploadStatus === 'error' ? '#ef4444' : 
                                     theme.textSecondary,
                              fontFamily: "'Manrope', sans-serif",
                            }}
                          >
                            {imageUploadStatus === 'uploading' && `Uploading: ${imageUploadProgress}%`}
                            {imageUploadStatus === 'success' && 'Upload successful!'}
                            {imageUploadStatus === 'error' && 'Upload failed. Please try again.'}
                          </p>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Modal isOpen={isCropperOpen} onClose={handleCropCancel}>
                  {cropImageUrl && (
                    <ImageCropper
                      imageUrl={cropImageUrl}
                      onCropComplete={handleCropComplete}
                      onCancel={handleCropCancel}
                      maxHeight={400}
                      aspectRatio={0.75}
                      quality={1}
                      originalFileName={pendingImageFile?.name}
                      originalMimeType={pendingImageFile?.type}
                      desiredFileName={pendingImageFile?.name}
                    />
                  )}
                </Modal>

                <FormField
                  control={form.control}
                  name="summary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel 
                        style={{ color: theme.text, fontFamily: "'Manrope', sans-serif" }}
                      >
                        Summary
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Brief summary" 
                          {...field}
                          style={{
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                            border: `1px solid ${theme.border}`,
                            color: theme.text,
                            fontFamily: "'Manrope', sans-serif",
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notebook_lm_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel 
                        style={{ color: theme.text, fontFamily: "'Manrope', sans-serif" }}
                      >
                        NotebookLM Link
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://notebooklm.google.com/..." 
                          {...field}
                          style={{
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                            border: `1px solid ${theme.border}`,
                            color: theme.text,
                            fontFamily: "'Manrope', sans-serif",
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full"
                  style={{
                    backgroundColor: theme.accent,
                    color: isDark ? '#050505' : '#ffffff',
                    fontFamily: "'Manrope', sans-serif",
                    fontWeight: 600,
                  }}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </Button>
              </form>
            </FormProvider>
          </div>
        </div>
      </div>
    </>
  );
}
