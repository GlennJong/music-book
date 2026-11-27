import { useState } from 'react';
import { type DriveFile, getAuthorizeUrl } from '@glennjong/vibe-sheets';
import type { RawData } from '../types';

// eslint-disable-next-line react-refresh/only-export-components
export const fetchScript = async (url: string, method: 'GET' | 'POST' = 'GET', body?: unknown): Promise<RawData[]> => {
  const options: RequestInit = { method };
  if (method === 'POST' && body) options.body = JSON.stringify(body);
  const res = await fetch(url, options);
  const json = await res.json();
  
  // Safety check: ensure data exists and is an array
  const data: RawData[] = Array.isArray(json.data) ? json.data : [];
  
  return data.map((item: RawData) => ({ 
    ...item
  }));
};

type FileItemProps = {
  isNew: boolean;
  file: DriveFile;
  onSelect: (scriptUrl: string) => void;
  needsUpgrade?: boolean;
  onUpgrade?: () => Promise<void>;
};

const FileItem = ({ isNew, file, onSelect, needsUpgrade, onUpgrade }: FileItemProps) => {
  const [ isUpgrading, setIsUpgrading ] = useState(false);
  const [ upgradeError, setUpgradeError ] = useState<string | null>(null);
  const [ isFetching, setIsFetching ] = useState(false);
  const [ isAccessed, setIsAccessed ] = useState<boolean | undefined>(!isNew);

  const handleSelect = async () => {
    try {
      if (file.description) {
        if (file.scriptUrl) {
          setIsFetching(true);
          await fetchScript(file.scriptUrl);
          setIsAccessed(true);
          onSelect(file.scriptUrl);
          setIsFetching(false);
        }
      }
    } catch (e) {
      console.error("Invalid file description", e);
      setIsAccessed(false);
      setIsFetching(false);
    }
  };

  // 輪詢檢查 scriptUrl 是否可用
  const pollAccess = () => {
    let count = 0;
    const maxTries = 10;
    const interval = setInterval(() => {
      // 這裡可根據實際情境改為 fetch 或 token 驗證
      if (file.scriptUrl) {
        setIsAccessed(true);
        clearInterval(interval);
      } else if (++count >= maxTries) {
        clearInterval(interval);
      }
    }, 800);
  };

  return (
    <div style={{ 
      backgroundColor: 'var(--bg-card)', 
      border: '1px solid var(--border-color)', 
      color: 'var(--text-main)',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '12px',
      boxShadow: '0 2px 5px var(--shadow-color)',
      transition: 'transform 0.1s ease-in-out',
    }}>
      <div key={file.id}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
          <span className="material-icons" style={{ fontSize: '24px', marginRight: '8px', color: 'var(--primary)' }}>
            description
          </span>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>{file.name.replace('musicbook-', '')}</h3>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <a href={file.webViewLink} target="_blank" rel="noreferrer" style={{ flex: 1, textDecoration: 'none' }}>
            <button style={{ 
              width: '100%', 
              padding: '10px',
              background: 'var(--bg-item)', 
              color: 'var(--text-main)', 
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}>
              <span className="material-icons" style={{ fontSize: '16px' }}>open_in_new</span>
              Open
            </button>
          </a>
          <button 
            disabled={isFetching || isAccessed !== true}
            onClick={handleSelect}
            style={{ 
              flex: 2,
              padding: '10px',
              backgroundColor: (isFetching || isAccessed !== true) ? 'var(--input-bg)' : 'var(--primary)',
              color: (isFetching || isAccessed !== true) ? 'var(--text-muted)' : 'var(--text-inv)',
              border: 'none',
              borderRadius: '6px',
              cursor: (isFetching || isAccessed !== true) ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
          >
            { isFetching ? (
              <>
                 <span className="spinner" style={{ width: '14px', height: '14px', border: '2px solid', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }}></span>
                 Loading
                 <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
              </>
            ) : (
              <>
                <span className="material-icons" style={{ fontSize: '18px' }}>check</span>
                Select
              </>
            )}
          </button>
        </div>
        { needsUpgrade && onUpgrade && (
          <div style={{ marginTop: '12px', padding: '10px', backgroundColor: 'var(--bg-item)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <p style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              後端腳本有新版本（同步更穩定、避免重複新增）。升級後網址不變。
            </p>
            <button
              disabled={isUpgrading}
              onClick={async () => {
                setIsUpgrading(true);
                setUpgradeError(null);
                try {
                  await onUpgrade();
                } catch (e) {
                  setUpgradeError(e instanceof Error ? e.message : String(e));
                } finally {
                  setIsUpgrading(false);
                }
              }}
              style={{
                width: '100%',
                backgroundColor: isUpgrading ? 'var(--input-bg)' : 'var(--primary)',
                color: isUpgrading ? 'var(--text-muted)' : 'var(--primary-fg)',
                border: 'none',
                padding: '8px',
                borderRadius: '4px',
                cursor: isUpgrading ? 'wait' : 'pointer',
                fontWeight: '500'
              }}
            >
              {isUpgrading ? '升級中…' : '升級後端'}
            </button>
            {upgradeError && (
              <p style={{ margin: '8px 0 0 0', color: 'var(--danger)', fontSize: '0.85rem' }}>{upgradeError}</p>
            )}
          </div>
        )}
        { isAccessed === false && 
          <div style={{ marginTop: '12px', padding: '10px', backgroundColor: 'var(--warning-bg-subtle)', borderRadius: '6px', border: '1px solid var(--warning)' }}>
            <p style={{ margin: '0 0 8px 0', color: 'var(--text-main)', fontSize: '0.9rem' }}>Access authorization required.</p>
            <button 
              onClick={() => {
                if (!file.scriptUrl) return;
                window.open(getAuthorizeUrl(file.scriptUrl), 'auth', 'width=600,height=400');
                pollAccess();
              }}
              style={{
                width: '100%',
                backgroundColor: 'var(--primary)',
                color: 'var(--text-inv)',
                border: 'none',
                padding: '8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Authorize
            </button>
          </div>
        }
      </div>
    </div>
  );
};

export default FileItem;
