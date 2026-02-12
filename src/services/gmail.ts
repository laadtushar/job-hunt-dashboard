
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import prisma from '@/lib/prisma';

export class GmailService {
    private auth: OAuth2Client;

    constructor(accessToken: string, refreshToken?: string) {
        this.auth = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );

        this.auth.setCredentials({
            access_token: accessToken,
            refresh_token: refreshToken,
        });
    }

    async listEmails(userId: string, query: string = 'label:inbox', maxResults: number = 10) {
        const gmail = google.gmail({ version: 'v1', auth: this.auth });

        // Get the last sync time for this user to optimize fetching
        // const lastSync = await prisma.user.findUnique({ where: { id: userId }, select: { lastEmailSync: true } });
        // if (lastSync) query += ` after:${Math.floor(lastSync.lastEmailSync.getTime() / 1000)}`;

        const response = await gmail.users.messages.list({
            userId: 'me',
            q: query,
            maxResults,
        });

        return response.data.messages || [];
    }

    async getEmailDetails(messageId: string) {
        const gmail = google.gmail({ version: 'v1', auth: this.auth });
        const response = await gmail.users.messages.get({
            userId: 'me',
            id: messageId,
            format: 'full',
        });
        return response.data;
    }

    // Helper to decode Base64 URL safe strings
    static decodeBody(data: string): string {
        return Buffer.from(data, 'base64').toString('utf-8');
    }

    // Extract plain text body from the complex Gmail message payload
    static getBody(payload: any): string {
        if (!payload) return '';

        if (payload.body && payload.body.data) {
            return GmailService.decodeBody(payload.body.data);
        }

        if (payload.parts) {
            for (const part of payload.parts) {
                if (part.mimeType === 'text/plain') {
                    return GmailService.getBody(part);
                }
                if (part.mimeType === 'multipart/alternative') {
                    return GmailService.getBody(part);
                }
            }
        }
        return '';
    }
}
