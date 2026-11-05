import React from "react";
import ReactDOM from "react-dom";
import { act, Simulate } from "react-dom/test-utils";
import type { GroupDetail, GroupShareRight } from "../../../types/vault";
import groupsService from "../../services/groups";
import PendingSharesTooltip from "./pending-shares-tooltip";

jest.mock("../../services/groups", () => ({
	__esModule: true,
	default: {
		readGroup: jest.fn(),
		decryptSecretKey: jest.fn(),
	},
}));
jest.mock("react-i18next", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("../../services/item-blueprint", () => ({
	__esModule: true,
	default: {
		getEntryTypes: () => [
			{ value: "website_password", title: "WEBSITE_PASSWORD" },
			{ value: "note", title: "NOTE" },
		],
	},
}));

const readGroup = groupsService.readGroup as jest.MockedFunction<
	typeof groupsService.readGroup
>;
const decrypt = groupsService.decryptSecretKey as jest.MockedFunction<
	typeof groupsService.decryptSecretKey
>;

function groupDetails(shares: Partial<GroupShareRight>[]): GroupDetail {
	return { group_share_rights: shares } as GroupDetail;
}

describe("pending group shares tooltip", () => {
	let container: HTMLDivElement;
	const outstandingShares = {
		pending: { group_id: "group", share_id: "pending" },
	};

	beforeEach(() => {
		jest.useFakeTimers();
		jest.resetAllMocks();
		container = document.createElement("div");
		document.body.appendChild(container);
	});

	afterEach(() => {
		act(() => {
			ReactDOM.unmountComponentAtNode(container);
		});
		container.remove();
		jest.useRealTimers();
	});

	function render(onClick = jest.fn()) {
		act(() => {
			ReactDOM.render(
				<PendingSharesTooltip
					groupId="group"
					outstandingShares={outstandingShares}
				>
					<button type="button" onClick={onClick}>
						Accept New Shares
					</button>
				</PendingSharesTooltip>,
				container,
			);
		});
		const button = container.querySelector("button")!;
		button.getBoundingClientRect = () =>
			({
				x: 0,
				y: 0,
				top: 0,
				left: 0,
				right: 100,
				bottom: 20,
				width: 100,
				height: 20,
			}) as DOMRect;
		return button;
	}

	async function hover(button: HTMLButtonElement) {
		await act(async () => {
			Simulate.mouseOver(button);
			jest.advanceTimersByTime(200);
		});
	}

	it("loads titles from group details when pending records only contain IDs", async () => {
		readGroup.mockResolvedValue(
			groupDetails([
				{ share_id: "pending", title: "encrypted", title_nonce: "nonce" },
				{ share_id: "accepted", title: "other", title_nonce: "other-nonce" },
			]),
		);
		decrypt.mockReturnValue("Shared team passwords");
		const button = render();
		expect(readGroup).not.toHaveBeenCalled();
		expect(decrypt).not.toHaveBeenCalled();

		await hover(button);

		expect(readGroup).toHaveBeenCalledWith("group");
		expect(decrypt).toHaveBeenCalledTimes(1);
		expect(decrypt).toHaveBeenCalledWith("group", "encrypted", "nonce");
		expect(document.querySelector('[role="tooltip"]')?.textContent).toBe(
			"Shared team passwords (UNKNOWN_TYPE)",
		);
		expect(document.querySelectorAll('[role="tooltip"] li')).toHaveLength(1);

		act(() => {
			Simulate.mouseLeave(button);
			jest.advanceTimersByTime(1000);
		});
		await hover(button);
		expect(readGroup).toHaveBeenCalledTimes(1);
	});

	it("uses the share ID if a title nonce is missing instead of decrypting undefined", async () => {
		readGroup.mockResolvedValue(
			groupDetails([{ share_id: "pending", title: "encrypted" }]),
		);
		await hover(render());

		expect(decrypt).not.toHaveBeenCalled();
		expect(document.querySelector('[role="tooltip"]')?.textContent).toBe(
			"pending (UNKNOWN_TYPE)",
		);
	});

	it.each([
		["folder", "FOLDER"],
		["website_password", "WEBSITE_PASSWORD"],
		["note", "NOTE"],
		["unrecognized-type", "UNKNOWN_TYPE"],
	])("shows the translated label for share type %s", async (type, label) => {
		readGroup.mockResolvedValue(
			groupDetails([
				{
					share_id: "pending",
					title: "encrypted-title",
					title_nonce: "title-nonce",
					type: "encrypted-type",
					type_nonce: "type-nonce",
				},
			]),
		);
		decrypt.mockImplementation((_groupId, encrypted) =>
			encrypted === "encrypted-type" ? type : "Shared item",
		);
		await hover(render());

		expect(decrypt).toHaveBeenCalledWith(
			"group",
			"encrypted-type",
			"type-nonce",
		);
		expect(document.querySelector('[role="tooltip"]')?.textContent).toBe(
			`Shared item (${label})`,
		);
	});

	it("does not decrypt a share type with a missing nonce", async () => {
		readGroup.mockResolvedValue(
			groupDetails([{ share_id: "pending", type: "encrypted-type" }]),
		);
		await hover(render());

		expect(decrypt).not.toHaveBeenCalled();
		expect(document.querySelector('[role="tooltip"]')?.textContent).toBe(
			"pending (UNKNOWN_TYPE)",
		);
	});

	it("keeps acceptance usable when loading the preview fails", async () => {
		readGroup.mockResolvedValue(undefined);
		const onClick = jest.fn();
		const button = render(onClick);
		await hover(button);

		expect(document.querySelector('[role="tooltip"]')?.textContent).toBe(
			"UNKNOWN_ERROR",
		);
		expect(decrypt).not.toHaveBeenCalled();
		act(() => button.click());
		expect(onClick).toHaveBeenCalledTimes(1);
	});
});
