"use client"

import { Button } from "@/components/ui/button"
import {
    Compass,
    Mail,
    Sparkles,
    Clock,
    ShieldCheck,
    Zap,
    MousePointer2,
    CheckCircle2,
    ArrowRight,
    Search,
    BrainCircuit,
    Layers,
    Bot,
    Terminal
} from "lucide-react"
import { motion } from "framer-motion"
import Image from "next/image"

export default function LandingPage({ loginAction }: { loginAction: any }) {
    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-blue-500/30 selection:text-blue-900 overflow-x-hidden">
            {/* Hero Section */}
            <section className="relative pt-20 pb-0 md:pt-32 flex flex-col items-center px-6">
                {/* Background Gradients */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="max-w-4xl text-center space-y-8"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm shadow-blue-500/5">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                        </span>
                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em] pt-0.5">
                            Now tracking 10,482 applications today
                        </span>
                    </div>

                    <h1 className="text-5xl md:text-8xl font-black tracking-tight leading-[0.9] text-slate-950 dark:text-white">
                        Your career hunt, <br />
                        <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 bg-clip-text text-transparent italic">
                            orchestrated.
                        </span>
                    </h1>

                    <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                        Stop the spreadsheet madness. Meridian automatically syncs your Gmail,
                        extracts details with Agentic AI, and builds a premium command center for your next big role.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <form action={loginAction}>
                            <Button size="lg" className="h-16 px-10 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 text-lg font-black transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-blue-500/30 group">
                                Launch Your Dashboard
                                <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </form>
                        <Button variant="outline" size="lg" className="h-16 px-10 rounded-2xl border-2 font-bold hover:bg-slate-50 dark:hover:bg-slate-900">
                            View Demo
                        </Button>
                    </div>
                </motion.div>

                {/* Dashboard Preview Frame */}
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.2, ease: "circOut" }}
                    className="mt-20 w-full max-w-6xl relative"
                >
                    <div className="absolute inset-0 bg-blue-500/20 blur-[100px] -z-10 rounded-full scale-90" />
                    <div className="rounded-t-3xl border-x-8 border-t-8 border-slate-900/5 dark:border-white/5 shadow-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 backdrop-blur-3xl aspect-[16/9] relative group">
                        <div className="h-8 bg-slate-900/10 dark:bg-white/10 flex items-center px-4 gap-1.5">
                            <div className="h-3 w-3 rounded-full bg-red-400/50" />
                            <div className="h-3 w-3 rounded-full bg-amber-400/50" />
                            <div className="h-3 w-3 rounded-full bg-green-400/50" />
                        </div>
                        <div className="relative h-full w-full">
                            <Image
                                src="/screenshots/dashboard.png"
                                alt="Meridian Dashboard"
                                fill
                                className="object-cover object-top p-4"
                                priority
                            />
                        </div>
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end justify-center p-12">
                            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl flex items-center gap-3 text-slate-900 dark:text-white">
                                <Zap className="h-4 w-4 text-blue-500" />
                                Experience the future of tracking
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Workflow section */}
            <section className="py-32 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-20 space-y-4">
                        <h2 className="text-sm font-black text-blue-500 uppercase tracking-[0.3em]">Agentic Pipeline</h2>
                        <h3 className="text-4xl md:text-5xl font-black text-slate-950 dark:text-white leading-tight">Sync, Analyze, Succeed.</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {[
                            { title: "Neural Sync", icon: Mail, desc: "Surgical inbox extraction bypassing platform limits.", color: "blue" },
                            { title: "AI Analysis", icon: BrainCircuit, desc: "Gemini 2.0 structures messy emails into clean job data.", color: "indigo" },
                            { title: "Consolidation", icon: Layers, desc: "L1-L4 layers merge fragmented threads into one view.", color: "purple" },
                            { title: "Smart Prep", icon: Sparkles, desc: "Get tailored interview advice & status alerts automatically.", color: "green" }
                        ].map((step, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -10 }}
                                className="p-8 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 relative group overflow-hidden"
                            >
                                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-6`} style={{ backgroundColor: `var(--${step.color}-500)` }}>
                                    {/* Fallback to simple colors if tailwind arbitrary bg fails */}
                                    <div className={`inset-0 absolute bg-${step.color}-500/10 opacity-100`} />
                                    <step.icon className={`h-7 w-7 text-${step.color}-500 relative z-10`} />
                                </div>
                                <h4 className="text-xl font-black text-slate-900 dark:text-white mb-3">{step.title}</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{step.desc}</p>
                                <div className="absolute -bottom-4 -right-4 text-8xl font-black text-slate-900/5 dark:text-white/5 italic select-none">
                                    0{i + 1}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Deep Dive Features */}
            <section className="py-32 bg-slate-950 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-blue-500/10 rounded-full blur-[150px] translate-x-1/2 -translate-y-1/2 pointer-events-none" />

                <div className="max-w-6xl mx-auto px-6 space-y-40">
                    {/* Feature 1 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="space-y-8">
                            <Badge className="bg-blue-600 text-white border-none py-1.5 px-4 rounded-full font-black text-[10px] uppercase tracking-widest">Performance</Badge>
                            <h2 className="text-4xl md:text-6xl font-black leading-tight">Neural Batch <br /><span className="text-blue-500 italic">Parallel Sync</span></h2>
                            <p className="text-lg text-slate-400 font-medium leading-relaxed">
                                Most trackers time out when you have 1000+ emails. Meridian uses a unique client-orchestrated parallel architecture that processes emails in concurrent batches of 25.
                                <br /><br />
                                Sync months of history in seconds, with surgical precision using Gmail's native `after:` and `before:` query parameters.
                            </p>
                            <ul className="space-y-4">
                                {['Zero platform timeouts', 'Client-side threading', 'Historical deep-scanning'].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm font-bold">
                                        <CheckCircle2 className="h-5 w-5 text-blue-500" /> {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <motion.div
                            whileHover={{ scale: 1.02, rotate: -1 }}
                            className="relative rounded-3xl overflow-hidden border border-white/10 shadow-3xl bg-slate-900"
                        >
                            <Image
                                src="/screenshots/sync_running.png"
                                alt="Sync Engine"
                                width={800}
                                height={500}
                                className="object-cover"
                            />
                        </motion.div>
                    </div>

                    {/* Feature 2 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            whileHover={{ scale: 1.02, rotate: 1 }}
                            className="relative rounded-3xl overflow-hidden border border-white/10 shadow-3xl bg-slate-900 order-2 lg:order-1"
                        >
                            <Image
                                src="/screenshots/Smart_consolidation.png"
                                alt="Smart Consolidation"
                                width={800}
                                height={500}
                                className="object-cover"
                            />
                        </motion.div>
                        <div className="space-y-8 order-1 lg:order-2">
                            <Badge className="bg-purple-600 text-white border-none py-1.5 px-4 rounded-full font-black text-[10px] uppercase tracking-widest">Data Integrity</Badge>
                            <h2 className="text-4xl md:text-6xl font-black leading-tight">Smart Identity <br /><span className="text-purple-500 italic">Resolution</span></h2>
                            <p className="text-lg text-slate-400 font-medium leading-relaxed">
                                Career search is messy. Meridian identifies that "Recruiter John" from "Apple" and a generic "System Alert" for "SDE Role" are actually the same application.
                                <br /><br />
                                Our L1-L4 matching layers use semantic reasoning to group interview invites, role updates, and offer letters into a single source of truth.
                            </p>
                            <ul className="space-y-4">
                                {['Semantic company matching', 'Multi-layer deduplication', 'Automated thread grouping'].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm font-bold">
                                        <CheckCircle2 className="h-5 w-5 text-purple-500" /> {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trust & Transparency Section */}
            <section className="py-32 bg-white dark:bg-slate-950 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-24 items-center">
                        <div className="order-2 md:order-1 grid grid-cols-1 gap-8">
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                                className="relative rounded-[2rem] border border-slate-200 dark:border-slate-800 p-2 bg-slate-50 dark:bg-slate-900 shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500"
                            >
                                <Image
                                    src="/screenshots/Log.png"
                                    alt="Neural Logs"
                                    width={600}
                                    height={400}
                                    className="rounded-[1.5rem] shadow-inner"
                                />
                                <div className="absolute -bottom-6 -right-6 bg-slate-900 text-white p-4 rounded-2xl shadow-xl font-bold text-xs flex items-center gap-3 border border-white/10">
                                    <Terminal className="h-4 w-4 text-blue-400" />
                                    Real-time Neural Trace
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="relative rounded-[2rem] border border-slate-200 dark:border-slate-800 p-2 bg-slate-50 dark:bg-slate-900 shadow-2xl -rotate-2 hover:rotate-0 transition-transform duration-500 ml-12"
                            >
                                <Image
                                    src="/screenshots/trust_list.png"
                                    alt="Trust List"
                                    width={600}
                                    height={400}
                                    className="rounded-[1.5rem] shadow-inner"
                                />
                                <div className="absolute -bottom-6 -left-6 bg-blue-600 text-white p-4 rounded-2xl shadow-xl font-bold text-xs flex items-center gap-3 border border-white/10">
                                    <ShieldCheck className="h-4 w-4 text-white" />
                                    Invite-Only Security
                                </div>
                            </motion.div>
                        </div>

                        <div className="order-1 md:order-2 space-y-10">
                            <div className="space-y-4 text-center md:text-left">
                                <h2 className="text-sm font-black text-blue-500 uppercase tracking-[0.3em]">Governance</h2>
                                <h3 className="text-4xl md:text-6xl font-black text-slate-950 dark:text-white leading-tight">Trust through <br /><span className="text-blue-500 italic">Total Visibility.</span></h3>
                                <p className="text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-xl">
                                    We believe AI shouldn't be a black box. Meridian provides surgical logs for every neural decision and a robust permission system to keep your data exclusively yours.
                                </p>
                            </div>

                            <div className="space-y-6">
                                {[
                                    { title: "Neural Protocol Logging", desc: "Audit every extraction, match, and AI decision in real-time.", icon: Terminal },
                                    { title: "Zero-Knowledge Trust", desc: "Invite-only architecture ensures only authorized users touch the system.", icon: ShieldCheck }
                                ].map((feature, i) => (
                                    <div key={i} className="flex gap-6 p-6 rounded-3xl hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                        <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                            <feature.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs">{feature.title}</h4>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{feature.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Agentic Flow Diagram Section */}
            <section className="py-32 bg-slate-50 dark:bg-slate-950 px-6">
                <div className="max-w-4xl mx-auto text-center space-y-16">
                    <div className="space-y-4">
                        <h2 className="text-sm font-black text-blue-500 uppercase tracking-[0.3em]">The Machine</h2>
                        <h3 className="text-4xl md:text-5xl font-black text-slate-950 dark:text-white">Why Meridian Wins.</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 text-left">
                        <div className="space-y-10">
                            <div className="space-y-4">
                                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl w-fit shadow-xl shadow-blue-500/5 ring-1 ring-slate-200 dark:ring-slate-800">
                                    <Bot className="h-6 w-6 text-blue-600" />
                                </div>
                                <h4 className="text-2xl font-black">Reflexion Loops</h4>
                                <p className="text-slate-500 dark:text-slate-400 font-medium">When data is unclear, Meridian re-interrogates your inbox. Our "Improve AI" feature uses your feedback to critiques its previous analysis and self-correct.</p>
                            </div>
                            <div className="space-y-4">
                                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl w-fit shadow-xl shadow-blue-500/5 ring-1 ring-slate-200 dark:ring-slate-800">
                                    <ShieldCheck className="h-6 w-6 text-green-600" />
                                </div>
                                <h4 className="text-2xl font-black">Truth Discovery</h4>
                                <p className="text-slate-500 dark:text-slate-400 font-medium">We don't just dump email text. We identify sentiment, next steps, and recruiter names so you're always one step ahead in the follow-up game.</p>
                            </div>
                        </div>

                        <div className="bg-blue-600 p-12 rounded-[3rem] text-white flex flex-col justify-between group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none group-hover:scale-125 transition-transform duration-700">
                                <Layers className="h-48 w-48 text-white" />
                            </div>
                            <div className="space-y-6 relative">
                                <h4 className="text-4xl font-black leading-tight">Ready to reclaim your time?</h4>
                                <p className="text-blue-100 font-medium">Join 500+ professionals using Meridian to land their next big opportunity.</p>
                            </div>
                            <form action={loginAction} className="relative mt-12">
                                <Button size="lg" className="w-full h-14 bg-white text-blue-600 hover:bg-slate-100 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">
                                    Get Started Now
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer Section */}
            <footer className="py-20 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
                    <div className="col-span-1 md:col-span-2 space-y-6">
                        <div className="flex items-center gap-2 group cursor-pointer">
                            <div className="h-8 w-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black group-hover:rotate-12 transition-transform shadow-lg shadow-blue-500/20">M</div>
                            <span className="text-xl font-black tracking-tighter text-slate-900 dark:text-white">Meridian</span>
                        </div>
                        <p className="max-w-xs text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                            Orchestrating the world's career hunts with autonomous AI and high-performance engineering.
                        </p>
                    </div>
                    <div>
                        <h5 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-6">Product</h5>
                        <ul className="space-y-4 text-sm font-bold text-slate-600 dark:text-slate-400">
                            <li className="hover:text-blue-500 cursor-pointer transition-colors">How it works</li>
                            <li className="hover:text-blue-500 cursor-pointer transition-colors">Neural Sync</li>
                            <li className="hover:text-blue-500 cursor-pointer transition-colors">Privacy Policy</li>
                        </ul>
                    </div>
                    <div>
                        <h5 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-6">Connect</h5>
                        <ul className="space-y-4 text-sm font-bold text-slate-600 dark:text-slate-400">
                            <li className="hover:text-blue-500 cursor-pointer transition-colors">GitHub</li>
                            <li className="hover:text-blue-500 cursor-pointer transition-colors">LinkedIn</li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-6xl mx-auto px-6 mt-20 pt-10 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">© 2026 Meridian Labs. Built for the ambitious.</p>
                </div>
            </footer>
        </div>
    )
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
            {children}
        </span>
    )
}
