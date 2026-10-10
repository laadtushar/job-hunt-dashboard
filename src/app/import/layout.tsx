import { privatePageMetadata } from "@/lib/seo";

// A client component cannot export metadata, so the noindex tags live in this layout.
export const metadata = privatePageMetadata("Bulk Import");

export default function ImportLayout({ children }: { children: React.ReactNode }) {
    return children;
}
