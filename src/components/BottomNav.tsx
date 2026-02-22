import type { Tab } from '../screen/MainLayout';

type BottomNavProps = {
  currentTab: Tab;
  onTabChange: (tab: Tab) => void;
};

const BottomNav = ({ currentTab, onTabChange }: BottomNavProps) => {
  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'var(--bg-card)',
      borderTop: '1px solid var(--border-color)',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingTop: '12px',
      paddingBottom: 'calc(25px + env(safe-area-inset-bottom))',
      zIndex: 1000,
      boxShadow: '0 -2px 5px var(--shadow-color)'
    }}>
      <button 
        onClick={() => onTabChange('try')}
        style={{
          background: 'none',
          border: 'none',
          color: currentTab === 'try' ? 'var(--primary)' : 'var(--text-muted)',
          fontSize: '1em',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flex: 1
        }}
      >
        <span className="material-icons" style={{ fontSize: '1.5em' }}>headphones</span>
        <span style={{ fontSize: '0.7em', marginTop: '4px' }}>Try</span>
      </button>

      <button 
        onClick={() => onTabChange('learn')}
        style={{
          background: 'none',
          border: 'none',
          color: currentTab === 'learn' ? 'var(--primary)' : 'var(--text-muted)',
          fontSize: '1em',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flex: 1
        }}
      >
        <span className="material-icons" style={{ fontSize: '1.5em' }}>menu_book</span>
        <span style={{ fontSize: '0.7em', marginTop: '4px' }}>Learn</span>
      </button>

      <button 
        onClick={() => onTabChange('vocal')}
        style={{
          background: 'none',
          border: 'none',
          color: currentTab === 'vocal' ? 'var(--primary)' : 'var(--text-muted)',
          fontSize: '1em',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flex: 1
        }}
      >
        <span className="material-icons" style={{ fontSize: '1.5em' }}>mic</span>
        <span style={{ fontSize: '0.7em', marginTop: '4px' }}>Vocal</span>
      </button>
    </div>
  );
};

export default BottomNav;
