import { z } from "zod";
import { adminRoleSchema } from "../permissions";

export const createAdminUserSchema = z.object({
  email: z.string().trim().email().max(255),
  fullName: z.string().trim().min(1).max(200),
  role: adminRoleSchema,
});

export type CreateAdminUserInput = z.infer<typeof createAdminUserSchema>;
