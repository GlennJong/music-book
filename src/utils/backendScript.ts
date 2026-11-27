import type { CustomScript, DriveFile } from '@glennjong/vibe-sheets';

/**
 * 後端 Apps Script 版本標記。
 * 建立試算表與升級腳本時會寫入檔案描述的 scriptVersion，用來判斷既有的試算表是否需要升級。
 * 不加自訂程式碼（code 為空），只使用 vibe-sheets 內建的 CRUD 腳本。
 * 升級 vibe-sheets 且內建腳本有變動時，記得更新這個版本字串。
 */
export const BACKEND_SCRIPT: CustomScript = {
  code: '',
  version: 'vibe-sheets@0.4.1',
};

export const needsScriptUpgrade = (file: DriveFile) =>
  !!file.scriptId && file.scriptVersion !== BACKEND_SCRIPT.version;
