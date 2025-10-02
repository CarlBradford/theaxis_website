const express = require('express');
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { authenticateToken, requireRole } = require('../src/middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
const ensureUploadsDir = async () => {
  try {
    await fs.access(uploadsDir);
  } catch {
    await fs.mkdir(uploadsDir, { recursive: true });
  }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureUploadsDir();
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Get all site settings
router.get('/settings', async (req, res) => {
  try {
    const settings = await prisma.siteSetting.findMany({
      orderBy: { key: 'asc' }
    });
    
    const settingsObject = {};
    settings.forEach(setting => {
      settingsObject[setting.key] = setting.value;
    });
    
    res.json({
      success: true,
      data: settingsObject
    });
  } catch (error) {
    console.error('Error fetching site settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch site settings'
    });
  }
});

// Get color settings (must be before /settings/:key to avoid route conflicts)
router.get('/settings/colors', async (req, res) => {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: 'color_palette' }
    });
    
    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Color settings not found'
      });
    }
    
    res.json({
      success: true,
      data: setting.value
    });
  } catch (error) {
    console.error('Error fetching color settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch color settings'
    });
  }
});

// Update site settings (colors)
router.put('/settings/colors', authenticateToken, requireRole(['ADMINISTRATOR', 'SYSTEM_ADMIN']), async (req, res) => {
  try {
    const { colors } = req.body;
    const userId = req.user.id;
    
    // Validate colors object
    const requiredColors = ['primary', 'secondary', 'background', 'textPrimary'];
    const missingColors = requiredColors.filter(color => !colors[color]);
    
    if (missingColors.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required colors: ${missingColors.join(', ')}`
      });
    }
    
    // Validate hex color format
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    const invalidColors = Object.entries(colors).filter(([key, value]) => 
      !hexColorRegex.test(value)
    );
    
    if (invalidColors.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid color format: ${invalidColors.map(([key]) => key).join(', ')}`
      });
    }
    
    // Update or create color settings
    const colorSettings = await prisma.siteSetting.upsert({
      where: { key: 'color_palette' },
      update: {
        value: colors,
        updatedBy: userId
      },
      create: {
        key: 'color_palette',
        value: colors,
        description: 'Website color palette settings',
        updatedBy: userId
      }
    });
    
    res.json({
      success: true,
      message: 'Color settings updated successfully',
      data: colorSettings.value
    });
  } catch (error) {
    console.error('Error updating color settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update color settings'
    });
  }
});

// Get specific setting (moved to end to avoid conflicts with specific routes)

// Get current site assets
router.get('/assets', async (req, res) => {
  try {
    const assets = await prisma.siteAsset.findMany({
      where: { isActive: true },
      orderBy: { assetType: 'asc' }
    });
    
    res.json({
      success: true,
      data: assets
    });
  } catch (error) {
    console.error('Error fetching site assets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch site assets'
    });
  }
});

// Upload logo
router.post('/assets/logo', authenticateToken, requireRole(['ADMINISTRATOR', 'SYSTEM_ADMIN']), upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    const userId = req.user.id;
    const { originalname, filename, path: filePath, size, mimetype } = req.file;
    
    // Deactivate existing logo
    await prisma.siteAsset.updateMany({
      where: { 
        assetType: 'logo',
        isActive: true
      },
      data: { isActive: false }
    });
    
    // Create new logo asset
    const logoAsset = await prisma.siteAsset.create({
      data: {
        assetType: 'logo',
        fileName: filename,
        originalName: originalname,
        filePath: filePath,
        fileSize: size,
        mimeType: mimetype,
        uploadedBy: userId
      }
    });
    
    res.json({
      success: true,
      message: 'Logo uploaded successfully',
      data: {
        id: logoAsset.id,
        fileName: logoAsset.fileName,
        originalName: logoAsset.originalName,
        fileSize: logoAsset.fileSize,
        mimeType: logoAsset.mimeType,
        url: `/uploads/${filename}`
      }
    });
  } catch (error) {
    console.error('Error uploading logo:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up uploaded file:', unlinkError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to upload logo'
    });
  }
});

