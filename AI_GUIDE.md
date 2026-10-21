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

### D. Node.js Module Interoperability
```hela
ගෙන්නන්න fs "fs" ගෙන්;
ගෙන්නන්න path "path" ගෙන්;

ලියන්න("package.json පවතීද:", fs.existsSync("package.json"));
```

---

## 🛠️ 3. CLI & Usage Guide

To run HelaScript files or use the interactive shell via terminal:

```bash
# Display help and version
node bin/hela.js --help
node bin/hela.js --version

# Run a .hela script file
node bin/hela.js run examples/01_hello.hela

# Launch interactive REPL shell
node bin/hela.js repl
```

---

## 🤖 4. Guide for AI Models (Prompt Context)

When an AI model generates, reviews, or debugs HelaScript code, follow these principles:

1. **Keywords**: Always use spoken Sinhala terms rather than archaic/classical written Sinhala:
   - Variables: `දාන්න` (let), `වෙනස්නොවන` (const)
   - Boolean / Null: `ඇත්ත` (true), `බොරු` (false), `හිස්` (null/undefined)
   - Conditionals: `ඉදින්` (if), `නැත්තම්` (else / else if)
   - Loops: `කියනකල්` (while), `හැම` (for/each)
   - Functions: `වැඩේ` (function), `යවන්න` (return)
   - Async: `නොපෙනෙන` (async), `ඉන්න` (await)
   - Imports: `ගෙන්නන්න <නම> "<මොඩියුලය>" ගෙන්;`
   - Printing: `ලියන්න(...)`
2. **Identifiers**: Sinhala variable names (e.g. `දාන්න අගය = 10;`) and alphanumeric ASCII names (e.g. `දාන්න count = 10;`) are both fully supported.
3. **Execution Runtime**: HelaScript evaluates AST nodes on Node.js, so native JavaScript data types, Node APIs, and npm packages integrate natively.
4. **Diagnostics**: Runtime errors are emitted as [HelaError](file:///c:/Project/HelaScript/src/diagnostics/error.ts) instances formatted in spoken Sinhala with source line highlights.
