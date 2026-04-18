import { useState } from 'react';
import SetupScreen from './Setup';

export function SetupScreenWrapper({ onDone }: { onDone: () => void }) {
  const [ready, setReady] = useState(false);

  // 監控 localStorage my_music_script_url 是否設定好
  // 若設定好則觸發 onDone
  if (!ready && localStorage.getItem('my_music_script_url')) {
    setReady(true);
    onDone();
  }

  return <SetupScreen />;
}
