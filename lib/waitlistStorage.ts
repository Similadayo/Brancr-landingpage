import { promises as fs } from "fs";
import path from "path";

export type WaitlistEntry = {
  name: string;
  email: string;
  timestamp: string;
};

const waitlistFilePath = path.join(process.cwd(), "data", "waitlist.json");

export async function saveWaitlistEntry(entry: Omit<WaitlistEntry, "timestamp">) {
  const timestamp = new Date().toISOString();
  const record: WaitlistEntry = { ...entry, timestamp };

  await fs.mkdir(path.dirname(waitlistFilePath), { recursive: true });

  let existingEntries: WaitlistEntry[] = [];

  try {
    const fileContents = await fs.readFile(waitlistFilePath, "utf-8");
    existingEntries = JSON.parse(fileContents);

    if (!Array.isArray(existingEntries)) {
      existingEntries = [];
    }
  } catch (error) {
    existingEntries = [];
  }

  existingEntries.push(record);
  await fs.writeFile(waitlistFilePath, JSON.stringify(existingEntries, null, 2), "utf-8");

  return record;
}

export async function getWaitlistEntries() {
  try {
    const fileContents = await fs.readFile(waitlistFilePath, "utf-8");
    const entries = JSON.parse(fileContents);

    if (Array.isArray(entries)) {
      return entries as WaitlistEntry[];
    }

    return [];
  } catch {
    return [];
  }
}
