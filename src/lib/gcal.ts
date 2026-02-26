import { google } from "googleapis";
import prisma from "@/lib/prisma";

export async function insertCalendarEvent(userId: string, eventDetails: {
    summary: string;
    description: string;
    startTime: string; // ISO string
    endTime: string; // ISO string
}) {
    // 1. Get the user's access token from the database
    const account = await prisma.account.findFirst({
        where: {
            userId: userId,
            provider: "google"
        }
    });

    if (!account || !account.access_token) {
        console.error(`No Google access token found for user ${userId}`);
        return null;
    }

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
    );

    // Set credentials. We prioritize access_token but will use refresh_token if present 
    // (though next-auth handles token refresh differently, this works for active sessions)
    oauth2Client.setCredentials({
        access_token: account.access_token,
        refresh_token: account.refresh_token,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    try {
        const response = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: {
                summary: eventDetails.summary,
                description: eventDetails.description,
                start: {
                    dateTime: eventDetails.startTime,
                    timeZone: 'UTC', // Default to UTC, ideally we'd parse the timezone from the email
                },
                end: {
                    dateTime: eventDetails.endTime,
                    timeZone: 'UTC',
                },
                reminders: {
                    useDefault: false,
                    overrides: [
                        { method: 'email', minutes: 24 * 60 },
                        { method: 'popup', minutes: 30 },
                    ],
                },
            },
        });

        console.log(`Created calendar event: ${response.data.htmlLink}`);
        return response.data;
    } catch (error) {
        console.error("Failed to insert calendar event:", error);
        return null;
    }
}
