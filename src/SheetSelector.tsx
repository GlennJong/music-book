import { useState, useEffect } from 'react';
import { ReactHooks } from '@glennjong/vibe-sheets';
import './App.css'
import FileItem from './components/FileItem';

type CreateSheetBoxProps = {
  createSheet: (options: { sheetName: string, prefix?: string, columns?: { name: string, type: 'string' | 'number' | 'boolean' }[], tabName?: string }) => Promise<void>;
  fetchFiles: (prefix: string) => Promise<void>;
  onCreate: (newSheetNames: string) => void;
}

const CreateSheetBox = ({ createSheet, fetchFiles, onCreate }: CreateSheetBoxProps) => {
  const [sheetName, setSheetName] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  
  const handleFetchCreationSheet = async () => {
    if (!sheetName.trim()) return;
    setIsCreating(true);
    try {
      await createSheet({
        sheetName: sheetName,
        prefix: 'musicbook-',
        columns: [
          { name: 'title', type: 'string' },
          { name: 'artist', type: 'string' },
          { name: 'key', type: 'string' },
          { name: 'bpm', type: 'number' },
          { name: 'subdivisions', type: 'number' },
          { name: 'capo', type: 'number' },
          { name: 'tuningName', type: 'string' },
          { name: 'measures', type: 'string' }, // measures 存為 JSON 字串
        ]
      })
      await fetchFiles('musicbook-');
      onCreate(sheetName);
      setSheetName('');
    } catch (error) {
      console.error(error);
      alert('Failed to create sheet');
    } finally {
      setIsCreating(false);
    }
  }
  
  return (
    <div style={{ width: '100%' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        width: '100%'
      }}>
        <input 
          type="text" 
          value={sheetName} 
          onChange={(e) => setSheetName(e.target.value)}
          placeholder="New Sheet Name" 
          disabled={isCreating}
          style={{
            flex: 1,
            padding: '0 12px',
            height: '40px',
            borderRadius: '4px',
            border: '1px solid var(--border-color)',
            backgroundColor: isCreating ? 'var(--bg-main)' : 'var(--input-bg)',
            color: 'var(--text-main)',
            boxSizing: 'border-box'
          }}
        />
        <button
          onClick={handleFetchCreationSheet}
          disabled={!sheetName.trim() || isCreating}
          style={{
            height: '40px',
            padding: '0 20px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: (!sheetName.trim() || isCreating) ? 'var(--input-bg)' : 'var(--primary)',
            color: (!sheetName.trim() || isCreating) ? 'var(--text-muted)' : 'var(--text-inv)',
            cursor: (!sheetName.trim() || isCreating) ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            fontWeight: '500'
          }}
        >
          Create
        </button>
      </div>
      {isCreating && (
        <div style={{ marginTop: '12px', color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
          <span className="spinner" style={{ width: '16px', height: '16px', border: '2px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
          Creating "{sheetName}"... please wait.
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      )}
    </div>
  )
}

const SheetSelector = ({ token, onSelect }: { token: string, onSelect: (endpoint: string) => void }) => {
  const { 
    createSheet, 
    fetchFiles,
    loading,
    files,
  } = ReactHooks.useSheetManager(token);

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [ newCreationSheetName, setNewCreationSheetName ] = useState<string[]>([]);
  
  useEffect(() => {
    fetchFiles('musicbook-').finally(() => setIsInitialLoad(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleStoreEndpoint = (endpoint: string) => {
    localStorage.setItem('my_music_script_url', endpoint);
    onSelect(endpoint);
  };
  
  if (isInitialLoad || (loading && files.length === 0)) {
    return (
      <div className="card" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
        <h3>Syncing your Musicbooks...</h3>
        <p>Please wait while we fetch your data.</p>
      </div>
    );
  }
  // View: Create New (Enable if no files OR if we just created one successfully)
  if (files.length === 0) {
    return (
      <div className="card" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
        <h2>Welcome to MusicBook</h2>
        <div style={{ padding: '1.5rem', background: 'var(--bg-item)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <h3>No Musicbooks Found</h3>
          <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
            It looks like you don't have a MusicBook backend yet.
          </p>
          <CreateSheetBox
            createSheet={createSheet}
            fetchFiles={fetchFiles}
            onCreate={(sheetName: string) => setNewCreationSheetName([...newCreationSheetName, sheetName])}
          />
          <button 
            className="secondary" 
            onClick={() => fetchFiles('musicbook-')} 
            disabled={loading}
            style={{
               marginTop: '10px',
               padding: '8px 16px',
               background: 'transparent',
               border: '1px solid var(--border-color)',
               color: 'var(--primary)',
               borderRadius: '4px',
               cursor: 'pointer'
            }}
          >
            Check Again
          </button>
        </div>
      </div>
    );
  }

  // View: List Files
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 1rem' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--text-main)' }}>Select MusicBook</h2>
      
      {/* Creation Section */}
      <div style={{ 
        marginBottom: '2rem', 
        padding: '1.5rem', 
        backgroundColor: 'var(--bg-card)', 
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 2px 8px var(--shadow-color)'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: '600', textAlign: 'center' }}>Create New Book</h3>
        <CreateSheetBox
          createSheet={createSheet}
          fetchFiles={fetchFiles}
          onCreate={(sheetName: string) => setNewCreationSheetName([...newCreationSheetName, sheetName])}
        />
      </div>

      {/* List Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0 4px' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Existing Books</h3>
        <button 
          onClick={() => fetchFiles('musicbook-')} 
          disabled={loading} 
          style={{ 
            background: 'transparent',
            border: 'none',
            color: 'var(--primary)',
            cursor: loading ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.9rem',
            padding: '4px 8px',
            borderRadius: '4px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-item)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <span className="material-icons" style={{ fontSize: '18px', animation: loading ? 'spin 1s linear infinite' : 'none' }}>refresh</span>
          Refresh
          {loading && <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>}
        </button>
      </div>
      {/* List Section */}
      <div className="file-grid" style={{ marginTop: 0 }}>
        {files.map((file) => 
          <FileItem
            isNew={newCreationSheetName.some((sheetName) => file.name.includes(sheetName))}
            key={file.id}
            file={file}
            onSelect={(scriptUrl) => {
              if (scriptUrl) {
                handleStoreEndpoint(scriptUrl);
              }
            }} />
        )}
      </div>
      
      {files.length === 0 && !loading && (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
          No books found. Create one above!
        </div>
      )}
    </div>
  );
};

export default SheetSelector
