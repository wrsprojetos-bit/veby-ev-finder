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

// Publish listing schema
export const publishSchema = z.object({
  type: z.enum(["vendo", "troco", "procuro"], {
    errorMap: () => ({ message: "Tipo inválido" }),
  }),
  category: z.string()
    .min(1, "Categoria é obrigatória")
    .max(50, "Categoria deve ter no máximo 50 caracteres"),
  title: z.string()
    .min(5, "Título deve ter pelo menos 5 caracteres")
    .max(100, "Título deve ter no máximo 100 caracteres")
    .trim(),
  price: z.number()
    .positive("Preço deve ser positivo")
    .max(999999999, "Preço muito alto")
    .optional()
    .nullable(),
  brand: z.string()
    .min(1, "Marca é obrigatória")
    .max(50, "Marca deve ter no máximo 50 caracteres")
    .trim(),
  model: z.string()
    .min(1, "Modelo é obrigatório")
    .max(50, "Modelo deve ter no máximo 50 caracteres")
    .trim(),
  description: z.string()
    .max(2000, "Descrição deve ter no máximo 2000 caracteres")
    .trim()
    .optional()
    .nullable(),
  acceptsTrade: z.boolean(),
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
