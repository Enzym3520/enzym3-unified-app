export interface NiaMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}
