# Image Measurement Tool with Perspective Correction

A web-based tool for measuring objects in images with advanced perspective distortion correction, calibration support, and real-time visual feedback.

## Quick Start

1. Save the 4 files (index.html, styles.css, script.js, perspective.js) in a folder
2. Open `index.html` in a modern web browser
3. Start measuring!

## Features

✅ **Image Upload** - Load any image format  
✅ **Perspective Correction** - Fix angled photos using 4-point homography  
✅ **Calibration** - Set real-world measurements  
✅ **Multi-Unit Support** - Measure in pixels, mm, cm, inches, or meters  
✅ **Live Measurements** - Click to measure with instant visual feedback  
✅ **High Quality** - Bilinear interpolation for smooth results  

## Usage Steps

### Step 1: Upload Image
Click the file input to select your image

### Step 2: Perspective Correction (Optional)
- Check "Enable Perspective Correction"
- Enter output width/height
- Click "Set Perspective"
- Click 4 corners in order: top-left → top-right → bottom-right → bottom-left

### Step 3: Calibration (Recommended)
- Check "Enable Calibration Mode"
- Enter known reference length (e.g., ruler length)
- Click "Calibrate"
- Click two points on your reference object

### Step 4: Measure
- Click "Start Measurement"
- Click two points on object to measure
- Results appear instantly

## Example: Measuring a UAV

1. Upload your UAV photo
2. Apply perspective correction to straighten the image
3. Calibrate using a known-size reference (ruler, measuring tape)
4. Click from wingtip to wingtip for wingspan
5. Click from nose to tail for length
6. All measurements saved in the list!

## Browser Support

Works on Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

## Files

- **index.html** - Main interface
- **styles.css** - Styling  
- **script.js** - Main application logic
- **perspective.js** - Perspective correction algorithm