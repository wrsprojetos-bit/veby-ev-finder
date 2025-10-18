-- Adicionar novos campos na tabela listings para vídeos
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS video_size INTEGER,
ADD COLUMN IF NOT EXISTS video_duration INTEGER;

-- Criar tabela de logs de storage
CREATE TABLE IF NOT EXISTS storage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  video_id TEXT,
  size_mb NUMERIC(10,2),
  duration_seconds INTEGER,
  status TEXT NOT NULL CHECK (status IN ('uploading', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_storage_logs_user_id ON storage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_storage_logs_status ON storage_logs(status);
CREATE INDEX IF NOT EXISTS idx_storage_logs_created_at ON storage_logs(created_at DESC);

-- RLS para storage_logs
ALTER TABLE storage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own storage logs"
  ON storage_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own storage logs"
  ON storage_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all storage logs"
  ON storage_logs FOR SELECT
  USING (is_admin(auth.uid()));