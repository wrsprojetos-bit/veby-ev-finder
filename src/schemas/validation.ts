import { z } from "zod";

// Auth schemas
export const signUpSchema = z.object({
  name: z.string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .trim(),
  location: z.string()
    .min(2, "Localização deve ter pelo menos 2 caracteres")
    .max(200, "Localização deve ter no máximo 200 caracteres")
    .trim(),
  email: z.string()
    .email("Email inválido")
    .max(255, "Email deve ter no máximo 255 caracteres")
    .trim()
    .toLowerCase(),
  password: z.string()
    .min(8, "Senha deve ter pelo menos 8 caracteres")
    .max(100, "Senha deve ter no máximo 100 caracteres")
    .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
    .regex(/[a-z]/, "Senha deve conter pelo menos uma letra minúscula")
    .regex(/[0-9]/, "Senha deve conter pelo menos um número"),
});

export const signInSchema = z.object({
  email: z.string()
    .email("Email inválido")
    .max(255, "Email deve ter no máximo 255 caracteres")
    .trim()
    .toLowerCase(),
  password: z.string()
    .min(1, "Senha é obrigatória")
    .max(100, "Senha deve ter no máximo 100 caracteres"),
});

// Publish listing schema - focado em veículos elétricos
export const publishSchema = z.object({
  // Campos obrigatórios VISÍVEIS NA UI
  type: z.enum(["vendo", "troco", "procuro"], {
    errorMap: () => ({ message: "Tipo inválido" }),
  }),
  category: z.string()
    .min(1, "Categoria é obrigatória")
    .max(50, "Categoria deve ter no máximo 50 caracteres")
    .trim(),
  title: z.string()
    .min(3, "Título deve ter pelo menos 3 caracteres")
    .max(100, "Título deve ter no máximo 100 caracteres")
    .trim(),
  price: z.number()
    .positive("Preço deve ser positivo")
    .max(999999999, "Preço muito alto"),
  description: z.string()
    .min(1, "Descrição é obrigatória")
    .max(2000, "Descrição deve ter no máximo 2000 caracteres")
    .trim(),
  location_state: z.string()
    .min(2, "Estado é obrigatório")
    .max(2, "Use a sigla do estado (ex: SP)")
    .trim(),
  location_city: z.string()
    .min(1, "Cidade é obrigatória")
    .max(100, "Cidade deve ter no máximo 100 caracteres")
    .trim(),
  video_url: z.string()
    .url("URL de vídeo inválida"),

  // Campos opcionais
  brand: z.string().max(50, "Marca deve ter no máximo 50 caracteres").trim().optional().nullable(),
  model: z.string().max(50, "Modelo deve ter no máximo 50 caracteres").trim().optional().nullable(),
  year: z.number().int("Ano deve ser inteiro").min(1900, "Ano inválido").max(new Date().getFullYear() + 1, "Ano não pode ser no futuro").optional().nullable(),
  acceptsTrade: z.boolean().optional().nullable().default(false),

  // Qualquer outro campo extra deve ser opcional
  tipo_veiculo: z.string().optional().nullable(),
  quilometragem_km: z.number().int().min(0).optional().nullable(),
  capacidade_bateria: z.string().max(50).trim().optional().nullable(),
  autonomia_km: z.number().int().min(0).optional().nullable(),
  potencia_motor: z.string().max(50).trim().optional().nullable(),
  tempo_carga_horas: z.string().max(50).trim().optional().nullable(),
  estado_conservacao: z.enum(["novo", "seminovo", "usado"]).optional().nullable(),
  bairro: z.string().max(100).trim().optional().nullable(),
  documentacao_em_dia: z.boolean().optional().nullable(),
  licenciado: z.boolean().optional().nullable(),
  unico_dono: z.boolean().optional().nullable(),
  inclui_carregador: z.boolean().optional().nullable(),
  inclui_segunda_bateria: z.boolean().optional().nullable(),
});

// Report schema
export const reportSchema = z.object({
  reason: z.string()
    .min(1, "Motivo é obrigatório")
    .max(200, "Motivo deve ter no máximo 200 caracteres"),
  description: z.string()
    .max(1000, "Descrição deve ter no máximo 1000 caracteres")
    .trim()
    .optional()
    .nullable(),
});

// Chat message schema
export const messageSchema = z.object({
  content: z.string()
    .min(1, "Mensagem não pode estar vazia")
    .max(2000, "Mensagem deve ter no máximo 2000 caracteres")
    .trim(),
});

// Profile update schemas
const urlSchema = z.string()
  .url("URL inválida")
  .max(500, "URL deve ter no máximo 500 caracteres")
  .optional()
  .nullable()
  .or(z.literal(""));

const phoneSchema = z.string()
  .regex(/^\+?[\d\s\-\(\)]+$/, "Número de telefone inválido")
  .min(8, "Número de telefone muito curto")
  .max(20, "Número de telefone muito longo")
  .optional()
  .nullable()
  .or(z.literal(""));

export const profileUpdateSchema = z.object({
  name: z.string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .trim(),
  location: z.string()
    .max(200, "Localização deve ter no máximo 200 caracteres")
    .trim()
    .optional()
    .nullable(),
  bio: z.string()
    .max(500, "Bio deve ter no máximo 500 caracteres")
    .trim()
    .optional()
    .nullable(),
  photo_url: urlSchema,
  instagram_url: urlSchema,
  whatsapp: phoneSchema,
  site_url: urlSchema,
  cnpj: z.string()
    .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, "CNPJ inválido (formato: 00.000.000/0000-00)")
    .optional()
    .nullable()
    .or(z.literal("")),
  logo_url: urlSchema,
  endereco: z.string()
    .max(300, "Endereço deve ter no máximo 300 caracteres")
    .trim()
    .optional()
    .nullable(),
  horario_funcionamento: z.string()
    .max(200, "Horário deve ter no máximo 200 caracteres")
    .trim()
    .optional()
    .nullable(),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type PublishInput = z.infer<typeof publishSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
