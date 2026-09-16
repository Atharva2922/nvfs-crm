import { AuditService, LogMutationParams } from "@/services/audit.service";

export async function logAudit(params: LogMutationParams) {
  return AuditService.logMutation(params);
}

export { AuditService };
