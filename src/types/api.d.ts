// Single file upload data
interface UploadFile {
  key: string; // Target path
  file: Blob; // File content
}

// Array of files to be uploaded
type UploadData = UploadFile[];

// Backend response structure
interface UploadResults {
  success: boolean; // Overall success
  uploaded: { key: string; success: boolean }[]; // Successfully uploaded files
  failed: { key: string; success: boolean; error: string }[]; // Failed files with error messages
}
