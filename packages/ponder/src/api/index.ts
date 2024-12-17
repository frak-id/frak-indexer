import { ponder } from "@/generated";

ponder.get("/hello", async ({ text }) => {
    return text("Hello!");
});
