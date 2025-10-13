import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export interface Chat {
  id: string;
  user1_id: string;
  user2_id: string;
  listing_id: string;
  status: string;
  last_message_at: string;
  created_at: string;
  listing?: {
    brand_model: string;
    thumbnail_url: string;
    images: string[];
  };
  other_user?: {
    name: string;
    photo_url: string;
  };
  last_message?: {
    content: string;
  };
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  media_url?: string;
  created_at: string;
  status: string;
}

export const useChat = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChats = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("chats")
        .select(`
          *,
          listing:listings(brand_model, thumbnail_url, images),
          messages(content, created_at)
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order("last_message_at", { ascending: false });

      if (error) throw error;

      // Buscar informações dos outros usuários
      const chatsWithUsers = await Promise.all(
        data.map(async (chat) => {
          const otherUserId = chat.user1_id === user.id ? chat.user2_id : chat.user1_id;
          const { data: profile } = await supabase
            .from("profiles")
            .select("name, photo_url")
            .eq("id", otherUserId)
            .single();

          // Pegar última mensagem
          const lastMessage = chat.messages?.[0];

          return {
            ...chat,
            other_user: profile,
            last_message: lastMessage,
          };
        })
      );

      setChats(chatsWithUsers);
    } catch (error) {
      console.error("Erro ao buscar chats:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as conversas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [user]);

  const findOrCreateChat = async (listingId: string, sellerId: string) => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para iniciar uma negociação",
        variant: "destructive",
      });
      return null;
    }

    try {
      // Verificar se já existe chat
      const { data: existingChat, error: searchError } = await supabase
        .from("chats")
        .select("*")
        .eq("listing_id", listingId)
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${sellerId}),and(user1_id.eq.${sellerId},user2_id.eq.${user.id})`)
        .maybeSingle();

      if (searchError) throw searchError;

      if (existingChat) {
        return existingChat.id;
      }

      // Criar novo chat
      const { data: newChat, error: createError } = await supabase
        .from("chats")
        .insert({
          user1_id: user.id,
          user2_id: sellerId,
          listing_id: listingId,
        })
        .select()
        .single();

      if (createError) throw createError;

      fetchChats();
      return newChat.id;
    } catch (error) {
      console.error("Erro ao criar chat:", error);
      toast({
        title: "Erro",
        description: "Não foi possível iniciar a conversa",
        variant: "destructive",
      });
      return null;
    }
  };

  return { chats, loading, findOrCreateChat, refreshChats: fetchChats };
};
