# HelaScript VS Code Extension (`helascript-vscode`)

Rich language support and syntax highlighting for **HelaScript (`.hela`)** — the spoken-Sinhala programming language.

---

## 🎨 Features

* **Custom `.hela` File Icon**: Dedicated brand icon displaying the official Hela calligraphic emblem beside all `.hela` files in the VS Code file explorer.
* **Spoken-Sinhala Syntax Highlighting**:
  - Declarations: `දාන්න`, `වෙනස්නොවන`
  - Functions & Flow: `වැඩේ`, `යවන්න`, `නොපෙනෙන`, `ඉන්න`
  - Control Logic: `ඉදින්`, `නැත්තම්`, `කියනකල්`, `හැම`, `නවත්වන්න`, `බිඳින්න`, `ඊළඟ`, `උත්සාහ`, `අල්ලන්න`
  - Modules: `ගෙන්නන්න`, `ගෙන්`
  - Booleans & Null: `ඇත්ත`, `බොරු`, `හිස්`
  - Standard Functions: `ලියන්න`, `අරගන්න`, `ලබාගන්න`, `දිග`, `වර්ගය`, `නිදන්න`, `කාලය`, `ගණිතය`
* **Auto-closing brackets and quotes**
* **Comment toggling (`Ctrl+/` or `Cmd+/`)**
* **Code folding support**

---

## 🛠️ Local Installation & Testing

You can easily test the extension locally in VS Code using either of these methods:

### Method 1: Extension Folder Link (Recommended for Development)
Copy or symlink the `vscode-extension` folder into your VS Code extensions directory:

* **Windows**:
  ```powershell
  # In PowerShell, copy the extension folder to your VS Code extensions directory:
  Copy-Item -Recurse -Path ".\vscode-extension" -Destination "$HOME\.vscode\extensions\helascript-vscode"
  ```
* **macOS / Linux**:
  ```bash
  cp -r ./vscode-extension ~/.vscode/extensions/helascript-vscode
  ```

Restart VS Code or reload the window (`Ctrl+Shift+P` -> `Developer: Reload Window`). Any `.hela` file will now be automatically recognized with full syntax highlighting!

---

### Method 2: Launch in VS Code Extension Development Host
1. Open the `vscode-extension` directory in VS Code.
2. Press `F5` to launch an Extension Development Host window.
3. Open any `.hela` file to test live syntax highlighting.

---

### Method 3: Packaging as `.vsix`
To package the extension into an installable `.vsix` file:
```bash
npx @vscode/vsce package
code --install-extension helascript-vscode-1.0.0.vsix
```
