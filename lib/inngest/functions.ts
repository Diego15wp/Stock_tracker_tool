import { inngest } from "@/lib/inngest/client";
import { PERSONALIZED_WELCOME_EMAIL_PROMPT } from "./prompts";
import { sendWelcomeEmail } from "@/lib/nodemailer";

export const sendSignUpEmail = inngest.createFunction(
    { id: 'sign-up-email'},
    { event: 'app/user.created'},
    async ({event, step}) => {
        const userProfile = `
          - Country: ${event.data.country}
          - Investment goals: ${event.data.investmentGoals}
          - Risk tolerance: ${event.data.riskTolerance}
          - Preffered industry: ${event.data.prefferedIndustry}
        `

        const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace('{{userProfile}}', userProfile)

        const response = await step.ai.infer('generate-welcome-intro', {
            model: step.ai.models.gemini({model: 'gemini-2.5-flash-lite'}),
            body: {
                contents:[{
                    role: 'user',
                    parts: [
                        {text:prompt}
                    ],
                }],
            },
        });

        await step.run('send-welcome-email', async () =>{
            const part = response.candidates?.[0].content?.parts?.[0];
            const introText = (part && 'text' in part ? part.text: null) || 'Thanks for joining Signalist. You now have the tools to track markets and trade smarter.';

            const {data: {email, name}} = event;
            //EMAIL SENDING LOGIC
            return await sendWelcomeEmail(
                {email, name, intro: introText}
            );
        });
        return {
            success: true,
            message: 'welcome email sent successfully'

        } 

    }
);