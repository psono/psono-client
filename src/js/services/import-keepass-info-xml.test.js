import React from "react";
import cryptoLibrary from "../services/crypto-library";
import importKeePassXml from "./import-keepass-info-xml";

describe("Service: importKeePassXml test suite", () => {
	it("importKeePassXml exists", () => {
		expect(importKeePassXml).toBeDefined();
	});
});
