import React from "react";

type UITool = { name?: string };
type UIMessagePart<TMeta = Record<string, unknown>, TToolMap = Record<string, UITool>> =
  | { type: "text"; text: string; state?: string; providerMetadata?: TMeta }
  | { type: "reasoning"; text: string; state?: string; providerMetadata?: TMeta }
  | (Record<string, unknown> & { type: string; state?: string });

function isToolPart(part: unknown): part is Record<string, unknown> & { type: string; state?: string } {
  const p = part as Record<string, unknown>;
  return typeof p?.type === "string" && p.type.startsWith("tool-");
}

export function renderMessagePart(
  part: UIMessagePart,
  messageId: string,
  index: number,
  isStreaming: boolean,
  metadata?: Record<string, unknown>
) {
  if (part.type === "text") {
    return (
      <div key={`${messageId}-${index}`} className="whitespace-pre-wrap">
        {part.text}
      </div>
    );
  }

  if (part.type === "reasoning") {
    return (
      <details key={`${messageId}-${index}`} className="w-full rounded border p-2 bg-muted/30">
        <summary className="cursor-pointer text-sm font-medium">Reasoning {isStreaming ? "(streaming)" : ""}</summary>
        <div className="mt-2 whitespace-pre-wrap text-sm">{part.text}</div>
      </details>
    );
  }

  const plan = metadata?.plan as Array<Record<string, unknown>> | undefined;
  if (plan && index === 0) {
    return (
      <div key={`${messageId}-plan`} className="w-full rounded border p-3 bg-background/50">
        <div className="mb-2 text-sm font-semibold">Agent Plan</div>
        <ul className="space-y-2 text-sm">
          {plan.map((item, i) => {
            const content = (item?.content as string) ?? JSON.stringify(item);
            const status = (item?.status as string) ?? "pending";
            return (
              <li key={`plan-${i}`} className="flex items-start justify-between gap-3">
                <div className="flex-1">{content}</div>
                <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[10px] uppercase tracking-wide">
                  {status}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  if (isToolPart(part)) {
    const input = (part as any).input;
    const output = (part as any).output;
    const errorText = (part as any).errorText as string | undefined;

    return (
      <div key={`${messageId}-${index}`} className="rounded border p-2 bg-background/50 text-xs">
        <div className="mb-1 font-medium">{(part as any).type}</div>
        {input !== undefined && (
          <div className="mb-1">
            <div className="font-medium">Input</div>
            <pre className="overflow-auto rounded bg-muted p-2">{JSON.stringify(input, null, 2)}</pre>
          </div>
        )}
        {output !== undefined && (
          <div className="mb-1">
            <div className="font-medium">Output</div>
            <pre className="overflow-auto rounded bg-muted p-2">{JSON.stringify(output, null, 2)}</pre>
          </div>
        )}
        {errorText && (
          <div className="text-destructive">Error: {errorText}</div>
        )}
      </div>
    );
  }

  return null;
}
