// extensions/banner/assets/banner.js

class CustomBanner extends HTMLElement {
  constructor() {
    super();
    
    // Get the settings from the data attribute
    this.settings = JSON.parse(this.getAttribute('data-banner-settings') || '{}');
    
    // Initialize the banner
    this.init();
  }
  
  init() {
    // Add any additional JavaScript functionality here
    
    // For example, you could add animation classes after the component loads
    setTimeout(() => {
      this.classList.add('banner-loaded');
    }, 100);
    
    // You could also add event listeners for interaction
    this.addEventListener('click', this.handleBannerClick.bind(this));
  }
  
  handleBannerClick(event) {
    // Example of interaction handling
    console.log('Banner clicked:', this.settings);
    
    // You could trigger custom events here that your app might listen for
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
      block.parentNode.replaceChild(newBanner, block);
    }
  });
});