import { ClientRequest, Agent, IncomingMessage } from 'http';
// eslint-disable-next-line import/no-unresolved
import { Readable } from 'node:stream';
import * as url from 'url';
import * as zlib from 'zlib';

import { IUwsgiClientOptions, IUwsgiClientResponse } from './types';

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
		const agent = (new Agent()) as Agent & { protocol: string };

		options = {
			protocol: 'uwsgi:',
			modifier1: 5,
			bufferSize: 16384,
			...options,
		};

		agent.protocol = 'uwsgi:';
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
			return proto._send.call(this, new Buffer(0)) as unknown;
		}

		return proto._send.apply(this, args) as unknown;
	}

	protected _implicitHeader() {
		let offset = 4;

		const vars: Record<string, string> = {
			...this.vars,
			...(this.options.headers as Record<string, string>),
		};

		const parsedPath = url.parse(this.path);

		vars.HTTP_HOST = String(this.options.headers.host || this.options.headers.Host);
		vars.REQUEST_METHOD = vars.REQUEST_METHOD || this.method;
		vars.REQUEST_URI = vars.REQUEST_URI || this.path;
		vars.PATH_INFO = vars.PATH_INFO || parsedPath.pathname.replace(/%20/g, ' ');
		vars.QUERY_STRING = vars.QUERY_STRING || parsedPath.query || '';
		vars.CONTENT_TYPE = vars.CONTENT_TYPE || '';
		vars.CONTENT_LENGTH = this.bodySize ? String(this.bodySize) : (vars.CONTENT_LENGTH || '');

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
			const request = new UwsgiClient(options);

			request.once('response', async (response) => {
				const raw = await this.getResponseBody(response);
				let data = {} as R;

				try {
					data = JSON.parse(raw) as R;
				} catch (err) {}

				if (response.statusCode >= 200 && response.statusCode < 300) {
					resolve({
						status: response.statusCode,
						statusText: response.statusMessage,
						raw,
						data,
						headers: response.headers as Record<string, string>,
					});
				} else {
					const err = new Error('UwsgiClientError') as Error & { response: IUwsgiClientResponse };

					err.response = {
						status: response.statusCode,
						statusText: response.statusMessage,
						raw,
						data,
						headers: response.headers as Record<string, string>,
					};

					reject(err);
				}
			});

			if (String(method).toLowerCase() === 'get' || !body) {
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
