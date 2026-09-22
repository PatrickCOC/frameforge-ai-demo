import { getChatGPTUser } from "@/app/chatgpt-auth";

export async function requireApiUser() {
  return getChatGPTUser();
}
