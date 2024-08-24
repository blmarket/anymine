/// <reference types="jasmine" />
import { ApolloClient } from "@apollo/client/core";

describe("import test", () => {
    it("works", async () => {
        expect(ApolloClient).toBeTruthy();
    });
});