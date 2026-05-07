/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_URL?: string;
    readonly VITE_API_BASE?: string;
    readonly VITE_CHAT_API_URL?: string;
    readonly VITE_SUPABASE_URL?: string;
    readonly VITE_SUPABASE_ANON_KEY?: string;
    readonly VITE_VOICE_AGENT_PHONE_NUMBER?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
