import { privatePageMetadata } from "@/lib/seo";

// A page marked "use server" cannot export metadata, so the noindex tags live in this layout.
export const metadata = privatePageMetadata("Pipeline");

export default function KanbanLayout({ children }: { children: React.ReactNode }) {
    return children;
}
