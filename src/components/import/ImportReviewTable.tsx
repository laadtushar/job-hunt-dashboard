"use client";

import { ExtractedJobData } from "@/services/ai";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Check, Trash2 } from "lucide-react";
import { saveBulkJobs } from "@/lib/bulk-actions";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

interface ImportReviewTableProps {
    jobs: ExtractedJobData[];
}

export default function ImportReviewTable({ jobs: initialJobs }: ImportReviewTableProps) {
    const [jobs, setJobs] = useState(initialJobs);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const handleChange = (index: number, field: keyof ExtractedJobData, value: any) => {
        const newJobs = [...jobs];
        newJobs[index] = { ...newJobs[index], [field]: value };
        setJobs(newJobs);
    };

    const handleRemove = (index: number) => {
        const newJobs = jobs.filter((_, i) => i !== index);
        setJobs(newJobs);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const result = await saveBulkJobs(jobs);
            if (result.success) {
                toast({
                    title: "Import Successful",
                    description: `Saved ${result.count} new job applications.`,
                });
                router.push("/");
            }
        } catch (e) {
            toast({
                title: "Import Failed",
                description: "Something went wrong while saving jobs.",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (jobs.length === 0) {
        return <div className="text-center p-8 text-muted-foreground">No valid jobs found to review.</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Review & Edit ({jobs.length})</h2>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Confirm & Import All"}
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px]">Company</TableHead>
                            <TableHead className="w-[200px]">Role</TableHead>
                            <TableHead className="w-[150px]">Status</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {jobs.map((job, index) => (
                            <TableRow key={index}>
                                <TableCell>
                                    <Input
                                        value={job.company || ""}
                                        onChange={(e) => handleChange(index, "company", e.target.value)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input
                                        value={job.role || ""}
                                        onChange={(e) => handleChange(index, "role", e.target.value)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Select
                                        value={job.status || "APPLIED"}
                                        onValueChange={(val) => handleChange(index, "status", val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="APPLIED">Applied</SelectItem>
                                            <SelectItem value="SCREEN">Screen</SelectItem>
                                            <SelectItem value="INTERVIEW">Interview</SelectItem>
                                            <SelectItem value="OFFER">Offer</SelectItem>
                                            <SelectItem value="REJECTED">Rejected</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell>
                                    <Input
                                        value={job.location || ""}
                                        onChange={(e) => handleChange(index, "location", e.target.value)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => handleRemove(index)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
