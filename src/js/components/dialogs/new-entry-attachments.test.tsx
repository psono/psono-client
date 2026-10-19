import { createTheme, ThemeProvider } from "@mui/material/styles";
import React from "react";
import ReactDOM from "react-dom";
import { act, Simulate } from "react-dom/test-utils";
import {
	uploadAttachment,
	type PendingAttachment,
} from "../../services/attachment";
import secretService from "../../services/secret";
import fileRepositoryService from "../../services/file-repository";
import fileTransferService from "../../services/file-transfer";
import type { FileRepository, Shard } from "../../../types/files";
import DialogNewEntry from "./new-entry";

jest.mock("react-i18next", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("../../i18n", () => ({ t: (key: string) => key }));
jest.mock("../../services/store", () => ({
	getStore: () => ({
		getState: () => ({
			user: {},
			server: { disableCallbacks: true },
			settingsDatastore: {},
		}),
	}),
}));
jest.mock("../../services/host", () => ({
	isNewerOrEqualVersionThan: () => true,
}));
jest.mock("../../services/secret", () => ({
	createSecret: jest.fn(),
	writeSecret: jest.fn(),
}));
jest.mock("../../services/attachment", () => ({ uploadAttachment: jest.fn() }));
jest.mock("../../services/file-repository", () => ({
	...jest.requireActual("../../services/file-repository").default,
	readFileRepositories: jest.fn(),
}));
jest.mock("../../services/file-transfer", () => ({
	...jest.requireActual("../../services/file-transfer").default,
	readShards: jest.fn(),
}));
jest.mock("../../services/offline-cache", () => ({ isActive: () => false }));
jest.mock("../markdown-notes-field", () => () => null);
jest.mock("../totp-circle", () => () => null);
jest.mock("./decrypt-gpg-message", () => () => null);
jest.mock("./encrypt-gpg-message", () => () => null);
jest.mock("./generate-new-gpg-key", () => () => null);
jest.mock("./generate-new-ssh-key", () => () => null);
jest.mock("./import-gpg-key-as-text", () => () => null);
jest.mock(
	"./add-attachment",
	() => (props: { onSelect: (pending: PendingAttachment) => void }) => (
		<button
			type="button"
			onClick={() =>
				props.onSelect({
					file: new File(["content"], "example.txt"),
					filename: "example.txt",
					destination: {
						id: "shard",
						destination_type: "shard",
					} as PendingAttachment["destination"],
				})
			}
		>
			SELECT_ATTACHMENT
		</button>
	),
);

const theme = createTheme({
	palette: { checked: { main: "#008000" }, greyText: { main: "#808080" } },
});
const attachment = {
	file_id: "file-id",
	file_secret_key: "file-key",
	file_chunks: [{ position: 1, hash: "hash" }],
	file_size: 7,
	filename: "example.txt",
	file_shard_id: "shard",
	file_repository_id: null,
};

function click(label: string) {
	const element = Array.from(
		document.querySelectorAll("button, [role=menuitem]"),
	).find((candidate) => candidate.textContent === label);
	if (!element) throw new Error(`Missing ${label}`);
	(element as HTMLElement).click();
}

describe("attachments during entry creation", () => {
	let container: HTMLDivElement;
	const onCreate = jest.fn();
	const onClose = jest.fn();
	async function render(open = true) {
		await act(async () => {
			ReactDOM.render(
				<ThemeProvider theme={theme}>
					<DialogNewEntry
						open={open}
						onClose={onClose}
						onCreate={onCreate}
						parentDatastoreId="datastore"
					/>
				</ThemeProvider>,
				container,
			);
		});
	}
	beforeEach(async () => {
		jest.clearAllMocks();
		jest
			.mocked(secretService.createSecret)
			.mockResolvedValue({ secret_id: "secret", secret_key: "key" });
		jest
			.mocked(secretService.writeSecret)
			.mockResolvedValue({ secret_id: "secret" });
		jest.mocked(uploadAttachment).mockResolvedValue(attachment);
		jest.mocked(fileTransferService.readShards).mockResolvedValue([
			{
				id: "shard",
				write: true,
				fileserver: [{ fileserver_url: "https://files.example", write: true }],
			},
		]);
		jest
			.mocked(fileRepositoryService.readFileRepositories)
			.mockResolvedValue([]);
		container = document.createElement("div");
		document.body.appendChild(container);
		await render();
		act(() => {
			const title = document.querySelector<HTMLInputElement>(
				'[name="websitePasswordTitle"]',
			)!;
			title.value = "Example";
			Simulate.change(title);
		});
	});
	afterEach(() => {
		act(() => {
			ReactDOM.unmountComponentAtNode(container);
		});
		container.remove();
	});
	function queue() {
		act(() => click("ADD_DOT_DOT_DOT"));
		act(() => click("ADD_ATTACHMENT"));
		act(() => click("SELECT_ATTACHMENT"));
	}
	it.each<{
		shards: Shard[];
		repositories: FileRepository[];
		available: boolean;
		description: string;
	}>([
		{
			description: "no storage",
			shards: [],
			repositories: [],
			available: false,
		},
		{
			description: "a writable fileserver",
			shards: [
				{
					id: "shard",
					write: true,
					fileserver: [
						{ fileserver_url: "https://files.example", write: true },
					],
				},
			],
			repositories: [],
			available: true,
		},
		{
			description: "an active accepted repository",
			shards: [],
			repositories: [
				{
					id: "repo",
					title: "Storage",
					type: "aws_s3",
					active: true,
					accepted: true,
				},
			],
			available: true,
		},
		{
			description: "only unavailable storage",
			shards: [
				{
					id: "shard",
					write: true,
					fileserver: [
						{ fileserver_url: "https://files.example", write: false },
					],
				},
			],
			repositories: [
				{
					id: "inactive",
					title: "Inactive",
					type: "aws_s3",
					active: false,
					accepted: true,
				},
				{
					id: "unaccepted",
					title: "Unaccepted",
					type: "aws_s3",
					active: true,
					accepted: false,
				},
			],
			available: false,
		},
	])("sets attachment button visibility for $description", async ({
		shards,
		repositories,
		available,
	}) => {
		jest.mocked(fileTransferService.readShards).mockResolvedValue(shards);
		jest
			.mocked(fileRepositoryService.readFileRepositories)
			.mockResolvedValue(repositories);
		await render(false);
		await render();
		act(() => click("ADD_DOT_DOT_DOT"));
		expect(document.body.textContent?.includes("ADD_ATTACHMENT")).toBe(
			available,
		);
	});
	it("hides the attachment action if destinations cannot be loaded", async () => {
		jest
			.mocked(fileTransferService.readShards)
			.mockRejectedValue(new Error("offline"));
		await render(false);
		await render();
		act(() => click("ADD_DOT_DOT_DOT"));
		expect(document.body.textContent).not.toContain("ADD_ATTACHMENT");
	});
	it("queues files locally and attaches them to the new secret on save", async () => {
		queue();
		expect(uploadAttachment).not.toHaveBeenCalled();
		expect(secretService.createSecret).not.toHaveBeenCalled();
		expect(document.body.textContent).toContain("example.txt");
		await act(async () => click("CREATE"));
		expect(uploadAttachment).toHaveBeenCalledWith(
			expect.objectContaining({ filename: "example.txt" }),
			"secret",
			expect.any(Function),
		);
		expect(secretService.writeSecret).toHaveBeenCalledWith(
			"secret",
			"key",
			expect.objectContaining({ attachments: [attachment] }),
			"",
			"",
			"",
		);
		expect(onCreate).toHaveBeenCalledWith(
			expect.objectContaining({ secret_id: "secret" }),
		);
	});
	it("removes queued files without uploading them", async () => {
		queue();
		act(() =>
			(document.querySelector('[aria-label="DELETE"]') as HTMLElement).click(),
		);
		await act(async () => click("CREATE"));
		expect(uploadAttachment).not.toHaveBeenCalled();
		expect(secretService.writeSecret).not.toHaveBeenCalled();
		expect(onCreate).toHaveBeenCalledTimes(1);
	});
	it("cancels without creating a secret or uploading files", () => {
		queue();
		act(() => click("CLOSE"));
		expect(onClose).toHaveBeenCalledTimes(1);
		expect(secretService.createSecret).not.toHaveBeenCalled();
		expect(uploadAttachment).not.toHaveBeenCalled();
	});
	it("keeps the draft after an upload failure and reuses its secret on retry", async () => {
		queue();
		jest.mocked(uploadAttachment).mockRejectedValueOnce(new Error("offline"));
		await act(async () => click("CREATE"));
		expect(onCreate).not.toHaveBeenCalled();
		expect(document.body.textContent).toContain("FILE_UPLOAD_FAILED");
		await act(async () => click("CREATE"));
		expect(secretService.createSecret).toHaveBeenCalledTimes(1);
		expect(onCreate).toHaveBeenCalledTimes(1);
	});
});
