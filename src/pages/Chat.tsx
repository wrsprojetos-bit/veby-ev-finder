import { BottomNav } from "@/components/BottomNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Send, ArrowLeft } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChat } from "@/hooks/useChat";
import { useMessages } from "@/hooks/useMessages";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Chat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const chatIdFromUrl = searchParams.get("chatId");
  
  const { chats, loading: chatsLoading } = useChat();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(chatIdFromUrl);
  const { messages, sendMessage } = useMessages(selectedChatId);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatIdFromUrl) {
      setSelectedChatId(chatIdFromUrl);
    }
  }, [chatIdFromUrl]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (message.trim() && selectedChatId) {
      await sendMessage(message.trim());
      setMessage("");
    }
  };

  const selectedChat = chats.find((c) => c.id === selectedChatId);

  if (selectedChatId && selectedChat) {
    return (
      <div className="min-h-screen bg-background pb-16">
        <header className="fixed top-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border">
          <div className="flex items-center gap-3 px-4 h-16">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedChatId(null);
                navigate("/chat");
              }}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Avatar className="w-10 h-10">
              <AvatarImage src={selectedChat.other_user?.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedChat.other_user?.name}`} />
              <AvatarFallback>{selectedChat.other_user?.name?.[0] || "?"}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="font-bold">{selectedChat.other_user?.name || "Usuário"}</h1>
              <p className="text-xs text-muted-foreground">{selectedChat.listing?.brand_model}</p>
            </div>
          </div>
        </header>

        <main className="pt-16 pb-24 px-4 space-y-3">
          {messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`px-4 py-2 rounded-2xl max-w-[75%] ${
                    isMe
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-card border border-border rounded-bl-none"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <span className={`text-xs ${isMe ? "opacity-80" : "text-muted-foreground"}`}>
                    {format(new Date(msg.created_at), "HH:mm", { locale: ptBR })}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </main>

        <div className="fixed bottom-16 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite uma mensagem..."
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} size="icon" disabled={!message.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <BottomNav />
      </div>
    );
  }

  if (chatsLoading) {
    return (
      <div className="min-h-screen bg-background pb-16 flex items-center justify-center">
        <p className="text-muted-foreground">Carregando conversas...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="fixed top-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-4 h-16">
          <h1 className="text-xl font-bold">Conversas</h1>
        </div>
      </header>

      <main className="pt-16">
        {chats.length > 0 ? (
          <div className="divide-y divide-border">
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => {
                  setSelectedChatId(chat.id);
                  navigate(`/chat?chatId=${chat.id}`);
                }}
                className="flex items-center gap-3 p-4 hover:bg-card/50 transition-colors cursor-pointer"
              >
                <Avatar className="w-12 h-12">
                  <AvatarImage src={chat.other_user?.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.other_user?.name}`} />
                  <AvatarFallback>{chat.other_user?.name?.[0] || "?"}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold truncate">{chat.other_user?.name || "Usuário"}</h3>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(chat.last_message_at), "HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {chat.last_message?.content || "Inicie a conversa"}
                  </p>
                </div>

                <img
                  src={chat.listing?.thumbnail_url || chat.listing?.images?.[0] || "https://images.unsplash.com/photo-1558981852-426c6c22a060?w=100&q=80"}
                  alt="Product"
                  className="w-12 h-12 rounded-lg object-cover"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] px-8 text-center">
            <MessageCircle className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma conversa ainda</h3>
            <p className="text-sm text-muted-foreground">
              Quando você iniciar uma negociação, suas conversas aparecerão aqui
            </p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Chat;
