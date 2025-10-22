const api = pitcher.useApi();
const uiApi = pitcher.useUi();
window.api = api;
let env = {};
let instanceID = "";
let currentCanvas = null;
let appConfig = null;

// Message queue system for iframe communication
let messageQueue = [];
let iframeReady = false;
let iframe = null;
let debugMode = false;
let messageHistory = [];
let iframeLoadTimeout = null;
let iframeLoadedSuccessfully = false;

// Send message to iframe with queue fallback
function sendToIframe(message) {
  if (iframeReady && iframe && iframe.contentWindow) {
    try {
      iframe.contentWindow.postMessage(message, "*");
      console.log("Message sent to iframe:", message.type);
      addMessageToHistory(message, 'sent');
    } catch (error) {
      console.error("Error sending message to iframe:", error);
      // If send fails, queue it (don't add to history yet, will add when actually sent)
      messageQueue.push(message);
    }
  } else {
    console.log("Iframe not ready, queueing message:", message.type);
    messageQueue.push(message);
    // Don't add to history yet - will be added when actually sent from queue
  }
  updateDebugPanel(); // Update panel to show queue changes
}

// Flush all queued messages
function flushMessageQueue() {
  if (!iframeReady || !iframe || !iframe.contentWindow) {
    console.log("Cannot flush queue - iframe not ready");
    return;
  }

  console.log(`Flushing ${messageQueue.length} queued messages`);
  while (messageQueue.length > 0) {
    const message = messageQueue.shift();
    try {
      iframe.contentWindow.postMessage(message, "*");
      console.log("Queued message sent:", message.type);
      addMessageToHistory(message, 'sent');
    } catch (error) {
      console.error("Error sending queued message:", error);
      // Put it back at the front if it fails
      messageQueue.unshift(message);
      addMessageToHistory(message, 'error');
      break;
    }
  }
  updateDebugPanel();
}

// Mark iframe as ready and flush queue
function onIframeReady(loadedSuccessfully = true) {
  // Clear the timeout since iframe loaded successfully
  if (iframeLoadTimeout) {
    clearTimeout(iframeLoadTimeout);
    iframeLoadTimeout = null;
  }

  iframeReady = true;
  iframeLoadedSuccessfully = loadedSuccessfully;
  console.log(loadedSuccessfully ? "Iframe loaded successfully, flushing queue" : "Iframe ready (timeout/error), flushing queue");
  updateDebugPanel();
  flushMessageQueue();
}

// Mark iframe as failed
function onIframeError() {
  console.error("Iframe failed to load");
  iframeLoadedSuccessfully = false;
  updateDebugPanel();
}

// Reset iframe state (called when creating new iframe)
function resetIframeState() {
  // Clear any pending iframe load timeout
  if (iframeLoadTimeout) {
    clearTimeout(iframeLoadTimeout);
    iframeLoadTimeout = null;
  }

  iframeReady = false;
  iframe = null;
  iframeLoadedSuccessfully = false;
  // Clear message queue to prevent old messages from being sent to new iframe
  messageQueue = [];
  console.log("Iframe state reset, queue cleared");
  updateDebugPanel();
}

// Function to set debug colors based on instance color
function setDebugColors() {
  const instanceColor = window.env?.instance?.color || '#00ffff';
  
  // Convert hex to RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 255, b: 255 };
  };
  
  const rgb = hexToRgb(instanceColor);
  
  // Set CSS custom properties
  document.documentElement.style.setProperty('--debug-color', instanceColor);
  document.documentElement.style.setProperty('--debug-color-shadow', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`);
  document.documentElement.style.setProperty('--debug-color-transparent', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`);
  document.documentElement.style.setProperty('--debug-color-translucent', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6)`);
  document.documentElement.style.setProperty('--debug-color-bright', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.95)`);
}

// Secret debug mode activation via corner trigger
// This works even when iframe has focus
const CLICK_WINDOW = 800; // milliseconds
let cornerClicks = [];

