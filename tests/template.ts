import { test_name } from "@utils/testing"
import { expect } from "@tests/chai"


describe(test_name(), () => {
	it("missing tests", () => {
		expect(true).to.equal(false)
	})
})
