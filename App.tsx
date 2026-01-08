
import React, { useState, useEffect } from 'react';
import { 
  Code, 
  BookOpen, 
  History, 
  Plus, 
  Copy, 
  Check, 
  Trash2, 
  Send, 
  Sparkles,
  ChevronRight,
  Database,
  ExternalLink,
  Laptop,
  AlertCircle
} from 'lucide-react';
import { GeminiWPBakeryService } from './services/geminiService.ts';
import { AppMode, HistoryItem } from './types.ts';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.GENERATOR);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // We create the service as a constant; it will initialize the AI SDK only when generateBlock is called.
  const geminiService = new GeminiWPBakeryService();

  useEffect(() => {
    const saved = localStorage.getItem('wpbakery_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('wpbakery_history', JSON.stringify(history));
  }, [history]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleGenerate = async () => {
    if (!input.trim()) return;

    setIsGenerating(true);
    setErrorMsg(null);
    const currentInput = input;
    setInput('');

    try {
      const apiHistory = history.slice(0, 5).map(item => ({
        role: item.type === 'reference' ? 'user' as const : 'model' as const,
        parts: [{ text: item.type === 'reference' ? `REFERÊNCIA:\n${item.content}` : item.response || '' }]
      }));

      const result = await geminiService.generateBlock(currentInput, apiHistory);
      
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        type: mode === AppMode.LEARNING ? 'reference' : 'generation',
        content: currentInput,
        response: result,
        timestamp: Date.now()
      };

      setHistory(prev => [newItem, ...prev]);
      setLastResponse(result);
    } catch (error: any) {
      console.error("Generation Error:", error);
      const msg = error.message || "Erro desconhecido ao processar requisição.";
      setErrorMsg(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const clearHistory = () => {
    if (window.confirm("Deseja realmente limpar todo o histórico?")) {
      setHistory([]);
      setLastResponse(null);
    }
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-72 bg-slate-900 text-white flex flex-col border-r border-slate-800">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-blue-500 p-1.5 rounded-lg">
              <Code size={20} className="text-white" />
            </div>
            <h1 className="font-bold text-lg leading-tight tracking-tight">
              WPBakery <span className="text-blue-400">Pro</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-tighter">THE7 EXPERT ENGINE</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button 
            onClick={() => setMode(AppMode.GENERATOR)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${mode === AppMode.GENERATOR ? 'bg-blue-600 shadow-lg shadow-blue-500/20 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
          >
            <Plus size={18} />
            <span className="font-medium text-sm">Gerar Novo Bloco</span>
          </button>
          
          <button 
            onClick={() => setMode(AppMode.LEARNING)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${mode === AppMode.LEARNING ? 'bg-blue-600 shadow-lg shadow-blue-500/20 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
          >
            <BookOpen size={18} />
            <span className="font-medium text-sm">Treinar Referência</span>
          </button>

          <div className="pt-6 pb-2 px-4">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Recentes</h3>
          </div>
          
          {history.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <div className="bg-slate-800/50 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-3">
                <History size={16} className="text-slate-500" />
              </div>
              <p className="text-xs text-slate-500 font-medium">Histórico vazio</p>
            </div>
          ) : (
            history.map(item => (
              <div key={item.id} className="group relative">
                <button 
                  onClick={() => setLastResponse(item.response || null)}
                  className="w-full flex items-start gap-3 px-4 py-3 rounded-xl text-left text-xs text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-colors truncate"
                >
                  <div className="mt-0.5 shrink-0">
                    {item.type === 'reference' ? <Database size={14} className="text-emerald-400" /> : <ChevronRight size={14} className="text-blue-400" />}
                  </div>
                  <span className="truncate pr-4">{item.content}</span>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteHistoryItem(item.id); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-1 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={clearHistory}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs text-slate-500 hover:text-red-400 transition-colors"
          >
            <Trash2 size={14} />
            Limpar tudo
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider border border-blue-100">
              Vercel Deployment Active
            </span>
            <div className="h-4 w-[1px] bg-gray-200"></div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
              <Laptop size={14} />
              <span>Full Responsive Engine</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <a 
              href="https://the7.io" 
              target="_blank" 
              rel="noreferrer" 
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
            >
              The7 Docs <ExternalLink size={12} />
            </a>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-gray-50/30">
          <div className="max-w-5xl mx-auto p-8 space-y-8">
            
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                <div className="text-xs text-red-800">
                  <strong className="block font-bold mb-1 text-red-900">Erro de Configuração</strong>
                  <p className="mb-2">{errorMsg}</p>
                  <p className="opacity-75">Dica: No dashboard da Vercel, acesse Settings > Environment Variables e adicione a chave <code>API_KEY</code>.</p>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl shrink-0 ${mode === AppMode.GENERATOR ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  {mode === AppMode.GENERATOR ? <Sparkles size={24} /> : <BookOpen size={24} />}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    {mode === AppMode.GENERATOR ? 'O que vamos construir hoje?' : 'Treinar Novo Padrão'}
                  </h2>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
                    {mode === AppMode.GENERATOR 
                      ? 'Descreva a seção que você precisa. Utilizarei shortcodes nativos do WPBakery + Ultimate Addons com o design system premium do The7.'
                      : 'Cole um código de referência funcional. Analisarei a hierarquia e parâmetros para replicar o estilo nas próximas gerações.'}
                  </p>
                </div>
              </div>

              <div className="mt-8 relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={mode === AppMode.GENERATOR ? "Ex: Hero section moderna para SaaS com grid de benefícios e botão CTA gradiente..." : "[vc_row][vc_column]... Cole o shortcode aqui"}
                  className="w-full min-h-[140px] bg-gray-50 border border-gray-200 rounded-xl p-5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none placeholder:text-gray-400"
                />
                <div className="absolute bottom-4 right-4 flex items-center gap-2">
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !input.trim()}
                    className="bg-slate-900 hover:bg-slate-800 disabled:bg-gray-200 text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:shadow-none"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        {mode === AppMode.GENERATOR ? 'Gerar Bloco' : 'Salvar Referência'}
                        <Send size={16} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {lastResponse && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                    <Code size={18} className="text-blue-500" />
                    Shortcode Gerado
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleCopy(lastResponse, 'last')}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition-all border border-emerald-100 shadow-sm"
                    >
                      {copiedId === 'last' ? <Check size={14} /> : <Copy size={14} />}
                      {copiedId === 'last' ? 'Copiado!' : 'Copiar para WPBakery'}
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-800 relative">
                  <div className="absolute top-4 left-4 flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-slate-700"></div>
                    <div className="h-2.5 w-2.5 rounded-full bg-slate-700"></div>
                    <div className="h-2.5 w-2.5 rounded-full bg-slate-700"></div>
                  </div>
                  <pre className="p-8 pt-12 text-xs font-mono text-blue-300 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[600px] custom-scrollbar">
                    <code>{lastResponse}</code>
                  </pre>
                </div>

                <div className="flex items-start gap-3 bg-blue-50/50 border border-blue-100 p-4 rounded-xl">
                  <AlertCircle size={18} className="text-blue-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-800 leading-relaxed">
                    <strong className="block mb-1 font-bold">Instrução de Uso:</strong>
                    Cole este código no modo <strong>Texto</strong> do editor WPBakery. Todos os parâmetros foram otimizados para o design system do tema The7.
                  </div>
                </div>
              </div>
            )}
            <div className="h-10"></div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
