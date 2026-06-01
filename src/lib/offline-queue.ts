export type OfflineMutation = {
  table: string;
  operation: "insert" | "update";
  payload: Record<string, unknown>;
  filters?: Record<string, unknown>;
};

const queue: OfflineMutation[] = [];

export async function flushQueue(
  executor: (mutation: OfflineMutation) => Promise<boolean>
): Promise<number> {
  let synced = 0;
  while (queue.length > 0) {
    const mutation = queue.shift()!;
    const ok = await executor(mutation).catch(() => false);
    if (ok) synced++;
  }
  return synced;
}
