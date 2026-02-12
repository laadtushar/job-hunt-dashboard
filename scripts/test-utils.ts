import { Normalizer } from '../src/lib/normalize';
import { UrlUtils } from '../src/lib/url';

console.log("--- Testing Normalizer ---");

const companies = [
    "Stripe, Inc.",
    "Google LLC",
    "Amazon Web Services",
    "  Facebook  ",
    "Twitter"
];

companies.forEach(c => {
    console.log(`'${c}' -> '${Normalizer.cleanCompanyName(c)}'`);
});

const titles = [
    "Senior Software Engineer",
    "SDE II",
    "Frontend Developer",
    "Principal Product Manager",
    "Remote Backend Engineer"
];

titles.forEach(t => {
    console.log(`'${t}' -> '${Normalizer.cleanJobTitle(t)}'`);
});

console.log("\n--- Testing UrlUtils ---");

const urls = [
    "https:// boards.greenhouse.io/stripe/jobs/12345?gh_jid=12345",
    "https://jobs.lever.co/netflix/8394-3948-3939-3939?utm_source=linkedin",
    "https://stripe.com/jobs/listing?ref=linkedin"
];

urls.forEach(u => {
    // Fix space in first url for test
    const fixed = u.replace(" ", "");
    console.log(`'${fixed}'`);
    console.log(`   Clean: '${UrlUtils.normalize(fixed)}'`);
    console.log(`   ID:    '${UrlUtils.extractJobId(fixed)}'`);
});
