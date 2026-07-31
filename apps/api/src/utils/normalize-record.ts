type PrismaRecord = Record<string, any>;

export function normalizeRecord<T extends PrismaRecord>(record: T | null | undefined): Omit<T, "_id"> & { id: string } {
  if (!record) {
    throw new Error("Invalid database record: expected object, got null or undefined");
  }

  const raw: PrismaRecord = typeof (record as any).toObject === "function" ? (record as any).toObject() : (record as any);
  const idValue = raw._id ?? raw.id;

  if (!idValue) {
    throw new Error(`Database record of type ${record.constructor.name} is missing an identifier.`);
  }

  const { _id, id: _, ...rest } = raw;

  return {
    id: typeof idValue === "object" ? idValue.toString() : String(idValue),
    ...rest,
  } as Omit<T, "_id"> & { id: string };
}