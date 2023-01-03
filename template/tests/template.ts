import { describe, expect, it } from "vitest"

import { testName } from "@alanscodelog/utils"


describe(testName(), () => {
	it("missing tests", () => {
		expect(true).to.equal(false)
	})
})
