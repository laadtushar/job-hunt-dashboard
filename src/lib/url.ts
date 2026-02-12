import { ATS_CONFIG } from '@/config/ats';

export class UrlUtils {

    // Known ATS patterns to extract Job IDs
    // tuple: [Host Regex, ID Extraction Regex]
    private static ATS_PATTERNS = ATS_CONFIG;

    static normalize(url: string | null | undefined): string | null {
        if (!url) return null;
        try {
            const u = new URL(url);

            // Remove common tracking params
            const paramsToRemove = [
                'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
                'ref', 'referrer', 'source', 'gh_jid', 'lever-source'
            ];

            paramsToRemove.forEach(p => u.searchParams.delete(p));

            // Sort remaining params for consistency (rarely needed for job posts but good practice)
            u.searchParams.sort();

            // Return clean string, stripping trailing slash
            return u.toString().replace(/\/$/, "");
        } catch (e) {
            return null; // Invalid URL
        }
    }

    static extractJobId(url: string | null | undefined): string | null {
        if (!url) return null;
        try {
            const u = new URL(url);
            const fullUrl = u.toString();

            for (const [hostPattern, idPattern] of this.ATS_PATTERNS) {
                if (hostPattern.test(u.hostname)) {
                    const match = fullUrl.match(idPattern);
                    if (match && match[1]) {
                        return `${u.hostname}:${match[1]}`; // Namespace the ID by host
                    }
                }
            }
        } catch (e) {
            // ignore
        }
        return null;
    }
}
