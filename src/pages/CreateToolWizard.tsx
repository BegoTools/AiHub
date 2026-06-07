import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Plus, Trash2, Save, Sparkles, Wrench, Eye, EyeOff, GripVertical, Check, Globe } from 'lucide-react';
import { createCustomTool } from '../services/customToolsService';
import { DynamicIcon } from '../components/ToolForm';
import { useAuth } from '../context/AuthContext';
import { getFirstName } from '../utils/getFirstName';

interface CreateToolWizardProps {
  t: any;
  language: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FieldDef {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number';
  placeholder: string;
  options: string;
  required: boolean;
}

const ICONS = ['Wand', 'Sparkles', 'Heart', 'Star', 'Zap', 'Cloud', 'Sun', 'Moon', 'Globe', 'Lock', 'Bell', 'Book', 'Camera', 'Clock', 'Compass', 'Cpu', 'FileText', 'Flag', 'Gift', 'Hash', 'Home', 'Image', 'Key', 'Layers', 'Lightbulb', 'Link', 'List', 'Mail', 'Map', 'MessageCircle', 'Music', 'Pen', 'Phone', 'Rocket', 'Search', 'Settings', 'Shield', 'ShoppingBag', 'Smartphone', 'Smile', 'Target', 'Terminal', 'Tool', 'TrendingUp', 'Trophy', 'Umbrella', 'User', 'Video', 'Volume2', 'Watch'];

export default function CreateToolWizard({ t, language, onSuccess, onCancel }: CreateToolWizardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('daily');
  const [icon, setIcon] = useState('Wand');
  const [visibility, setVisibility] = useState<'private' | 'public'>('public');
  const [promptTemplate, setPromptTemplate] = useState('');
  const [fields, setFields] = useState<FieldDef[]>([
    { id: 'input_1', label: '', type: 'textarea', placeholder: '', options: '', required: false },
  ]);
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);

  const addField = () => {
    setFields(prev => [...prev, { id: `input_${Date.now()}`, label: '', type: 'textarea', placeholder: '', options: '', required: false }]);
  };

  const removeField = (id: string) => {
    if (fields.length <= 1) return;
    setFields(prev => prev.filter(f => f.id !== id));
  };

