import { lazy, Suspense } from 'react';
import { ReactHooks } from '@glennjong/vibe-sheets';
// import '../../App.css'

const SheetSelector = lazy(() => import('../../SheetSelector'));

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const Setup = () => {
  const { login, accessToken, isAppsScriptEnabled } = ReactHooks.useGoogleAuth({
    clientId
  });
  const vibeScriptUrl = typeof window !== 'undefined' ? localStorage.getItem('vibe_script_url') : null;

  // Show delete button if vibe_script_url exists
  if (!accessToken) {
    return (
      <div className="card" style={{ color: 'var(--text-main)', textAlign: 'center', padding: '40px 20px' }}>
        {vibeScriptUrl ? (
          <button
            onClick={() => {
              localStorage.removeItem('vibe_script_url');
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
    return (
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
  }

  return (
    <Suspense fallback={
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <span className="spinner" style={{ width: '30px', height: '30px', border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
        </div>
    }>
      <SheetSelector
        token={accessToken}
        onSelect={(endpoint: string) => {
          localStorage.setItem('vibe_script_url', endpoint);
        }}
      />
    </Suspense>
  )
};

export default Setup;
