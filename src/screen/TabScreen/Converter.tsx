import React, { useState } from 'react';
import type { TabData } from '../../types';


interface ConverterProps {
  onChange?: (data: TabData) => void;
}

const Converter: React.FC<ConverterProps> = ({ onChange }) => {
  const [image, setImage] = useState<string | null>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/png');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<TabData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const apiKey = ""; // 執行環境會自動注入

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImage(base64);
        setBase64Data(base64.split(',')[1]);
        setMimeType(file.type); // 動態記錄檔案類型
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchWithRetry = async (payload: Record<string, unknown>, retries = 5, delay = 1000): Promise<GeminiResponse> => {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (_err) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(payload, retries - 1, delay * 2);
      }
      throw _err;
    }
  };

  const processImage = async () => {
    if (!base64Data) return;
    setIsProcessing(true);
    setError(null);

    const systemPrompt = `你是一位專業的吉他譜轉譯專家。請分析這張吉他譜圖檔（可能是六線譜 TAB），並將其精確轉換為 JSON 格式。
    
    嚴格遵守以下 JSON 結構：
    {
      "metadata": { "title": "字串", "artist": "字串", "key": "字串", "bpm": 數字, "subdivisions": 4, "capo": 數字, "tuningName": "standard" },
      "chordLib": { "和弦名": { "frets": [1弦, 2弦, 3弦, 4弦, 5弦, 6弦], "theory": "簡短分析" } },
      "measures": [
        { "id": 1, "chord": "和弦名", "lyrics": "歌詞", "notes": [{ "string": 1-6, "fret": 0-24, "beat": 0-3 }] }
      ]
    }
    
    規則：
    1. string 1 是最高音弦 (下圖最上方)，string 6 是最低音弦。
    2. 如果圖中沒標示 BPM，預設為 80。
    3. 如果沒標示 Capo，預設為 0。
    4. 根據橫向間距推斷 beat 位置 (0-3 代表四分音符)。
    5. 只輸出 JSON，不要有任何 Markdown 標記或解釋文字。`;

    try {
      const payload = {
        contents: [{
          parts: [
            { text: "請轉換此吉他譜圖檔為上述 JSON 格式。" },
            { inlineData: { mimeType: mimeType, data: base64Data } }
          ]
        }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { responseMimeType: "application/json" }
      };

      const data: GeminiResponse = await fetchWithRetry(payload);
      const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (textResult) {
        const parsed = JSON.parse(textResult);
        // chordLib 已棄用，移除
        if (parsed.chordLib) delete parsed.chordLib;
        setResult(parsed);
        if (onChange) onChange(parsed);
      }
    } catch (err) {
      console.log(err)
      setError("辨識過程中發生錯誤，請確認網路連線或嘗試更換清晰的圖片。");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans p-6 md:p-12 selection:bg-indigo-100">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
              <span className="material-icons text-[28px]">photo_camera</span>
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight">影像辨識轉換器</h1>
              <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em]">Image to Vibe-TabData OCR</p>
            </div>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="p-2 text-zinc-300 hover:text-zinc-600 transition-colors flex items-center"
          >
            <span className="material-icons">refresh</span>
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* 左側：上傳區 */}
          <div className="space-y-6">
            <div className={`relative border-2 border-dashed rounded-[3rem] transition-all flex flex-col items-center justify-center p-10 min-h-110 ${image ? 'border-indigo-200 bg-white shadow-inner' : 'border-zinc-200 hover:border-indigo-400 bg-zinc-100/30'}`}>
              {!image ? (
                <>
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 text-zinc-300">
                    <span className="material-icons text-[32px]">add_a_photo</span>
                  </div>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest text-center">拖放或點擊上傳圖檔<br /><span className="text-[10px] opacity-60">(支援 PNG, JPG, JPEG)</span></p>
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg, image/jpg" 
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </>
              ) : (
                <div className="relative w-full h-full flex flex-col items-center">
                  <div className="p-2 bg-zinc-50 rounded-3xl border border-zinc-100 shadow-sm mb-8">
                    <img src={image} alt="Preview" className="max-h-75 rounded-2xl object-contain" />
                  </div>
                  <button 
                    onClick={() => {setImage(null); setBase64Data(null); setResult(null);}} 
                    className="w-12 h-12 bg-zinc-900 text-white rounded-2xl flex items-center justify-center shadow-xl hover:bg-red-500 transition-all active:scale-90"
                  >
                    <span className="material-icons text-[20px]">delete_sweep</span>
                  </button>
                </div>
              )}
            </div>

            {image && !isProcessing && !result && (
              <button 
                onClick={processImage}
                className="w-full py-6 bg-zinc-950 text-white rounded-4xl font-black uppercase tracking-[0.3em] shadow-2xl shadow-zinc-200 hover:bg-indigo-600 hover:-translate-y-1.5 transition-all flex items-center justify-center gap-4"
              >
                <span className="material-icons text-[20px]">auto_awesome</span>
                Start AI Analysis
              </button>
            )}

            {isProcessing && (
              <div className="w-full py-6 bg-white border-2 border-zinc-100 text-zinc-400 rounded-4xl font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 animate-pulse">
                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                Analyzing Structure...
              </div>
            )}
          </div>

          {/* 右側：結果區 */}
          <div className="space-y-6">
            <div className="bg-zinc-900 rounded-[3rem] p-10 min-h-110 shadow-2xl relative overflow-hidden border border-zinc-800">
              <div className="flex items-center justify-between mb-8 border-b border-zinc-800 pb-6">
                <span className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em]">Result Output</span>
                {result && (
                  <div className="flex items-center gap-2 text-emerald-400">
                    <span className="material-icons text-[14px]">verified</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">Parsed</span>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex flex-col items-center justify-center h-64 text-red-400 gap-4 animate-in fade-in zoom-in">
                  <span className="material-icons text-[48px]">report_problem</span>
                  <p className="text-xs font-bold text-center px-10 leading-loose uppercase tracking-widest">{error}</p>
                </div>
              )}

              {!result && !error && !isProcessing && (
                <div className="flex flex-col items-center justify-center h-64 text-zinc-800 gap-6 opacity-30">
                  <span className="material-icons text-[56px]">code</span>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em]">Waiting for data...</p>
                </div>
              )}

              {result && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <pre className="text-indigo-300 font-mono text-[12px] leading-loose overflow-auto max-h-130 scrollbar-hide">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {result && (
              <button 
                className="w-full py-6 bg-white border-2 border-zinc-100 text-zinc-600 rounded-4xl font-black uppercase tracking-[0.2em] hover:bg-zinc-50 hover:text-indigo-600 transition-all flex items-center justify-center gap-4 shadow-sm active:scale-95"
                onClick={() => {
                  const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${result.title || 'tab_data'}.json`;
                  a.click();
                }}
              >
                <span className="material-icons">file_download</span>
                Download JSON
              </button>
            )}
          </div>
        </div>

        <footer className="mt-20 pt-10 border-t border-zinc-100 text-center">
          <p className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.5em]">
            Vibe Data Standard v1.2.4 • Gemini Flash OCR
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Converter;


// Gemini Gemini API 回傳型別
interface GeminiCandidate {
  content?: {
    parts?: { text?: string }[];
  };
}
interface GeminiResponse {
  candidates?: GeminiCandidate[];
}