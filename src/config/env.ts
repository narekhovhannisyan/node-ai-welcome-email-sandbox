import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z
  .object({
    PORT: z.coerce.number().int().positive().default(3000),
    APP_BASE_URL: z.string().url(),
    OPENAI_API_KEY: z.string().min(1),
    OPENAI_MODEL: z.string().min(1).default("gpt-4o-mini"),
    MAILTRAP_API_TOKEN: z.string().min(1),
    MAILTRAP_TEMPLATE_UUID: z.string().uuid(),
    MAIL_FROM_ADDRESS: z.string().email(),
    MAIL_FROM_NAME: z.string().min(1),
    MAILTRAP_SANDBOX: z.preprocess(
      (value) => {
        if (typeof value === "boolean") {
          return value;
        }

        if (typeof value === "string") {
          return value.toLowerCase() === "true";
        }

        return true;
      },
      z.boolean(),
    ),
    MAILTRAP_INBOX_ID: z.string().optional(),
    MAILTRAP_ACCOUNT_ID: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.MAILTRAP_SANDBOX && !value.MAILTRAP_INBOX_ID) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["MAILTRAP_INBOX_ID"],
        message: "MAILTRAP_INBOX_ID is required when MAILTRAP_SANDBOX=true",
      });
    }

    if (value.MAILTRAP_SANDBOX && !value.MAILTRAP_ACCOUNT_ID) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["MAILTRAP_ACCOUNT_ID"],
        message: "MAILTRAP_ACCOUNT_ID is required when MAILTRAP_SANDBOX=true",
      });
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration", parsed.error.flatten().fieldErrors);
  throw new Error("Environment validation failed");
}

export const env = parsed.data;
