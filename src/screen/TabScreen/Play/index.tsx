import React, { useState } from 'react';
import './style.css';

import type { TabData } from '../index';
import { tuningInfo } from '../tuningInfo';

interface PlayProps {
  tabData: TabData;
}

// 六線譜渲染
// 與 TabData 結構一致
interface Note {
  string: number;
  fret: number;
  beat: number;
}
interface Measure {
  id: number;
  chord: string;
  lyrics: string;
  notes: Note[];
}
function renderTablature(measure: Measure, subdivisions: number, tuning: string[]) {
  // 產生 6 行，每行為一條弦
  const lines = Array.from({ length: 6 }, (_, s) => {
    // s: 0 (最高音弦) ~ 5 (最低音弦)
    const stringNum = s + 1;
    let line = '';
    for (let b = 0; b < subdivisions; b++) {
      const note = measure.notes.find((n: Note) => n.string === stringNum && n.beat === b);
      line += '|';
      line += note ? String(note.fret).padStart(2, ' ') : '  ';
    }
    line += '|';
    return tuning[s] + ' ' + line;
  });
  return lines;
}


const Play: React.FC<PlayProps> = ({ tabData }) => {

  const [measuresPerRow, setMeasuresPerRow] = useState(2);
  if (!tabData || !tabData.measures) return <div className="tab-play-container">無譜面資料</div>;

  // 分組顯示小節
  const measureGroups = [];
  for (let i = 0; i < tabData.measures.length; i += measuresPerRow) {
    measureGroups.push(tabData.measures.slice(i, i + measuresPerRow));
  }

  // 歌曲資訊
  const { title, artist, key, bpm, capo, subdivisions, tuningName } = tabData;

  return (
    <div className="tab-play-container" style={{ fontSize: 13, padding: 8 }}>
      <div style={{ marginBottom: 8, padding: 8, borderRadius: 8, background: '#f3f4f6', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 16 }}>{title || '未命名'}</span>
        {artist && <span style={{ color: '#666' }}>{artist}</span>}
        <span style={{ color: '#6366f1', fontWeight: 700 }}>Key: {key}</span>
        <span style={{ color: '#6366f1', fontWeight: 700 }}>BPM: {bpm}</span>
        {capo ? <span style={{ color: '#6366f1', fontWeight: 700 }}>Capo: {capo}</span> : null}
      </div>
      <div style={{ marginBottom: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: '#666', fontWeight: 500 }}>每行顯示</span>
        {[2,4,6,8].map(num => (
          <button
            key={num}
            onClick={() => setMeasuresPerRow(num)}
            style={{
              padding: '2px 10px',
              borderRadius: 6,
              border: '1px solid',
              borderColor: measuresPerRow === num ? '#6366f1' : '#e0e0e0',
              background: measuresPerRow === num ? '#6366f1' : '#fff',
              color: measuresPerRow === num ? '#fff' : '#333',
              fontWeight: 'bold',
              fontSize: 13,
              cursor: 'pointer',
              marginRight: 2
            }}
          >{num}</button>
        ))}
        <span style={{ fontSize: 12, color: '#666', fontWeight: 500 }}>小節</span>
      </div>
      <div className="tab-play-sheet">
        {tabData.measures.length === 0 ? (
          <div>無譜面資料</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {measureGroups.map((group, groupIdx) => (
              <div key={groupIdx} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                {group.map((m) => (
                  <div key={m.id} style={{ flex: 1, minWidth: 160, padding: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 'bold', fontSize: 15, color: '#6366f1' }}>{m.chord || '-'}</span>
                    </div>
                    <pre style={{ fontFamily: 'monospace', fontSize: 11, margin: 0, background: '#f8fafc', padding: 6, borderRadius: 6, overflowX: 'auto' }}>
                      {renderTablature(
                        m,
                        subdivisions,
                        (() => {
                          const t = tuningInfo[tuningName];
                          return Array.isArray(t) && t.length === 6 ? t : tuningInfo['standard'];
                        })()
                      ).join('\n')}
                    </pre>
                    {m.lyrics && (
                      <div style={{ marginTop: 6, color: '#666', fontSize: 12, fontWeight: 500 }}>{m.lyrics}</div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Play;
