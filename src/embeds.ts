import { Build, Embed } from "./types";
const STATUS_STYLE: Partial<Record<Build["status"], { title: string; color: number }>> = {
    WORKING: { title: "🔨 BUILDING", color: 1027128 },
    SUCCESS: { title: "✅ SUCCESS", color: 1127128 },
};

const ERROR_STATUSES = new Set(["FAILURE", "INTERNAL_ERROR", "TIMEOUT", "CANCELLED", "EXPIRED"]);

export const addUtmParams = (logUrl: string): string => {
  try {
    const url = new URL(logUrl);
    url.searchParams.set("utm_source", "google-cloud-build-discord");
    url.searchParams.set("utm_medium", "chat");
    return url.toString();
  } catch (e) {
    return logUrl
    }
}


export const statusEmbeds
    = (build: Build, logUrl: string): Embed[] => {
        const sourceText = build.source?.repoSource?.repoName

        const embeds: Embed[] = []

        const style = STATUS_STYLE[build.status]
        if (style) {
            embeds.push({ title: style.title, color: style.color })
        } else if (ERROR_STATUSES.has(build.status)) {
            embeds.push(
                { title: `❌ ERROR - ${build.status}`, color: 14177041 },
                { title: "Log", description: logUrl, color: 14177041 },
            )
        }

        if(embeds.length > 0 && sourceText) embeds[0]!.description = sourceText

        return embeds
    }
