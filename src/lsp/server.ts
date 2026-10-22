/**
 * HelaScript Language Server Protocol (LSP) Server
 * Implements JSON-RPC 2.0 communication over stdio for Anti Gravity IDE and VS Code.
 */

import { HelaLspService } from './lspService.js';

export class HelaLspServer {
  private service: HelaLspService;
  private documents: Map<string, string> = new Map();
  private buffer: Buffer = Buffer.alloc(0);
  private writeOutput: (data: string) => void;

  constructor(service: HelaLspService = new HelaLspService(), writeOutput: (data: string) => void = (d) => process.stdout.write(d)) {
    this.service = service;
    this.writeOutput = writeOutput;
  }

  /**
   * Feed raw input data chunk into the server buffer and process messages
   */
  public handleData(chunk: string | Buffer): void {
    const chunkBuf = typeof chunk === 'string' ? Buffer.from(chunk, 'utf8') : chunk;
    this.buffer = Buffer.concat([this.buffer, chunkBuf]);

    const headerDelim = Buffer.from('\r\n\r\n', 'utf8');

    while (true) {
      const headerEnd = this.buffer.indexOf(headerDelim);
      if (headerEnd === -1) {
        break;
      }

      const headerText = this.buffer.subarray(0, headerEnd).toString('utf8');
      const contentLengthMatch = headerText.match(/Content-Length:\s*(\d+)/i);
      if (!contentLengthMatch) {
        // Malformed header, skip
        this.buffer = this.buffer.subarray(headerEnd + 4);
        continue;
      }

      const contentLength = parseInt(contentLengthMatch[1], 10);
      const bodyStart = headerEnd + 4;
      const bodyEnd = bodyStart + contentLength;

      if (this.buffer.length < bodyEnd) {
        // Waiting for more data
        break;
      }

      const bodyBuf = this.buffer.subarray(bodyStart, bodyEnd);
      this.buffer = this.buffer.subarray(bodyEnd);

      try {
        const message = JSON.parse(bodyBuf.toString('utf8'));
        this.processMessage(message);
      } catch (err) {
        console.error('LSP Error parsing JSON-RPC message:', err);
      }
    }
  }

  /**
   * Process a parsed JSON-RPC message
   */
  public processMessage(msg: any): void {
    const { id, method, params } = msg;

    if (!method && id !== undefined) {
      // Response, ignore
      return;
    }

    switch (method) {
      case 'initialize': {
        this.sendResponse(id, {
          capabilities: {
            textDocumentSync: 1, // Full document sync
            completionProvider: {
              triggerCharacters: ['.', ' ', '('],
              resolveProvider: false,
            },
            hoverProvider: true,
          },
          serverInfo: {
            name: 'helascript-lsp',
            version: '1.0.0',
          },
        });
        break;
      }

      case 'initialized': {
        // Notification, no response
        break;
      }

      case 'textDocument/didOpen': {
        const { textDocument } = params;
        this.documents.set(textDocument.uri, textDocument.text);
        this.publishDiagnostics(textDocument.uri, textDocument.text);
        break;
      }

      case 'textDocument/didChange': {
        const { textDocument, contentChanges } = params;
        if (contentChanges && contentChanges.length > 0) {
          const newText = contentChanges[contentChanges.length - 1].text;
          this.documents.set(textDocument.uri, newText);
          this.publishDiagnostics(textDocument.uri, newText);
        }
        break;
      }

      case 'textDocument/didClose': {
        const { textDocument } = params;
        this.documents.delete(textDocument.uri);
        this.sendNotification('textDocument/publishDiagnostics', {
          uri: textDocument.uri,
          diagnostics: [],
        });
        break;
      }

      case 'textDocument/completion': {
        const { textDocument, position } = params;
        const text = this.documents.get(textDocument.uri) || '';
        const items = this.service.getCompletions(text, position);
        this.sendResponse(id, {
          isIncomplete: false,
          items,
        });
        break;
      }

      case 'textDocument/hover': {
        const { textDocument, position } = params;
        const text = this.documents.get(textDocument.uri) || '';
        const hover = this.service.getHover(text, position);
        this.sendResponse(id, hover);
        break;
      }

      case 'shutdown': {
        this.sendResponse(id, null);
        break;
      }

      case 'exit': {
        if (typeof process !== 'undefined' && process.exit) {
          process.exit(0);
        }
        break;
      }

      default: {
        if (id !== undefined) {
          // Method not found
          this.sendError(id, -32601, `Method '${method}' not found`);
        }
        break;
      }
    }
  }

  private publishDiagnostics(uri: string, text: string): void {
    const diagnostics = this.service.getDiagnostics(text, uri);
    this.sendNotification('textDocument/publishDiagnostics', {
      uri,
      diagnostics,
    });
  }

  private sendResponse(id: number | string, result: any): void {
    const message = JSON.stringify({
      jsonrpc: '2.0',
      id,
      result,
    });
    this.sendRaw(message);
  }

  private sendError(id: number | string, code: number, message: string): void {
    const payload = JSON.stringify({
      jsonrpc: '2.0',
      id,
      error: { code, message },
    });
    this.sendRaw(payload);
  }

  private sendNotification(method: string, params: any): void {
    const payload = JSON.stringify({
      jsonrpc: '2.0',
      method,
      params,
    });
    this.sendRaw(payload);
  }

  private sendRaw(payload: string): void {
    const contentLength = Buffer.byteLength(payload, 'utf8');
    const header = `Content-Length: ${contentLength}\r\n\r\n`;
    this.writeOutput(header + payload);
  }
}

/**
 * Start the LSP server on standard I/O
 */
export function startLspServer(): HelaLspServer {
  const server = new HelaLspServer();

  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => {
    server.handleData(chunk);
  });

  process.stdin.resume();
  return server;
}
