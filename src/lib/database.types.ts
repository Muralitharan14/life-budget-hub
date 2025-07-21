// This file has been kept for reference but is no longer used
// All data types are now defined in the hook files directly
// The database structure has been migrated to local storage

export const deprecatedMessage = "Database types have been moved to individual hook files for local storage implementation.";

// Legacy types for reference
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
