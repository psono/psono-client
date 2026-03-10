import React from "react";
import hostService from "./host";

describe("Service: host test suite", () => {
	describe("semverCompare", () => {
		it("semverCompare exists", () => {
			expect(hostService.semverCompare).toBeDefined();
		});

		// Basic version comparisons
		it("should return 0 for equal versions", () => {
			expect(hostService.semverCompare("1.0.0", "1.0.0")).toBe(0);
			expect(hostService.semverCompare("2.5.3", "2.5.3")).toBe(0);
			expect(hostService.semverCompare("0.0.1", "0.0.1")).toBe(0);
		});

		it("should return -1 when first version is less than second", () => {
			expect(hostService.semverCompare("1.0.0", "2.0.0")).toBe(-1);
			expect(hostService.semverCompare("1.0.0", "1.1.0")).toBe(-1);
			expect(hostService.semverCompare("1.0.0", "1.0.1")).toBe(-1);
			expect(hostService.semverCompare("0.9.0", "1.0.0")).toBe(-1);
		});

		it("should return 1 when first version is greater than second", () => {
			expect(hostService.semverCompare("2.0.0", "1.0.0")).toBe(1);
			expect(hostService.semverCompare("1.1.0", "1.0.0")).toBe(1);
			expect(hostService.semverCompare("1.0.1", "1.0.0")).toBe(1);
			expect(hostService.semverCompare("1.0.0", "0.9.0")).toBe(1);
		});

		it("should handle leading v prefix", () => {
			expect(hostService.semverCompare("v1.0.0", "1.0.0")).toBe(0);
			expect(hostService.semverCompare("1.0.0", "v1.0.0")).toBe(0);
			expect(hostService.semverCompare("v2.0.0", "1.0.0")).toBe(1);
			expect(hostService.semverCompare("2.0.0", "v1.0.0")).toBe(1);
			expect(hostService.semverCompare("v1.0.0", "2.0.0")).toBe(-1);
			expect(hostService.semverCompare("1.0.0", "v2.0.0")).toBe(-1);
			expect(hostService.semverCompare("v1.2.3", "v1.2.3")).toBe(0);
		});

		// Whitespace handling
		it("should ignore everything after whitespace", () => {
			expect(hostService.semverCompare("1.0.0 some extra text", "1.0.0")).toBe(
				0,
			);
			expect(hostService.semverCompare("2.0.0", "1.0.0 build info")).toBe(1);
			expect(hostService.semverCompare("1.0.0 alpha", "2.0.0 beta")).toBe(-1);
		});

		// Build metadata handling (+ sign)
		it("should ignore everything after plus sign", () => {
			expect(hostService.semverCompare("1.0.0+build123", "1.0.0")).toBe(0);
			expect(hostService.semverCompare("1.0.0", "1.0.0+build456")).toBe(0);
			expect(
				hostService.semverCompare("2.0.0+metadata", "1.0.0+othermeta"),
			).toBe(1);
			expect(hostService.semverCompare("1.0.0+build", "2.0.0+build")).toBe(-1);
		});

		// Pre-release version handling
		it("should handle pre-release versions correctly", () => {
			// Pre-release should be less than regular version
			expect(hostService.semverCompare("1.0.0-alpha", "1.0.0")).toBe(-1);
			expect(hostService.semverCompare("1.0.0", "1.0.0-beta")).toBe(1);
		});

		it("should compare pre-release versions", () => {
			expect(hostService.semverCompare("1.0.0-alpha", "1.0.0-beta")).toBe(-1);
			expect(hostService.semverCompare("1.0.0-beta", "1.0.0-alpha")).toBe(1);
			expect(hostService.semverCompare("1.0.0-alpha", "1.0.0-alpha")).toBe(0);
		});

		// Complex version formats
		it("should handle different version formats", () => {
			expect(hostService.semverCompare("1.0", "1.0.0")).toBe(-1);
			expect(hostService.semverCompare("1", "1.0")).toBe(-1);
			expect(hostService.semverCompare("10", "2")).toBe(1);
		});

		// Edge cases
		it("should handle empty or malformed versions", () => {
			expect(hostService.semverCompare("", "")).toBe(0);
			expect(hostService.semverCompare("1.0.0", "")).toBe(1);
			expect(hostService.semverCompare("", "1.0.0")).toBe(-1);
		});

		// Numeric sorting
		it("should use numeric comparison for version numbers", () => {
			expect(hostService.semverCompare("1.10.0", "1.2.0")).toBe(1);
			expect(hostService.semverCompare("1.2.0", "1.10.0")).toBe(-1);
			expect(hostService.semverCompare("2.0.0", "10.0.0")).toBe(-1);
		});

		// Combined scenarios
		it("should handle complex scenarios with whitespace and build metadata", () => {
			expect(
				hostService.semverCompare("1.0.0-alpha+build123 extra", "1.0.0"),
			).toBe(-1);
			expect(
				hostService.semverCompare("2.0.0+build extra text", "1.0.0-beta+other"),
			).toBe(1);
		});

		// Real-world examples based on the codebase usage
		it("should handle version formats used in the codebase", () => {
			// Based on the usage in checkHost function
			expect(hostService.semverCompare("4.0.14", "4.0.13")).toBe(1);
			expect(hostService.semverCompare("4.0.24", "4.0.14")).toBe(1);
			expect(hostService.semverCompare("3.9.0", "4.0.14")).toBe(-1);
		});

		// Case sensitivity
		it("should handle case sensitivity correctly", () => {
			expect(hostService.semverCompare("1.0.0-Alpha", "1.0.0-alpha")).toBe(-1); // uppercase comes first
			expect(hostService.semverCompare("1.0.0-alpha", "1.0.0-Alpha")).toBe(1);
		});
	});
});