function createDebugTrigger() {
  // Remove existing trigger if present
  const existing = document.getElementById('debugTrigger');
  if (existing) {
    existing.remove();
  }

  // Create a small corner trigger
  const trigger = document.createElement('div');
  trigger.id = 'debugTrigger';
  trigger.className = 'debug-trigger';
  trigger.title = 'Triple-click to toggle debug mode';

  trigger.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();

    const now = Date.now();
    cornerClicks.push(now);

    // Remove clicks older than the time window
    cornerClicks = cornerClicks.filter(click => now - click < CLICK_WINDOW);

    // Visual feedback on each click
    trigger.style.transform = 'scale(1.2)';
    setTimeout(() => {
      trigger.style.transform = 'scale(1)';
    }, 100);

    // Check if we have 3 clicks within the window
    if (cornerClicks.length >= 3) {
      cornerClicks = []; // Reset
      toggleDebugMode();
    }
  });

  document.body.appendChild(trigger);
}

function toggleDebugMode() {
  debugMode = !debugMode;

  // Save to localStorage for persistence across page reloads
  try {
    localStorage.setItem('pitcher_debug_mode', debugMode.toString());
  } catch (error) {
    console.error('Failed to save debug mode preference:', error);
  }

  console.log(`Debug mode ${debugMode ? 'ENABLED' : 'DISABLED'} (persisted: corner triple-click)`);

  if (debugMode) {
    createDebugPanel();
    showDebugToast('Debug Mode Enabled\n(Triple-click corner to toggle)\n(Persists across reloads)');
  } else {
    // Remove debug panel
    const panel = document.getElementById('debugPanel');
    if (panel) {
      panel.remove();
    }
    showDebugToast('Debug Mode Disabled\n(Triple-click corner to re-enable)');
  }
}

function loadDebugModePreference() {
  // Try to load from localStorage first (per-user preference)
  try {
    const stored = localStorage.getItem('pitcher_debug_mode');
    if (stored !== null) {
      const isEnabled = stored === 'true';
      console.log(`Debug mode loaded from localStorage: ${isEnabled}`);
      return isEnabled;
    }
  } catch (error) {
    console.error('Failed to load debug mode preference:', error);
  }

  // Fall back to config default (if set)
  return appConfig?.debug_mode === true;
}

