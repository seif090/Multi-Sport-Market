-- Add soft-delete / active flag for users
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
