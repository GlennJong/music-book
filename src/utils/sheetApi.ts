// Google Sheets API 更新工具
// 需確保 vibe_script_url 已設定於 localStorage
export async function updateSheetWithTabData(tabData) {
  const endpoint = localStorage.getItem('vibe_script_url');
  if (!endpoint) throw new Error('vibe_script_url not set');
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'update',
      data: tabData
    })
  });
  if (!res.ok) throw new Error('Failed to update Google Sheet');
  return await res.json();
}