  const updateField = (id: string, key: keyof FieldDef, value: any) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, [key]: value } : f));
  };

  const handleSave = async () => {
    if (!title.trim() || !promptTemplate.trim()) {
      setError(t.fillRequiredFields || 'يرجى تعبئة الحقول المطلوبة');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const tagList = tags.split(',').map(s => s.trim()).filter(Boolean);
      const createdByName = getFirstName(undefined, user?.user_metadata, user?.email);
      await createCustomTool({
        id: `custom_${Date.now()}`,
        title: title.trim(),
        description: description.trim(),
        category,
        icon,
        visibility: 'public',
        promptTemplateString: promptTemplate.trim(),
        inputFields: fields.map(f => ({
          id: f.id,
          label: f.label || f.id,
          type: f.type,
          placeholder: f.placeholder,
          options: f.type === 'select' ? f.options.split('\n').filter(Boolean).map(o => {
            const [value, label] = o.split('|').map(s => s.trim());
            return { value: value || o, label: label || o };
          }) : undefined,
          required: f.required,
        })),
        tags: tagList,
        createdByName,
      });
      onSuccess();
      navigate('/community');
    } catch (e: any) {
      setError(e.message || 'حدث خطأ أثناء الحفظ');
    }
    setSaving(false);
  };

  const categories = [
    { id: 'writing', label: 'كتابة' }, { id: 'business', label: 'بيزنس' },
    { id: 'social', label: 'سوشيال ميديا' }, { id: 'study', label: 'دراسة' },
    { id: 'career', label: 'مهني' }, { id: 'daily', label: 'حياة يومية' },
    { id: 'coding', label: 'برمجة' }, { id: 'media', label: 'وسائط' },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={onCancel} className="p-2 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer text-slate-500 dark:text-zinc-400">
          <ArrowRight size={20} className="rtl:rotate-0 rotate-180" />
        </button>
        <div>
          <h2 className="font-extrabold text-xl text-slate-800 dark:text-zinc-100">{t.createTool || 'إنشاء أداة جديدة'}</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">{t.createToolDesc || 'اصنع أداتك الذكية المخصصة بخطوات بسيطة'}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {[t.basicInfo || 'معلومات أساسية', t.configuration || 'الإعدادات', t.preview || 'مراجعة'].map((label, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step >= idx ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
            }`}>{idx + 1}</div>
            <span className={`text-xs font-semibold hidden sm:inline ${step >= idx ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-zinc-400'}`}>{label}</span>
            {idx < 2 && <div className="w-8 h-px bg-slate-200 dark:bg-zinc-800" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl text-xs">{error}</div>
      )}

      {step === 0 && (
        <div className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 lg:p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300">{t.toolName || 'اسم الأداة'} *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder={t.toolNamePlaceholder || 'مثلاً: كاتب مقالات تسويقية'}
              className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300">{t.toolDesc || 'الوصف'} *</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder={t.toolDescPlaceholder || 'صف ما تفعله هذه الأداة...'}
              rows={3}
              className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 transition-all resize-none" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300">{t.category || 'التصنيف'}</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {categories.map(cat => (
                <button key={cat.id} onClick={() => setCategory(cat.id)}
                  className={`p-2.5 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                    category === cat.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:border-blue-500/30'
                  }`}>{cat.label}</button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300">{t.icon || 'أيقونة'}</label>
            <div className="relative">
              <button onClick={() => setShowIconPicker(!showIconPicker)}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm text-slate-700 dark:text-zinc-300 hover:border-blue-500/30 transition-all cursor-pointer">
                <DynamicIcon name={icon} size={18} />
                <span>{icon}</span>
              </button>
              {showIconPicker && (
                <div className="absolute top-full mt-2 left-0 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-2xl p-3 grid grid-cols-10 gap-1.5 z-50 shadow-xl max-h-48 overflow-y-auto w-80">
                  {ICONS.map(ic => (
                    <button key={ic} onClick={() => { setIcon(ic); setShowIconPicker(false); }}
                      className={`p-1.5 rounded-lg text-xs transition-all hover:bg-blue-100 dark:hover:bg-blue-900/30 cursor-pointer ${
                        icon === ic ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-zinc-400'
                      }`}>
                      <DynamicIcon name={ic} size={14} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 lg:p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
              {t.promptTemplateLabel || 'قالب الأمر (Prompt Template)'} *
            </label>
            <p className="text-[10px] text-slate-500 dark:text-zinc-500 mb-2">
              {t.promptTemplateHint || 'استخدم {'} {'} لأسماء الحقول. مثلاً: اكتب مقالاً عن {topic}'}
            </p>
            <textarea value={promptTemplate} onChange={(e) => setPromptTemplate(e.target.value)}
              placeholder={t.promptTemplatePlaceholder || 'اكتب القالب هنا...\nمثلاً: أنت خبير في... اكتب عن {topic}'}
              rows={6}
              className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 rounded-xl px-4 py-3 text-sm focus:border-blue-500 transition-all resize-none font-mono" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300">{t.inputFields || 'حقول الإدخال'}</label>
              <button onClick={addField} className="px-3 py-1.5 text-[10px] font-semibold rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-all flex items-center gap-1 cursor-pointer">
                <Plus size={12} /> {t.addField || 'إضافة حقل'}
              </button>
            </div>
            <div className="space-y-3">
              {fields.map((field, idx) => (
                <div key={field.id} className="p-4 bg-slate-50 dark:bg-zinc-950/50 border border-slate-200 dark:border-zinc-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">{t.field || 'حقل'} {idx + 1}</span>
                    <button onClick={() => removeField(field.id)} className="p-1 text-rose-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer">
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" value={field.label} onChange={(e) => updateField(field.id, 'label', e.target.value)}
                      placeholder={t.fieldLabel || 'اسم الحقل'}
                      className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 rounded-lg px-3 py-1.5 text-xs focus:border-blue-500 transition-all" />
                    <input type="text" value={field.placeholder} onChange={(e) => updateField(field.id, 'placeholder', e.target.value)}
                      placeholder={t.fieldPlaceholder || 'نص توجيهي'}
                      className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 rounded-lg px-3 py-1.5 text-xs focus:border-blue-500 transition-all" />
                  </div>
                  <div className="flex items-center gap-2">
                    <select value={field.type} onChange={(e) => updateField(field.id, 'type', e.target.value)}
                      className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 rounded-lg px-3 py-1.5 text-xs focus:border-blue-500 transition-all">
                      <option value="text">Text</option>
                      <option value="textarea">Textarea</option>
                      <option value="select">Select</option>
                      <option value="number">Number</option>
                    </select>
                    {field.type === 'select' && (
                      <input type="text" value={field.options} onChange={(e) => updateField(field.id, 'options', e.target.value)}
                        placeholder={t.selectOptionsHint || 'قيمة|تسمية (كل سطر خيار)'}
                        className="flex-1 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 rounded-lg px-3 py-1.5 text-xs focus:border-blue-500 transition-all" />
                    )}
                    <label className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-zinc-400 cursor-pointer">
                      <input type="checkbox" checked={field.required} onChange={(e) => updateField(field.id, 'required', e.target.checked)}
                        className="rounded border-slate-300 dark:border-zinc-700" />
                      {t.required || 'إجباري'}
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300">{t.tags || 'الكلمات الدلالية'}</label>
            <input type="text" value={tags} onChange={(e) => setTags(e.target.value)}
              placeholder={t.tagsHint || 'كتابة, تسويق, إبداع (مفصولة بفاصلة)'}
              className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 transition-all" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300">{t.visibility || 'الرؤية'}</label>
            <div className="flex gap-2">
              <button onClick={() => setVisibility('private')}
                className={`flex-1 p-3 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  visibility === 'private' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400'
                }`}>
                <EyeOff size={14} /> {t.private || 'خاص'}
              </button>
              <button onClick={() => setVisibility('public')}
                className={`flex-1 p-3 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  visibility === 'public' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400'
                }`}>
                <Eye size={14} /> {t.public || 'عام'}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 lg:p-8 space-y-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-2xl">
            <h3 className="font-bold text-base text-slate-800 dark:text-zinc-100 flex items-center gap-2">
              <Wrench size={18} className="text-blue-600" />
              {title || t.untitledTool || 'أداة بدون اسم'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">{description || t.noDescription || 'لا يوجد وصف'}</p>
            <div className="flex items-center gap-2 mt-3">
              <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">{categories.find(c => c.id === category)?.label || category}</span>
              <span className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 rounded-lg">{visibility === 'public' ? (t.public || 'عام') : (t.private || 'خاص')}</span>
              <DynamicIcon name={icon} size={14} className="text-slate-400" />
            </div>
          </div>

          {fields.filter(f => f.label).length > 0 && (
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-slate-600 dark:text-zinc-400">{t.inputFields || 'حقول الإدخال'} ({fields.filter(f => f.label).length})</h4>
              <div className="space-y-1.5">
                {fields.filter(f => f.label).map(f => (
                  <div key={f.id} className="flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-950 px-3 py-2 rounded-lg">
                    <span className="font-semibold text-slate-800 dark:text-zinc-200">{f.label}</span>
                    <span className="text-[10px] text-slate-400">({f.type})</span>
                    {f.required && <span className="text-[10px] text-rose-400">*</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {promptTemplate && (
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-slate-600 dark:text-zinc-400">{t.promptTemplateLabel || 'قالب الأمر'}</h4>
              <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-xs text-slate-600 dark:text-zinc-400 font-mono whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto">
                {promptTemplate}
              </div>
            </div>
          )}

          {tags && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {tags.split(',').map((tag, i) => (
                <span key={i} className="text-[9px] px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 rounded-lg">#{tag.trim()}</span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <button onClick={step > 0 ? () => setStep(prev => prev - 1) : onCancel}
          className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all flex items-center gap-1.5 cursor-pointer">
          <ArrowRight size={14} className="rtl:rotate-0 rotate-180" />
          {step === 0 ? (t.cancel || 'إلغاء') : (t.back || 'السابق')}
        </button>
        {step < 2 ? (
          <button onClick={() => setStep(prev => prev + 1)}
            className="px-5 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-all flex items-center gap-1.5 cursor-pointer">
            {t.next || 'التالي'} <ArrowLeft size={14} className="rtl:rotate-0 rotate-180" />
          </button>
        ) : (
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer">
            {saving ? (<><Sparkles size={14} className="animate-spin" /> {t.saving || 'جارٍ الحفظ...'}</>) : (<><Save size={14} /> {t.save || 'حفظ الأداة'}</>)}
          </button>
        )}
      </div>
    </div>
  );
}
