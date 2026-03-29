import express from "express";
import { supabase } from "./supabase.js";
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

const raise_error = (message, details) => {
    throw new Error(JSON.stringify({ message, details }));
};

const save_to_db = async (event, content) => {
    const { error } = await supabase.from("received_emails").insert({
        from_email: event.data.from || "",
        to_email: event.data.to?.[0] || "",
        subject: event.data.subject || "",
        html: content?.html || "",
        text: content?.text || "",
        resend_message_id: event.data.message_id || "",
        received_at: new Date().toISOString(),
    });

    if (error) {
        raise_error("Failed to save email to database.", error);
    }
};

const forward_email = async (
    resend,
    event,
    from_email
) => {
    const { data: settings, error } = await supabase
        .from("settings")
        .select("personal_email")
        .maybeSingle();

    if (error) {
        raise_error("Failed to retrieve settings.", error);
    }

    if (!settings?.personal_email) return;

    const { error: forwardError } = await resend.emails.receiving.forward({
        emailId: event.data.email_id,
        to: settings.personal_email,
        from: from_email,
    });

    if (forwardError) {
        raise_error("Failed to forward email.", forwardError);
    }
};

router.post("/webhook/redirect", async (req, res) => {
    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
        const event = req.body;

        if (event.type !== "email.received") {
            return res.json({ ok: true });
        }

        const { data: content } = await resend.emails.receiving.get(
            event.data.email_id
        );

        const recipient = event.data.to?.[0]?.split("@")[0];

        switch (recipient) {
            case "outreach":
                await forward_email(
                    resend,
                    event,
                    "Outreach Unchained <outreach@mail.unchainedin.app>"
                );
                await save_to_db(event, content);
                break;

            case "career":
                await forward_email(
                    resend,
                    event,
                    "Career Unchained <career@mail.unchainedin.app>"
                );
                await save_to_db(event, content);
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

export default router;
