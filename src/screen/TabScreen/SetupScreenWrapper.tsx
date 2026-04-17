import { useState } from 'react';
import SetupScreen from './Stepup';

export function SetupScreenWrapper({ onDone }: { onDone: () => void }) {
  const [ready, setReady] = useState(false);

  // 監控 localStorage vibe_script_url 是否設定好
  // 若設定好則觸發 onDone
  if (!ready && localStorage.getItem('vibe_script_url')) {
    setReady(true);
    onDone();
  }

  return <SetupScreen />;
}
