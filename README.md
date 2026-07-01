# LifeDash - 個人理財及工具助手

一個簡約、有設計感嘅個人 Dashboard 網站，整合個人理財系統同日常小工具。

## 功能

### 個人理財系統
- 記錄收入同支出
- 分類管理（飲食、交通、購物等）
- 每月預算設定同追蹤
- 圖表化支出分析
- 每月收支月結報表

### 工具箱
- **世界時間** - 監察多個城市實時時間
- **番茄時鐘** - 25分鐘專注 + 5分鐘休息
- **支票銀碼產生器** - 香港適用中英文銀碼全寫

## 使用

### 方法 1：直接打開（基本功能）
直接用瀏覽器打開 `index.html` 即可使用大部分功能。

### 方法 2：本地伺服器（完整 PWA 功能）
如需離線支援及 PWA 安裝，請先啟動本地伺服器：

```bash
# Python 3
cd personal-dashboard && python3 -m http.server 8080

# 或 Node.js
cd personal-dashboard && npx serve .
```

然後用瀏覽器打開 `http://localhost:8080`

## 數據儲存

- **在線時**：數據會同步到 Supabase 雲端數據庫
- **離線時**：自動使用瀏覽器 LocalStorage 作為備份，再次上線後會繼續同步
- 數據透過 `x-user-key` header 同 Row Level Security（RLS）進行隔離

### 重要安全提示

`js/db.js` 入面嘅 `USER_KEY` 預設係 `'default'`。如果你打算正式使用，請改成一組只有自己知道嘅隨機字串，例如：

```js
const USER_KEY = 'ld-2024-your-random-string';
```

否則其他使用相同 key 嘅人可能會讀寫到你嘅數據。

### Supabase 設定

如果你使用自己嘅 Supabase 專案，請參考 `supabase-setup.sql` 建立數據表同 RLS 政策。

## PWA 安裝

1. 用 Chrome / Safari / Edge 打開網站（必須用 localhost 或 HTTPS）
2. 點擊地址欄右邊「加入主畫面」或「安裝」
3. 即可像 App 一樣使用，支援離線瀏覽

## 技術

- HTML5 / CSS3 / Vanilla JavaScript
- Supabase 雲端同步
- LocalStorage 離線備份
- Service Worker 離線支援
- Responsive Design
