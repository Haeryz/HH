console.log("Notion2Invoice content script loaded.");

let databaseCount = 0;
let debounceTimer;

// Function to scan the document for Notion databases
const findDatabases = () => {
  const dbSelectors = '.notion-collection-view, .notion-table-view, .notion-board-view';
  const databases = document.querySelectorAll(dbSelectors);

  if (databases.length !== databaseCount) {
    console.log(`Notion2Invoice: Found ${databases.length} databases.`);
    databaseCount = databases.length;
    // Proactively send the new count to any listening parts of the extension (e.g., the popup)
    chrome.runtime.sendMessage({ type: 'DB_COUNT_UPDATED', count: databaseCount });
  }
};

// Debounced version of our findDatabases function
const debouncedFindDatabases = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(findDatabases, 500); // Wait 500ms after the last mutation
};

// Set up the observer to watch for changes in the DOM
const observer = new MutationObserver((mutations) => {
  // We check for changes whenever the DOM is mutated.
  // The debounce mechanism prevents this from being too resource-intensive.
  debouncedFindDatabases();
});

// Start observing the document body for added/removed nodes.
observer.observe(document.body, {
  childList: true,
  subtree: true,
});

// Run an initial scan in case the databases are already present on page load.
debouncedFindDatabases();

// The message listener to handle requests from the popup will be added in the next step.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_DB_COUNT') {
    // The popup is asking for the current count.
    // We run a final check to be sure, then respond.
    findDatabases();
    sendResponse({ count: databaseCount });
  }
  // Return true to indicate you wish to send a response asynchronously.
  return true;
});
