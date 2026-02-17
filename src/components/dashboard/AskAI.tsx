
"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, Send, X, Sparkles, User, Bot, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
// import ReactMarkdown from 'react-markdown' // If available, else just text

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    suggestedQuestions?: string[];
}

export function AskAI() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        { id: 'intro', role: 'assistant', content: "Hi! I'm your Job Hunt AI. I can search your applications and analysis. Ask me anything like \"What's the status of Google?\" or \"Show me high salary jobs\"." }
    ])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, isOpen])

    const handleSend = async (text: string = input) => {
        if (!text.trim() || isLoading) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            const res = await fetch('/api/rag/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });
            const data = await res.json();

            if (data.error) throw new Error(data.error);

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.answer,
                suggestedQuestions: data.suggestedQuestions
            };
            setMessages(prev => [...prev, aiMsg]);

        } catch (e) {
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: "Sorry, I had trouble connecting to the neural network. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="w-[380px] h-[600px] max-h-[80vh] shadow-2xl rounded-2xl overflow-hidden"
                    >
                        <Card className="h-full flex flex-col border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
                            {/* Header */}
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-5 w-5" />
                                    <h3 className="font-bold">Job Hunt AI</h3>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20" onClick={() => setIsOpen(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Chat Area */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                                {messages.map((msg) => (
                                    <div key={msg.id} className={cn("flex gap-3", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                                        <div className={cn(
                                            "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                                            msg.role === 'user' ? "bg-slate-200 dark:bg-slate-700" : "bg-blue-100 dark:bg-blue-900/30 text-blue-600"
                                        )}>
                                            {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                        </div>
                                        <div className={cn(
                                            "rounded-2xl px-4 py-2.5 max-w-[85%] text-sm leading-relaxed",
                                            msg.role === 'user'
                                                ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tr-none"
                                                : "bg-blue-50 dark:bg-blue-900/10 text-slate-800 dark:text-slate-200 rounded-tl-none border border-blue-100 dark:border-blue-900/20"
                                        )}>
                                            <div className="whitespace-pre-wrap">{msg.content}</div>
                                            {msg.suggestedQuestions && (
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {msg.suggestedQuestions.map((q, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => handleSend(q)}
                                                            className="text-xs bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors text-left"
                                                        >
                                                            {q}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex gap-3">
                                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0">
                                            <Bot className="h-4 w-4" />
                                        </div>
                                        <div className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                            <span className="text-xs text-slate-500">Processing...</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Input Area */}
                            <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                                <form
                                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                    className="flex gap-2"
                                >
                                    <Input
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        placeholder="Ask about your applications..."
                                        className="rounded-xl"
                                        disabled={isLoading}
                                    />
                                    <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shrink-0">
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </form>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "h-14 w-14 rounded-full shadow-xl flex items-center justify-center transition-colors relative group",
                    isOpen
                        ? "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                        : "bg-gradient-to-br from-blue-600 to-indigo-600 text-white"
                )}
            >
                {/* Ping animation when closed */}
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500 border-2 border-white"></span>
                    </span>
                )}
                {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}

                {/* Tooltip */}
                {!isOpen && (
                    <span className="absolute right-full mr-4 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        Ask AI Assistant
                    </span>
                )}
            </motion.button>
        </div>
    )
}
