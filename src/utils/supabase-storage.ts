/* eslint-disable @typescript-eslint/no-unsafe-call */
import { supabase } from '~/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// You might need to install uuid: npm install uuid @types/uuid

export async function uploadImage(
  imageDataUrl: string, 
  folder = 'letters'
): Promise<string | null> {
  try {
    console.log('Starting image upload to folder:', folder);
    
    // Extract base64 data from the dataURL
    const base64Data = imageDataUrl.split(',')[1];
    if (!base64Data) {
      console.error('Invalid image data: Base64 data extraction failed');
      throw new Error('Invalid image data: missing base64 content');
    }
    
    // Convert base64 to Blob
    try {
      const blob = await fetch(imageDataUrl).then(res => res.blob());
      console.log('Image converted to blob:', {
        type: blob.type,
        size: blob.size,
        validBlob: blob instanceof Blob
      });
      
      // Generate a unique filename
      const fileExt = getFileExtensionFromDataUrl(imageDataUrl);
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;
      console.log('Generated file path:', filePath);
      
      // Log Supabase connection status
      console.log('Supabase client initialized:', !!supabase);
      
      // Check if bucket exists 
      const { data: buckets, error: bucketError } = await supabase
        .storage
        .listBuckets();
      
      if (bucketError) {
        console.error('Error checking Supabase buckets:', bucketError);
        throw new Error(`Supabase bucket access error: ${bucketError.message}`);
      }
      
      console.log('Available buckets:', buckets?.map(b => b.name));
      
      // Upload to Supabase Storage
      const { data, error } = await supabase
        .storage
        .from('letter-images') // your bucket name
        .upload(filePath, blob, {
          contentType: blob.type,
          upsert: false
        });
      
      if (error) {
        console.error('Error uploading to Supabase:', {
          message: error.message,
          name: error.name
        });
        return null;
      }
      
      console.log('Upload successful, file data:', data);
      
      // Get the public URL of the uploaded file
      const { data: { publicUrl } } = supabase
        .storage
        .from('letter-images')
        .getPublicUrl(filePath);
      
      console.log('Generated public URL:', publicUrl);
      
      return publicUrl;
    } catch (fetchError) {
      console.error('Error processing image:', fetchError);
      throw new Error(`Image processing error: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
    }
  } catch (error) {
    console.error('Error in uploadImage:', error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : String(error));
    return null;
  }
}

export async function uploadPdf(
  pdfBase64: string,
  folder = 'pdfs'
): Promise<string | null> {
  try {
    console.log('Starting PDF upload to folder:', folder);
    
    // Convert base64 to Blob
    const byteCharacters = atob(pdfBase64);
    const byteArrays = [];
    
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    
    const blob = new Blob(byteArrays, { type: 'application/pdf' });
    
    // Generate a unique filename
    const fileName = `${uuidv4()}.pdf`;
    const filePath = `${folder}/${fileName}`;
    console.log('Generated file path:', filePath);
    
    // Upload to Supabase Storage
    const { data, error } = await supabase
      .storage
      .from('letter-images') // your bucket name
      .upload(filePath, blob, {
        contentType: 'application/pdf',
        upsert: false
      });
    
    if (error) {
      console.error('Error uploading PDF to Supabase:', {
        message: error.message,
        name: error.name
      });
      return null;
    }
    
    console.log('Upload successful, file data:', data);
    
    // Get the public URL of the uploaded file
    const { data: { publicUrl } } = supabase
      .storage
      .from('letter-images')
      .getPublicUrl(filePath);
    
    console.log('Generated public URL:', publicUrl);
    
    return publicUrl;
  } catch (error) {
    console.error('Error in uploadPdf:', error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : String(error));
    return null;
  }
}

// Helper to get file extension from data URL
function getFileExtensionFromDataUrl(dataUrl: string): string {
  const regex = /data:image\/(\w+);/;
  const execResult = regex.exec(dataUrl);
  return execResult?.[1] ?? 'png'; // Default to png if not detected
} 