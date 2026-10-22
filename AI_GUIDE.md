<p align="center">
  <img src="./assets/logo/hela-logo-full.png" alt="HelaScript Logo" width="220"/>
</p>

# 📜 HelaScript (.hela) Documentation & AI Guide

HelaScript is a modern, AI-native, spoken-Sinhala-based programming language/DSL designed to bridge natural human thought with high-performance software execution.

---

## 🚀 1. What is HelaScript?

HelaScript is not just a string-replacement script; it is a fully-featured programming language engine built with:

* **Custom Unicode Lexer**: Fully supports Sinhala UTF-8 multi-byte character sets and complex ligatures (e.g., combining marks, virama `්`, and Zero-Width Joiner `\u200D` for characters like `ක්‍ර`, `ර්‍ය`, `ප්‍රතිඵලය`).
* **Recursive Descent Parser**: Generates a robust Abstract Syntax Tree (AST) with operator precedence climbing for arithmetic, logic, and comparisons.
* **Asynchronous AST Evaluator**: Handles lexical scoping, variable immutability (`වෙනස්නොවන`), functions (`වැඩේ`), closures, and Promises/Async operations (`නොපෙනෙන`, `ඉන්න`).
* **Node.js & NPM Interoperability**: Allows seamless importing and usage of native Node modules and NPM packages via `ගෙන්නන්න ... ගෙන්;`.
* **Spoken Sinhala Error Diagnostics**: Friendly, natural-language error messages with line/column context and helpful suggestions (`💡 උපදෙස:`).

---

## 💻 2. Core Syntax Reference

### A. Variables & Data Types
```hela
// Mutable variable
දාන්න නම = "පැතුම්";

// Immutable (constant) variable
වෙනස්නොවන වයස = 21;

// Arrays and Objects
දාන්න ගණන්_ලැයිස්තුව = [10, 20, 30];
දාන්න විස්තර = { නගරය: "කොළඹ", සක්‍රීයද: ඇත්ත };
```

### B. Control Flow & Loops
```hela
// If-Else
ඉදින් (වයස >= 18) {
    ලියන්න("වයස හරි, වැඩේ කරන්න පුළුවන්!");
} නැත්තම් {
    ලියන්න("තවම වයස මදි!");
}

// While Loop
දාන්න i = 0;
කියනකල් (i < 3) {
    ලියන්න("අංකය:", i);
    i = i + 1;
}

// For-Each Loop
හැම (දාන්න අගය ගෙන් ගණන්_ලැයිස්තුව) {
    ලියන්න("අගය:", අගය);
}
```

### C. Functions & Asynchronous Flow
```hela
// Synchronous Function
වැඩේ එකතු_කරන්න(a, b) {
    යවන්න a + b;
}

// Asynchronous Function & Await
වැඩේ නොපෙනෙන දත්ත_ගන්න() {
    දාන්න උත්තරේ = ඉන්න ලබාගන්න("https://jsonplaceholder.typicode.com/todos/1");
    යවන්න උත්තරේ;
}
```

### D. Error Handling & Concurrency
```hela
// 1. Spoken Sinhala Try-Catch Error Handling
උත්සාහ {
    දාන්න අන්තර්ගතය = ගොනු.කියවන්න("not_found.txt");
} අල්ලන්න (දෝෂය) {
    ලියන්න("දෝෂයක් අල්ලා ගන්නා ලදී:", දෝෂය);
}

// 2. Custom Error Throwing
විසිකරන්න "වලංගු නොවන පරිශීලක හැඳුනුම්පතකි!";

// 3. Parallel Async Execution (Promise.all)
දාන්න ප්‍රතිඵල = ඉන්න සමාන්තර([
    api.ලබාගන්න("https://jsonplaceholder.typicode.com/todos/1"),
    api.ලබාගන්න("https://jsonplaceholder.typicode.com/todos/2")
]);
ලියන්න("ප්‍රතිඵල 2 සාර්ථකව ලැබුණි:", ප්‍රතිඵල[0].id, ප්‍රතිඵල[1].id);
```

