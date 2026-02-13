
import { auth, signIn, signOut } from "@/auth"

export default async function Navbar() {
    const session = await auth()

    return (
        <nav className="border-b bg-background px-6 py-4 shadow-sm">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <h1 className="text-xl font-bold tracking-tight">Job Hunt Dashboard</h1>
                <div>
                    {session ? (
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground">
                                {session.user?.email}
                            </span>
                            <form
                                action={async () => {
                                    "use server"
                                    await signOut()
                                }}
                            >
                                <button className="text-sm font-medium hover:underline">
                                    Sign Out
                                </button>
                            </form>
                        </div>
                    ) : (
                        <form
                            action={async () => {
                                "use server"
                                await signIn("google")
                            }}
                        >
                            <button className="text-sm font-medium hover:underline">
                                Sign In with Google
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </nav>
    )
}
