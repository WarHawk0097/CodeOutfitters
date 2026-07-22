import { describe, expect, it } from "vitest";
import { Test } from "@nestjs/testing";
import { HealthController } from "./health.controller";

describe("HealthController (Phase 1 smoke)", () => {
  it("responds with ok status", async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    const controller = moduleRef.get(HealthController);
    expect(controller.check()).toEqual({
      status: "ok",
      service: "command-center-api",
    });
  });
});