// Upload wordmark
router.post('/assets/wordmark', authenticateToken, requireRole(['ADMINISTRATOR', 'SYSTEM_ADMIN']), upload.single('wordmark'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    const userId = req.user.id;
    const { originalname, filename, path: filePath, size, mimetype } = req.file;
    
    // Deactivate existing wordmark
    await prisma.siteAsset.updateMany({
      where: { 
        assetType: 'wordmark',
        isActive: true
      },
      data: { isActive: false }
    });
    
    // Create new wordmark asset
    const wordmarkAsset = await prisma.siteAsset.create({
      data: {
        assetType: 'wordmark',
        fileName: filename,
        originalName: originalname,
        filePath: filePath,
        fileSize: size,
        mimeType: mimetype,
        uploadedBy: userId
      }
    });
    
    res.json({
      success: true,
      message: 'Wordmark uploaded successfully',
      data: {
        id: wordmarkAsset.id,
        fileName: wordmarkAsset.fileName,
        originalName: wordmarkAsset.originalName,
        fileSize: wordmarkAsset.fileSize,
        mimeType: wordmarkAsset.mimeType,
        url: `/uploads/${filename}`
      }
    });
  } catch (error) {
    console.error('Error uploading wordmark:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up uploaded file:', unlinkError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to upload wordmark'
    });
  }
});

// Delete asset
router.delete('/assets/:id', authenticateToken, requireRole(['ADMINISTRATOR', 'SYSTEM_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const asset = await prisma.siteAsset.findUnique({
      where: { id }
    });
    
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }
    
    // Delete file from filesystem
    try {
      await fs.unlink(asset.filePath);
    } catch (unlinkError) {
      console.error('Error deleting file:', unlinkError);
    }
    
    // Delete from database
    await prisma.siteAsset.delete({
      where: { id }
    });
    
    res.json({
      success: true,
      message: 'Asset deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete asset'
    });
  }
});

// Reset color settings to default
router.post('/settings/colors/reset', authenticateToken, requireRole(['ADMINISTRATOR', 'SYSTEM_ADMIN']), async (req, res) => {
  try {
    const userId = req.user.id;
    
    const defaultColors = {
      primary: '#215d55',
      secondary: '#656362',
      background: '#ffffff',
      textPrimary: '#1c4643'
    };
    
    const colorSettings = await prisma.siteSetting.upsert({
      where: { key: 'color_palette' },
      update: {
        value: defaultColors,
        updatedBy: userId
      },
      create: {
        key: 'color_palette',
        value: defaultColors,
        description: 'Website color palette settings',
        updatedBy: userId
      }
    });
    
    res.json({
      success: true,
      message: 'Color settings reset to default',
      data: colorSettings.value
    });
  } catch (error) {
    console.error('Error resetting color settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset color settings'
    });
  }
});

// Get public site information (no authentication required)
router.get('/settings/site-info/public', async (req, res) => {
  try {
    const siteInfoKeys = [
      'site_name',
      'site_description',
      'contact_email',
      'address',
      'year_copyright',
      'facebook_link',
      'instagram_link',
      'x_link'
    ];

    const settings = await prisma.siteSetting.findMany({
      where: {
        key: {
          in: siteInfoKeys
        }
      }
    });

    const siteInfo = {};
    settings.forEach(setting => {
      siteInfo[setting.key] = setting.value;
    });

    // Fill in defaults for missing settings
    const defaultSiteInfo = {
      site_name: 'The AXIS',
      site_description: 'The AXIS, the Official Student Publication of the Batangas State University–The National Engineering University Alangilan Campus, is a student-funded, student-run, written and produced group of publications that attempts to bring comprehensive coverage of the news and events affecting the campus.',
      contact_email: 'theaxispub.alangilan@g.batstate-u.edu.ph',
      address: 'Alangilan, Batangas City, Philippines',
      year_copyright: new Date().getFullYear().toString(),
      facebook_link: 'https://www.facebook.com/TheAXISPublications',
      instagram_link: 'https://www.instagram.com/theaxispub/',
      x_link: 'https://x.com/theaxispub'
    };

    siteInfoKeys.forEach(key => {
      if (!siteInfo[key]) {
        siteInfo[key] = defaultSiteInfo[key];
      }
    });

    res.json({
      success: true,
      data: siteInfo
    });
  } catch (error) {
    console.error('Error fetching public site information:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch site information'
    });
  }
});

