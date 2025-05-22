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
  }
  
  handleBannerClick(event) {
    // Example of interaction handling
    console.log('Banner clicked:', this.settings);
    
    // Dispatch custom event that the app might listen for
    const customEvent = new CustomEvent('banner:click', {
      detail: {
        blockId: this.id,
        settings: this.settings
      },
      bubbles: true
    });
    
    this.dispatchEvent(customEvent);
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