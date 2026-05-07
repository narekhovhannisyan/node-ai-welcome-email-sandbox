import { MailtrapClient } from "mailtrap";

import { env } from "../config/env";
import type { WelcomeCopy } from "../types/signup";

type SendWelcomeEmailParams = {
  recipientEmail: string;
  name: string;
  copy: WelcomeCopy;
};

const mailtrapClient = new MailtrapClient({
  token: env.MAILTRAP_API_TOKEN,
  sandbox: env.MAILTRAP_SANDBOX,
  testInboxId: env.MAILTRAP_SANDBOX ? Number(env.MAILTRAP_INBOX_ID) : undefined,
  accountId: env.MAILTRAP_SANDBOX ? Number(env.MAILTRAP_ACCOUNT_ID) : undefined,
});

/**
 * Sends the welcome email using Mailtrap template variables.
 */
export async function sendWelcomeEmail(params: SendWelcomeEmailParams): Promise<void> {
  const { recipientEmail, name, copy } = params;

  await mailtrapClient.send({
    from: {
      email: env.MAIL_FROM_ADDRESS,
      name: env.MAIL_FROM_NAME,
    },
    to: [{ email: recipientEmail }],
    template_uuid: env.MAILTRAP_TEMPLATE_UUID,
    template_variables: {
      user_name: name,
      headline: copy.headline,
      body: copy.body,
      cta_text: copy.ctaText,
    },
    category: "welcome_email",
  });
}
