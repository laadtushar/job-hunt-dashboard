import Navbar from "@/components/Navbar";
import DataRequestForm from "@/components/compliance/DataRequestForm";

export default function DataRequestPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
            <Navbar />

            <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 md:py-20 flex flex-col md:flex-row gap-12 items-start">
                <div className="w-full md:w-1/2 space-y-6">
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
                        Manage Your Data
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                        We value your privacy and give you control over your data.
                        Under GDPR and other privacy laws, you have the right to request a copy of your data or ask for it to be deleted.
                    </p>

                    <div className="space-y-4 pt-4">
                        <div className="flex gap-4 items-start">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400 font-bold">1</div>
                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-white">Request Submission</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Submit the form with your account email and request details.</p>
                            </div>
                        </div>

                        <div className="flex gap-4 items-start">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400 font-bold">2</div>
                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-white">Verification</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">We will verify your identity to ensure security before processing.</p>
                            </div>
                        </div>

                        <div className="flex gap-4 items-start">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400 font-bold">3</div>
                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-white">Processing</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">We will process your request within 30 days and notify you upon completion.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full md:w-1/2">
                    <DataRequestForm />
                </div>
            </div>
        </div>
    );
}
