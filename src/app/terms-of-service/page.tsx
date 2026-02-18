import Navbar from "@/components/Navbar";

export default function TermsOfServicePage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <Navbar />
            <div className="max-w-4xl mx-auto py-12 px-6">
                <h1 className="text-3xl font-bold mb-8 text-slate-900 dark:text-slate-100">Terms of Service</h1>

                <div className="prose dark:prose-invert max-w-none space-y-6 text-slate-700 dark:text-slate-300">
                    <p>Last updated: {new Date().toLocaleDateString()}</p>

                    <section>
                        <h2 className="text-xl font-semibold mb-3 text-slate-900 dark:text-slate-100">1. Agreement to Terms</h2>
                        <p>
                            By accessing our website, you agree to be bound by these Terms of Service and to comply with all applicable laws and regulations.
                            If you do not agree with these terms, you are prohibited from using or accessing this site.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3 text-slate-900 dark:text-slate-100">2. Use License</h2>
                        <p>
                            Permission is granted to temporarily download one copy of the materials (information or software) on Meridian's website for personal,
                            non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-2">
                            <li>modify or copy the materials;</li>
                            <li>use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
                            <li>attempt to decompile or reverse engineer any software contained on Meridian's website;</li>
                            <li>remove any copyright or other proprietary notations from the materials; or</li>
                            <li>transfer the materials to another person or "mirror" the materials on any other server.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3 text-slate-900 dark:text-slate-100">3. Disclaimer</h2>
                        <p>
                            The materials on Meridian's website are provided on an 'as is' basis. Meridian makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3 text-slate-900 dark:text-slate-100">4. Limitations</h2>
                        <p>
                            In no event shall Meridian or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Meridian's website, even if Meridian or a Meridian authorized representative has been notified orally or in writing of the possibility of such damage.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3 text-slate-900 dark:text-slate-100">5. Governing Law</h2>
                        <p>
                            These terms and conditions are governed by and construed in accordance with the laws and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
