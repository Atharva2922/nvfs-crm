export interface ModuleManifest {
  name: string;
  code: string;
  block: number;
  description: string;
  status: "FOUNDATION" | "READY_TO_BUILD" | "PLANNED";
}

export const authModule: ModuleManifest = {
  name: "Authentication & Identity Management",
  code: "auth",
  block: 0,
  description: "Session authentication, credential verification, and user access state.",
  status: "FOUNDATION",
};
