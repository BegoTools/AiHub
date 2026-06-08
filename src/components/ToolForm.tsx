import { useState, useEffect, FormEvent } from 'react';
import { Tool } from '../types';
import * as icons from 'lucide-react';
import { Play, RotateCcw, Sparkles, Image, Upload, X, Info, Loader2 } from 'lucide-react';
import { processUploadedFile } from '../services/fileService';

interface ToolFormProps {
  tool: Tool;
  onSubmit: (values: Record<string, string>) => void;
  isLoading: boolean;
  t?: any;
}

// Map dynamic string icons safely to Lucide Icons
export function DynamicIcon({ name, className, size = 20 }: { name: string; className?: string; size?: number }) {
  // Safe Fallback mapping if name differs slightly
  let iconName = name;
  if (name === 'BriefcaseCon') iconName = 'Briefcase';
  if (name === 'Sparkle') iconName = 'Sparkles';
  if (name === 'CalendarDays') iconName = 'Calendar';
  
  const IconComponent = (icons as any)[iconName] || icons.Sparkles;
  return <IconComponent className={className} size={size} />;
}

export default function ToolForm({ tool, onSubmit, isLoading, t = {} as any }: ToolFormProps) {
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({});
  const [imageProcessing, setImageProcessing] = useState<Record<string, boolean>>({});

  // Initialize form values
  useEffect(() => {
    const defaults: Record<string, string> = {};
    tool.inputs.forEach((input) => {
      defaults[input.id] = input.defaultValue || '';
    });
    setFormValues(defaults);
  }, [tool]);

  const handleInputChange = (id: string, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const loadPdfJs = () => {
    return new Promise<any>((resolve, reject) => {
      if ((window as any).pdfjsLib) {
        resolve((window as any).pdfjsLib);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
      script.onload = () => {
        const pdfjsLib = (window as any).pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
        resolve(pdfjsLib);
      };
      script.onerror = (e) => reject(e);
      document.body.appendChild(script);
    });
  };

  const handlePdfUpload = async (e: any, inputId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtractingPdf(true);
    try {
      const pdfjsLib = await loadPdfJs();
      const reader = new FileReader();
      
      reader.onload = async function() {
        try {
          const typedarray = new Uint8Array(this.result as ArrayBuffer);
          const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
          let extractedText = '';
          
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            extractedText += pageText + ' ';
          }
          
          if (extractedText.trim().length > 0) {
            handleInputChange(inputId, extractedText.trim());
          } else {
            alert(t.pdfImportError || 'لم نتمكن من استخراج أي نصوص من هذا الملف.');
          }
        } catch (err) {
          console.error(err);
          alert(t.pdfImportError || 'فشل قراءة ملف PDF.');
        } finally {
          setIsExtractingPdf(false);
        }
      };
      
      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error(err);
      alert(t.pdfImportError || 'فشل تحميل مكملات قراءة المستندات.');
      setIsExtractingPdf(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, inputId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageProcessing(prev => ({ ...prev, [inputId]: true }));
    try {
      const fileInfo = await processUploadedFile(file);
      const dataUrl = `data:${fileInfo.type};base64,${fileInfo.base64}`;
      handleInputChange(inputId, dataUrl);
      setImagePreviews(prev => ({ ...prev, [inputId]: dataUrl }));
    } catch (err: any) {
      alert(err.message || 'فشل رفع الصورة');
    } finally {
      setImageProcessing(prev => ({ ...prev, [inputId]: false }));
    }
  };

  const handleRemoveImage = (inputId: string) => {
    handleInputChange(inputId, '');
    setImagePreviews(prev => {
      const next = { ...prev };
      delete next[inputId];
      return next;
    });
  };

  const handleFillExample = () => {
    setFormValues(tool.exampleInput);
  };

  const handleClear = () => {
    const cleared: Record<string, string> = {};
    tool.inputs.forEach((input) => {
      cleared[input.id] = '';
    });
    setFormValues(cleared);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(formValues);
  };

  return (
    <div id={`tool-form-container-${tool.id}`} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 lg:p-8 shadow-sm">
      {/* Tool Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="p-3.5 bg-gradient-to-tr from-amber-500/10 to-orange-500/10 text-orange-600 dark:text-amber-400 rounded-2xl border border-amber-100 dark:border-slate-800">
            <DynamicIcon name={tool.icon} size={28} />
          </div>
          <div>
            <h2 className="font-bold text-xl text-slate-900 dark:text-white leading-tight">{tool.title}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{tool.description}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {tool.inputs.map((input) => {
          const value = formValues[input.id] || '';
          const maxChars = input.type === 'textarea' ? 4000 : 250;
          return (
            <div key={input.id} className="flex flex-col gap-2">
              <label 
                htmlFor={input.id}
                className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between"
              >
                <span>{input.label} {input.required && <span className="text-rose-500">*</span>}</span>
                {input.type !== 'image' && (
                  <span className="text-[11px] font-mono text-slate-400">
                    {value.length} / {maxChars} {t.charCount || 'حرف'}
                  </span>
                )}
              </label>

              {input.type === 'textarea' ? (
                <div className="space-y-1.5">
                  <textarea
                    id={input.id}
                    value={value}
                    onChange={(e) => handleInputChange(input.id, e.target.value)}
                    placeholder={input.placeholder}
                    required={input.required}
                    rows={6}
                    maxLength={maxChars}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-slate-100 rounded-2xl px-4 py-3 placeholder-slate-400 dark:placeholder-slate-500 hover:border-slate-300 dark:hover:border-slate-700 focus:border-amber-500 dark:focus:border-amber-500 text-sm leading-relaxed transition-all resize-none"
                  />
                  {/* PDF import capability */}
                  <div className="flex justify-end">
                    <label className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-600 hover:text-white text-blue-500 hover:text-white dark:text-amber-400 dark:hover:text-white border border-blue-500/20 dark:border-amber-500/20 rounded-xl text-xs font-semibold cursor-pointer transition-all">
                      <icons.Paperclip size={12} className="shrink-0" />
                      <span>{isExtractingPdf ? (t.pdfExtracting || 'جاري استخراج النص...') : (t.importPdf || 'استيراد نصوص من PDF 📄')}</span>
                      <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={(e) => handlePdfUpload(e, input.id)}
                        disabled={isExtractingPdf}
                      />
                    </label>
                  </div>
                </div>
              ) : input.type === 'select' ? (
                <select
                  id={input.id}
                  value={value}
                  onChange={(e) => handleInputChange(input.id, e.target.value)}
                  required={input.required}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl px-4 py-3 hover:border-slate-300 dark:hover:border-slate-700 focus:border-amber-500 dark:focus:border-amber-500 text-sm transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20class%3D%22feather%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C/polyline%3E%3C/svg%3E')] bg-[length:16px_16px] bg-[position:left_16px_center] bg-no-repeat"
                >
                  <option value="" disabled className="text-slate-400">{input.placeholder}</option>
                  {input.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : input.type === 'image' ? (
                <div className="space-y-2">
                  {value && imagePreviews[input.id] ? (
                    <div className="space-y-2">
                      <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900">
                        <img
                          src={imagePreviews[input.id]}
                          alt="Preview"
                          className="w-full max-h-64 object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(input.id)}
                          className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <div className="p-2.5 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-xl flex items-start gap-2 text-[10px] text-blue-600 dark:text-blue-400">
                        <Info size={12} className="shrink-0 mt-0.5" />
                        <span>هذا الملف مؤقت وسيتم حذفه تلقائياً بعد المعالجة.</span>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-slate-300 dark:border-zinc-700 hover:border-amber-400 dark:hover:border-amber-600 rounded-2xl bg-slate-50 dark:bg-zinc-900/50 cursor-pointer transition-all">
                      {imageProcessing[input.id] ? (
                        <Loader2 size={28} className="animate-spin text-amber-500" />
                      ) : (
                        <>
                          <div className="p-4 bg-slate-100 dark:bg-zinc-800 rounded-2xl text-slate-400 dark:text-zinc-500">
                            <Upload size={28} />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">
                              {input.placeholder || 'اختر صورة من جهازك'}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
                              يدعم: JPG, PNG, WebP, GIF
                            </p>
                          </div>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, input.id)}
                        disabled={imageProcessing[input.id]}
                      />
                    </label>
                  )}
                </div>
              ) : (
                <input
                  id={input.id}
                  type={input.type}
                  value={value}
                  onChange={(e) => handleInputChange(input.id, e.target.value)}
                  placeholder={input.placeholder}
                  required={input.required}
                  maxLength={maxChars}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-slate-100 rounded-2xl px-4 py-3 placeholder-slate-400 dark:placeholder-slate-500 hover:border-slate-300 dark:hover:border-slate-700 focus:border-amber-500 dark:focus:border-amber-500 text-sm transition-all"
                />
              )}
            </div>
          );
        })}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-2">
            <button
              id="btn-fill-example"
              type="button"
              onClick={handleFillExample}
              className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/20 dark:hover:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded-xl border border-amber-200/50 dark:border-amber-900/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles size={14} />
              <span>{t.exampleInput || 'مثال توضيحي'}</span>
            </button>
            <button
              id="btn-clear-form"
              type="button"
              onClick={handleClear}
              className="px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>{t.clearFields || 'تفريغ الحقول'}</span>
            </button>
          </div>

          <button
            id="btn-submit-generate"
            type="submit"
            disabled={isLoading}
            className={`px-6 py-3 bg-gradient-to-l from-amber-500 to-orange-500 text-slate-950 font-bold text-sm rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md hover:shadow-lg active:scale-95 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:from-amber-400 hover:to-orange-400'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>{t.preparingResponse || 'إعداد الاستجابة الذكية...'}</span>
              </>
            ) : (
              <>
                <Play size={14} fill="currentColor" />
                <span>{t.runTool || 'ابدأ التوليد الذكي'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
