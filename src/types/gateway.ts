export interface GatewayAuthentication {
	type: string;
	username?: string;
	password?: string;
	private_key?: string;
}

/** Only these fields are serialized into a gateway launch. */
export interface GatewayPayload {
	version: 1;
	protocol: "ssh" | "rdp" | "vnc";
	hostname: string;
	port: number;
	domain?: string;
	ignore_certificate?: boolean;
	resize_method?: string;
	server_layout?: string;
	authentication: GatewayAuthentication & { username: string };
}

export interface GatewayWindow {
	close(): void;
	location: Pick<Location, "replace">;
	opener: unknown;
}