### E. REST API Client, File System & Interoperability
```hela
// 1. REST API Client
ගෙන්නන්න api "http" ගෙන්;
දාන්න ප්රතිඵලය = api.ලබාගන්න("https://jsonplaceholder.typicode.com/todos/1");
ලියන්න("API ප්රතිඵලය:", ප්රතිඵලය.title);

// 2. Native File System Module
ගෙන්නන්න ගොනු "fs" ගෙන්;
ගොනු.ලියන්න("data.txt", "ආයුබෝවන් HelaScript ගොනු පාලනය!");
දාන්න අන්තර්ගතය = ගොනු.කියවන්න("data.txt");
ලියන්න("ගොනුවේ අන්තර්ගතය:", අන්තර්ගතය);
ගොනු.මකන්න("data.txt");

// 3. Native SQLite Database
ගෙන්නන්න db "sqlite" ගෙන්;
දාන්න myDb = db.open(":memory:");
myDb.ක්‍රියාත්මක("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);");
myDb.ඇතුළත්("INSERT INTO users (name) VALUES (?);", ["පැතුම්"]);
දාන්න සාමාජිකයින් = myDb.සොයන්න("SELECT * FROM users;");
myDb.වසන්න();
```

---

## 🛠️ 3. Tooling Ecosystem (CLI, Package Manager, Web & LSP)

### A. Terminal CLI & Enhanced REPL
- Run files: `hela <file.hela>` or `hela run <file.hela>`
- Interactive REPL: `hela repl` (featuring persistent history in `~/.hela_history`, colorized values, and multiline support).
- LSP Daemon: `hela lsp` (JSON-RPC 2.0 language server for IDEs).

### B. HelaScript Package Manager (`hela-pkg`)
- `hela-pkg init [name]`: Initialize project manifest `hela.json`.
- `hela-pkg install <pkg>`: Install from local paths or GitHub repositories (`owner/repo`).
- `hela-pkg run <script>`: Execute custom scripts defined in `hela.json`.
- `hela-pkg list`: List installed packages in `hela_modules/`.

### C. Web Playground & Browser Runtime
- Bundled at `dist/helascript-web.js` with browser shims.
- Interactive Web Playground at `playground/index.html` with presets, live console capture, token explorer, and AST tree inspector.

---

## 🤖 4. Guide for AI Models (Prompt Context)

When an AI model generates, reviews, or debugs HelaScript code, follow these principles:

1. **Keywords**: Always use spoken Sinhala terms rather than archaic/classical written Sinhala:
   - Variables: `දාන්න` (let), `වෙනස්නොවන` (const)
   - Boolean / Null: `ඇත්ත` (true), `බොරු` (false), `හිස්` (null/undefined)
   - Conditionals: `ඉදින්` (if), `නැත්තම්` (else / else if)
   - Loops: `කියනකල්` (while), `හැම` (for/each)
   - Functions: `වැඩේ` (function), `යවන්න` (return)
   - Async: `නොපෙනෙන` (async), `ඉන්න` (await), `සමාන්තර` (Promise.all)
   - Error Handling: `උත්සාහ` (try), `අල්ලන්න` / `අල්ලාගන්න` (catch), `විසිකරන්න` (throw)
   - Imports: `ගෙන්නන්න <නම> "<මොඩියුලය>" ගෙන්;`
   - Printing: `ලියන්න(...)`
2. **Identifiers**: Sinhala variable names (e.g. `දාන්න අගය = 10;`) and alphanumeric ASCII names (e.g. `දාන්න count = 10;`) are both fully supported.
3. **Execution Runtime**: HelaScript evaluates AST nodes on Node.js and modern Web Browsers, so native JavaScript data types and APIs integrate seamlessly.
4. **Diagnostics**: Runtime errors are emitted as [HelaError](file:///c:/Project/HelaScript/src/diagnostics/error.ts) instances formatted in spoken Sinhala with source line highlights.
