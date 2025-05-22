// extensions/banner/assets/banner.js

class CustomBanner extends HTMLElement {
  constructor() {
    super();
    
    // Get the settings from the data attribute
    try {
      this.settings = JSON.parse(this.getAttribute('data-banner-settings') || '{}');
    } catch (error) {
      console.error('Error parsing banner settings:', error);
      this.settings = {
        heading: '',
        description: '',
        banner_height: 'medium',
        text_color: '#ffffff',
        background_color: '#4a4a4a'
      };
    }
    
    // Initialize the banner
    this.init();
  }
  
  init() {
    // Add animation classes after component loads
    setTimeout(() => {
      this.classList.add('banner-loaded');
    }, 100);
    
    // Add event listeners for interaction
    this.addEventListener('click', this.handleBannerClick.bind(this));
    
    // Create camera popup modal (initially hidden)
    this.createCameraModal();
  }
  
  createCameraModal() {
    // Create modal HTML structure
    const modal = document.createElement('div');
    modal.className = 'camera-modal';
    modal.innerHTML = `
      <div class="camera-modal-content">
        <span class="camera-close">&times;</span>
        <h3>Camera Access</h3>
        <video id="camera-video" autoplay playsinline></video>
        <canvas id="camera-canvas" style="display: none;"></canvas>
        <div class="camera-controls">
          <button id="capture-btn">📸 Capture Photo</button>
          <button id="switch-camera-btn">🔄 Switch Camera</button>
        </div>
        <div id="captured-image-container" style="display: none;">
          <h4>Captured Image:</h4>
          <img id="captured-image" alt="Captured photo" />
          <div class="image-actions">
            <button id="save-image-btn">💾 Save Image</button>
            <button id="retake-btn">🔄 Retake</button>
          </div>
        </div>
      </div>
    `;
    
    // Add modal styles
    const style = document.createElement('style');
    style.textContent = `
      .camera-modal {
        display: none;
        position: fixed;
        z-index: 10000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(5px);
      }
      
      .camera-modal-content {
        background-color: #ffffff;
        margin: 5% auto;
        padding: 20px;
        border-radius: 15px;
        width: 90%;
        max-width: 600px;
        text-align: center;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      }
      
      .camera-close {
        color: #aaa;
        float: right;
        font-size: 28px;
        font-weight: bold;
        cursor: pointer;
        line-height: 1;
      }
      
      .camera-close:hover {
        color: #000;
      }
      
      #camera-video {
        width: 100%;
        max-width: 500px;
        height: auto;
        border-radius: 10px;
        margin: 15px 0;
        background: #000;
        transform: scaleX(-1); /* Flip horizontally to fix mirror effect */
      }
      
      #camera-video.back-camera {
        transform: none; /* Don't flip back camera */
      }
      
      .camera-controls {
        margin: 15px 0;
      }
      
      .camera-controls button,
      .image-actions button {
        background: #007cba;
        color: white;
        border: none;
        padding: 12px 20px;
        margin: 5px;
        border-radius: 25px;
        cursor: pointer;
        font-size: 16px;
        transition: background 0.3s;
      }
      
      .camera-controls button:hover,
      .image-actions button:hover {
        background: #005a87;
      }
      
      #captured-image {
        width: 100%;
        max-width: 400px;
        border-radius: 10px;
        margin: 10px 0;
      }
      
      .image-actions {
        margin-top: 15px;
      }
    `;
    
    // Add modal and styles to document
    document.head.appendChild(style);
    document.body.appendChild(modal);
    
    // Store modal reference
    this.modal = modal;
    this.setupCameraEvents();
  }
  
  setupCameraEvents() {
    const modal = this.modal;
    const video = modal.querySelector('#camera-video');
    const canvas = modal.querySelector('#camera-canvas');
    const closeBtn = modal.querySelector('.camera-close');
    const captureBtn = modal.querySelector('#capture-btn');
    const switchBtn = modal.querySelector('#switch-camera-btn');
    const saveBtn = modal.querySelector('#save-image-btn');
    const retakeBtn = modal.querySelector('#retake-btn');
    const capturedImageContainer = modal.querySelector('#captured-image-container');
    const capturedImage = modal.querySelector('#captured-image');
    
    let currentStream = null;
    let facingMode = 'user'; // 'user' for front camera, 'environment' for back camera
    
    // Close modal events
    closeBtn.onclick = () => this.closeCameraModal();
    modal.onclick = (e) => {
      if (e.target === modal) this.closeCameraModal();
    };
    
    // Camera controls
    captureBtn.onclick = () => this.capturePhoto(video, canvas, capturedImage, capturedImageContainer);
    switchBtn.onclick = () => this.switchCamera(video);
    retakeBtn.onclick = () => this.retakePhoto(capturedImageContainer, video);
    saveBtn.onclick = () => this.saveImage(capturedImage);
    
    // Store references for later use
    this.cameraElements = {
      video, canvas, capturedImage, capturedImageContainer
    };
    this.facingMode = 'user'; // Initialize facing mode
  }
  
