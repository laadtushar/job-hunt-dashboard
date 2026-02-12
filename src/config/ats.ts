// Initial list of known ATS providers and their URL patterns for Job ID extraction
// Tuple: [Host Regex, ID Extraction Regex]

export const ATS_CONFIG: [RegExp, RegExp][] = [
    // --- Startups / Modern ATS ---
    [/greenhouse\.io/, /jobs\/(\d+)/],                 // greenhouse.io/company/jobs/123
    [/boards\.greenhouse\.io/, /\/jobs\/(\d+)/],       // boards.greenhouse.io/company/jobs/123
    [/lever\.co/, /\/([0-9a-f-]{10,})/],               // jobs.lever.co/company/UUID
    [/ashbyhq\.com/, /\/([0-9a-f-]{10,})/],            // jobs.ashbyhq.com/company/UUID
    [/workable\.com/, /\/j\/([A-Z0-9]+)/],             // apply.workable.com/company/j/CODE
    [/breezy\.hr/, /\/p\/([0-9a-f]+)/],                // company.breezy.hr/p/HEXCODE
    [/dover\.io/, /\/apply\/([0-9a-f-]+)/],            // dover.io/apply/UUID

    // --- Enterprise / Legacy ATS ---
    [/myworkdayjobs\.com/, /job\/.*_([A-Za-z0-9]+)/], // company.myworkdayjobs.com/ns/job/title_JOBID
    [/taleo\.net/, /jobdetail\.ftl\?job=(\d+)/],       // company.taleo.net/careersection/jobdetail?job=123
    [/smartrecruiters\.com/, /\/([a-f0-9-]{10,})/],    // jobs.smartrecruiters.com/company/UUID
    [/jobvite\.com/, /\/job\/([a-zA-Z0-9]+)/],         // jobs.jobvite.com/company/job/CODE
    [/icims\.com/, /jobs\/(\d+)/],                     // company.icims.com/jobs/123
    [/adp\.com/, /requisitionId=(\d+)/],               // workforcenow.adp.com...requisitionId=123
    [/successfactors\.com/, /career\?.*career_ns=job_listing.*&career_job_req_id=(\d+)/], // SAP
    [/brassring\.com/, /jobId=(\d+)/]                  // sjobs.brassring.com...
];
