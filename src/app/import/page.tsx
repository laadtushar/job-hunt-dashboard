"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import ImportReviewTable from "@/components/import/ImportReviewTable";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { ExtractedJobData } from "@/services/ai";

export default function ImportPage() {
    const [rawText, setRawText] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [parsedJobs, setParsedJobs] = useState<ExtractedJobData[] | null>(null);

    const handleAnalyze = async () => {
        if (!rawText.trim()) return;
        setIsAnalyzing(true);
        try {
            const res = await fetch("/api/jobs/bulk-analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rawText })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to analyze jobs");
            }

            const data = await res.json();
            setParsedJobs(data.jobs);
        } catch (e) {
            console.error("Bulk Import Error:", e);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <Navbar />
            <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/" className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                        <ArrowLeft className="h-6 w-6 text-slate-500" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Bulk Import</h1>
                        <p className="text-slate-500 dark:text-slate-400">Paste job lists from Excel, Email, or LinkedIn to import them via AI.</p>
                    </div>
                </div>

                {!parsedJobs ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>Paste Raw Text</CardTitle>
                            <CardDescription>
                                Copy and paste any unstructured list of jobs. The AI will try to extract Company, Role, Status, and Location.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea
                                placeholder="Example: 
1. Software Engineer at Google - Applied yesterday
2. Stripe, Product Manager, Interviewing next week
3. Netflix - Senior Dev - Rejected"
                                className="min-h-[300px] font-mono text-sm"
                                value={rawText}
                                onChange={(e) => setRawText(e.target.value)}
                            />
                            <div className="flex justify-end">
                                <Button onClick={handleAnalyze} disabled={isAnalyzing || !rawText.trim()}>
                                    {isAnalyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isAnalyzing ? "Analyzing..." : "Analyze & Parse"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                <strong>AI Analysis Complete:</strong> Found {parsedJobs.length} potential jobs. Please review before saving.
                            </p>
                            <Button variant="outline" size="sm" onClick={() => setParsedJobs(null)}>
                                Reset
                            </Button>
                        </div>

                        <ImportReviewTable jobs={parsedJobs} />
                    </div>
                )}
            </main>
        </div>
    );
}
