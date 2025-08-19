document.addEventListener('DOMContentLoaded', () => {
  const statusIndicator = document.getElementById('status-indicator');
  const statusText = document.getElementById('status-text');

  // Function to update the popup's UI based on the database count
  const updatePopupUI = (count) => {
    statusIndicator.className = ''; // Reset classes

    if (count > 0) {
      statusIndicator.classList.add('found');
      statusText.textContent = `Database(s) detected: ${count} found`;
    } else {
      switch (count) {
        case 0:
          statusIndicator.classList.add('error'); // Use red to indicate nothing was found
          statusText.textContent = 'No database found on this page.';
          break;
        case -1:
          statusIndicator.classList.add('error');
          statusText.textContent = 'Error: Could not connect to page.';
          break;
        case -2:
          statusIndicator.classList.add('error');
          statusText.textContent = 'This is not a Notion page.';
          break;
        default:
          // Default to searching state if count is undefined or unexpected
          statusIndicator.classList.add('searching');
          statusText.textContent = 'Searching for databases...';
          break;
      }
    }
  };

  // Immediately ask the content script for the current status on load
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (activeTab && activeTab.url && activeTab.url.includes('notion.so')) {
      chrome.tabs.sendMessage(activeTab.id, { type: 'GET_DB_COUNT' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          updatePopupUI(-1); // Error state
        } else if (response && typeof response.count !== 'undefined') {
          updatePopupUI(response.count);
        } else {
          // No response, content script might still be loading
          updatePopupUI(); // Default to searching
        }
      });
    } else {
      updatePopupUI(-2); // Not a notion page
    }
  });

  // Listen for proactive updates from the content script (e.g., if a DB loads after popup is open)
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'DB_COUNT_UPDATED') {
      updatePopupUI(request.count);
    }
  });
});
