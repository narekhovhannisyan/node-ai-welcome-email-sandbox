import OpenAI from "openai";
import { z } from "zod";

import { env } from "../config/env";
import type { SignupPayload, WelcomeCopy } from "../types/signup";

const responseSchema = z.object({
  headline: z.string().min(1),
  body: z.string().min(1),
  cta_text: z.string().min(1),
});

const openaiClient = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

/**
 * Builds default welcome copy used when AI personalization fails.
 */
export function buildGenericWelcomeCopy(signup: SignupPayload): WelcomeCopy {
  return {
    headline: `Welcome aboard, ${signup.name}!`,
    body: `Thanks for joining us as a ${signup.role}. We are excited to help your team make progress quickly with practical workflows tailored to ${signup.useCase}.`,
    ctaText: "Get started",
  };
}

/**
 * Generates personalized welcome copy from signup profile data.
 */
export async function generateWelcomeCopy(signup: SignupPayload): Promise<WelcomeCopy> {
  const fallback = buildGenericWelcomeCopy(signup);

  try {
    const completion = await openaiClient.responses.create({
      model: env.OPENAI_MODEL,
      input: [
        {
          role: "system",
          content:
            "You are a SaaS onboarding copywriter. Return JSON only with keys: headline, body, cta_text.",
        },
        {
          role: "user",
          content: `Create concise, friendly welcome copy for:
name=${signup.name}
role=${signup.role}
company_size=${signup.companySize}
use_case=${signup.useCase}`,
        },
      ],
      text: {
        format: {
          type: "json_object",
        },
      },
    });

    const outputText = completion.output_text;

    if (!outputText) {
      throw new Error("OpenAI returned empty output");
    }

    const jsonPayload: unknown = JSON.parse(outputText);
    const parsed = responseSchema.parse(jsonPayload);

    return {
      headline: parsed.headline,
      body: parsed.body,
      ctaText: parsed.cta_text,
    };
  } catch (error) {
    console.warn("OpenAI personalization failed, using fallback copy", error);
    return fallback;
  }
}
