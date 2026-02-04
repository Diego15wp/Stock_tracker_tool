import {serve} from "inngest/next";
import {inngest} from "@/lib/inngest/client";
import { sendSignUpEmail } from "@/lib/inngest/functions";

export const {GET, POST, PUT} = serve({
    client: inngest,
    functions: [sendSignUpEmail], //for functions that we want running in background not particularly just when users using app
});