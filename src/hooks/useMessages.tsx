import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";
import type { Message } from "./useChat";

export const useMessages = (chatId: string | null) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    if (!chatId || !user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        throw error;
      }
      
      setMessages(data || []);
    } catch (error) {
      console.error("Erro ao buscar mensagens:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as mensagens",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!chatId || !user) {
      setLoading(false);
      return;
    }

    fetchMessages();

    // Configurar realtime
    const channel = supabase
      .channel(`messages:${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          setMessages((current) => [...current, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, user]);

  const sendMessage = async (content: string, mediaUrl?: string) => {
    if (!chatId || !user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para enviar mensagens",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error: insertError } = await supabase.from("messages").insert({
        chat_id: chatId,
        sender_id: user.id,
        content,
        media_url: mediaUrl,
      });

      if (insertError) {
        console.error("Error inserting message:", insertError);
        throw insertError;
      }

      // Atualizar last_message_at do chat
      const { error: updateError } = await supabase
        .from("chats")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", chatId);

      if (updateError) {
        console.error("Error updating chat:", updateError);
      }
    } catch (error: any) {
      console.error("Erro ao enviar mensagem:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível enviar a mensagem",
        variant: "destructive",
      });
    }
  };

  return { messages, loading, sendMessage };
};
