"use client";

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full bg-blue-600 text-white rounded-lg py-3 font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit Request
        </button>
    );
}

export default function DataRequestForm() {
    const [requestType, setRequestType] = useState<'export' | 'delete'>('export');
    const { toast } = useToast();

    async function handleSubmit(formData: FormData) {
        try {
            const response = await fetch('/api/gdpr-request', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Something went wrong');
            }

            toast({
                title: "Request Submitted",
                description: "We have received your request and will process it shortly.",
                variant: "default",
            });

            // Ideally reset form or redirect here
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to submit request",
                variant: "destructive",
            });
        }
    }

    return (
        <form action={handleSubmit} className="space-y-6 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800">
            <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Request Type</label>
                <div className="grid grid-cols-2 gap-4">
                    <button
                        type="button"
                        onClick={() => setRequestType('export')}
                        className={`p-4 rounded-lg border-2 text-center transition-all ${requestType === 'export'
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                    >
                        <span className="block font-semibold">Export Data</span>
                        <span className="text-xs opacity-75">Get a copy of your data</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setRequestType('delete')}
                        className={`p-4 rounded-lg border-2 text-center transition-all ${requestType === 'delete'
                                ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                    >
                        <span className="block font-semibold">Delete Data</span>
                        <span className="text-xs opacity-75">Permanently remove your data</span>
                    </button>
                </div>
                <input type="hidden" name="type" value={requestType} />
            </div>

            <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Email Address associated with account
                </label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="you@example.com"
                />
            </div>

            <div className="space-y-2">
                <label htmlFor="reason" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Reason (Optional)
                </label>
                <textarea
                    id="reason"
                    name="reason"
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                    placeholder="Please let us know why you are making this request..."
                />
            </div>

            <div className="pt-2">
                <SubmitButton />
            </div>

            <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                Takes up to 30 days to process. We may contact you to verify your identity.
            </p>
        </form>
    );
}
