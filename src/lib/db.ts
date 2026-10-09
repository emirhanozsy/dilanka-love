import { supabase } from './supabase';

export interface Memory {
  id: string;
  image?: string;
  images?: string[];
  date: string;
  note: string;
}

// Upload base64 image to Supabase Storage and return public URL
async function uploadBase64Image(base64: string): Promise<string> {
  // If it's already a URL (e.g. from static memories or already uploaded), return it
  if (base64.startsWith('http') || base64.startsWith('/')) return base64;

  try {
    const res = await fetch(base64);
    const blob = await res.blob();
    const ext = blob.type.split('/')[1] || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    
    const { error } = await supabase.storage.from('uploads').upload(fileName, blob);
    if (error) throw error;
    
    const { data } = supabase.storage.from('uploads').getPublicUrl(fileName);
    return data.publicUrl;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
}

export async function getAllMemories(): Promise<Memory[]> {
  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error("Error fetching memories:", error);
    return [];
  }
  return data || [];
}

export async function saveMemory(memory: Memory): Promise<void> {
  let uploadedImages: string[] = [];
  let uploadedImage: string | undefined = memory.image;
  
  if (memory.images && memory.images.length > 0) {
    uploadedImages = await Promise.all(memory.images.map(uploadBase64Image));
  }
  if (memory.image) {
    uploadedImage = await uploadBase64Image(memory.image);
  }

  const memoryToSave = {
    ...memory,
    images: uploadedImages,
    image: uploadedImage,
  };

  const { error } = await supabase
    .from('memories')
    .upsert(memoryToSave);

  if (error) {
    console.error("Error saving memory:", error);
    throw error;
  }
}

export async function deleteMemory(id: string): Promise<void> {
  const { error } = await supabase
    .from('memories')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Error deleting memory:", error);
    throw error;
  }
}

export async function updateMemoryNote(id: string, note: string): Promise<void> {
  const { error } = await supabase
    .from('memories')
    .update({ note })
    .eq('id', id);

  if (error) {
    console.error("Error updating note:", error);
    throw error;
  }
}
