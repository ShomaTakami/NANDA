export type MemoryItem = {
  id: string;
  name: string;
  category: string | null;
  memo: string | null;
  tags: string[];
  imageUri: string | null;
  url: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MemoryInput = {
  name: string;
  category?: string | null;
  memo?: string | null;
  tags?: string[];
  imageUri?: string | null;
  url?: string | null;
};
