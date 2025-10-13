-- Tabela de perfis de usuários
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  photo_url TEXT,
  location TEXT,
  verified BOOLEAN DEFAULT false,
  rating DECIMAL(2,1) DEFAULT 0.0,
  total_tratos INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Perfis são visíveis por todos"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem criar seu próprio perfil"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Função para criar perfil automaticamente ao registrar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, location)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'Usuário'),
    COALESCE(new.raw_user_meta_data->>'location', '')
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Tabela de anúncios
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('venda', 'troca', 'procurando')),
  category TEXT NOT NULL CHECK (category IN ('bike', 'patinete', 'skate', 'scooter', 'carro', 'pecas')),
  brand_model TEXT NOT NULL,
  price DECIMAL(10,2),
  description TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  images TEXT[],
  location TEXT NOT NULL,
  accepts_trade BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'vendido', 'trocado', 'inativo')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para listings
CREATE POLICY "Anúncios ativos são visíveis por todos"
  ON public.listings FOR SELECT
  USING (status = 'ativo' OR auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios anúncios"
  ON public.listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios anúncios"
  ON public.listings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios anúncios"
  ON public.listings FOR DELETE
  USING (auth.uid() = user_id);

-- Tabela de chats
CREATE TABLE public.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  user2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'fechado')),
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para chats
CREATE POLICY "Usuários veem apenas seus chats"
  ON public.chats FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Usuários podem criar chats"
  ON public.chats FOR INSERT
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Participantes podem atualizar o chat"
  ON public.chats FOR UPDATE
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Tabela de mensagens
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT,
  media_url TEXT,
  status TEXT DEFAULT 'enviada' CHECK (status IN ('enviada', 'lida')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para messages
CREATE POLICY "Usuários veem mensagens dos seus chats"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = messages.chat_id
      AND (chats.user1_id = auth.uid() OR chats.user2_id = auth.uid())
    )
  );

CREATE POLICY "Usuários podem enviar mensagens nos seus chats"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = messages.chat_id
      AND (chats.user1_id = auth.uid() OR chats.user2_id = auth.uid())
    )
  );

-- Tabela de tratos fechados
CREATE TABLE public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'cancelado')),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para deals
CREATE POLICY "Usuários veem seus próprios tratos"
  ON public.deals FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Usuários podem criar tratos"
  ON public.deals FOR INSERT
  WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Participantes podem atualizar o trato"
  ON public.deals FOR UPDATE
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Tabela de avaliações
CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  to_user UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
  text TEXT,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(from_user, deal_id)
);

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para ratings
CREATE POLICY "Avaliações são visíveis por todos"
  ON public.ratings FOR SELECT
  USING (true);

CREATE POLICY "Usuários podem criar avaliações"
  ON public.ratings FOR INSERT
  WITH CHECK (auth.uid() = from_user);

-- Tabela de anúncios em destaque
CREATE TABLE public.featured_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL UNIQUE,
  start_date TIMESTAMPTZ DEFAULT now(),
  end_date TIMESTAMPTZ NOT NULL,
  paid BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.featured_listings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para featured_listings
CREATE POLICY "Anúncios em destaque são visíveis por todos"
  ON public.featured_listings FOR SELECT
  USING (true);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true);

-- Políticas de Storage para vídeos
CREATE POLICY "Vídeos são publicamente acessíveis"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'videos');

CREATE POLICY "Usuários autenticados podem fazer upload de vídeos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'videos' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Usuários podem atualizar seus próprios vídeos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'videos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Usuários podem deletar seus próprios vídeos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'videos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Políticas de Storage para imagens
CREATE POLICY "Imagens são publicamente acessíveis"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'images');

CREATE POLICY "Usuários autenticados podem fazer upload de imagens"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'images' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Usuários podem atualizar suas próprias imagens"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Usuários podem deletar suas próprias imagens"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Função para atualizar rating do usuário
CREATE OR REPLACE FUNCTION public.update_user_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET rating = (
    SELECT COALESCE(AVG(stars), 0)
    FROM public.ratings
    WHERE to_user = NEW.to_user
  )
  WHERE id = NEW.to_user;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_rating_created
  AFTER INSERT ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_user_rating();

-- Habilitar realtime para mensagens
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;