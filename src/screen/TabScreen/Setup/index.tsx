import { lazy, Suspense, useState } from 'react';
import { ReactHooks } from '@glennjong/vibe-sheets';
import { CHORD_DATA, saveChordData, resetChordData, type ChordPosition } from '../../../components/GuitarChord/constants';

const SheetSelector = lazy(() => import('./SheetSelector'));

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const ChordDataEditor = () => {
  const [open, setOpen] = useState(false);
  const [json, setJson] = useState(() => JSON.stringify(CHORD_DATA, null, 2));
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch (e) {
      setError(`JSON 格式錯誤：${e instanceof Error ? e.message : String(e)}`);
      return;
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      setError('資料必須為物件，且 key 為和弦名稱');
      return;
    }
    for (const [key, val] of Object.entries(parsed)) {
      if (!Array.isArray(val)) {
        setError(`「${key}」的值必須為陣列`);
        return;
      }
    }
    saveChordData(parsed as Record<string, ChordPosition[]>);
    window.location.reload();
  };

  const handleReset = () => {
    if (!window.confirm('確定要重置和弦資料庫為預設值嗎？')) return;
    resetChordData();
    window.location.reload();
  };

  return (
    <div className="card" style={{ marginTop: '24px', padding: '20px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', color: 'var(--text-main)', fontSize: '1em', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <span>和弦資料庫編輯</span>
        <span className="material-icons" style={{ fontSize: '20px' }}>{open ? 'expand_less' : 'expand_more'}</span>
      </button>

      {open && (
        <div style={{ marginTop: '16px' }}>
          <p style={{ fontSize: '0.85em', color: 'var(--text-muted, #888)', marginBottom: '8px' }}>
            編輯 JSON 後儲存會重新載入頁面。格式為 <code>{'{ "和弦名": [{ name, chord, startFret?, barre?, baseShape? }] }'}</code>
          </p>
          <textarea
            value={json}
            onChange={e => { setJson(e.target.value); setError(null); }}
            spellCheck={false}
            style={{
              width: '100%',
              minHeight: '320px',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: '12px',
              padding: '12px',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-main, #fafafa)',
              color: 'var(--text-main)',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
          {error && (
            <div style={{ marginTop: '8px', padding: '8px 12px', backgroundColor: '#fee', color: '#c00', borderRadius: '6px', fontSize: '0.85em' }}>
              {error}
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button
              onClick={handleSave}
              style={{ padding: '8px 16px', backgroundColor: 'var(--primary)', color: 'var(--bg-card)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9em' }}
            >
              儲存並重新載入
            </button>
            <button
              onClick={handleReset}
              style={{ padding: '8px 16px', backgroundColor: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9em' }}
            >
              重置為預設
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Setup = ({ onSelect }: { onSelect: () => void }) => {
  const { login, accessToken, isAppsScriptEnabled } = ReactHooks.useGoogleAuth({
    clientId
  });
  const vibeScriptUrl = typeof window !== 'undefined' ? localStorage.getItem('my_music_script_url') : null;

  let authSection;
  if (!accessToken) {
    authSection = (
      <div className="card" style={{ color: 'var(--text-main)', textAlign: 'center', padding: '40px 20px' }}>
        {vibeScriptUrl ? (
          <button
            onClick={() => {
              localStorage.removeItem('my_music_script_url');
              window.location.reload();
            }}
            style={{ fontSize: '1.1em', padding: '12px 24px', backgroundColor: 'var(--danger)', color: 'var(--bg-card)', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            刪除 Google Sheet 連結
          </button>
        ) : (
          <button onClick={login} style={{ fontSize: '1.1em', padding: '12px 24px', backgroundColor: 'var(--primary)', color: 'var(--bg-card)', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Login with Google</button>
        )}
      </div>
    );
  } else if (accessToken && !isAppsScriptEnabled) {
    authSection = (
      <div className="card" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
        {isAppsScriptEnabled === undefined ?
          <p>Checking your Apps Script permission...</p>
          :
          <>
            <p>Before we start using MusicBook, you need to enable Apps Script.</p>
            <a target="_blank" href="https://script.google.com/home/usersettings?pli=1">Click Me</a>
          </>
        }
      </div>
    );
  } else {
    authSection = (
      <Suspense fallback={
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh' }}>
              <span className="spinner" style={{ width: '30px', height: '30px', border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
          </div>
      }>
        <SheetSelector
          token={accessToken}
          onSelect={(endpoint: string) => {
            localStorage.setItem('my_music_script_url', endpoint);
            onSelect();
          }}
        />
      </Suspense>
    );
  }

  return (
    <>
      {authSection}
      <ChordDataEditor />
    </>
  );
};

export default Setup;
