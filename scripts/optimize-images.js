const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const glob = require('glob');

// Configuration
const QUALITY = 80;
const WIDTHS = [480, 768, 1200];
  const IMAGE_DIRS = [
    path.resolve(__dirname, '../src/assets/images'),
    path.resolve(__dirname, '../public/assets/images'),
    path.resolve(__dirname, '../client/src/assets/images'),
    path.resolve(__dirname, '../client/public/assets/images'),
  ];

// Helper to ensure directory exists
async function ensureDir(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

// Process a single image
async function processImage(imagePath) {
  const ext = path.extname(imagePath).toLowerCase();
  if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
    console.log(`Skipping ${imagePath} - not a supported image type`);
    return;
  }

  const dir = path.dirname(imagePath);
  const basename = path.basename(imagePath, ext);

  console.log(`Processing ${imagePath}...`);

  // Generate WebP versions at different widths
  for (const width of WIDTHS) {
    const outputPath = path.join(dir, `${basename}-${width}.webp`);
    
    try {
      await sharp(imagePath)
        .resize(width, null, {
          withoutEnlargement: true,
          fit: 'inside',
        })
        .webp({ quality: QUALITY })
        .toFile(outputPath);

      console.log(`✅ Generated ${outputPath}`);
    } catch (error) {
      console.error(`❌ Error processing ${imagePath} at width ${width}:`, error.message);
    }
  }

  // Generate a tiny preview version for blur-up loading
  try {
    const previewPath = path.join(dir, `${basename}-preview.webp`);
    await sharp(imagePath)
      .resize(20, null, {
        withoutEnlargement: true,
        fit: 'inside',
      })
      .webp({ quality: 20 })
      .toFile(previewPath);

    console.log(`✅ Generated preview ${previewPath}`);
  } catch (error) {
    console.error(`❌ Error generating preview for ${imagePath}:`, error.message);
  }
}

// Main function
async function optimizeImages() {
  try {
    let totalProcessed = 0;
    
    // Process each image directory
    for (const dir of IMAGE_DIRS) {
      try {
        await ensureDir(dir);
        
                  // Find all images in directory
          const images = glob.sync(path.join(dir, '**/*.{jpg,jpeg,png}').replace(/\\/g, '/'));
        
        console.log(`📁 Found ${images.length} images in ${dir}`);
        
        if (images.length > 0) {
          // Process each image
          for (const image of images) {
            await processImage(image);
            totalProcessed++;
          }
        }
      } catch (error) {
        console.log(`⚠️  Directory ${dir} not found or inaccessible, skipping...`);
      }
    }

    console.log(`🎉 Image optimization complete! Processed ${totalProcessed} images.`);
  } catch (error) {
    console.error('❌ Error during image optimization:', error);
    process.exit(1);
  }
}

// Run the optimization
optimizeImages(); 