import { Router, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";

import { env } from "../config/env";
import { sendWelcomeEmail } from "../services/mailService";
import { generateWelcomeCopy } from "../services/personalizationService";
import type { SignupPayload } from "../types/signup";

const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.string().trim().email("Please provide a valid email address."),
  role: z.string().trim().min(2, "Role is required."),
  companySize: z.string().trim().min(1, "Company size is required."),
  useCase: z.string().trim().min(5, "Use case must be at least 5 characters."),
});

const submitLimiter = rateLimit({
  windowMs: 60_000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many signup attempts. Please try again in a minute.",
});

/**
 * Escapes user-provided values before injecting into HTML output.
 */
export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * Renders the signup page with optional validation errors and status message.
 */
export function renderSignupPage(options?: {
  values?: Partial<SignupPayload>;
  errors?: Partial<Record<keyof SignupPayload, string>>;
  successMessage?: string;
}): string {
  const values = options?.values ?? {};
  const errors = options?.errors ?? {};

  const successBanner = options?.successMessage
    ? `<p style="padding:12px;border-radius:6px;background:#ecfdf3;color:#065f46;">${escapeHtml(options.successMessage)}</p>`
    : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>AI Welcome Signup</title>
  </head>
  <body style="font-family:Arial,sans-serif;max-width:720px;margin:40px auto;padding:0 16px;">
    <h1>Sign up for a personalized welcome email</h1>
    <p>Submit your profile and we will generate onboarding copy using AI.</p>
    ${successBanner}
    <form method="post" action="/signup" style="display:grid;gap:12px;">
      <label>Name<br /><input name="name" value="${escapeHtml(values.name ?? "")}" /></label>
      ${errors.name ? `<small style="color:#b91c1c;">${escapeHtml(errors.name)}</small>` : ""}
      <label>Email<br /><input name="email" type="email" value="${escapeHtml(values.email ?? "")}" /></label>
      ${errors.email ? `<small style="color:#b91c1c;">${escapeHtml(errors.email)}</small>` : ""}
      <label>Role<br /><input name="role" value="${escapeHtml(values.role ?? "")}" /></label>
      ${errors.role ? `<small style="color:#b91c1c;">${escapeHtml(errors.role)}</small>` : ""}
      <label>Company size<br /><input name="companySize" value="${escapeHtml(values.companySize ?? "")}" /></label>
      ${errors.companySize ? `<small style="color:#b91c1c;">${escapeHtml(errors.companySize)}</small>` : ""}
      <label>Use case<br /><textarea name="useCase" rows="5">${escapeHtml(values.useCase ?? "")}</textarea></label>
      ${errors.useCase ? `<small style="color:#b91c1c;">${escapeHtml(errors.useCase)}</small>` : ""}
      <button type="submit">Create my welcome email</button>
    </form>
    <p style="margin-top:24px;color:#4b5563;">Mode: ${
      env.MAILTRAP_SANDBOX ? "Sandbox" : "Production"
    }</p>
  </body>
</html>`;
}

/**
 * Handles GET /signup and returns the initial server-rendered form.
 */
export function getSignupPageHandler(_request: Request, response: Response): void {
  response.status(200).send(renderSignupPage());
}

/**
 * Handles POST /signup with validation, personalization, and mail send.
 */
export async function postSignupHandler(request: Request, response: Response): Promise<void> {
  const parsed = signupSchema.safeParse(request.body);

  if (!parsed.success) {
    const values = request.body as Partial<SignupPayload>;
    const fieldErrors = parsed.error.flatten().fieldErrors;

    response.status(400).send(
      renderSignupPage({
        values,
        errors: {
          name: fieldErrors.name?.[0],
          email: fieldErrors.email?.[0],
          role: fieldErrors.role?.[0],
          companySize: fieldErrors.companySize?.[0],
          useCase: fieldErrors.useCase?.[0],
        },
      }),
    );
    return;
  }

  const signup = parsed.data;
  const copy = await generateWelcomeCopy(signup);

  try {
    await sendWelcomeEmail({
      recipientEmail: signup.email,
      name: signup.name,
      copy,
    });
  } catch (error) {
    console.warn("Mailtrap send failed. Continuing signup response.", error);
  }

  response.status(200).send(
    renderSignupPage({
      successMessage:
        "Thanks for signing up. Your welcome email is being prepared and will arrive shortly.",
    }),
  );
}

export const signupRouter = Router();

signupRouter.get("/", getSignupPageHandler);
signupRouter.post("/", submitLimiter, postSignupHandler);
