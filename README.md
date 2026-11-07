# 🐍 3D 巨蟒爭霸 (Snake Infinite / 3D Snake Mega Arena)

<div align="center">

![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-r187-black?style=flat-square&logo=threedotjs&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=flat-square&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-Apache--2.0-green?style=flat-square)

**360 度全方位滑順轉彎 ‧ 3D 立體逼真視角 ‧ 無限廣闊競技場 ‧ 智慧群蛇 AI 圍捕對決**

[🎮 線上試玩](#-快速開始-getting-started) • [🕹️ 操作指南](#️-操作指南) • [🍎 道具增益](#-道具與特殊增益效果-buffs) • [🤖 電腦 ai 性格](#-電腦對手-ai-戰術生態) • [🛠️ 技術架構](#️-技術架構與效能優化)

</div>

---

## 📖 專案簡介

**3D 巨蟒爭霸** 將經典貪食蛇全面升級為現代化 **3D 多人立體競技場** 風格！

跳脫傳統 2D 網格四方向死板轉角的限制，玩家可透過 **滑鼠游標射線** 或 **平滑旋轉控制**，指引巨蟒在無邊界的立體空間中 360 度隨意穿梭。場上常駐 9 條擁有獨特戰術性格（夾擊、包圍、攔截、奪食）的電腦對手蛇，隨著長度與粗度（Girth）的動態增長，展開緊張刺激的生死獵殺！

---

## ✨ 遊戲特色亮點

- 🌀 **360° 全方位流暢操控**：擺脫傳統 90 度轉角，蛇頭精準跟隨滑鼠游標在立體地面上的射線指引，轉向自然滑順。
- 🎥 **三大 3D 視角即時切換**：
  - **等角俯瞰 (Isometric 3D)**：45 度經典斜視角，平衡立體感與大局觀。
  - **頂部鳥瞰 (Top-down 3D)**：垂直上帝視角，適合精細微操與包圍戰術判斷。
  - **追焦跟隨 (Chase 3D)**：第三人稱視角緊隨蛇頭後方，帶來極致沉浸的飛馳震撼感。
- 🛡️ **自由穿透與立體碰撞判定**：
  - **自身免疫**：蛇頭穿過自己的身體**完全不會死亡**，可靈活盤旋打結作為自身護盾。
  - **敵我碰撞**：蛇頭撞擊對手蛇身會立即出局；若**誘使對手蛇頭撞上你的身體**，則可成功將其擊殺（反殺），並掉落大量珍稀食物！
- 🍎 **動態道具與增益效果系統**：場上動態生成 6 種各具特色的戰術道具（加速、雙倍得分、減速微操、幽靈無敵、縮身瘦身等）。
- 🎨 **多重主題風格即時切換**：內建「翡翠綠境」、「霓虹夜影」、「復古掌機」、「深海幽藍」等 4 款精美主題。
- 🔊 **原生 Web Audio 合成音效**：無需外部音效資源，透過瀏覽器音訊合成器即時生成進食、衝刺、擊殺與音階反饋。
- ⚡ **Zero-GC 60 FPS 極致效能**：Three.js 物件池化與原地向量複用，消弭垃圾回收（GC Pause），百節蛇身與粒子特效持續滿幀運作。
- 📱 **響應式跨裝置支援**：支援行動端虛擬搖桿與觸控旋轉，桌機與手機皆可暢玩。

---

## 🕹️ 操作指南

### 鍵盤與滑鼠 (PC / Mac)

| 按鍵 / 操作 | 功能說明 |
| :--- | :--- |
| **滑鼠游標移動** | **360° 全方位即時轉向**（蛇頭即時朝向游標在 3D 空間的投射點轉彎） |
| **A / D 或 方向鍵 $\leftarrow / \rightarrow$** | 左右平滑旋轉航向 |
| **W / S 或 方向鍵 $\uparrow / \downarrow$** | 快速轉向向上 / 向下 |
| **Shift 鍵 (按住)** | **極限加速衝刺**（提高移動速度） |
| **空白鍵 (Space)** | 暫停 / 繼續遊戲 |
| **R 鍵** | 重新開始一局 |
| **M 鍵** | 遊戲音效 靜音 / 開啟 切換 |
| **畫布右上角視角按鈕** | 切換視角：**等角俯瞰** ↔ **頂部鳥瞰** ↔ **追焦跟隨** |

### 行動裝置 (Mobile / Tablet)

- **螢幕虛擬搖桿**：在左下角滑動旋轉盤直接控制蛇頭朝向。
- **螢幕直接觸控指引**：手指點擊或拖曳螢幕任意位置，蛇頭即時轉向目標點。

---

## 🏆 核心勝負規則

```
[ 蛇頭撞擊自己的身體 ] ──> 🛡️ 自身免疫！完全安全（可利用身軀進行自衛盤旋）
[ 蛇頭撞擊敵方蛇身 ]   ──> 💥 玩家陣亡（Game Over）
[ 敵蛇蛇頭撞擊你身體 ] ──> ⚔️ 擊殺對手！敵蛇爆散成高分食物與金蘋果
```

1. **體型成長**：吃下食物時，蛇身的**長度**與**立體粗度（Girth）**會平滑遞增，視覺重量感倍增。
2. **世界座標與雷達**：HUD 實時顯示當前座標 `(X, Y)`、探索總距離與世界原點方向指引。
3. **戰績統計**：自動在瀏覽器儲存最高分數、累計擊殺數、最長生存時間、最大蛇身長度等完整數據。

---

## 🍎 道具與特殊增益效果 (Buffs)

場上會動態生成 6 種特色道具，拾取時帶有專屬 3D 特效與動態光環：

| 道具名稱 | 圖示 | 效果說明 | 額外加分 |
| :--- | :---: | :--- | :---: |
| **紅蘋果 (Apple)** | 🍎 | 基礎食物，每次食用蛇身長度穩定增長 +1。 | **+10 分** |
| **金蘋果 (Golden Apple)** | 🌟 | 限時稀有高級食物，大幅加速體型成長。 | **+30 分** |
| **烈焰魔椒 (Speed Chili)** | 🌶️ | **極速狂飆 5 秒**，且期間所有得分**雙倍計算**！ | **+25 分** |
| **冰霜莓果 (Frost Berry)** | 🫐 | **蛇身減速 6 秒**，大幅提升精細走位與極限微操避險能力。 | **+15 分** |
| **幽靈之星 (Ghost Star)** | ⭐ | **獲得 5 秒幽靈穿透護盾**，期間**即便撞上敵方蛇身也完全免死**！ | **+20 分** |
| **縮小蘑菇 (Magic Mushroom)**| 🍄 | 快速吸收多餘身體（長度 -3），讓巨蟒瞬間輕盈瘦身、身手矯健。 | **+20 分** |

---

## 🤖 電腦對手 AI 戰術生態

競技場常駐 9 隻具備獨特顏色標記、懸浮血條名牌與戰術性格的 AI 電腦蛇：

| 電腦蛇名稱 | 主題顏色 | 戰術性格 | AI 行為特徵 |
| :--- | :---: | :---: | :--- |
| **赤焰狂蟒** | 鮮紅色 | **獵殺者 (HUNTER)** | 具備高度侵略性，主動貼近玩家側面，伺機縮小空間迫使對手撞擊。 |
| **深海巨蛟** | 湛藍色 | **包圍者 (COILER)** | 擅長利用長軀繞大圈，試圖將對手圍困於圓形包圍圈內窒息出局。 |
| **紫晶魔蚺** | 紫羅蘭 | **截擊者 (INTERCEPTOR)** | 擁有預判路徑演算法，高速斜切進入玩家前進路線進行封堵。 |
| **金眼金蝰** | 琥珀金 | **包圍者 (COILER)** | 迂迴巡弋，發現獵物即迅速收縮包圍網。 |
| **翡翠靈蛇** | 翠綠色 | **貪吃者 (GLUTTON)** | 優先尋找並衝向金蘋果與高分食物，快速發育膨脹體型。 |
| **幽冥夜蟒** | 暗灰色 | **截擊者 (INTERCEPTOR)** | 陰暗潛行，常在視覺盲區高速切角伏擊。 |
| **極光幻蚺** | 青綠色 | **包圍者 (COILER)** | 防守型包圍，以自身為中心構築防禦圈。 |
| **熾陽狂蜥** | 烈橙色 | **獵殺者 (HUNTER)** | 暴走式追尾與突刺，極具威脅性。 |
| **魅影魔蛇** | 洋紅色 | **包圍者 (COILER)** | 靈活擺動尾部封死對手逃生動線。 |

---

## 🛠️ 技術架構與效能優化

- **前端核心**：[React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **3D 渲染引擎**：[Three.js](https://threejs.org/) (PBR 材質、自適應視網膜解析度、動態光源與環境光)
- **UI & 樣式**：[Tailwind CSS v4](https://tailwindcss.com/) + [Lucide React](https://lucide.dev/) (高質感玻璃擬態 HUD)
- **音效系統**：純原生 Web Audio API，無外鏈相依，低延遲合成各種反饋音效
- **效能架構**：
  - 核心物理更新與渲染管線脫離 React 重繪循環，維持穩定 60 FPS。
  - 使用靜態向量與四元數（`_vec3`, `_mat4`, `_quat`）避免頻繁 GC 記憶體分配。
  - 空間距離計算全面採用平方距離（`distSq`），省去開平方（`sqrt`）的高昂運算開銷。

---

## 📂 專案目錄結構

```text
經典貪食蛇/
├── index.html               # 遊戲入口 HTML
├── package.json             # 專案相依套件與指令腳本
├── vite.config.ts           # Vite 建置與開發伺服器設定
├── tsconfig.json            # TypeScript 型別編譯設定
├── src/
│   ├── main.tsx             # React 根節點渲染入口
│   ├── App.tsx              # 遊戲主循環、鍵盤監聽、核心狀態管理
│   ├── index.css            # 全域樣式與 Tailwind CSS 導入
│   ├── types/
│   │   └── game.ts          # 遊戲狀態、道具、主題、AI 型別定義
│   ├── components/
│   │   ├── SnakeCanvas.tsx  # Three.js 3D 渲染核心（相機、光影、網格、粒子）
│   │   ├── GameHud.tsx      # 頂部即時儀表板（分數、Buff計時條、長度、雷達）
│   │   ├── TopBar.tsx       # 頂部導航列（暫停、重開、靜音、說明彈窗）
│   │   ├── VirtualDPad.tsx  # 行動裝置虛擬搖桿與觸控介面
│   │   ├── GameOverModal.tsx# 遊戲結束結算彈窗與新紀錄徽章
│   │   ├── HowToPlayModal.tsx # 詳細規則與道具說明彈窗
│   │   ├── SettingsModal.tsx # 外觀主題更換與控制偏好設定
│   │   └── StatsModal.tsx   # 歷史戰績與成就統計面板
│   └── utils/
│       ├── audio.ts         # Web Audio API 原生音效合成引擎
│       └── storage.ts       # 本地 LocalStorage 統計與偏好持久化
└── README.md                # 專案說明文件
```

---

## 🚀 快速開始 (Getting Started)

### 1. 環境需求

- [Node.js](https://nodejs.org/) (v18.0 或更高版本) 或 [Bun](https://bun.sh/)
- 支援 WebGL 2.0 的現代瀏覽器 (Chrome, Edge, Safari, Firefox)

### 2. 安裝依賴

使用 `npm`：
```bash
npm install
```

或使用 `bun`（推薦，極速安裝）：
```bash
bun install
```

### 3. 本地啟動開發伺服器

```bash
npm run dev
# 或
bun run dev
```

啟動後，使用瀏覽器開啟提示的網址（預設為 `http://localhost:3000`）。

### 4. 生產環境建置與預覽

```bash
# 建置生產靜態檔案
npm run build

# 本地預覽建置成果
npm run preview
```

---

## 📄 授權條款 (License)

本專案採用 [Apache License 2.0](LICENSE) 授權開源。
