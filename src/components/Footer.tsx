import Link from 'next/link';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 py-8 md:py-12 mt-auto">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex flex-col items-center md:items-start gap-2">
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6">
                            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
                                <defs>
                                    <linearGradient id="footer-g" gradientUnits="userSpaceOnUse" x1="16" y1="12" x2="48" y2="52">
                                        <stop offset="0%" stopColor="#4d6bff" />
                                        <stop offset="100%" stopColor="#22d3ee" />
                                    </linearGradient>
                                </defs>
                                <path d="M16 12V52M48 12V52M16 32H48" stroke="url(#footer-g)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="6" />
                                <circle cx="16" cy="12" r="4" fill="#4d6bff" />
                                <circle cx="48" cy="52" r="4" fill="#22d3ee" />
                            </svg>
                        </div>
                        <span className="text-lg font-bold"><span className="text-slate-900 dark:text-white">Hyred</span><span className="font-light text-slate-500 dark:text-slate-400">Lab</span></span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        © {currentYear} HyredLab. All rights reserved.
                    </p>
                </div>

                <div className="flex flex-wrap justify-center gap-6 md:gap-8">
                    <Link href="/privacy-policy" className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        Privacy Policy
                    </Link>
                    <Link href="/terms-of-service" className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        Terms of Service
                    </Link>
                    <Link href="/data-request" className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        Data Request (GDPR)
                    </Link>
                </div>
            </div>
        </footer>
    );
}
