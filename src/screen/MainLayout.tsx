import { useState, useLayoutEffect, useRef, lazy, Suspense } from "react";
import BottomNav from "../components/BottomNav";

const TryScreen = lazy(() => import("./TryScreen"));
const LearnScreen = lazy(() => import("./LearnScreen"));
const VocalScreen = lazy(() => import("./VocalScreen"));

export type Tab = 'try' | 'learn' | 'vocal';

const MainLayout = () => {
  const [currentTab, setCurrentTab] = useState<Tab>('learn');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [currentTab]);

  const handleTabChange = (tab: Tab) => {
    setCurrentTab(tab);
  };

  return (
    <div style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden' // Prevent outer scroll
    }}>
      <div 
        ref={scrollContainerRef}
        id="main-scroll-container" 
        style={{ flex: 1, overflowY: 'auto', paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
      >
        <Suspense fallback={
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
            <span className="spinner" style={{ width: '24px', height: '24px', border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
          </div>
        }>
          {currentTab === 'learn' && (
            <LearnScreen />
          )}
          {currentTab === 'try' && (
            <TryScreen />
          )}
          {currentTab === 'vocal' && (
            <VocalScreen />
          )}
        </Suspense>
      </div>

      <BottomNav 
        currentTab={currentTab} 
        onTabChange={handleTabChange} 
      />

    </div>
  );
};

export default MainLayout;
