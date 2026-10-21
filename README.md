<p align="center">
  <img src="./assets/logo/hela-logo-full.png" alt="HelaScript Logo" width="240"/>
</p>

<h1 align="center">HelaScript (හෙළස්ක්‍රිප්ට්)</h1>

<p align="center">
  <b>ස්වභාවික සිංහල ක්‍රමලේඛන භාෂාව (A Modern, Spoken-Sinhala Programming Language Engine)</b>
</p>

<p align="center">
  <a href="#-key-features"><img src="https://img.shields.io/badge/Language-Sinhala-blue.svg" alt="Sinhala Language"/></a>
  <a href="#-running-tests"><img src="https://img.shields.io/badge/Tests-27%20Passing-brightgreen.svg" alt="Tests"/></a>
  <a href="https://github.com/Pathum-Official/helascript/releases"><img src="https://img.shields.io/badge/Release-v1.0.0-orange.svg" alt="Release"/></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License"/></a>
</p>

HelaScript is a full-fledged programming language engine built in TypeScript and running on Node.js. It features a custom **Unicode-aware Lexer**, **Recursive Descent AST Parser**, **AST Evaluator / Runtime**, **Node.js/NPM Interoperability**, and **natural spoken Sinhala error diagnostics**.

---

## 📑 සාරාංශය (Table of Contents)
- [✨ Key Features](#-key-features)
- [🚀 Getting Started](#-getting-started)
- [📖 Syntax Cheatsheet (ස්වභාවික සිංහල වාක්‍ය ඛණ්ඩ)](#-syntax-cheatsheet)
  - [Variables & Data Types (විචල්‍ය සහ දත්ත වර්ග)](#1-variables--data-types)
  - [Control Flow & Loops (කොන්දේසි සහ ලූප)](#2-control-flow--loops)
  - [Functions & Async Flow (ක්‍රියා සහ අසමමුහුර්ත ප්‍රවාහය)](#3-functions--async-flow)
  - [Imports & Node.js Interop (මොඩියුල ගෙන්වීම)](#4-imports--nodejs-interop)
  - [Standard Library & Built-ins (සම්මත පුස්තකාලය)](#5-standard-library)
- [💻 CLI & Interactive REPL](#-cli--interactive-repl)
- [🚨 Error Diagnostics (ස්වභාවික සිංහල දෝෂ පණිවිඩ)](#-error-diagnostics)
- [🏗 Architecture](#-architecture)
- [🧪 Running Tests](#-running-tests)

---

## ✨ Key Features

1. **Natural Spoken Sinhala Semantics**: Daily spoken Sinhala terms (`දාන්න`, `වෙනස්නොවන`, `ඉදින්`, `නැත්තම්`, `කියනකල්`, `හැම`, `වැඩේ`, `යවන්න`, `ඉන්න`, `ගෙන්නන්න`) instead of formal/archaic grammar.
2. **Unicode-Aware Lexer**: Seamlessly tokenizes Sinhala UTF-8 script including complex vowel ligatures and Zero-Width Joiners (ZWJ `\u200D` e.g., `ක්‍රියාව`, `ප්‍රතිඵලය`).
3. **AST Parser & Scoped Evaluator**: Full Pratt/recursive descent parsing generating AST nodes with lexical environment chaining, closures, and call stacks.
4. **Asynchronous Flow**: Native `ඉන්න` (await) and `නොපෙනෙන` (async) support.
5. **Node.js & NPM Interoperability**: Import any standard Node module (`fs`, `path`, `os`, `http`) or NPM package natively.
6. **Friendly Sinhala Diagnostics**: Visual code frames with line numbers, column pointers (`^`), and spoken Sinhala error descriptions.

---

## 🚀 Getting Started

### Installation & Build

```bash
# Clone the repository
git clone https://github.com/your-username/HelaScript.git
cd HelaScript

# Install dependencies
npm install

# Build the TypeScript compiler
npm run build
```

### Running HelaScript Files

```bash
# Run a .hela file
node bin/hela.js examples/01_hello.hela

# Or using the run subcommand
node bin/hela.js run examples/04_functions.hela
```

### Starting the Interactive REPL

```bash
node bin/hela.js repl
```

---

## 📖 Syntax Cheatsheet

### 1. Variables & Data Types

* `දාන්න` : Mutable variable (`let`)
* `වෙනස්නොවන` : Immutable constant (`const`)
* `ඇත්ත` : `true`
* `බොරු` : `false`
* `හිස්` : `null` / `undefined`

```hela
// විචල්‍ය සාදමු
දාන්න නම = "පැතුම්";
වෙනස්නොවන උපන්_වර්ෂය = 2003;
දාන්න වයස = 21;

// ලැයිස්තු (Arrays)
දාන්න ගණන්_ලැයිස්තුව = [10, 20, 30, 40, 50];
දාන්න පළමු_අගය = ගණන්_ලැයිස්තුව[0];

// වස්තු (Objects)
දාන්න විස්තර = {
    නම: "පැතුම් සම්පත්",
    නගරය: "කොළඹ",
    ක්රියාකාරීද: ඇත්ත
};

ලියන්න("නගරය:", විස්තර.නගරය);
```

---

### 2. Control Flow & Loops

* `ඉදින් (...) { ... }` : if
* `නැත්තම් { ... }` : else
* `නැත්තම් ඉදින් (...) { ... }` : else if
* `කියනකල් (...) { ... }` : while loop
* `හැම (දාන්න x ගෙන් ලැයිස්තුව) { ... }` : for-each / for-in loop
* `නවත්වන්න` / `බිඳින්න` : break
* `ඊළඟ` / `ඉදිරියට` : continue

```hela
දාන්න ලකුණු = 75;

ඉදින් (ලකුණු >= 75) {
    ලියන්න("විශිෂ්ට සාමාර්ථයක්! (A)");
} නැත්තම් ඉදින් (ලකුණු >= 50) {
    ලියන්න("සාමාන්‍ය සාමාර්ථයක්! (C)");
} නැත්තම් {
    ලියන්න("නැවත උත්සාහ කරන්න.");
}

// While ලූපය (කියනකල්)
දාන්න i = 0;
කියනකල් (i < 3) {
    ලියන්න("අංකය:", i);
    i = i + 1;
}

// ලැයිස්තු ලූපය (හැම ... ගෙන්)
දාන්න පළතුරු = ["අඹ", "කෙසෙල්", "දොඩම්"];
හැම (දාන්න ගෙඩිය ගෙන් පළතුරු) {
    ලියන්න("රසවත් පළතුරක්:", ගෙඩිය);
}
```

---

### 3. Functions & Async Flow

* `වැඩේ` : Function declaration
* `යවන්න` : Return statement
* `නොපෙනෙන` : Async function modifier
* `ඉන්න` : Await expression

```hela
// සාමාන්‍ය ශ්‍රිතයක් (Function)
වැඩේ එකතු_කරන්න(a, b) {
    යවන්න a + b;
}

දාන්න එකතුව = එකතු_කරන්න(15, 25);
ලියන්න("එකතුව:", එකතුව); // 40

// අසමමුහුර්ත ශ්‍රිත (Async/Await)
වැඩේ නොපෙනෙන දත්ත_ගන්න() {
    ලියන්න("දත්ත ලබා ගනිමින් පවතී...");
    ඉන්න නිදන්න(100); // මිලි තත්පර 100ක් නවතී
    යවන්න "සාර්ථකව දත්ත ලැබුණා!";
}

දාන්න ප්‍රතිඵලය = ඉන්න දත්ත_ගන්න();
ලියන්න(ප්‍රතිඵලය);
```

---

### 4. Imports & Node.js Interop

Use `ගෙන්නන්න` to import any standard Node.js built-in module, NPM package, or local `.hela` module:

```hela
// Node.js මොඩියුල ගෙන්වීම
ගෙන්නන්න fs "fs" ගෙන්;
ගෙන්නන්න path "path" ගෙන්;
ගෙන්නන්න os "os" ගෙන්;

ලියන්න("OS වේදිකාව:", os.platform());
ලියන්න("ගොනුව පවතීද:", fs.existsSync("package.json"));

// Named imports
ගෙන්නන්න { readFile, existsSync } "fs" ගෙන්;
```

---

### 5. Standard Library

| ශ්‍රිතය / විචල්‍යය | විස්තරය | උදාහරණය |
| :--- | :--- | :--- |
| `ලියන්න(...)` | තිරයේ මුද්‍රණය (console.log) | `ලියන්න("ආයුබෝවන්!");` |
| `අරගන්න(...)` | පරිශීලකයාගෙන් ආදාන ගැනීම (interactive prompt) | `දාන්න නම = ඉන්න අරගන්න("නම මොකක්ද? ");` |
| `ලබාගන්න(...)` | HTTP Fetch API (JSON / Text) | `දාන්න res = ඉන්න ලබාගන්න("https://...");` |
| `දිග(item)` | ලැයිස්තුවේ හෝ අකුරු පෙළේ දිග | `දිග([1, 2, 3])` -> `3` |
| `වර්ගය(item)` | දත්ත වර්ගය හඳුනා ගැනීම | `වර්ගය("කමල්")` -> `"අකුරු"` |
| `සංඛ්‍යාව(item)` | සංඛ්‍යාවකට පරිවර්තනය කිරීම | `සංඛ්‍යාව("123")` -> `123` |
| `අකුරු(item)` | String බවට පත් කිරීම | `අකුරු(100)` -> `"100"` |
| `නිදන්න(ms)` | ප්‍රමාදයක් සිදු කිරීම (sleep in ms) | `ඉන්න නිදන්න(1000);` |
| `කාලය()` | වත්මන් කාල මුද්‍රාව (Date.now) | `දාන්න t = කාලය();` |
| `ගණිතය` | Math functions (round, floor, random, etc.) | `ගණිතය.වටයන්න(3.7)` -> `4` |

---

## 💻 CLI & Interactive REPL

The HelaScript CLI (`bin/hela.js`) includes an interactive REPL shell:

```bash
$ node bin/hela.js repl

╔══════════════════════════════════════════════════════════════╗
║  🇱🇰 HelaScript (හෙළස්ක්‍රිප්ට්) v1.0.0                          ║
║  ස්වභාවික සිංහල ක්‍රමලේඛන භාෂාව (Sinhala Programming Engine)   ║
║  පිටවීමට '.exit' හෝ Ctrl+C යොදන්න. (.help සහාය සඳහා)         ║
╚══════════════════════════════════════════════════════════════╝

hela> දාන්න x = 50;
hela> දාන්න y = 25;
hela> x + y
=> 75
hela> වැඩේ දෙගුණ_කරන්න(n) { යවන්න n * 2; }
hela> දෙගුණ_කරන්න(x)
=> 100
hela> .exit
ස්තූතියි! HelaScript වෙතින් සමුගන්නා ලදී. 🙏
```

---

## 🚨 Error Diagnostics

HelaScript provides clear, human-friendly error messages in spoken Sinhala with source visualizers:

```
❌ [HelaScript දෝෂයකි] - පේළිය: 3, තීරුව: 15 (main.hela)
───────────────────────────────────────────────────────
     1 | දාන්න a = 10;
     2 | වෙනස්නොවන pi = 3.14;
 >   3 | pi = 3.14159;
       |               ^
     4 | ලියන්න(pi);
───────────────────────────────────────────────────────
වැරැද්ද: 'pi' යනු වෙනස්නොවන (වෙනස්නොවන / const) අගයකි. එයට අලුතින් අගයක් පැවරිය නොහැක!
💡 උපදෙස: 'වෙනස්නොවන' ලෙස නම් කළ විචල්‍යයන්ගේ අගය වෙනස් කළ නොහැක. අගය වෙනස් කිරීමට අවශ්‍ය නම් 'දාන්න' යොදන්න.
```

---

## 🏗 Architecture

```
c:/Project/HelaScript/
├── bin/
│   └── hela.js                # CLI runner & interactive REPL executable
├── src/
│   ├── diagnostics/
│   │   └── error.ts           # HelaError & spoken Sinhala error formatters
│   ├── lexer/
│   │   ├── token.ts           # TokenType, Token interface & keywords map
│   │   └── lexer.ts           # Unicode-aware Lexer with Sinhala ZWJ support
│   ├── parser/
│   │   ├── ast.ts             # Abstract Syntax Tree (AST) node definitions
│   │   └── parser.ts          # Recursive Descent Parser with Pratt expressions
│   ├── evaluator/
│   │   ├── environment.ts     # Lexical scoping, bindings, const enforcement
│   │   ├── values.ts          # Runtime functions, callables, and control signals
│   │   └── evaluator.ts       # AST Evaluator with async execution & JS this-binding
│   ├── interop/
│   │   └── moduleLoader.ts    # Node.js built-ins, NPM, and .hela module loader
│   ├── stdlib/
│   │   └── stdlib.ts          # Built-in Sinhala functions (ලියන්න, අරගන්න, etc.)
│   └── index.ts               # Programmatic TypeScript/JavaScript API
├── examples/                  # Comprehensive runnable .hela scripts
└── test/                      # Unit & integration test suites
```

---

## 🧪 Running Tests

```bash
# Run the complete test suite
npm test
```

All 27 unit & integration tests covering lexing, parsing, scope evaluation, async/await, error diagnostics, and Node.js interop execute with 100% pass rate.
