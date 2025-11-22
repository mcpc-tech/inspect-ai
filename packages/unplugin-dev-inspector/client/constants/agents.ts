export interface Agent {
  name: string;
  command: string;
  args?: string[];
  env: Array<{
    key: string;
    required: boolean;
  }>;
  authMethodId?: string;
  meta?: {
    icon?: string;
  };
}

export const AVAILABLE_AGENTS: Agent[] = [
  {
    name: "Claude Code",
    command: "npx",
    args: ["-y", "@zed-industries/claude-code-acp"],
    env: [
      { key: "ANTHROPIC_API_KEY", required: false },
      { key: "ANTHROPIC_BASE_URL", required: false },
    ],
    meta: {
      icon: "https://unpkg.com/@lobehub/icons-static-svg@1.73.0/icons/claude-color.svg",
    },
  },
  {
    name: "Codex CLI",
    command: "npx",
    args: ["-y", "@zed-industries/codex-acp"],
    env: [{ key: "AI_GATEWAY_API_KEY", required: false }],
    meta: {
      icon: "https://unpkg.com/@lobehub/icons-static-svg@1.73.0/icons/openai.svg",
    },
  },
  {
    name: "Gemini CLI",
    command: "npx",
    args: ["@google/gemini-cli", "--experimental-acp"],
    env: [{ key: "GEMINI_API_KEY", required: false }],
    authMethodId: "gemini-api-key",
    meta: {
      icon: "https://unpkg.com/@lobehub/icons-static-svg@1.73.0/icons/gemini-color.svg",
    },
  },
];

export const DEFAULT_AGENT = "Claude Code";
