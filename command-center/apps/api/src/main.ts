import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  const port = Number(process.env.PORT ?? 3101);
  await app.listen(port, "0.0.0.0");
  // eslint-disable-next-line no-console
  console.log(`command-center api listening on :${port}`);
}

bootstrap();
