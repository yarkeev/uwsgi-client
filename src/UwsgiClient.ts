import { ClientRequest, Agent, IncomingMessage } from 'http';
// eslint-disable-next-line import/no-unresolved
import { Readable } from 'node:stream';
import * as url from 'url';
import * as zlib from 'zlib';

import { IUwsgiClientOptions, IUwsgiClientResponse } from './types';

const HEADERS_WITHOUT_PREFIX: string[] = [
	'QUERY_STRING',
	'REQUEST_METHOD',
	'CONTENT_TYPE',
	'CONTENT_LENGTH',
	'REQUEST_URI',
	'PATH_INFO',
	'DOCUMENT_ROOT',
	'SERVER_PROTOCOL',
	'REQUEST_SCHEME',
	'HTTPS',
	'REMOTE_ADDR',
	'REMOTE_PORT',
	'SERVER_PORT',
	'SERVER_NAME',
];

const agent = (new Agent({ keepAlive: true })) as Agent & { protocol: string };

agent.protocol = 'uwsgi:';

export class UwsgiClient extends ClientRequest {

	protected bodySize = 0;
	protected bufferSize = 4096;
	protected modifier1 = 0;
	protected modifier2 = 0;
	protected options: IUwsgiClientOptions;
	protected vars: Record<string, string> = {};
	protected _header: Buffer;
	protected _last: boolean;
	protected _headerSent: boolean;

	public method: string;
	public path: string;

	constructor(options: IUwsgiClientOptions) {
		options = {
			protocol: 'uwsgi:',
			modifier1: 5,
			bufferSize: 16384,
			headersWithoutChanges: [],
			...options,
		};

		options.agent = agent;

		super(options);

		this.options = options;

		if (options.bufferSize) {
			this.bufferSize = options.bufferSize;
		}
		if (options.modifier1) {
			this.modifier1 = options.modifier1;
		}
		if (options.modifier2) {
			this.modifier2 = options.modifier2;
		}

		this.bodySize = 0;

		this.vars.SERVER_NAME = options.hostname || options.host || 'localhost';
		this.vars.SERVER_PORT = String(options.port);
	}

	write(chunk: unknown, encoding: BufferEncoding, callback?: (error: Error | null | undefined) => void): boolean;
	write(chunk: unknown, callback?: (error: Error | null | undefined) => void): boolean;
	write(...args: unknown[]): boolean {
		const [chunk, callback] = args;
		let body: Buffer;

		if (typeof chunk === 'string') {
			const dataSize = chunk.length;

			this.bodySize += dataSize;
			body = new Buffer(dataSize);
			body.write(chunk, 0, dataSize, 'utf8');
		} else {
			body = <Buffer> chunk;
		}

		return ClientRequest.prototype.write.call(this, body, callback) as boolean;
	}

	_send(...args: unknown[]) {
		const proto = ClientRequest.prototype as unknown as { _send(...sendArgs: unknown[]): unknown };

		if (!this._headerSent) {
			proto._send.call(this, new Buffer(0)) as unknown;
		}

		return proto._send.apply(this, args) as unknown;
	}

