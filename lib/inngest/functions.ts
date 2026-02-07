import { inngest } from "@/lib/inngest/client";
import { NEWS_SUMMARY_EMAIL_PROMPT, PERSONALIZED_WELCOME_EMAIL_PROMPT } from "./prompts";
import { sendNewsSummaryEmail, sendWelcomeEmail } from "@/lib/nodemailer";
import { getAllUsersForNewsEmail } from "../actions/user.actions";
import { getWatchlistSymbolsByEmail } from "../actions/watchlist.actions";
import { getNews } from "../actions/finnhub.actions";
import { formatDateToday } from "../utils";

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

export const sendDailyNewsSummary = inngest.createFunction(
    { id: 'daily-news-summary' },
    [
        { event: 'app/send.daily.news' },
        { cron: '0 12 * * *' }
    ],
    async ({ step }) => {
        // Step 1: get all users for news delivery
        const users = await step.run('get-all-users', getAllUsersForNewsEmail);
        if (!users || users.length === 0) return { success: false, message: 'No users found for news email' };
        const userNewsSummaries: {user:User; newsContent:string | null}[] = [];

        // Step 2: for each user, fetch their watchlist and retrieve news
        for (const user of users) {
            try {
                const symbols: string[] = await step.run('get-user-watchlist', async () => getWatchlistSymbolsByEmail(user.email));
                let news = await step.run('fetch-news', async () => getNews(symbols && symbols.length ? symbols : undefined));

               // If no personalized news, fall back to general market news
                if (!news || news.length === 0) {
                    news = await step.run('fetch-general-news', async () => getNews());
                }

                if (!news || news.length === 0) {
                    // nothing to send for this user
                    continue;
                }

                // Step 3: Summarize news via AI (placeholder)
                const prompt= NEWS_SUMMARY_EMAIL_PROMPT.replace('{{newsData}}', JSON.stringify(news,null,2));
                const response = await step.ai.infer(`summarize-news-${user.email}`,
                    {model: step.ai.models.gemini({model:'gemini-2.5-flash-lite'}),
                    body: {contents:[{role:'user', parts:[{text: prompt}]}]}
                    });
                const part = response.candidates?.[0]?.content?.parts?.[0];
                const newsContent = (part && 'text' in part ? part.text: null) || 'No market news.';
                userNewsSummaries.push({ user, newsContent });
                } 
            catch(e){
                console.error('Failed to summarize news for : ', user.email);
                userNewsSummaries.push({user, newsContent: null});
            }
        }
        // Step 4: Send the email (placeholder)
        await step.run('send-news-email', async () => {
            await Promise.all(
                userNewsSummaries.map(async ({user, newsContent})=>{
                    if(!newsContent) return false;
                    return await sendNewsSummaryEmail({email:user.email, date: formatDateToday, summary: newsContent });
                })
            );
            return true;
        });
        return { success: true, message: 'Daily news summary emails sent successfully' };
    }
);