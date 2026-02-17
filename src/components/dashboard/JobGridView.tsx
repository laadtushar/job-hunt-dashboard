
'use client';

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Settings2, CheckCircle2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ALL_COLUMNS = [
    { id: 'company', label: 'Company', alwaysShow: true },
    { id: 'role', label: 'Role', alwaysShow: true },
    { id: 'status', label: 'Status' },
    { id: 'rejectionReason', label: 'Rejection Reason' },
    { id: 'location', label: 'Location' },
    { id: 'appliedDate', label: 'Applied Date' },
    { id: 'source', label: 'Source' },
    { id: 'salary', label: 'Salary' },
    { id: 'recruiter', label: 'Recruiter' },
    { id: 'hiringManager', label: 'Hiring Manager' },
    { id: 'sentiment', label: 'Sentiment' },
];

export function JobGridView({ jobs }: { jobs: any[] }) {
    const [visibleColumns, setVisibleColumns] = useState<string[]>(
        ['company', 'role', 'status', 'rejectionReason', 'location', 'appliedDate', 'source']
    );

    const toggleColumn = (columnId: string) => {
        setVisibleColumns(prev =>
            prev.includes(columnId)
                ? prev.filter(id => id !== columnId)
                : [...prev, columnId]
        );
    };

    const isVisible = (columnId: string) => visibleColumns.includes(columnId);

    const exportToCSV = () => {
        // Export only visible columns
        const headers = ALL_COLUMNS.filter(c => isVisible(c.id)).map(c => c.label);
        const rows = jobs.map(j => {
            const rowData: string[] = [];
            if (isVisible('company')) rowData.push(j.company || "");
            if (isVisible('role')) rowData.push(j.role || "");
            if (isVisible('status')) rowData.push(j.status || "");
            if (isVisible('rejectionReason')) rowData.push(j.rejectionReason || "");
            if (isVisible('location')) rowData.push(j.location || "");
            if (isVisible('appliedDate')) rowData.push(new Date(j.appliedDate).toLocaleDateString());
            if (isVisible('source')) rowData.push(j.source || "MANUAL");
            if (isVisible('salary')) rowData.push(j.salaryRange || "");
            if (isVisible('recruiter')) rowData.push(j.recruiterName || "");
            if (isVisible('hiringManager')) rowData.push(j.hiringManager || "");
            if (isVisible('sentiment')) rowData.push(j.sentimentScore !== null ? `${Math.round(j.sentimentScore * 100)}%` : "");
            return rowData;
        });

        const content = [headers, ...rows].map(r => r.join(",")).join("\n");
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `job_applications_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-white/40 dark:bg-slate-900/40 p-2 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-md">
                <div className="flex items-center gap-2 pl-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                        {jobs.length} Applications <span className="mx-1 text-slate-300">|</span>
                        <span className="text-blue-500">{visibleColumns.length} Columns Visible</span>
                    </span>
                </div>
                <div className="flex gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="rounded-xl gap-2 font-bold">
                                <Settings2 className="h-4 w-4" />
                                Columns
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-2xl border-slate-200 dark:border-slate-800">
                            <DropdownMenuLabel className="font-black text-[10px] uppercase tracking-widest text-slate-400">Toggle Visibility</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {ALL_COLUMNS.map((col) => (
                                <DropdownMenuCheckboxItem
                                    key={col.id}
                                    className="rounded-lg font-medium"
                                    checked={isVisible(col.id)}
                                    onCheckedChange={() => toggleColumn(col.id)}
                                    disabled={col.alwaysShow}
                                >
                                    {col.label}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="outline" size="sm" onClick={exportToCSV} className="rounded-xl gap-2 font-bold text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                        <Download className="h-4 w-4" />
                        Export CSV
                    </Button>
                </div>
            </div>

            <div className="rounded-3xl border bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-slate-200 dark:border-slate-800 hover:bg-transparent">
                                {isVisible('company') && <TableHead className="font-bold">Company</TableHead>}
                                {isVisible('role') && <TableHead className="font-bold">Role</TableHead>}
                                {isVisible('status') && <TableHead className="font-bold text-center">Status</TableHead>}
                                {isVisible('rejectionReason') && <TableHead className="font-bold">Rejection Reason</TableHead>}
                                {isVisible('location') && <TableHead className="font-bold">Location</TableHead>}
                                {isVisible('appliedDate') && <TableHead className="font-bold">Applied Date</TableHead>}
                                {isVisible('source') && <TableHead className="font-bold">Source</TableHead>}
                                {isVisible('salary') && <TableHead className="font-bold">Salary</TableHead>}
                                {isVisible('recruiter') && <TableHead className="font-bold">Recruiter</TableHead>}
                                {isVisible('hiringManager') && <TableHead className="font-bold">Hiring Manager</TableHead>}
                                {isVisible('sentiment') && <TableHead className="font-bold">Sentiment</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {jobs.map((job) => (
                                <TableRow key={job.id} className="border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    {isVisible('company') && <TableCell className="font-semibold">{job.company}</TableCell>}
                                    {isVisible('role') && <TableCell className="max-w-[200px] truncate">{job.role}</TableCell>}
                                    {isVisible('status') && (
                                        <TableCell className="text-center">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${job.status === 'OFFER' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                    job.status === 'REJECTED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                        job.status === 'INTERVIEW' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                                }`}>
                                                {job.status}
                                            </span>
                                        </TableCell>
                                    )}
                                    {isVisible('rejectionReason') && (
                                        <TableCell>
                                            <div className="max-w-[200px] truncate text-xs text-red-600 dark:text-red-400 font-medium" title={job.rejectionReason || ""}>
                                                {job.rejectionReason || "-"}
                                            </div>
                                        </TableCell>
                                    )}
                                    {isVisible('location') && <TableCell className="text-muted-foreground whitespace-nowrap">{job.location || 'Remote'}</TableCell>}
                                    {isVisible('appliedDate') && (
                                        <TableCell className="text-slate-500 whitespace-nowrap">
                                            {new Date(job.appliedDate).toLocaleDateString()}
                                        </TableCell>
                                    )}
                                    {isVisible('source') && <TableCell className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{job.source || 'MANUAL'}</TableCell>}
                                    {isVisible('salary') && (
                                        <TableCell className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                            {job.salaryRange || "-"}
                                        </TableCell>
                                    )}
                                    {isVisible('recruiter') && (
                                        <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                                            {job.recruiterName || job.recruiterEmail || "-"}
                                        </TableCell>
                                    )}
                                    {isVisible('hiringManager') && (
                                        <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                                            {job.hiringManager || "-"}
                                        </TableCell>
                                    )}
                                    {isVisible('sentiment') && (
                                        <TableCell>
                                            {job.sentimentScore !== null ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-12 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-blue-500"
                                                            style={{ width: `${Math.round(job.sentimentScore * 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                                                        {Math.round(job.sentimentScore * 100)}%
                                                    </span>
                                                </div>
                                            ) : "-"}
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}

