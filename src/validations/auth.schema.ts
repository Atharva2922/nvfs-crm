import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Please provide a company ID or email address"),
  password: z.string().min(1, "Please provide a password"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const employeeCreateSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  designation: z.string().min(1, "Designation is required"),
  departmentId: z.string().optional(),
  managerId: z.string().optional(),
  baseSalary: z.number().positive().optional(),
  hireDate: z.string().or(z.date()),
});

export type EmployeeCreateInput = z.infer<typeof employeeCreateSchema>;
