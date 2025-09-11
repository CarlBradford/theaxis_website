-- AddDefaultUsers
-- This migration adds default users to the database

-- Insert default users with pre-hashed passwords
INSERT INTO "User" ("id", "email", "username", "firstName", "lastName", "passwordHash", "role", "isActive", "emailVerified", "bio", "createdAt", "updatedAt") 
VALUES 
  ('user_admin', 'admin@theaxis.local', 'admin', 'System', 'Administrator', '$argon2id$v=19$m=65536,t=3,p=1$9qAt6+s3OYV8gDjiRN1Gkw$zzeWQW9SsJYfsM9EMcfUinuxGVAnuChzbvq7UMp/Dzo', 'ADVISER', true, true, 'System administrator for The AXIS platform', NOW(), NOW()),
  ('user_eic', 'eic@theaxis.local', 'editorinchief', 'Editor', 'In Chief', '$argon2id$v=19$m=65536,t=3,p=1$64MoHdAwmm64EYtYPqKGag$vbCIXi2M6yG/s/VOKRb9+okUsEqiyv1gzVMSxp/Vhqk', 'EDITOR_IN_CHIEF', true, true, 'Editor-in-Chief of The AXIS publication', NOW(), NOW()),
  ('user_section', 'section@theaxis.local', 'sectionhead', 'Section', 'Head', '$argon2id$v=19$m=65536,t=3,p=1$0HGwZW2BPfb9jpNHEe+BjA$e2GnXPfqnfw0zNsWRR/bTJLaGee9Fx3jA8Faj/41ovE', 'SECTION_HEAD', true, true, 'Section Head for The AXIS publication', NOW(), NOW()),
  ('user_staff', 'staff@theaxis.local', 'publicationstaff', 'Staff', 'Writer', '$argon2id$v=19$m=65536,t=3,p=1$L2WHYvS49FrtCfhhA5thqA$9QRfSK2+7u0gTA/neLgNBXNriWYbll4cIFtNyBkwUio', 'STAFF', true, true, 'Publication staff for The AXIS publication', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;