function showDebugToast(message) {
  const toast = document.createElement('div');
  toast.className = 'debug-toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  // Fade out and remove after 2 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// Create debug trigger on load
document.addEventListener('DOMContentLoaded', createDebugTrigger);

// Debug UI functions
function createDebugPanel() {
  if (!debugMode) return;

  // Remove existing panel if it exists
  const existingPanel = document.getElementById('debugPanel');
  if (existingPanel) {
    existingPanel.remove();
  }

  const panel = document.createElement('div');
  panel.id = 'debugPanel';
  panel.className = 'debug-panel';
  panel.innerHTML = `
    <div class="debug-header">
      🔍 DEBUG MODE
    </div>
    <div id="debugContent"></div>
  `;
  document.body.appendChild(panel);
  updateDebugPanel();
}

function updateDebugPanel() {
  if (!debugMode) return;

  const content = document.getElementById('debugContent');
  if (!content) return;

  const now = new Date().toLocaleTimeString();
  
  // Get instance color for inline styles
  const instanceColor = window.env?.instance?.color || '#0ff';

  let html = `
    <div style="margin-bottom: 8px;">
      <span style="color: #ff0;">Iframe Status:</span>
      <span style="color: ${iframeReady && iframeLoadedSuccessfully ? '#0f0' : (iframeReady ? '#f90' : '#f00')};">
        ${iframeReady && iframeLoadedSuccessfully ? '✓ LOADED' : (iframeReady ? '⚠ READY (TIMEOUT)' : '✗ NOT READY')}
      </span>
    </div>
    <div style="margin-bottom: 8px;">
      <span style="color: #ff0;">Queue:</span>
      <span style="color: ${messageQueue.length > 0 ? '#f90' : '#0f0'};">
        ${messageQueue.length} message(s)
      </span>
    </div>
  `;

  if (messageQueue.length > 0) {
    html += `
      <div style="margin-bottom: 8px; border-top: 1px solid #333; padding-top: 5px;">
        <div style="color: #ff0; margin-bottom: 3px;">Queued Messages:</div>
    `;
    messageQueue.forEach((msg) => {
      html += `<div style="margin-left: 10px; color: #f90;">• ${msg.type}</div>`;
    });
    html += `</div>`;
  }

  html += `
    <div style="margin-top: 8px; border-top: 1px solid #333; padding-top: 5px;">
      <div style="color: #ff0; margin-bottom: 3px;">Last 5 Messages:</div>
  `;

  const recentMessages = messageHistory.slice(-5).reverse();
  if (recentMessages.length === 0) {
    html += `<div style="margin-left: 10px; color: #666;">No messages yet</div>`;
  } else {
    recentMessages.forEach((entry, idx) => {
      const statusColor = entry.status === 'sent' ? '#0f0' : '#f00';
      const statusIcon = entry.status === 'sent' ? '✓' : '✗';
      html += `
        <div class="message-history-item" data-index="${idx}">
          <span style="color: ${statusColor};">
            ${statusIcon}
          </span>
          <span style="color: ${instanceColor};">${entry.type}</span>
          <span style="color: #aaa; font-size: 9px;"> ${entry.time}</span>
        </div>
      `;
    });
  }

  html += `
    </div>
    <div style="margin-top: 5px; font-size: 9px; color: #888; text-align: right;">
      Updated: ${now}
    </div>
  `;

  content.innerHTML = html;

  // Add click handlers to message history items
  const historyItems = content.querySelectorAll('.message-history-item');
  historyItems.forEach((item) => {
    item.addEventListener('click', function () {
      const index = parseInt(this.getAttribute('data-index'));
      showMessageDetails(index);
    });

    // Add hover effect
    item.addEventListener('mouseenter', function () {
      const instanceColor = window.env?.instance?.color || '#00ffff';
      const rgb = instanceColor.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
      if (rgb) {
        const r = parseInt(rgb[1], 16);
        const g = parseInt(rgb[2], 16);
        const b = parseInt(rgb[3], 16);
        this.style.background = `rgba(${r}, ${g}, ${b}, 0.1)`;
      } else {
        this.style.background = 'rgba(0, 255, 255, 0.1)';
      }
    });
    item.addEventListener('mouseleave', function () {
      this.style.background = 'transparent';
    });
  });
}

function addMessageToHistory(message, status) {
  if (!debugMode) return;

  messageHistory.push({
    type: message.type || 'unknown',
    message: message,
    status,
    time: new Date().toLocaleTimeString()
  });

  // Keep only last 20 messages
  if (messageHistory.length > 20) {
    messageHistory.shift();
  }

  updateDebugPanel();
}

// Show message details in a modal
function showMessageDetails(historyIndex) {
  const entry = messageHistory[messageHistory.length - 1 - historyIndex];
  if (!entry) return;

  const modal = document.createElement('div');
  modal.className = 'debug-modal';

  const messageJson = JSON.stringify(entry.message, null, 2);
  
  // Get instance color for inline styles
  const instanceColor = window.env?.instance?.color || '#0ff';

  modal.innerHTML = `
    <div class="debug-modal-header">
      <div class="debug-modal-title">
        Message Details
      </div>
      <button id="closeModal" class="debug-modal-close">
        ✕ Close
      </button>
    </div>
    <div style="margin-bottom: 10px;">
      <span style="color: #ff0;">Type:</span> <span style="color: ${instanceColor};">${entry.type}</span>
    </div>
    <div style="margin-bottom: 10px;">
      <span style="color: #ff0;">Status:</span> <span style="color: ${entry.status === 'sent' ? '#0f0' : '#f00'};">${entry.status}</span>
    </div>
    <div style="margin-bottom: 10px;">
      <span style="color: #ff0;">Time:</span> <span style="color: #aaa;">${entry.time}</span>
    </div>
    <div style="margin-bottom: 5px; color: #ff0;">Message Content:</div>
    <pre class="debug-modal-content">${messageJson}</pre>
  `;

  document.body.appendChild(modal);

  // Close modal on button click
  document.getElementById('closeModal').addEventListener('click', function () {
    modal.remove();
  });

  // Close modal on outside click
  modal.addEventListener('click', function (e) {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// Function to process URL with Handlebars template
function processUrlWithContext(urlTemplate, context) {
  try {
    // Compile the Handlebars template
    const template = Handlebars.compile(urlTemplate);
    // Process the template with the canvas context
    return template(context);
  } catch (error) {
    console.error("Error processing URL template:", error);
    return urlTemplate; // Return original URL if template processing fails
  }
}

// Helper function to get nested property value using dot notation
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, prop) => {
    return current?.[prop];
  }, obj);
}

// Helper function to set nested property value using dot notation
function setNestedValue(obj, path, value) {
  const parts = path.split('.');
  const lastPart = parts.pop();

  // Navigate/create the path
  const target = parts.reduce((current, prop) => {
    if (!current[prop] || typeof current[prop] !== 'object') {
      current[prop] = {};
    }
    return current[prop];
  }, obj);

  // Set the final value
  target[lastPart] = value;
}

// Build canvas data object based on app config
function buildCanvasData(result) {
  // Check if a custom transform function is provided
  if (appConfig?.transform_function) {
    try {
      // Eval the transform function and apply it
      const transformFn = eval(`(${appConfig.transform_function})`);
      const transformed = transformFn(result);
      console.log('Applied transform function to canvas data');
      return transformed;
    } catch (error) {
      console.error('Error applying transform function:', error);
      console.error('Transform function:', appConfig.transform_function);
      // Fall through to default behavior on error
    }
  }

  if (appConfig?.send_everything) {
    return { ...result };
  }

  // Extract only essential fields and specific context properties
  const {
    metadata,
    name,
    id,
    template,
    created_by,
    created_at,
    updated_at,
    updated_by,
    context
  } = result;

  // Build context object based on configuration
  let contextFields = null;

  // Try to parse custom context fields from config
  if (appConfig?.context_fields) {
    try {
      const parsedFields = JSON.parse(appConfig.context_fields);
      if (Array.isArray(parsedFields) && parsedFields.length > 0) {
        contextFields = {};
        parsedFields.forEach(field => {
          if (!context) return;

          // Check if field uses dot notation for nested access
          if (field.includes('.')) {
            // Extract nested value
            const value = getNestedValue(context, field);
            if (value !== undefined) {
              // Rebuild the nested structure in contextFields
              setNestedValue(contextFields, field, value);
            }
          } else {
            // Simple top-level field
            if (context[field] !== undefined) {
              contextFields[field] = context[field];
            }
          }
        });
      }
    } catch (error) {
      console.error("Error parsing context_fields configuration:", error);
      // Fall back to defaults
    }
  }

  // Use defaults if no custom fields were configured or parsing failed
  if (!contextFields) {
    contextFields = {
      wizard: context?.wizard,
      SelectedAccount: context?.SelectedAccount,
      Account: context?.Account
    };
  }

  return {
    metadata,
    name,
    id,
    template,
    created_by,
    created_at,
    updated_at,
    updated_by,
    context: contextFields
  };
}

const onIframeMessage = async (message) => {
  const { type, body: { action = null, data = null } = {} } =
    message.data;
  try {
    if (message.data.event.type == "canvas_updated") {
      console.log("canvas updated");
      api
        .getCanvas({ id: window.pitcherData.canvas.id })
        .then(function (result) {
          console.log(result);
          window.pitcherData.canvas = result;
          currentCanvas = result; // Update currentCanvas to always have latest

          sendToIframe({
            type: "CANVAS_DATA",
            canvas: buildCanvasData(result),
          });
        });
    }
  } catch (error) { }

  if (type === "IFRAME_DATA_MESSAGE" && action) {
    if (action === "set_data") {
      window.pitcherData = data;
      currentCanvas = window.pitcherData.canvas;
      api.getEnv().then(function (result) {
        window.env = result;
        setDebugColors();
        api
          .getAppConfig()
          .then(function (result) {
            appConfig = result;

            // Load debug mode preference (localStorage takes priority over config)
            debugMode = loadDebugModePreference();

            // Log debug mode status
            if (debugMode) {
              console.log('Debug mode enabled on initialization');
            }

            let iframeUrl = result.url;
            if (data.settings?.url) {
              iframeUrl = data.settings.url;
            }
            if (iframeUrl) {
              // Process URL with canvas context using Handlebars
              const processedUrl = processUrlWithContext(
                iframeUrl,
                data.canvas?.context || {}
              );
              console.log("Original URL:", iframeUrl);
              console.log("Canvas context:", data.canvas?.context);
              console.log("Processed URL:", processedUrl);

              // Reset iframe state before creating new iframe
              resetIframeState();

              document.body.innerHTML = `<iframe id="targetFrame" src="${processedUrl}" class="target-iframe"></iframe>`;

              // Recreate debug trigger after clearing body
              createDebugTrigger();

              // Store iframe reference and set up onload handler
              iframe = document.getElementById("targetFrame");
              iframe.onload = function () {
                const isRedirect = iframeReady; // If already ready, this is a redirect/navigation

                if (isRedirect) {
                  console.log("Iframe navigated/redirected - resending canvas data");
                }

                onIframeReady(true); // Successfully loaded

                // Only send initial canvas data if iframe loaded successfully (not timeout)
                // Get the latest canvas data (might have been updated)
                const latestCanvas = window.pitcherData?.canvas || currentCanvas;

                if (latestCanvas) {
                  sendToIframe({
                    type: "CANVAS_DATA",
                    canvas: buildCanvasData(latestCanvas),
                  });
                }
              };

              // Add error handler for iframe load failures
              iframe.onerror = function () {
                onIframeError();
                // Still mark as ready (with loadedSuccessfully=false) so future messages can be queued
                if (!iframeReady) {
                  onIframeReady(false);
                }
              };

              // Set timeout to mark iframe as ready even if onload doesn't fire
              // This prevents messages from being stuck in queue forever
              iframeLoadTimeout = setTimeout(function () {
                if (!iframeReady) {
                  console.warn("Iframe load timeout - marking as ready (but not loaded successfully)");
                  onIframeReady(false); // Mark as ready but not successfully loaded
                }
              }, 10000); // 10 second timeout

              // Create debug panel AFTER iframe is created (so it doesn't get removed)
              if (debugMode) {
                createDebugPanel();
              }
            } else {
              document.body.innerHTML = `
								<div class="no-url-message">
									<h1>No iFrame URL provided</h1>
									<h2>How to use Handlebars templates with canvas context:</h2>
									<p>You can use Handlebars syntax in your iframe URL to inject canvas context values dynamically.</p>
									<h3>Example URLs:</h3>
									<ul style="line-height: 2;">
										<li><code>https://www.google.com/search?q={{SelectedAccount.Name}}</code> - Search for account name</li>
										<li><code>https://example.com/account/{{SelectedAccount.Id}}</code> - Use account ID in path</li>
										<li><code>https://crm.example.com/lead?id={{SelectedLead.Id}}&amp;status={{SelectedLead.Status}}</code> - Multiple parameters</li>
										<li><code>https://maps.google.com/search/{{SelectedAccount.Address}}</code> - Use address field</li>
										<li><code>https://analytics.example.com/report?company={{SelectedAccount.Name}}&amp;owner={{SelectedAccount.Owner}}</code> - Multiple context fields</li>
									</ul>
									<h3>Available context variables depend on your canvas configuration:</h3>
									<ul>
										<li>SelectedAccount.* (Name, Id, Address, Owner, etc.)</li>
										<li>SelectedContact.* (Name, Email, Phone, etc.)</li>
										<li>SelectedLead.* (Id, Status, etc.)</li>
										<li>SelectedOpportunity.* (Name, Amount, Stage, etc.)</li>
										<li>Any other objects configured in your canvas context</li>
									</ul>
									<p style="margin-top: 20px;"><strong>Configure the URL in canvas settings to enable iframe passthrough.</strong></p>
								</div>
							`;

              // Recreate debug trigger after clearing body
              createDebugTrigger();

              // Create debug panel even when no URL (after innerHTML is set)
              if (debugMode) {
                createDebugPanel();
              }
            }
          });
      });
    }
    if (action === "canvas_updated") {
      window.pitcherData = data;
      currentCanvas = window.pitcherData.canvas;

      // Send updated canvas data to iframe
      if (currentCanvas) {
        sendToIframe({
          type: "CANVAS_DATA",
          canvas: buildCanvasData(currentCanvas),
        });
      }
    }
  }
};

document.addEventListener("DOMContentLoaded", function () {
  window.parent.postMessage(
    {
      type: "IFRAME_DATA_MESSAGE",
      body: {
        action: "iframe_loaded",
        data: {},
      },
    },
    "*"
  );
});

window.addEventListener("message", onIframeMessage);

window.pitcherData = {};
