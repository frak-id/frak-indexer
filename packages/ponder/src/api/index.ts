import { ponder } from "@/generated";
import { graphql } from "@ponder/core";

// todo: api key middleware

// This is the entry point for the Graphql api
ponder.use("/graphql", graphql());
