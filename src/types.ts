import { ClientRequestArgs } from 'http';

export interface IUwsgiClientOptions extends ClientRequestArgs {
	bufferSize?: number;
	modifier1?: number;
	modifier2?: number;

	body?: unknown;
}

export interface IUwsgiClientResponse<R = unknown> {
	data: R;
	raw: string;
	headers: Record<string, string>;
	status: number;
	statusText: string;
}
