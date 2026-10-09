import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, PlusCircle, Image as ImageIcon, Calendar, ArrowRight, ArrowLeft, ImagePlus, X, Pencil, Trash2, Check } from 'lucide-react';
import { getAllMemories, saveMemory, deleteMemory, updateMemoryNote } from './lib/db';

interface Memory {
  id: string;
  image?: string;
  images?: string[];
  date: string;
  note: string;
}

// Static memories that are always available (stored in public folder)
const STATIC_MEMORIES: Memory[] = [
  { id: 'static-3', date: '2026-09-20', note: 'Hayallerimi süsleyen kadın... 20/09/2026', image: '/facetime.jpeg' },
  { id: 'static-2', date: '2026-08-15', note: 'Aşıkların şehrine, ismini veren fotoğraf, 15/08/2026', image: '/üsküdar.jpeg' },
  { id: 'static-1', date: '2025-05-16', note: 'Aşkımın başladığı gün, 16/05/2025 ❤️', image: '/özbekistan.jpeg' },
];

type ViewState = 'welcome' | 'timeline' | 'addMemory';

export default function App() {
  const [memories, setMemories] = useState<Memory[]>(STATIC_MEMORIES);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewState>(
    () => (localStorage.getItem('currentView') as ViewState) || 'welcome'
  );

  useEffect(() => {
    localStorage.setItem('currentView', currentView);
  }, [currentView]);

  // Form State
  const [newImagesBase64, setNewImagesBase64] = useState<string[]>([]);
  const [newDate, setNewDate] = useState<string>('');
  const [newNote, setNewNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit / Delete State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ─── Load from IndexedDB ────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const saved = await getAllMemories();
        // Merge: user-saved memories + static ones, deduplicate by date preference
        const savedDates = new Set(saved.map(m => m.date));
        const filtered = STATIC_MEMORIES.filter(m => !savedDates.has(m.date));
        const all = [...saved, ...filtered].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setMemories(all);
      } catch (e) {
        console.error('DB load error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ─── Image handling ─────────────────────────────────────────────────────────
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      Promise.all(
        files.map(file =>
          new Promise<string>(resolve => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          })
        )
      ).then(base64Arr => setNewImagesBase64(prev => [...prev, ...base64Arr]));
    }
  };

  const removePreviewImage = (index: number) => {
    setNewImagesBase64(prev => prev.filter((_, i) => i !== index));
  };

  // ─── Add Memory ─────────────────────────────────────────────────────────────
  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newImagesBase64.length === 0 || !newDate || (!dateHasMemories && !newNote)) return;

    setIsSubmitting(true);
    try {
      const existingMemory = memories.find(m => m.date === newDate && !m.id.startsWith('static-'));
      const existingStatic = memories.find(m => m.date === newDate && m.id.startsWith('static-'));

      if (existingMemory) {
        // Append images to existing user memory
        const existingImages = [
          ...(existingMemory.images || []),
          ...(existingMemory.image ? [existingMemory.image] : []),
        ];
        const updated: Memory = { ...existingMemory, images: [...existingImages, ...newImagesBase64], image: undefined };
        await saveMemory(updated);
        setMemories(prev => prev.map(m => m.id === updated.id ? updated : m));
      } else if (existingStatic) {
        // Convert static memory to user-saved by merging images
        const existingImages = existingStatic.image ? [existingStatic.image] : [];
        const updated: Memory = {
          id: Date.now().toString(),
          date: newDate,
          note: existingStatic.note,
          images: [...existingImages, ...newImagesBase64],
        };
        await saveMemory(updated);
        setMemories(prev => [
          ...prev.filter(m => m.date !== newDate),
          updated,
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } else {
        // New date — create new memory
        const newMemory: Memory = {
          id: Date.now().toString(),
          date: newDate,
          note: newNote,
          images: newImagesBase64,
        };
        await saveMemory(newMemory);
        setMemories(prev => [newMemory, ...prev].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        ));
      }

      setNewImagesBase64([]);
      setNewDate('');
      setNewNote('');
      setCurrentView('timeline');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Delete Memory ───────────────────────────────────────────────────────────
  const handleDeleteMemory = async (id: string) => {
    if (!id.startsWith('static-')) {
      await deleteMemory(id);
    }
    setMemories(prev => prev.filter(m => m.id !== id));
    setDeletingId(null);
  };

  // ─── Edit Memory Note ────────────────────────────────────────────────────────
  const handleEditStart = (memory: Memory) => {
    setEditingId(memory.id);
    setEditingNote(memory.note);
  };

  const handleEditSave = async (id: string) => {
    if (!id.startsWith('static-')) {
      await updateMemoryNote(id, editingNote);
    }
    setMemories(prev => prev.map(m => m.id === id ? { ...m, note: editingNote } : m));
    setEditingId(null);
  };

  // ─── Grouped Memories ────────────────────────────────────────────────────────
  const groupedMemories = useMemo(() => {
    const groups: Record<string, Memory[]> = {};
    memories.forEach(m => {
      if (!groups[m.date]) groups[m.date] = [];
      groups[m.date].push(m);
    });
    return Object.entries(groups).sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime());
  }, [memories]);

  const dateHasMemories = useMemo(() => {
    return newDate ? memories.some(m => m.date === newDate) : false;
  }, [newDate, memories]);

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-[#faf8f7] to-rose-100 text-slate-800 font-sans selection:bg-rose-200 overflow-x-hidden relative">
      <AnimatePresence mode="wait">

        {/* ── 1. WELCOME ── */}
        {currentView === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="min-h-screen w-full relative flex flex-col items-center md:items-start justify-center overflow-hidden"
          >
            <div className="absolute inset-0 z-0 bg-black">
              <img src="/öpücük.jpeg" alt="Emir & Dilan"
                className="w-full h-full object-cover object-[center_75%] md:object-[15%_40%] opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/70 md:bg-gradient-to-r md:from-black/80 md:via-black/40 md:to-transparent" />
            </div>

            <div className="relative z-10 flex-1 flex flex-col items-center md:items-start justify-between md:justify-center w-full md:w-1/2 lg:w-[45%] px-6 md:pl-16 lg:pl-24 h-full text-center md:text-left pt-20 pb-10 md:py-0">
              <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="flex flex-col md:mb-16 text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] font-serif w-full items-center md:items-start">
                <div className="flex flex-col">
                  <span className="text-6xl sm:text-8xl self-start -ml-12 md:ml-0 tracking-wide">Emir</span>
                  <span className="text-5xl sm:text-6xl self-center md:self-start md:ml-20 my-2 text-rose-300 italic">&</span>
                  <span className="text-6xl sm:text-8xl self-end md:self-start md:ml-40 -mr-12 md:mr-0 tracking-wide">Dilan</span>
                </div>
              </motion.div>

              <div className="w-full flex flex-col items-center md:items-start">
                <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                  className="text-3xl sm:text-5xl font-serif italic text-white tracking-wide mb-3 md:mb-4 drop-shadow-md">
                  Seni Seviyorum
                </motion.h1>
                <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                  className="text-white/80 text-base md:text-lg font-light mb-8 md:mb-10 max-w-lg leading-relaxed drop-shadow-sm">
                  Birlikte biriktirdiğimiz güzel anıların köşesi. Geçmişte yaşadığımız mutlu anları hatırla veya hikayemize yeni bir anı ekle.
                </motion.p>
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                  className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto md:justify-start md:ml-12 lg:ml-20">
                  <button onClick={() => setCurrentView('timeline')}
                    className="flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-medium py-3 px-6 md:py-4 md:px-8 rounded-full shadow-xl hover:-translate-y-0.5 transition-all text-base md:text-lg w-full sm:w-auto">
                    Zaman Tüneli <ArrowRight className="w-5 h-5" />
                  </button>
                  <button onClick={() => setCurrentView('addMemory')}
                    className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/30 font-medium py-3 px-6 md:py-4 md:px-8 rounded-full shadow-lg hover:-translate-y-0.5 transition-all text-base md:text-lg w-full sm:w-auto">
                    <PlusCircle className="w-5 h-5" /> Yeni Anı Ekle
                  </button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── 2. TIMELINE ── */}
        {currentView === 'timeline' && (
          <motion.div key="timeline" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.6, ease: 'easeOut' }}
            className="min-h-screen py-12 px-4 sm:px-8 max-w-5xl mx-auto">

            <div className="flex flex-col sm:flex-row items-center justify-between mb-16 gap-6">
              <button onClick={() => setCurrentView('welcome')}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-medium self-start sm:self-auto px-4 py-2 hover:bg-slate-100 rounded-full">
                <ArrowLeft className="w-5 h-5" /> Geri Dön
              </button>
              <div className="text-center flex-grow">
                <h2 className="text-3xl sm:text-4xl font-light text-slate-900 flex items-center justify-center gap-3">
                  Zaman Tüneli <Heart className="w-8 h-8 text-rose-300 fill-rose-100" />
                </h2>
              </div>
              <button onClick={() => setCurrentView('addMemory')}
                className="flex items-center gap-2 bg-rose-100 hover:bg-rose-200 text-rose-600 transition-colors font-medium self-end sm:self-auto px-5 py-2.5 rounded-full shadow-sm">
                <PlusCircle className="w-5 h-5" /> Yeni Ekle
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="w-8 h-8 rounded-full border-4 border-rose-200 border-t-rose-500 animate-spin" />
              </div>
            ) : (
              <div className="relative border-l-2 border-rose-100 md:border-l-0 md:before:absolute md:before:inset-0 md:before:mx-auto md:before:w-0.5 md:before:bg-rose-100 flex flex-col gap-12 md:gap-24 py-4 ml-4 md:ml-0">
                {groupedMemories.length === 0 ? (
                  <div className="text-center text-slate-400 py-20 font-light text-lg">Henüz bir anı eklenmemiş.</div>
                ) : groupedMemories.map(([date, items]) => (
                  <div key={date} className="relative flex flex-col md:flex-row items-start md:items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                    <div className="absolute -left-[23px] top-0 md:static md:flex items-center justify-center w-11 h-11 rounded-full border-4 border-[#faf8f7] bg-rose-200 text-rose-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10" />

                    <div className="w-full pl-6 md:pl-0 md:w-[calc(50%-3rem)] p-0 mt-1 md:mt-0">
                      <div className="mb-4 flex md:group-odd:justify-start md:group-even:justify-end">
                        <span className="inline-block bg-white text-slate-600 px-5 py-2 rounded-full text-sm font-medium shadow-sm border border-slate-100">
                          {new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      </div>

                      <div className="bg-white p-5 sm:p-8 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 flex flex-col gap-8 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow duration-500">
                        {items.map((memory, index) => (
                          <div key={memory.id} className="flex flex-col gap-4">
                            <div className="w-full overflow-hidden rounded-2xl bg-slate-50 flex flex-col gap-2">
                              {memory.images && memory.images.length > 0 ? (
                                memory.images.map((img, i) => (
                                  <img key={i} src={img} alt="Anı"
                                    className="w-full h-auto max-h-[60vh] object-contain hover:scale-[1.02] transition-transform duration-700 ease-out rounded-lg" />
                                ))
                              ) : (
                                <img src={memory.image} alt="Anı"
                                  className="w-full h-auto max-h-[60vh] object-contain hover:scale-[1.02] transition-transform duration-700 ease-out" />
                              )}
                            </div>

                            {editingId === memory.id ? (
                              <div className="flex flex-col gap-2">
                                <textarea value={editingNote} onChange={e => setEditingNote(e.target.value)}
                                  rows={3} className="w-full p-3 rounded-xl bg-slate-50 border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-200 text-slate-700 resize-none text-sm" />
                                <div className="flex gap-2 justify-end">
                                  <button onClick={() => setEditingId(null)}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-slate-500 hover:bg-slate-100 transition-colors">
                                    <X className="w-3.5 h-3.5" /> İptal
                                  </button>
                                  <button onClick={() => handleEditSave(memory.id)}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-rose-500 text-white hover:bg-rose-600 transition-colors">
                                    <Check className="w-3.5 h-3.5" /> Kaydet
                                  </button>
                                </div>
                              </div>
                            ) : memory.note && (
                              <p className="text-slate-600 font-light text-base sm:text-lg leading-relaxed text-center italic">
                                "{memory.note}"
                              </p>
                            )}

                            {editingId !== memory.id && (
                              <div className="flex items-center justify-center gap-2 pt-1">
                                {deletingId === memory.id ? (
                                  <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-2">
                                    <span className="text-sm text-red-600">Silmek istediğinden emin misin?</span>
                                    <button onClick={() => handleDeleteMemory(memory.id)}
                                      className="text-xs bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition-colors">Evet, sil</button>
                                    <button onClick={() => setDeletingId(null)}
                                      className="text-xs text-slate-500 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors">Hayır</button>
                                  </div>
                                ) : (
                                  <>
                                    <button onClick={() => handleEditStart(memory)}
                                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all border border-transparent hover:border-slate-200">
                                      <Pencil className="w-3.5 h-3.5" /> Notu Düzenle
                                    </button>
                                    <button onClick={() => setDeletingId(memory.id)}
                                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-red-400 hover:bg-red-50 hover:text-red-600 transition-all border border-transparent hover:border-red-100">
                                      <Trash2 className="w-3.5 h-3.5" /> Sil
                                    </button>
                                  </>
                                )}
                              </div>
                            )}

                            {index !== items.length - 1 && <hr className="my-4 border-slate-100 w-1/2 mx-auto" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── 3. ADD MEMORY ── */}
        {currentView === 'addMemory' && (
          <motion.div key="addMemory" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }}
            className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
            <div className="w-full max-w-xl">
              <button onClick={() => setCurrentView('welcome')}
                className="mb-8 flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-medium px-4 py-2 hover:bg-slate-100 rounded-full">
                <ArrowLeft className="w-5 h-5" /> Geri Dön
              </button>

              <div className="bg-white rounded-[2rem] p-6 sm:p-10 shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-slate-100 w-full">
                <div className="flex flex-col items-center text-center mb-8">
                  <div className="bg-rose-50 p-4 rounded-full mb-4">
                    <ImagePlus className="w-8 h-8 text-rose-400" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-light text-slate-900">Yeni Bir Anı Ekle</h2>
                </div>

                <form onSubmit={handleAddMemory} className="flex flex-col gap-6">
                  <div>
                    <label className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Tarih
                    </label>
                    <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
                      className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all text-slate-700" required />
                  </div>

                  {dateHasMemories && (
                    <div className="flex items-start gap-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl px-4 py-3 text-sm">
                      <span className="text-rose-400 mt-0.5">💡</span>
                      <span>Bu tarih için zaten bir anı mevcut. Görseller doğrudan o tarihin anısına eklenecek.</span>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" /> Görsel
                    </label>
                    <input id="image-upload" type="file" accept="image/*" multiple onChange={handleImageChange}
                      className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-200 transition-all text-slate-600 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-white file:text-slate-700 file:shadow-sm hover:file:bg-slate-50 cursor-pointer"
                      required={newImagesBase64.length === 0} />
                    {newImagesBase64.length > 0 && (
                      <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                        {newImagesBase64.map((img, idx) => (
                          <div key={idx} className="w-24 h-24 shrink-0 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 relative group">
                            <img src={img} alt="Önizleme" className="w-full h-full object-cover" />
                            <button type="button" onClick={() => removePreviewImage(idx)}
                              className="absolute top-1 right-1 bg-white/90 p-1 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                      Notunuz {dateHasMemories && <span className="text-slate-400 font-normal">(opsiyonel)</span>}
                    </label>
                    <textarea value={newNote} onChange={e => setNewNote(e.target.value)} rows={3}
                      className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all text-slate-700 resize-none"
                      placeholder="Bu anıya dair hisleriniz..." required={!dateHasMemories} />
                  </div>

                  <button type="submit" disabled={isSubmitting}
                    className="mt-4 w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-medium py-4 px-6 rounded-2xl shadow-md hover:shadow-lg transition-all text-lg flex items-center justify-center gap-2">
                    {isSubmitting ? (
                      <><div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Kaydediliyor...</>
                    ) : 'Anıyı Kaydet'}
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
