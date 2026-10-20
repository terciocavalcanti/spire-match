import { BadRequestException } from "@nestjs/common";
import { z } from "zod";

import { ZodValidationPipe } from "./zod-validation.pipe";

describe("ZodValidationPipe", () => {
  const schema = z.object({ email: z.string().email() });
  const pipe = new ZodValidationPipe(schema);

  it("retorna os dados parseados quando válidos", () => {
    expect(pipe.transform({ email: "tercio@spirematch.com.br" })).toEqual({
      email: "tercio@spirematch.com.br",
    });
  });

  it("lança BadRequestException com detalhes quando inválido", () => {
    expect(() => pipe.transform({ email: "não-é-email" })).toThrow(BadRequestException);
  });
});
