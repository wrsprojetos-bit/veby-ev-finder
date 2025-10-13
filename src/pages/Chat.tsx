import { BottomNav } from "@/components/BottomNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Send } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const conversations = [
  {
    id: 1,
    name: "Carlos Silva",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos",
    lastMessage: "Oi, o patinete ainda está disponível?",
    time: "10:30",
    unread: 2,
    productImage: "https://images.unsplash.com/photo-1621544402532-7a86ed81d07a?w=100&q=80",
  },
  {
    id: 2,
    name: "Maria Oliveira",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
    lastMessage: "Aceita R$ 4.000?",
    time: "Ontem",
    unread: 0,
    productImage: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=100&q=80",
  },
  {
    id: 3,
    name: "João Santos",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Joao",
    lastMessage: "Perfeito! Quando posso buscar?",
    time: "Seg",
    unread: 1,
    productImage: "https://images.unsplash.com/photo-1558981852-426c6c22a060?w=100&q=80",
  },
];

const Chat = () => {
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  const handleSendMessage = () => {
    if (message.trim()) {
      console.log("Enviando mensagem:", message);
      setMessage("");
    }
  };

  if (selectedChat !== null) {
    const chat = conversations[selectedChat];
    return (
      <div className="min-h-screen bg-background pb-16">
        <header className="fixed top-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border">
          <div className="flex items-center gap-3 px-4 h-16">
            <button onClick={() => setSelectedChat(null)} className="text-foreground">
              ←
            </button>
            <Avatar className="w-10 h-10">
              <AvatarImage src={chat.avatar} />
              <AvatarFallback>{chat.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-bold">{chat.name}</h1>
              <p className="text-xs text-muted-foreground">Online</p>
            </div>
          </div>
        </header>

        <main className="pt-16 pb-20 px-4 space-y-4">
          <div className="flex justify-start">
            <div className="bg-card px-4 py-2 rounded-2xl rounded-tl-none max-w-[70%]">
              <p className="text-sm">{chat.lastMessage}</p>
              <span className="text-xs text-muted-foreground">{chat.time}</span>
            </div>
          </div>
        </main>

        <div className="fixed bottom-16 left-0 right-0 bg-background border-t border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite uma mensagem..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <BottomNav />
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
        {conversations.length > 0 ? (
          <div className="divide-y divide-border">
            {conversations.map((conversation, index) => (
              <div
                key={conversation.id}
                onClick={() => setSelectedChat(index)}
                className="flex items-center gap-3 p-4 hover:bg-card/50 transition-colors cursor-pointer"
              >
                <div className="relative">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={conversation.avatar} />
                    <AvatarFallback>{conversation.name[0]}</AvatarFallback>
                  </Avatar>
                  {conversation.unread > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                      {conversation.unread}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold truncate">{conversation.name}</h3>
                    <span className="text-xs text-muted-foreground">{conversation.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {conversation.lastMessage}
                  </p>
                </div>

                <img
                  src={conversation.productImage}
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
