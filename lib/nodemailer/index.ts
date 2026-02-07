import nodemailer from 'nodemailer';
import { WELCOME_EMAIL_TEMPLATE, NEWS_SUMMARY_EMAIL_TEMPLATE } from '@/lib/nodemailer/templates';

export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.NODEMAILER_EMAIL!,
        pass: process.env.NODEMAILER_PASSWORD!,
    }
});

export const sendWelcomeEmail = async ({email, name, intro}: WelcomeEmailData) =>{
    const htmlTemplate = WELCOME_EMAIL_TEMPLATE
    .replace('{{name}}', name)
    .replace('{{intro}}', intro);

    const mailOptions= {
        from: `"Signalist <signalist@thecompany.com>"`,
        to: email,
        subject: 'Welcome to Signalist - your stock market toolkit is ready!',
        text: 'Thanks for joining Signalist',
        html: htmlTemplate,
    }

    await transporter.sendMail(mailOptions);
}

type NewsSummaryEmailData = {
    email: string;
    date: string;
    summary: string; // HTML or plain text
};

export const sendNewsSummaryEmail = async ({ email, date, summary }: NewsSummaryEmailData) => {

    const htmlTemplate = NEWS_SUMMARY_EMAIL_TEMPLATE
        .replace('{{date}}', date)
        .replace('{{newsContent}}', typeof summary === 'string' ? summary : '');

    // Plain-text fallback by stripping HTML tags
    const textFallback = (summary || '').replace(/<[^>]*>/g, '').trim() || 'Today\'s market news summary.';

    const mailOptions = {
        from: `"Signalist <signalist@thecompany.com>"`,
        to: email,
        subject: `Your Market News Summary - ${date}`,
        text: textFallback,
        html: htmlTemplate,
    };

    await transporter.sendMail(mailOptions);
};