// Get site information settings (admin only)
router.get('/settings/site-info', authenticateToken, requireRole(['ADMINISTRATOR', 'SYSTEM_ADMIN']), async (req, res) => {
  try {
    const siteInfoKeys = [
      'site_name',
      'site_description',
      'contact_email',
      'address',
      'year_copyright',
      'facebook_link',
      'instagram_link',
      'x_link'
    ];

    const settings = await prisma.siteSetting.findMany({
      where: {
        key: {
          in: siteInfoKeys
        }
      }
    });

    const siteInfo = {};
    settings.forEach(setting => {
      siteInfo[setting.key] = setting.value;
    });

    // Fill in defaults for missing settings
    const defaultSiteInfo = {
      site_name: 'The AXIS',
      site_description: 'The AXIS, the Official Student Publication of the Batangas State University–The National Engineering University Alangilan Campus, is a student-funded, student-run, written and produced group of publications that attempts to bring comprehensive coverage of the news and events affecting the campus.',
      contact_email: 'theaxispub.alangilan@g.batstate-u.edu.ph',
      address: 'Alangilan, Batangas City, Philippines',
      year_copyright: new Date().getFullYear().toString(),
      facebook_link: 'https://www.facebook.com/TheAXISPublications',
      instagram_link: 'https://www.instagram.com/theaxispub/',
      x_link: 'https://x.com/theaxispub'
    };

    siteInfoKeys.forEach(key => {
      if (!siteInfo[key]) {
        siteInfo[key] = defaultSiteInfo[key];
      }
    });

    res.json({
      success: true,
      data: siteInfo
    });
  } catch (error) {
    console.error('Error fetching site information:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch site information'
    });
  }
});

// Update site information settings
router.put('/settings/site-info', authenticateToken, requireRole(['ADMINISTRATOR', 'SYSTEM_ADMIN']), async (req, res) => {
  try {
    const { siteInfo } = req.body;
    const userId = req.user.id;

    // Validate required fields
    const requiredFields = ['site_name', 'contact_email'];
    const missingFields = requiredFields.filter(field => !siteInfo[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(siteInfo.contact_email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Validate URL formats for social media links
    const urlRegex = /^https?:\/\/.+/;
    const socialFields = ['facebook_link', 'instagram_link', 'x_link'];
    const invalidUrls = socialFields.filter(field => 
      siteInfo[field] && !urlRegex.test(siteInfo[field])
    );
    
    if (invalidUrls.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid URL format for: ${invalidUrls.join(', ')}. URLs must start with http:// or https://`
      });
    }

    // Update or create each setting
    const updatedSettings = {};
    for (const [key, value] of Object.entries(siteInfo)) {
      const setting = await prisma.siteSetting.upsert({
        where: { key },
        update: {
          value: value,
          updatedBy: userId
        },
        create: {
          key,
          value: value,
          description: `Site information: ${key.replace('_', ' ')}`,
          updatedBy: userId
        }
      });
      updatedSettings[key] = setting.value;
    }

    res.json({
      success: true,
      message: 'Site information updated successfully',
      data: updatedSettings
    });
  } catch (error) {
    console.error('Error updating site information:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update site information'
    });
  }
});

