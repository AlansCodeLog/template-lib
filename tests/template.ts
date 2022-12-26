import { describe, expect, it } from "vitest"

import { testName } from "@/testing"


describe(testName(), () => {
	it("missing tests", () => {
		expect(true).to.equal(false)
	})
})
