
'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function JobGridView({ jobs }: { jobs: any[] }) {

    const exportToCSV = () => {
        const headers = ["Company", "Role", "Status", "Location", "Applied Date", "Source"];
        const rows = jobs.map(j => [
            j.company,
            j.role,
            j.status,
            j.location || "",
            new Date(j.appliedDate).toLocaleDateString(),
            j.source || "MANUAL"
        ]);

        const content = [headers, ...rows].map(r => r.join(",")).join("\n");
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `job_applications_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={exportToCSV} className="rounded-xl gap-2">
                    <Download className="h-4 w-4" />
                    Export CSV
                </Button>
            </div>
            <div className="rounded-3xl border bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden shadow-xl">
                <Table>
                    <TableHeader>
                        <TableRow className="border-slate-200 dark:border-slate-800 hover:bg-transparent">
                            <TableHead className="font-bold">Company</TableHead>
                            <TableHead className="font-bold">Role</TableHead>
                            <TableHead className="font-bold text-center">Status</TableHead>
                            <TableHead className="font-bold">Location</TableHead>
                            <TableHead className="font-bold">Applied Date</TableHead>
                            <TableHead className="font-bold">Source</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {jobs.map((job) => (
                            <TableRow key={job.id} className="border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <TableCell className="font-semibold">{job.company}</TableCell>
                                <TableCell>{job.role}</TableCell>
                                <TableCell className="text-center">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${job.status === 'OFFER' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                            job.status === 'REJECTED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                job.status === 'INTERVIEW' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                        }`}>
                                        {job.status}
                                    </span>
                                </TableCell>
                                <TableCell className="text-muted-foreground">{job.location || 'Remote'}</TableCell>
                                <TableCell className="text-slate-500 whitespace-nowrap">
                                    {new Date(job.appliedDate).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-[10px] font-bold text-slate-400">{job.source || 'MANUAL'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