// Get privacy policy and terms of service (public endpoint)
router.get('/settings/legal/public', async (req, res) => {
  try {
    const legalKeys = ['privacy_policy', 'terms_of_service'];
    
    const settings = await prisma.siteSetting.findMany({
      where: {
        key: {
          in: legalKeys
        }
      },
      select: {
        key: true,
        value: true,
        updatedAt: true
      }
    });

    const legalContent = {};
    let lastUpdated = null;
    
    settings.forEach(setting => {
      legalContent[setting.key] = setting.value;
      // Track the most recent update date
      if (!lastUpdated || setting.updatedAt > lastUpdated) {
        lastUpdated = setting.updatedAt;
      }
    });

    // Default content if not set
    const defaultLegal = {
      privacy_policy: `# Privacy Policy

## Information We Collect

We collect information you provide directly to us, such as when you create an account, submit content, or contact us.

### Personal Information
- Name and email address
- Content submissions (articles, comments, etc.)
- Profile information

### Usage Information
- How you use our website
- Device and browser information
- IP address and location data

## How We Use Your Information

We use the information we collect to:
- Provide and maintain our services
- Process content submissions
- Communicate with you
- Improve our website and services
- Ensure security and prevent abuse

## Information Sharing

We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except:
- To comply with legal obligations
- To protect our rights and safety
- With service providers who assist us in operating our website

## Data Security

We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.

## Cookies and Tracking

Our website may use cookies and similar tracking technologies to enhance your browsing experience and analyze website traffic.

## Your Rights

You have the right to:
- Access your personal information
- Correct inaccurate information
- Request deletion of your information

## Contact Us

If you have any questions about this Privacy Policy, please contact us at:
- Email: theaxispub.alangilan@g.batstate-u.edu.ph
- Address: Alangilan, Batangas City, Philippines`,

      terms_of_service: `# Terms of Service

## Acceptance of Terms

By accessing and using The AXIS Group of Publications website, you accept and agree to be bound by the terms and provision of this agreement.

## User Conduct

When using our website, you agree to:
- Provide accurate and truthful information
- Respect other users and maintain civil discourse
- Not post content that is illegal, harmful, or violates others' rights
- Not attempt to gain unauthorized access to our systems
- Not use our website for any unlawful purpose

## Comments and User-Generated Content

By submitting comments or other content to our website, you grant us a non-exclusive, royalty-free license to use, reproduce, and distribute such content. You are responsible for the content you submit and must ensure it does not violate any laws or infringe on others' rights.

## Content Moderation

We reserve the right to moderate, edit, or remove any content that violates these terms or is deemed inappropriate. We may also suspend or terminate accounts that repeatedly violate these terms.

## Intellectual Property

All content on this website, including articles, images, and design elements, is the property of The AXIS Group of Publications or its content creators and is protected by copyright and other intellectual property laws.

## Disclaimer

The materials on The AXIS website are provided on an 'as is' basis. The AXIS Group of Publications makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.

## Limitations

In no event shall The AXIS Group of Publications or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on The AXIS website, even if The AXIS Group of Publications or an authorized representative has been notified orally or in writing of the possibility of such damage.

## Accuracy of Materials

The materials appearing on The AXIS website could include technical, typographical, or photographic errors. The AXIS Group of Publications does not warrant that any of the materials on its website are accurate, complete, or current.

## Links to Other Websites

Our website may contain links to third-party websites. We are not responsible for the content or privacy practices of these external sites.

## Governing Law

These terms and conditions are governed by and construed in accordance with the laws of the Philippines and you irrevocably submit to the exclusive jurisdiction of the courts in that state or location.

## Changes to Terms

The AXIS Group of Publications may revise these terms of service at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.

## Contact Information

If you have any questions about these Terms of Service, please contact us at:
- Email: theaxispub.alangilan@g.batstate-u.edu.ph
- Address: Alangilan, Batangas City, Philippines`
    };

    legalKeys.forEach(key => {
      if (!legalContent[key]) {
        legalContent[key] = defaultLegal[key];
      }
    });

    res.json({
      success: true,
      data: {
        ...legalContent,
        lastUpdated: lastUpdated
      }
    });
  } catch (error) {
    console.error('Error fetching public legal content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch legal content'
    });
  }
});

