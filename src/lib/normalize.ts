export const COMPANY_SUFFIXES = [
    /\binc\.?\b/gi, /\bllc\.?\b/gi, /\bltd\.?\b/gi, /\bcorp\.?\b/gi, /\bcorporation\b/gi,
    /\bgmbh\b/gi, /\bco\.?\b/gi, /\bcompany\b/gi, /\bplc\b/gi, /\bpvt\.?\b/gi,
    /\bsao\b/gi, /\bpty\b/gi, /\bproprietory\b/gi, /\blimited\b/gi
];

export const TITLE_LEVELS = [
    /\bsenior\b/gi, /\bzsenior\b/gi, /\bsr\.?\b/gi, /\bjr\.?\b/gi, /\bjunior\b/gi,
    /\bprincipal\b/gi, /\blead\b/gi, /\bstaff\b/gi, /\bintern\b/gi,
    /\bii\b/gi, /\biii\b/gi, /\biv\b/gi, /\bv\b/gi,
    /\bentry level\b/gi, /\bassociate\b/gi
];

export const TITLE_SYNONYMS: Record<string, string> = {
    'sde': 'software engineer',
    'swe': 'software engineer',
    'developer': 'software engineer',
    'programmer': 'software engineer',
    'web developer': 'software engineer',
    'frontend engineer': 'frontend developer',
    'backend engineer': 'backend developer',
    'fullstack': 'full stack',
    'full-stack': 'full stack',
    'qa': 'quality assurance',
    'pm': 'product manager',
    'em': 'engineering manager',
    'tpm': 'technical product manager'
};

export class Normalizer {
    static cleanCompanyName(name: string): string {
        if (!name) return "";
        let cleaned = name.trim().toLowerCase();

        // Remove suffixes
        for (const suffix of COMPANY_SUFFIXES) {
            cleaned = cleaned.replace(suffix, '');
        }

        // Remove punctuation and extra spaces
        cleaned = cleaned.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();

        // Common Aliases (can be expanded via database or config later)
        const aliases: Record<string, string> = {
            'facebook': 'meta',
            'fb': 'meta',
            'google': 'alphabet', // Debatable, but for matching strictly job apps, usually people say Google
            'aws': 'amazon'
        };

        return aliases[cleaned] || cleaned;
    }

    static cleanJobTitle(title: string): string {
        if (!title) return "";
        let cleaned = title.trim().toLowerCase();

        // Remove levels (optional - sometimes we WANT to distinguish Senior vs Junior, 
        // but for "Grouping" broad matches, removing them helps find duplicates)
        for (const level of TITLE_LEVELS) {
            cleaned = cleaned.replace(level, '');
        }

        // Replace synonyms
        const words = cleaned.split(/\s+/).map(w => TITLE_SYNONYMS[w] || w);
        cleaned = words.join(' ');

        // Remove common non-role words
        cleaned = cleaned.replace(/\b(remote|hybrid|onsite|contract|full time|part time)\b/gi, '');

        return cleaned.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
    }
}
