import express from "express";
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);

const raise_error = (message, details) => {
    throw new Error(JSON.stringify({ message, details }));
};

const forward_email = async (
    resend,
    event,
    from_email
) => {
    const { error: forwardError } = await resend.emails.receiving.forward({
        emailId: event.data.email_id,
        to: "sambhavsaxena02@gmail.com",
        from: from_email,
    });

    if (forwardError) {
        raise_error("Failed to forward email.", forwardError);
    }
};

router.post("/webhook/redirect", async (req, res) => {
    try {
        const event = req.body;

        if (event.type !== "email.received") {
            return res.json({ ok: true });
        }

        const recipient = event.data.to?.[0]?.split("@")[0];

        switch (recipient) {
            case "outreach":
                await forward_email(
                    resend,
                    event,
                    "Outreach Unchained <outreach@mail.unchainedin.app>"
                );
                break;

            case "career":
                await forward_email(
                    resend,
                    event,
                    "Career Unchained <career@mail.unchainedin.app>"
                );
                break;

            default:
                await forward_email(
                    resend,
                    event,
                    "Unknown Unchained <unknown@mail.unchainedin.app>"
                );
                return res.json({ success: true });
        }

        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({
            error: "Webhook failed",
            details: err.message,
        });
    }
});

router.post("/send", async (req, res) => {
    try {
        const { subject, html } = req.body;

        if (!subject || !html) {
            return res.status(400).json({
                error: "Missing required fields: subject, html",
            });
        }

        const { error } = await resend.emails.send({
            from: "Unchained India <outreach@mail.unchainedin.app>",
            to: "sambhavsaxena02@gmail.com",
            subject,
            html,
        });

        if (error) {
            raise_error("Failed to send email.", error);
        }

        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({
            error: "Failed to send email",
            details: err.message,
        });
    }
});

export default router;
