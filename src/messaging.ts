import Handlebars from "handlebars";
import type { Build, DiscordMessage, TemplateView} from "./types";
import { addUtmParams, statusEmbeds } from "./embeds";


Handlebars.registerHelper("replace", (s: string, oldStr: string, newStr: string) =>
  s.split(oldStr).join(newStr),
);

Handlebars.registerHelper("json", (value: unknown) => {
  const json = JSON.stringify(value ?? "");
  return new Handlebars.SafeString(json.slice(1, -1));
});


export function compileTemplate(source: string): HandlebarsTemplateDelegate<TemplateView> {
  return Handlebars.compile<TemplateView>(source, { noEscape: true });
}


export function renderMessage(
  build: Build,
  view: TemplateView,
  tmpl: HandlebarsTemplateDelegate<TemplateView> | undefined,
): DiscordMessage | null {
  const logUrl = addUtmParams(build.logUrl);

  let templated: DiscordMessage | undefined;
  if (tmpl) {
    const rendered = tmpl(view).trim();
    if (rendered.length > 0) {
      templated = JSON.parse(rendered) as DiscordMessage; // may throw — let caller 500
    }
  }

  const embeds = templated?.embeds?.length ? templated.embeds : statusEmbeds(build, logUrl);
  if (embeds.length === 0) return null; // unhandled status

  return { content: templated?.content, embeds };
}
