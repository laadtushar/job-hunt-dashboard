import { privatePageMetadata } from "@/lib/seo";

// A page marked "use server" cannot export metadata, so the noindex tags live in this layout.
export const metadata = privatePageMetadata("Access Pending");

export default function AccessDeniedLayout({ children }: { children: React.ReactNode }) {
    return children;
}
