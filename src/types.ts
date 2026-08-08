export type BuildStatus =
  | "QUEUED" | "WORKING" | "SUCCESS" | "FAILURE"
  | "INTERNAL_ERROR" | "TIMEOUT" | "CANCELLED" | "EXPIRED" | "PENDING";


export interface Build {
  id: string;
  projectId: string;
  status: BuildStatus;
  logUrl: string;
  substitutions?: Record<string, string>;
  source?: {
    repoSource?: { repoName?: string };
  };
}


export interface Embed {
  title: string;
  color: number;
  description?: string;
}

export interface DiscordMessage {
  content?: string;
  embeds: Embed[];
}

// TemplateView { Build, Params }
export interface TemplateView {
  Build: Build;
  Params: Record<string, string>;
}


// Equivalent of notifiers.Config (spec.notification.*, spec.secrets)
export interface NotifierConfig {
  apiVersion: string;
  kind: string;
  metadata: { name: string };
  spec: {
    notification: {
      filter?: FilterConfig;      // see Step 6. replaces the CEL string
      delivery: { webhookUrl: { secretRef: string } };
      template?: string;
    };
    secrets: Array<{ name: string; value: string }>;
  };
}

export interface FilterConfig {
  statuses?: BuildStatus[];
  substitutions?: Record<string, string>;
}