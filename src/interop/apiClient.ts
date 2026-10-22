/**
 * HelaScript REST API Client & HTTP Integration Module
 * Supports GET, POST, PUT, DELETE, JSON parsing, error handling, and web server interop.
 */

import { HelaError, SourceLocation } from '../diagnostics/error.js';

export function createHttpClientModule(
  evaluator?: any,
  httpModule?: any,
  loc?: SourceLocation
): Record<string, any> {
  const safeLoc: SourceLocation = loc || { line: 1, column: 1 };

  async function parseResponse(res: Response, options: any = {}) {
    const contentType = res.headers.get('content-type') || '';
    let data: any;

    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      try {
        // Try parsing JSON even if header omitted or text/plain
        const trimmed = text.trim();
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
          data = JSON.parse(trimmed);
        } else {
          data = text;
        }
      } catch {
        data = text;
      }
    }

    if (!res.ok && options.throwOnError !== false) {
      let detail = res.statusText;
      if (typeof data === 'object' && data !== null) {
        detail += ` (${JSON.stringify(data)})`;
      } else if (typeof data === 'string' && data.length > 0) {
        detail += ` (${data.slice(0, 150)})`;
      }
      throw new HelaError(`API ඉල්ලීම අසාර්ථක විය [HTTP ${res.status}]: ${detail} (${res.url})`, safeLoc);
    }

    if (options.fullResponse) {
      const headersObj: Record<string, string> = {};
      res.headers.forEach((val, key) => {
        headersObj[key] = val;
      });
      return {
        status: res.status,
        ok: res.ok,
        statusText: res.statusText,
        headers: headersObj,
        data,
      };
    }

    return data;
  }

  // Client methods
  const client: Record<string, any> = {
    // GET: ලබාගන්න / get
    ලබාගන්න: async (url: string, options: any = {}) => {
      try {
        const res = await fetch(url, { method: 'GET', ...options });
        return await parseResponse(res, options);
      } catch (err: any) {
        if (err instanceof HelaError) throw err;
        throw new HelaError(`API ලබාගැනීමේදී දෝෂයක් (${url}): ${err.message}`, safeLoc);
      }
    },
    get: async (url: string, options: any = {}) => {
      try {
        const res = await fetch(url, { method: 'GET', ...options });
        return await parseResponse(res, options);
      } catch (err: any) {
        if (err instanceof HelaError) throw err;
        throw new HelaError(`API GET Error (${url}): ${err.message}`, safeLoc);
      }
    },

    // POST: යවන්න / පළකරන්න / post
    යවන්න: async (url: string, body?: any, options: any = {}) => {
      try {
        const headers: Record<string, string> = { ...(options.headers || {}) };
        let payload = body;
        if (body !== undefined && typeof body === 'object' && !(body instanceof FormData)) {
          if (!headers['Content-Type'] && !headers['content-type']) {
            headers['Content-Type'] = 'application/json; charset=utf-8';
          }
          payload = JSON.stringify(body);
        }
        const res = await fetch(url, {
          method: 'POST',
          headers,
          body: payload,
          ...options,
        });
        return await parseResponse(res, options);
      } catch (err: any) {
        if (err instanceof HelaError) throw err;
        throw new HelaError(`API යැවීමේදී දෝෂයක් (${url}): ${err.message}`, safeLoc);
      }
    },
    පළකරන්න: async (url: string, body?: any, options: any = {}) => {
      return client.යවන්න(url, body, options);
    },
    post: async (url: string, body?: any, options: any = {}) => {
      return client.යවන්න(url, body, options);
    },

    // PUT: යාවත්කාලීන / put
    යාවත්කාලීන: async (url: string, body?: any, options: any = {}) => {
      try {
        const headers: Record<string, string> = { ...(options.headers || {}) };
        let payload = body;
        if (body !== undefined && typeof body === 'object' && !(body instanceof FormData)) {
          if (!headers['Content-Type'] && !headers['content-type']) {
            headers['Content-Type'] = 'application/json; charset=utf-8';
          }
          payload = JSON.stringify(body);
        }
        const res = await fetch(url, {
          method: 'PUT',
          headers,
          body: payload,
          ...options,
        });
        return await parseResponse(res, options);
      } catch (err: any) {
        if (err instanceof HelaError) throw err;
        throw new HelaError(`API යාවත්කාලීන කිරීමේදී දෝෂයක් (${url}): ${err.message}`, safeLoc);
      }
    },
    put: async (url: string, body?: any, options: any = {}) => {
      return client.යාවත්කාලීන(url, body, options);
    },

    // DELETE: මකන්න / delete
    මකන්න: async (url: string, options: any = {}) => {
      try {
        const res = await fetch(url, { method: 'DELETE', ...options });
        return await parseResponse(res, options);
      } catch (err: any) {
        if (err instanceof HelaError) throw err;
        throw new HelaError(`API මකාදැමීමේදී දෝෂයක් (${url}): ${err.message}`, safeLoc);
      }
    },
    delete: async (url: string, options: any = {}) => {
      return client.මකන්න(url, options);
    },

    // General Request
    ඉල්ලීම: async (url: string, options: any = {}) => {
      try {
        const res = await fetch(url, options);
        return await parseResponse(res, options);
      } catch (err: any) {
        if (err instanceof HelaError) throw err;
        throw new HelaError(`API ඉල්ලීමේ දෝෂයක් (${url}): ${err.message}`, safeLoc);
      }
    },
    request: async (url: string, options: any = {}) => {
      try {
        const res = await fetch(url, options);
        return await parseResponse(res, options);
      } catch (err: any) {
        if (err instanceof HelaError) throw err;
        throw new HelaError(`API Request Error (${url}): ${err.message}`, safeLoc);
      }
    },

    fetch: globalThis.fetch,
  };

  if (!httpModule) {
    return client;
  }

  // Combined HTTP Server & Client module
  return {
    ...httpModule,
    ...client,
    start: (port: number = 3000, handler: any) => {
      const server = httpModule.createServer(async (req: any, res: any) => {
        try {
          if (handler && typeof handler.call === 'function') {
            const result = await handler.call(evaluator, [req, res]);
            if (!res.writableEnded && result !== undefined && result !== null) {
              res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
              res.end(String(result));
            }
          } else if (typeof handler === 'function') {
            const result = await handler(req, res);
            if (!res.writableEnded && result !== undefined && result !== null) {
              res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
              res.end(String(result));
            }
          }
        } catch (err: any) {
          if (!res.writableEnded) {
            res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end(`HelaScript Server දෝෂයකි: ${err.message}`);
          }
        }
      });
      server.listen(port);
      return server;
    },
    createServer: (fn: any) => {
      const s = httpModule.createServer(async (req: any, res: any) => {
        if (fn && typeof fn.call === 'function') {
          await fn.call(evaluator, [req, res]);
        } else if (typeof fn === 'function') {
          await fn(req, res);
        }
      });
      const originalListen = s.listen.bind(s);
      s.listen = (port: any, ...args: any[]) => {
        const wrappedArgs = args.map((arg: any) => {
          if (arg && typeof arg.call === 'function') {
            return async (...cbArgs: any[]) => {
              return await arg.call(evaluator, cbArgs);
            };
          }
          return arg;
        });
        return originalListen(port, ...wrappedArgs);
      };
      return s;
    },
  };
}