	protected _implicitHeader() {
		let offset = 4;

		const vars = { ...this.vars };

		const parsedPath = url.parse(this.path);

		vars.HTTP_HOST = String(this.options.headers.host || this.options.headers.Host);
		vars.REQUEST_METHOD = vars.REQUEST_METHOD || this.method;
		vars.REQUEST_URI = vars.REQUEST_URI || this.path;
		vars.PATH_INFO = vars.PATH_INFO || parsedPath.pathname.replace(/%20/g, ' ');
		vars.QUERY_STRING = vars.QUERY_STRING || parsedPath.query || '';
		vars.CONTENT_TYPE = vars.CONTENT_TYPE || '';
		vars.CONTENT_LENGTH = this.bodySize ? String(this.bodySize) : (vars.CONTENT_LENGTH || '');
		vars.REMOTE_ADDR = vars.REMOTE_ADDR || this.options.headers['x-real-ip'] as string || '';

		Object.keys(this.options.headers).forEach((key) => {
			let name = key.replace(/-/g, '_').toUpperCase();

			if (!HEADERS_WITHOUT_PREFIX.includes(name)) {
				name = 'HTTP_' + name;
			}

			vars[name] = vars[name] || this.options.headers[key] as string;
		});

		this.options.headersWithoutChanges.forEach((key) => {
			const value = this.options.headers[key.toLowerCase()];

			if (value) {
				vars[key] = value as string;
			}
		});

		const buffer = new Buffer(this.bufferSize);

		Object.keys(vars).forEach((key: string) => {
			const nameBytes = new Buffer(key);
			const valueBytes = new Buffer(vars[key]);

			buffer.writeUInt16LE(nameBytes.length, offset);
			offset += 2;
			nameBytes.copy(buffer, offset);
			offset += nameBytes.length;
			buffer.writeUInt16LE(valueBytes.length, offset);
			offset += 2;
			valueBytes.copy(buffer, offset);
			offset += valueBytes.length;
		});

		buffer.writeUInt8(this.modifier1, 0);
		buffer.writeUInt16LE(offset - 4, 1);
		buffer.writeUInt8(this.modifier2, 3);
		this._header = buffer.slice(0, offset);

		this._last = true;
		this._headerSent = false;
	}

	static async getResponseBody(response: IncomingMessage): Promise<string> {
		return new Promise<string>((resolve) => {
			let stream: Readable;
			let contentLength: number;

			switch (response.headers['content-encoding']) {
				case 'gzip':
					stream = response.pipe(zlib.createGunzip());
					break;
				case 'inflate':
					stream = response.pipe(zlib.createInflate());
					break;
				default:
					stream = response;
					if (response.headers['content-length'] !== undefined) {
						contentLength = Number(response.headers['content-length']);
					}
					break;
			}

			if (contentLength === undefined) {
				let body = '';

				stream.setEncoding('utf8');
				stream.on('data', (chunk: string) => body += chunk);

				stream.on('end', () => resolve(body.toString()));
			} else {
				const body = new Buffer(contentLength);
				let offset = 0;

				stream.on('data', (chunk: Buffer) => {
					chunk.copy(body, offset);
					offset += chunk.length;
				});

				stream.on('end', () => resolve(body.toString()));
			}
		});
	}

	static async request<R = unknown>(options: IUwsgiClientOptions): Promise<IUwsgiClientResponse<R>> {
		return new Promise((resolve, reject) => {
			const { method, body } = options;
			const hasBody = Boolean(body) && !['get', 'delete'].includes(String(method).toLocaleLowerCase());
			const hasContentTypeHeader = Object.keys(options.headers)
				.map((header) => header.toLowerCase())
				.includes('content-type');
			const request = new UwsgiClient({
				...options,
				...(
					hasContentTypeHeader || !hasBody
						? {}
						: {
							headers: {
								...options.headers,
								'Content-Type': 'application/x-www-form-urlencoded',
							},
						}
				),
			});

			if (options.timeout) {
				request.setTimeout(options.timeout);
			}

			request
				.once('response', async (response) => {
					const raw = await this.getResponseBody(response);
					let data = {} as R;

					try {
						data = JSON.parse(raw) as R;
					} catch (err) {}

					resolve({
						status: response.statusCode,
						statusText: response.statusMessage,
						raw,
						data,
						headers: response.headers as Record<string, string>,
					});
				})
				.once('timeout', () => {
					request.end();
					reject(new Error('UWSGI request timeout'));
				})
				.once('error', (err) => reject(err));

			if (!hasBody) {
				request.end();
			} else {
				const bodyParams = body as Record<string, string>;

				request.write(
					Object.keys(bodyParams)
						.map((key) => `${key}=${encodeURIComponent(bodyParams[key])}`)
						.join('&'),
					() => request.end(),
				);
			}
		});
	}

}