  async handleBannerClick(event) {
    // Prevent default behavior
    event.preventDefault();
    
    console.log('Banner clicked:', this.settings);
    
    // Show camera modal
    await this.openCameraModal();
    
    // Dispatch custom event
    const customEvent = new CustomEvent('banner:click', {
      detail: {
        blockId: this.id,
        settings: this.settings,
        action: 'camera_opened'
      },
      bubbles: true
    });
    
    this.dispatchEvent(customEvent);
  }
  
  async openCameraModal() {
    this.modal.style.display = 'block';
    
    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      
      const video = this.cameraElements.video;
      video.srcObject = stream;
      this.currentStream = stream;
      
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Could not access camera. Please check your permissions and try again.');
      this.closeCameraModal();
    }
  }
  
  closeCameraModal() {
    this.modal.style.display = 'none';
    
    // Stop camera stream
    if (this.currentStream) {
      this.currentStream.getTracks().forEach(track => track.stop());
      this.currentStream = null;
    }
    
    // Reset UI
    this.cameraElements.capturedImageContainer.style.display = 'none';
    this.cameraElements.video.style.display = 'block';
  }
  
  capturePhoto(video, canvas, capturedImage, capturedImageContainer) {
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    const context = canvas.getContext('2d');
    
    // Check if it's front camera (mirrored) and flip the captured image back to normal
    if (this.facingMode === 'user') {
      // Flip the image horizontally for front camera
      context.scale(-1, 1);
      context.drawImage(video, -canvas.width, 0);
    } else {
      // Back camera - draw normally
      context.drawImage(video, 0, 0);
    }
    
    // Convert canvas to image
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    capturedImage.src = imageDataUrl;
    
    // Show captured image, hide video
    video.style.display = 'none';
    capturedImageContainer.style.display = 'block';
    
    console.log('Photo captured successfully');
  }
  
  async switchCamera(video) {
    // Toggle between front and back camera using the instance variable
    const newFacingMode = this.facingMode === 'user' ? 'environment' : 'user';
    
    try {
      // Stop current stream
      if (this.currentStream) {
        this.currentStream.getTracks().forEach(track => track.stop());
      }
      
      // Get new stream with different facing mode
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: newFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      
      video.srcObject = stream;
      this.currentStream = stream;
      this.facingMode = newFacingMode; // Update the instance variable
      
      // Update video CSS class based on camera type
      if (newFacingMode === 'environment') {
        video.classList.add('back-camera');
      } else {
        video.classList.remove('back-camera');
      }
      
      console.log('Switched to camera:', newFacingMode);
      
    } catch (error) {
      console.error('Error switching camera:', error);
      alert('Could not switch camera. This device may only have one camera.');
    }
  }
  
  retakePhoto(capturedImageContainer, video) {
    // Hide captured image, show video again
    capturedImageContainer.style.display = 'none';
    video.style.display = 'block';
  }
  
  saveImage(capturedImage) {
    // Create download link
    const link = document.createElement('a');
    link.download = `banner-photo-${Date.now()}.jpg`;
    link.href = capturedImage.src;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('Image saved');
    
    // Close modal after saving
    setTimeout(() => {
      this.closeCameraModal();
    }, 500);
  }
}

// Register the custom element with the browser
customElements.define('custom-banner', CustomBanner);

// Initialize all banner blocks on the page
document.addEventListener('DOMContentLoaded', () => {
  const bannerBlocks = document.querySelectorAll('.banner-block');
  
  bannerBlocks.forEach(block => {
    // Convert standard divs to custom elements
    if (!(block instanceof CustomBanner)) {
      const newBanner = document.createElement('custom-banner');
      
      // Copy all attributes
      Array.from(block.attributes).forEach(attr => {
        newBanner.setAttribute(attr.name, attr.value);
      });
      
      // Copy inner HTML
      newBanner.innerHTML = block.innerHTML;
      
      // Replace the original element
      if (block.parentNode) {
        block.parentNode.replaceChild(newBanner, block);
      }
    }
  });
});