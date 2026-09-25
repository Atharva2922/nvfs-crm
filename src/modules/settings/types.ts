import { LucideIcon } from "lucide-react";

export type SettingsCategoryKey =
  | "overview"
  | "account"
  | "organization"
  | "users"
  | "roles"
  | "security"
  | "authentication"
  | "notifications"
  | "communication"
  | "crm"
  | "sales"
  | "tasks"
  | "finance"
  | "inventory"
  | "vendors"
  | "contracts"
  | "hr"
  | "workflows"
  | "ai"
  | "integrations"
  | "developer"
  | "mobile"
  | "reports"
  | "data"
  | "audit"
  | "appearance"
  | "localization"
  | "email"
  | "storage"
  | "billing"
  | "health"
  | "danger";

export interface SettingsCategoryMeta {
  key: SettingsCategoryKey;
  label: string;
  description: string;
  group: "GENERAL" | "SECURITY" | "OPERATIONS" | "AUTOMATION" | "DEVELOPER" | "SYSTEM";
  iconName: string;
  minRoleLevel: number;
  allowedRoles?: string[];
  keywords: string[];
}

export interface SearchableSettingItem {
  id: string;
  key: string;
  label: string;
  category: SettingsCategoryKey;
  categoryLabel: string;
  description: string;
  keywords: string[];
}
