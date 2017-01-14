//var server = 'https://triage-with-me.herokuapp.com/';
var server = 'http://localhost:3000/'
var server_api = server + 'api/';
var bugzilla = 'bugzilla.mozilla.org';
var github = 'github.com';
var ignore_paths = ['/process_bug.cgi'];


function notificationClick(notificationId) {
  browser.tabs.create({url: server + 'triage.html#' + notificationId});
}

function maybeLogURL(url, key) {
  var visited_url = new window.URL(url);
  if (
      // only record github and bugzilla URLs.
      (visited_url.host === bugzilla || visited_url.host === github) &&
      // ignore some paths though...
      !ignore_paths.includes(visited_url.path)) {
    browser.notifications.create(key.toString(), {
        type: 'basic',
        title: 'Triage with me',
        message: 'URL sent for triage',
        iconUrl: browser.extension.getURL('/') + 'data/full.png',
    });
  }
}

function logNewTab(tab) {
  browser.storage.local.get('key')
  .then((result) => {
    maybeLogURL(tab.url, result.key)
  });
}

function logUpdatedTab(tabId, info, tab) {
  browser.storage.local.get('key')
  .then((result) => {
    maybeLogURL(tab.url, result.key)
  });
}

function start() {
  fetch(server_api, {method: 'POST'})
  .then((response) => {
    return response.json();
  })
  .then((json) => {
    browser.storage.local.set({state: true, key: json.key, urls: []})
    .then(() => {
      browser.browserAction.setBadgeText({text: 'ON'});
      browser.tabs.onCreated.addListener(logNewTab);
      browser.tabs.onUpdated.addListener(logUpdatedTab);
    })
  });
}

function end() {
  browser.storage.local.set({state: false})
  .then(() => {
    browser.browserAction.setBadgeText({text: ''});
  })
}

function toggle() {
  browser.storage.local.get('state')
  .then((result) => {
    console.log(result.state);
    if (!result.state || result.state === false) {
      start();
    } else {
      end();
    }
  });
}


browser.notifications.onClicked.addListener(notificationClick);
browser.browserAction.onClicked.addListener(toggle);
