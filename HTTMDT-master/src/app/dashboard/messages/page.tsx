"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { MessageSquare, Loader2, Send, Search, CheckCircle2, UserCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";

interface MessageType {
    _id: string;
    senderId: any;
    receiverId: any;
    propertyId: any;
    content: string;
    isRead: boolean;
    createdAt: string;
}

interface PeerType {
    id: string;
    name: string;
    avatar: string;
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
    propertyRef?: string;
    propertyTitle?: string;
}

function InboxContent() {
    const { data: session } = useSession();
    const searchParams = useSearchParams();
    const initialPeer = searchParams.get("peer");
    
    const [messages, setMessages] = useState<MessageType[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    
    // Derived state
    const [peers, setPeers] = useState<PeerType[]>([]);
    const [supportPeer, setSupportPeer] = useState<PeerType | null>(null);
    const [activePeerId, setActivePeerId] = useState<string | null>(initialPeer || null);
    const [replyText, setReplyText] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    const messagesViewportRef = useRef<HTMLDivElement>(null);

    const visiblePeers = useMemo(() => {
        if (!supportPeer) return peers;

        const peerMap = new Map(peers.map(peer => [peer.id, peer]));
        if (!peerMap.has(supportPeer.id)) {
            peerMap.set(supportPeer.id, supportPeer);
        }

        return Array.from(peerMap.values());
    }, [peers, supportPeer]);

    const loadMessages = async (isBackground = false) => {
        try {
            if (!isBackground) setLoading(true);
            const res = await fetch("/api/messages");
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        } catch(err) {
            console.error(err);
        } finally {
            if (!isBackground) setLoading(false);
        }
    }

    // Polling every 4 seconds
    useEffect(() => {
        if (!session) return;
        loadMessages();
        const intervalId = setInterval(() => {
            loadMessages(true);
        }, 4000);
        return () => clearInterval(intervalId);
    }, [session]);

    // Process messages into peer groups when messages change
    useEffect(() => {
        if (!session?.user?.id) return;

        if (!messages.length) {
            setPeers([]);
            if (!supportPeer || activePeerId !== supportPeer.id) {
                setActivePeerId(null);
            }
            return;
        }
        
        const myId = session.user.id;
        const peerMap = new Map<string, PeerType>();

        // Messages are sorted newest first by the API, but let's reverse them for chronological rendering
        const chronological = [...messages].reverse();

        chronological.forEach(msg => {
            const isSender = msg.senderId._id === myId;
            const peer = isSender ? msg.receiverId : msg.senderId;
            if (!peer || !peer._id) return;

            const existing = peerMap.get(peer._id);
            const isUnread = !isSender && !msg.isRead;

            peerMap.set(peer._id, {
                id: peer._id,
                name: peer.name || "Người dùng",
                avatar: peer.avatar || "",
                lastMessage: msg.content,
                lastMessageTime: msg.createdAt,
                unreadCount: (existing?.unreadCount || 0) + (isUnread ? 1 : 0),
                propertyRef: msg.propertyId?._id || existing?.propertyRef,
                propertyTitle: msg.propertyId?.title || existing?.propertyTitle
            });
        });

        // Convert to array and sort by latest message time
        const sortedPeers = Array.from(peerMap.values()).sort((a, b) => 
            new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
        );

        setPeers(sortedPeers);

        // Auto-select first peer if none selected
        if (!activePeerId && sortedPeers.length > 0) {
            setActivePeerId(sortedPeers[0].id);
        }
    }, [messages, session, activePeerId, supportPeer]);

    // Update read status implicitly when viewing a chat
    useEffect(() => {
        if (!activePeerId || !session?.user?.id) return;
        
        const unreadMsgIds = messages
            .filter(m => m.senderId._id === activePeerId && m.receiverId._id === session.user.id && !m.isRead)
            .map(m => m._id);

        unreadMsgIds.forEach(id => {
            fetch(`/api/messages/${id}/read`, { method: 'PATCH' }).catch(console.error);
        });

        // Optimistically update local state to reflect read
        if (unreadMsgIds.length > 0) {
             setMessages(prev => prev.map(m => unreadMsgIds.includes(m._id) ? { ...m, isRead: true } : m));
             window.dispatchEvent(new Event("message-unread-refresh"));
        }
    }, [activePeerId, messages, session]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || !activePeerId || !session?.user?.id) return;

        setSending(true);
        const textToSend = replyText;
        setReplyText(""); // Optimistic clear

        // Find context property
        const activePeer = visiblePeers.find(p => p.id === activePeerId);
        
        try {
            const res = await fetch("/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    receiverId: activePeerId, 
                    content: textToSend,
                    propertyId: activePeer?.propertyRef // carry over context
                })
            });
            if (res.ok) {
                // Optimistically fetch to show immediate result
                loadMessages(true);
            }
        } catch(err) {
            console.error(err);
        } finally {
            setSending(false);
        }
    };

    const handleDeleteConversation = async (peerId: string, peerName?: string) => {
        if (!session?.user?.id) return;
        const myId = session.user.id;
        if (!confirm(`Xóa toàn bộ cuộc trò chuyện với ${peerName || "người này"} khỏi hộp thư của bạn?`)) return;

        try {
            const res = await fetch(`/api/messages/conversations/${peerId}`, { method: "DELETE" });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                alert(data.error || "Không thể xóa cuộc trò chuyện.");
                return;
            }

            setMessages(prev => prev.filter(m => {
                const isConversation =
                    (m.senderId._id === peerId && m.receiverId._id === myId) ||
                    (m.receiverId._id === peerId && m.senderId._id === myId);
                return !isConversation;
            }));

            if (activePeerId === peerId) {
                setActivePeerId(null);
            }
            if (supportPeer?.id === peerId) {
                setSupportPeer(null);
            }
            window.dispatchEvent(new Event("message-unread-refresh"));
        } catch (err) {
            console.error(err);
            alert("Không thể xóa cuộc trò chuyện.");
        }
    };

    const handleStartAdminChat = async () => {
        try {
            const res = await fetch("/api/messages/admin", { cache: "no-store" });
            const data = await res.json();

            if (!res.ok) {
                alert(data.error || "Không thể mở hội thoại với admin.");
                return;
            }

            const adminPeer: PeerType = {
                id: data.id,
                name: data.name || "Admin An Cư Plus",
                avatar: data.avatar || "",
                lastMessage: "Bắt đầu hội thoại với admin",
                lastMessageTime: new Date().toISOString(),
                unreadCount: 0,
            };

            setSupportPeer(adminPeer);
            setActivePeerId(adminPeer.id);
            setSearchQuery("");
        } catch (err) {
            console.error(err);
            alert("Không thể mở hội thoại với admin.");
        }
    };

    const handleDeleteMessage = async (message: MessageType, isMe: boolean) => {
        const mode = isMe ? "everyone" : "me";
        const confirmText = isMe
            ? "Gỡ tin nhắn này cho cả hai bên? Người nhận sẽ không còn thấy tin nhắn này."
            : "Xóa tin nhắn này khỏi phía bạn?";

        if (!confirm(confirmText)) return;

        try {
            const res = await fetch(`/api/messages/${message._id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mode }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                alert(data.error || "Không thể xóa tin nhắn.");
                return;
            }

            setMessages(prev => prev.filter(m => m._id !== message._id));
            window.dispatchEvent(new Event("message-unread-refresh"));
        } catch (err) {
            console.error(err);
            alert("Không thể xóa tin nhắn.");
        }
    };

    // Get messages for the active conversation, chronologically
    const activeMessages = useMemo(() => messages.filter(
        m => (m.senderId._id === activePeerId && m.receiverId._id === session?.user?.id) ||
             (m.receiverId._id === activePeerId && m.senderId._id === session?.user?.id)
    ).reverse(), [activePeerId, messages, session?.user?.id]);

    const latestActiveMessageId = activeMessages[activeMessages.length - 1]?._id || "";

    // Keep scrolling inside the chat viewport only. scrollIntoView can move the whole page.
    useEffect(() => {
        const viewport = messagesViewportRef.current;
        if (!viewport) return;

        viewport.scrollTo({
            top: viewport.scrollHeight,
            behavior: "auto",
        });
    }, [activePeerId, latestActiveMessageId]);

    if (loading && messages.length === 0) {
        return <div className="flex justify-center items-center h-[70vh]"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
    }

    const filteredPeers = visiblePeers.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="container mx-auto p-4 max-w-6xl h-[calc(100vh-80px)] flex flex-col">
            <div className="bg-card border rounded-2xl shadow-sm overflow-hidden flex flex-1 w-full h-full my-2">
                
                {/* LEFT SIDEBAR: Conversations */}
                <div className={`${activePeerId ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-r flex-col bg-muted/10`}>
                    <div className="p-4 border-b bg-background">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <h2 className="font-bold text-xl flex items-center gap-2">
                                <MessageSquare className="w-6 h-6 text-primary" /> Messenger
                            </h2>
                            {session?.user?.role !== "admin" && (
                                <button
                                    onClick={handleStartAdminChat}
                                    className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                                >
                                    Nhắn admin
                                </button>
                            )}
                        </div>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                            <input 
                                type="text"
                                placeholder="Tìm kiếm liên hệ..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm bg-muted rounded-full focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto w-full">
                        {visiblePeers.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                                <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
                                <p className="text-sm">Hộp thư của bạn đang trống.</p>
                                {session?.user?.role !== "admin" && (
                                    <button
                                        onClick={handleStartAdminChat}
                                        className="mt-4 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                                    >
                                        Nhắn admin
                                    </button>
                                )}
                            </div>
                        ) : (
                            filteredPeers.map(peer => (
                                <div
                                    key={peer.id}
                                    className={`group flex w-full items-center gap-2 border-b border-l-4 p-2 transition-colors last:border-b-0 hover:bg-muted/50 ${activePeerId === peer.id ? "bg-primary/5 border-l-primary" : "border-l-transparent"}`}
                                >
                                    <button
                                        onClick={() => setActivePeerId(peer.id)}
                                        className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-1 text-left"
                                    >
                                        <div className="relative shrink-0">
                                            {peer.avatar ? (
                                                <img src={peer.avatar} alt="avatar" className="w-12 h-12 rounded-full object-cover" />
                                            ) : (
                                                <UserCircle className="w-12 h-12 text-muted-foreground" />
                                            )}
                                            {peer.unreadCount > 0 && (
                                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-background">
                                                    {peer.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-0.5">
                                                <h4 className="font-semibold text-sm truncate pr-2">{peer.name}</h4>
                                                <span className="text-[10px] text-muted-foreground shrink-0">
                                                    {new Date(peer.lastMessageTime).toLocaleTimeString("vi-VN", {hour: '2-digit', minute:'2-digit'})}
                                                </span>
                                            </div>
                                            <p className={`text-xs truncate ${peer.unreadCount > 0 ? "font-bold text-foreground" : "text-muted-foreground"}`}>
                                                {peer.lastMessage}
                                            </p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => handleDeleteConversation(peer.id, peer.name)}
                                        title="Xóa cuộc trò chuyện"
                                        className="rounded-md p-2 text-muted-foreground opacity-100 transition-colors hover:bg-red-50 hover:text-red-600 md:opacity-0 md:group-hover:opacity-100"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* RIGHT PANE: Chat Box */}
                <div className={`${!activePeerId ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-background relative`}>
                    {!activePeerId ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-muted/5">
                            <MessageSquare className="w-16 h-16 opacity-10 mb-4" />
                            <p className="text-lg font-medium">Chọn một hội thoại</p>
                            <p className="text-sm">Bấm vào người dùng bên trái hoặc nhắn admin để bắt đầu.</p>
                            {session?.user?.role !== "admin" && (
                                <button
                                    onClick={handleStartAdminChat}
                                    className="mt-5 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                                >
                                    Nhắn admin
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div className="h-16 border-b flex items-center justify-between px-4 bg-background z-10 sticky top-0">
                                <div className="flex items-center gap-3">
                                    {/* Mobile back button */}
                                    <button onClick={() => setActivePeerId(null)} className="md:hidden mr-2 p-1 bg-muted rounded-full">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                                    </button>
                                    
                                    {(() => {
                                        const peer = visiblePeers.find(p => p.id === activePeerId);
                                        return (
                                            <>
                                                {peer?.avatar ? (
                                                    <img src={peer.avatar} className="w-10 h-10 rounded-full" />
                                                ) : (
                                                    <UserCircle className="w-10 h-10 text-muted-foreground" />
                                                )}
                                                <div>
                                                    <h3 className="font-bold text-sm leading-none">{peer?.name}</h3>
                                                    {peer?.propertyRef && (
                                                        <Link href={`/property/${peer.propertyRef}`} className="text-[10px] text-primary hover:underline mt-1 inline-block truncate max-w-[200px] sm:max-w-xs">
                                                            V/v: {peer.propertyTitle}
                                                        </Link>
                                                    )}
                                                </div>
                                            </>
                                        )
                                    })()}
                                </div>
                                {(() => {
                                    const peer = visiblePeers.find(p => p.id === activePeerId);
                                    return (
                                        <button
                                            onClick={() => activePeerId && handleDeleteConversation(activePeerId, peer?.name)}
                                            title="Xóa cuộc trò chuyện"
                                            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    );
                                })()}
                            </div>

                            {/* Messages View */}
                            <div ref={messagesViewportRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5">
                                {activeMessages.map((msg, idx) => {
                                    const isMe = msg.senderId._id === session?.user?.id;
                                    // simple grouping to show timestamps occasionally
                                    const showTime = idx === 0 || 
                                        new Date(activeMessages[idx].createdAt).getTime() - new Date(activeMessages[idx-1].createdAt).getTime() > 10 * 60 * 1000;
                                    
                                    return (
                                        <div key={msg._id} className="flex flex-col">
                                            {showTime && (
                                                <div className="text-[10px] text-center text-muted-foreground my-3">
                                                    {new Date(msg.createdAt).toLocaleString("vi-VN", { weekday: 'short', hour: '2-digit', minute:'2-digit' })}
                                                </div>
                                            )}
                                            <div className={`group flex items-center gap-2 ${isMe ? "justify-end" : "justify-start"} mb-1`}>
                                                {isMe && (
                                                    <button
                                                        onClick={() => handleDeleteMessage(msg, isMe)}
                                                        title="Gỡ tin nhắn cho cả hai bên"
                                                        className="rounded-full p-1.5 text-muted-foreground opacity-100 transition-colors hover:bg-red-50 hover:text-red-600 md:opacity-0 md:group-hover:opacity-100"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                                <div 
                                                    className={`max-w-[75%] px-4 py-2 text-sm shadow-sm
                                                        ${isMe 
                                                            ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm" 
                                                            : "bg-white border rounded-2xl rounded-tl-sm text-foreground"
                                                        }`}
                                                >
                                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                                </div>
                                                {!isMe && (
                                                    <button
                                                        onClick={() => handleDeleteMessage(msg, isMe)}
                                                        title="Xóa tin nhắn phía bạn"
                                                        className="rounded-full p-1.5 text-muted-foreground opacity-100 transition-colors hover:bg-red-50 hover:text-red-600 md:opacity-0 md:group-hover:opacity-100"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                            {/* Read receipt indicator (only on last message if it's mine) */}
                                            {isMe && idx === activeMessages.length - 1 && (
                                                <div className="flex justify-end pr-1 text-[10px] text-muted-foreground">
                                                    {msg.isRead ? <span className="flex items-center text-primary"><CheckCircle2 className="w-3 h-3 mr-0.5" /> Đã xem</span> : "Đã gửi"}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Chat Input */}
                            <div className="p-3 bg-background border-t mt-auto">
                                <form onSubmit={handleSend} className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={replyText}
                                        onChange={e => setReplyText(e.target.value)}
                                        placeholder="Nhập tin nhắn..." 
                                        className="flex-1 bg-muted rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                    <button 
                                        type="submit" 
                                        disabled={!replyText.trim() || sending}
                                        className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                                    >
                                        <Send className="w-4 h-4 ml-0.5" />
                                    </button>
                                </form>
                            </div>
                        </>
                    )}
                </div>

            </div>
        </div>
    );
}

export default function InboxPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-[70vh]"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>}>
            <InboxContent />
        </Suspense>
    );
}
