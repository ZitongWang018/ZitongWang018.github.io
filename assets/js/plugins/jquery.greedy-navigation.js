/*
* Greedy Navigation
*
* http://codepen.io/lukejacksonn/pen/PwmwWV
*
*/

var $nav = $('#site-nav');
var $btn = $('#site-nav button');
var $vlinks = $('#site-nav .visible-links');
var $hlinks = $('#site-nav .hidden-links');

// Disable greedy navigation - always show all links and hide the button
function updateNav() {
  // Move all hidden links back to visible links first
  if($hlinks && $hlinks.children().length > 0) {
    $hlinks.children().appendTo($vlinks);
  }
  
  // Always hide the button and hidden links container
  if($btn && $btn.length > 0) {
    $btn.addClass('hidden');
  }
  if($hlinks && $hlinks.length > 0) {
    $hlinks.addClass('hidden');
  }
}

// Continuously ensure all links are visible (in case other code tries to hide them)
function ensureAllLinksVisible() {
  if($hlinks && $hlinks.children().length > 0) {
    $hlinks.children().appendTo($vlinks);
  }
  if($btn && $btn.length > 0) {
    $btn.addClass('hidden');
  }
}

// Window listeners
$(window).resize(function() {
  updateNav();
});

// Initialize when DOM is ready
$(document).ready(function() {
  updateNav();
  // Check periodically to ensure links stay visible
  setInterval(ensureAllLinksVisible, 100);
});

// Also run immediately in case DOM is already ready
if(document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', updateNav);
} else {
  updateNav();
  // Check periodically
  setInterval(ensureAllLinksVisible, 100);
}