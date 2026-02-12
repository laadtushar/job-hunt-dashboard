
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export class GoogleSheetsService {
    private auth: OAuth2Client;
    private spreadsheetId: string | undefined;

    constructor(accessToken: string, refreshToken?: string, spreadsheetId?: string) {
        this.auth = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );

        this.auth.setCredentials({
            access_token: accessToken,
            refresh_token: refreshToken,
        });

        this.spreadsheetId = spreadsheetId;
    }

    async appendApplication(data: any) {
        if (!this.spreadsheetId) throw new Error("Spreadsheet ID not configured");

        const sheets = google.sheets({ version: 'v4', auth: this.auth });

        const rowValues = [
            data.company,
            data.role,
            data.status,
            data.appliedDate,
            data.source,
            data.salary?.base || '',
            data.location || '',
            data.people?.recruiterName || '',
            data.people?.recruiterEmail || '',
            data.urls?.jobPost || '',
            data.nextSteps || '',
            data.sentiment || '',
            data.feedback || ''
        ];

        await sheets.spreadsheets.values.append({
            spreadsheetId: this.spreadsheetId,
            range: 'Sheet1!A:M', // Adjust as needed
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [rowValues],
            },
        });
    }
}