// Get privacy policy and terms of service (admin endpoint)
router.get('/settings/legal', authenticateToken, requireRole(['ADMINISTRATOR', 'SYSTEM_ADMIN']), async (req, res) => {
  try {
    const legalKeys = ['privacy_policy', 'terms_of_service'];
    
    const settings = await prisma.siteSetting.findMany({
      where: {
        key: {
          in: legalKeys
        }
      }
    });

    const legalContent = {};
    settings.forEach(setting => {
      legalContent[setting.key] = setting.value;
    });

    // Default content if not set
    const defaultLegal = {
      privacy_policy: `# Privacy Policy

## Information We Collect

We collect information you provide directly to us, such as when you create an account, submit content, or contact us.

### Personal Information
- Name and email address
- Content submissions (articles, comments, etc.)
- Profile information

### Usage Information
- How you use our website
- Device and browser information
- IP address and location data

## How We Use Your Information

We use the information we collect to:
- Provide and maintain our services
- Process content submissions
- Communicate with you
- Improve our website and services
- Ensure security and prevent abuse

## Information Sharing

We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except:
- To comply with legal obligations
- To protect our rights and safety
- With service providers who assist us in operating our website

## Data Security

We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.

## Your Rights

You have the right to:
- Access your personal information
- Correct inaccurate information
- Delete your account and data
- Opt-out of communications

## Contact Us

If you have questions about this Privacy Policy, please contact us at: contact@theaxis.local

Last updated: ${new Date().toLocaleDateString()}`,
      
      terms_of_service: `# Terms of Service

## Acceptance of Terms

By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement.

## Use License

Permission is granted to temporarily download one copy of the materials on this website for personal, non-commercial transitory viewing only.

## Content Submission

When you submit content to our platform:
- You retain ownership of your content
- You grant us a license to publish and distribute your content
- You are responsible for ensuring your content does not violate any laws or rights
- We reserve the right to edit, reject, or remove content

## Prohibited Uses

You may not use our website:
- For any unlawful purpose or to solicit others to perform unlawful acts
- To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances
- To infringe upon or violate our intellectual property rights or the intellectual property rights of others
- To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate
- To submit false or misleading information

## User Accounts

When you create an account:
- You must provide accurate and complete information
- You are responsible for maintaining the security of your account
- You must notify us immediately of any unauthorized use
- We reserve the right to suspend or terminate accounts that violate these terms

## Privacy

Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the website.

## Modifications

We reserve the right to modify these terms at any time. We will notify users of any material changes.

## Contact Information

If you have any questions about these Terms of Service, please contact us at: contact@theaxis.local

Last updated: ${new Date().toLocaleDateString()}`
    };

    legalKeys.forEach(key => {
      if (!legalContent[key]) {
        legalContent[key] = defaultLegal[key];
      }
    });

    res.json({
      success: true,
      data: legalContent
    });
  } catch (error) {
    console.error('Error fetching legal content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch legal content'
    });
  }
});

// Update privacy policy and terms of service
router.put('/settings/legal', authenticateToken, requireRole(['ADMINISTRATOR', 'SYSTEM_ADMIN']), async (req, res) => {
  try {
    const { privacy_policy, terms_of_service } = req.body;
    const userId = req.user.id;

    if (!privacy_policy || !terms_of_service) {
      return res.status(400).json({
        success: false,
        message: 'Both privacy policy and terms of service are required'
      });
    }

    // Update privacy policy
    const privacySetting = await prisma.siteSetting.upsert({
      where: { key: 'privacy_policy' },
      update: {
        value: privacy_policy,
        updatedBy: userId
      },
      create: {
        key: 'privacy_policy',
        value: privacy_policy,
        description: 'Website privacy policy',
        updatedBy: userId
      }
    });

    // Update terms of service
    const termsSetting = await prisma.siteSetting.upsert({
      where: { key: 'terms_of_service' },
      update: {
        value: terms_of_service,
        updatedBy: userId
      },
      create: {
        key: 'terms_of_service',
        value: terms_of_service,
        description: 'Website terms of service',
        updatedBy: userId
      }
    });

    res.json({
      success: true,
      message: 'Legal content updated successfully',
      data: {
        privacy_policy: privacySetting.value,
        terms_of_service: termsSetting.value
      }
    });
  } catch (error) {
    console.error('Error updating legal content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update legal content'
    });
  }
});

// Get specific setting (moved to end to avoid conflicts with specific routes)
router.get('/settings/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const setting = await prisma.siteSetting.findUnique({
      where: { key }
    });
    
    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      });
    }
    
    res.json({
      success: true,
      data: setting.value
    });
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch setting'
    });
  }
});

module.exports = router;
