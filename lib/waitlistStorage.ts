import { promises as fs } from "fs";
import os from "os";
import path from "path";

export type WaitlistEntry = {
  name: string;
  email: string;
  timestamp: string;
};

const preferredDir = process.env.WAITLIST_STORAGE_DIR
  ? path.resolve(process.env.WAITLIST_STORAGE_DIR)
  : path.join(process.cwd(), "data");

const storageDir = process.env.VERCEL ? path.join(os.tmpdir(), "brancr-waitlist") : preferredDir;
const fallbackDir = path.join(os.tmpdir(), "brancr-waitlist-fallback");

function getFilePath(dir: string) {
  return path.join(dir, "waitlist.json");
}

async function writeEntries(dir: string, entries: WaitlistEntry[]) {
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(getFilePath(dir), JSON.stringify(entries, null, 2), "utf-8");
}

async function readEntries(dir: string) {
  try {
    const fileContents = await fs.readFile(getFilePath(dir), "utf-8");
    const entries = JSON.parse(fileContents);

    if (Array.isArray(entries)) {
      return entries as WaitlistEntry[];
    }

    return [];
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

export async function saveWaitlistEntry(entry: Omit<WaitlistEntry, "timestamp">) {
  const timestamp = new Date().toISOString();
  const record: WaitlistEntry = { ...entry, timestamp };

  let existingEntries: WaitlistEntry[] = [];

  try {
    existingEntries = await readEntries(storageDir);
  } catch (error) {
    console.warn("Primary waitlist storage read failed, falling back to temp directory:", error);
    existingEntries = await readEntries(fallbackDir);
  }

  existingEntries.push(record);

  try {
    await writeEntries(storageDir, existingEntries);
  } catch (error) {
    console.warn("Primary waitlist storage write failed, using fallback temp directory:", error);
    await writeEntries(fallbackDir, existingEntries);
  }

  return record;
}

export async function getWaitlistEntries() {
  try {
    return await readEntries(storageDir);
  } catch (error) {
    console.warn("Primary waitlist storage read failed, falling back to temp directory:", error);
    return readEntries(fallbackDir);
  }
}
