# Minecraft Dungeons 2 Save Editor

![GitHub release (latest by date)](https://img.shields.io/github/v/release/IshiakiZ/mcd2-save-editor)
![GitHub License](https://img.shields.io/github/license/IshiakiZ/mcd2-save-editor)
![Platform Windows](https://img.shields.io/badge/platform-Windows-blue)

The **Ultimate Minecraft Dungeons 2 Save Editor**. Modify your character's level, power, emeralds, items, and enchantments with an easy-to-use, modern interface inspired by the actual game UI.

Whether you're playing on **Steam**, **Xbox Game Pass (PC)**, or the **Windows Store**, this tool automatically detects your saves and provides full editing capabilities without the risk of file corruption.

## ✨ Features

*   **🎮 Full Save Detection:** Automatically finds saves from Windows Store, Xbox App, and Steam installations using the correct Xbox WGS Binary parsing. It ignores stale cloud sync files.
*   **⚔️ Real Game Data:** Built-in database of **296 items, 32 enchantments, and 196 effects** extracted directly from Minecraft Dungeons 2 files. No placeholder data!
*   **🎒 Inventory Management:** 
    *   Add, clone, or delete items.
    *   Change item Power Level and Rarity (Common, Rare, Unique, Special).
    *   Modify enchantments on all 3 slots with full tier control (I, II, III).
*   **📈 Character Stats:** Instantly edit your Level, Power, XP, Emeralds, Enchantment Points, SpringStones, and Merchant upgrades.
*   **🛡️ Automatic Backups:** Every time you save, a backup is created. A built-in backup manager allows you to restore previous states with one click.
*   **🎨 Game-Themed UI:** Features a dark mode UI with authentic rarity colors, Minecraft typography (VT323), and real item icons loaded from the community CDN.
*   **↩️ Undo/Redo System:** Made a mistake? Press `Ctrl+Z` to undo up to 50 actions.

---

## 🚀 How to Use

### 1. Installation
1. Go to the [Releases](https://github.com/IshiakiZ/mcd2-save-editor/releases) page.
2. Download the latest `MCD2-Save-Editor-Setup.exe`.
3. Run the installer.

### 2. Editing Your Save
1. Ensure **Minecraft Dungeons 2 is completely closed**.
2. Open the MCD2 Save Editor. It will automatically load your character(s) on the left sidebar.
3. Select your character to view their stats and inventory.
4. Make your desired changes (edit items, add enchantments, increase emeralds).
5. Click **"Save Changes"** in the bottom left (or press `Ctrl+S`).
6. Launch the game and enjoy your new gear!

---

## 🛠️ For Developers / Building from Source

This project is built using modern web technologies packaged into a desktop application:
*   **Electron** (Backend & OS Integration)
*   **React + TypeScript** (Frontend UI)
*   **Vite** (Build Tooling)

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18 or newer recommended)
*   Git

### Build Instructions
```bash
# Clone the repository
git clone https://github.com/IshiakiZ/mcd2-save-editor.git
cd mcd2-save-editor

# Install dependencies
npm install

# Run in development mode (hot-reload enabled)
npm run dev

# Build the production executable
npm run build
npm run package
```

The compiled `.exe` will be available in the `release/` folder.

---

## ⚠️ Disclaimer & Risk Warning

*   **Always backup your saves manually** if you are doing extensive editing (though the app makes automatic backups, it's good practice).
*   **Online Play:** Modifying your save file and playing in public multiplayer lobbies may violate the game's Terms of Service. Use this tool responsibly, preferably in offline or private sessions with friends who consent to modded gameplay.
*   This tool is a community-driven project and is **NOT** affiliated with, endorsed by, or associated with Mojang Studios, Double Eleven, or Microsoft.

## 🙏 Acknowledgements
*   The game data structures and AES key logic are heavily inspired by the reverse-engineering efforts of the MCD/MCD2 modding community, specifically referencing research by `Tonystukl` and the `Dokucraft` community.
*   Icons provided by the `dungeons.tools` CDN.
