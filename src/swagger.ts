import swaggerUi from "swagger-ui-express";
import fs from "fs";
import yaml from "js-yaml";
import { OpenAPIV3 } from "openapi-types";

const fileContents = fs.readFileSync("./src/docs/openapi.yaml", "utf8");

const swaggerDocument = yaml.load(fileContents) as OpenAPIV3.Document;

export { swaggerUi, swaggerDocument };
