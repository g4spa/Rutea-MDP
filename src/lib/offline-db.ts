import { openDB, type DBSchema } from "idb";

interface RuteaDatabase extends DBSchema {
  pendingMutations: {
    key: string;
    value: { id: string; url: string; method: "POST" | "PATCH"; body: unknown; createdAt: number };
    indexes: { "by-createdAt": number };
  };
}

const database = () =>
  openDB<RuteaDatabase>("rutea-mdp", 1, {
    upgrade(db) {
      const store = db.createObjectStore("pendingMutations", { keyPath: "id" });
      store.createIndex("by-createdAt", "createdAt");
    }
  });

export async function queueMutation(
  mutation: Omit<RuteaDatabase["pendingMutations"]["value"], "id" | "createdAt">
) {
  const entry = { ...mutation, id: crypto.randomUUID(), createdAt: Date.now() };
  await (await database()).put("pendingMutations", entry);
  return entry.id;
}

export async function flushMutations() {
  if (!navigator.onLine) return 0;
  const db = await database();
  const pending = await db.getAllFromIndex("pendingMutations", "by-createdAt");
  let synced = 0;

  for (const mutation of pending) {
    try {
      const response = await fetch(mutation.url, {
        method: mutation.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mutation.body)
      });
      if (!response.ok) continue;
      await db.delete("pendingMutations", mutation.id);
      synced += 1;
    } catch {
      break;
    }
  }

  return synced;
}
