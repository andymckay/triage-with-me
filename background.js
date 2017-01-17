//var server = 'https://triage-with-me.herokuapp.com/';
var server = 'http://localhost:3000/'
var server_api = server + 'api/';
var bugzilla = 'bugzilla.mozilla.org';
var github = 'github.com';
var ignore_paths = ['/process_bug.cgi'];


function notificationClick(notificationId) {
  if (notificationId) {
    browser.tabs.create({url: server + 'triage.html#' + notificationId});
  }
}

function sendNotification(key, message) {
  browser.notifications.create(key.toString(), {
      type: 'basic',
      title: 'Triage with me',
      message: message,
      iconUrl: browser.extension.getURL('/') + 'data/full.png',
  });
}

function sendToServer(tab, key) {
  let headers = new Headers({'content-type': 'application/json'});
  let data = JSON.stringify({url: tab.url, title: tab.title});
  fetch(server_api + key + '/', {
    body: data,
    headers: headers,
    method: 'POST'
  })
  .then((response) => {
    if (response.status == 200) {
      console.log('Server response.status: ' + response.status);
      sendNotification(key, 'URL sent for triage.');
    } else {
      sendNotification(key, 'Failure sending the URL.');
    }
  });
}

function maybeLogTab(tab, key) {
  var visited_url = new window.URL(tab.url);
  if (
      // only record github and bugzilla URLs.
      (visited_url.host === bugzilla || visited_url.host === github) &&
      // ignore some paths though...
      !ignore_paths.includes(visited_url.path)) {
    browser.storage.local.get('urls')
    .then((result) => {
      if (!result.urls.includes(tab.url)) {
        // Ensure we don't store an add-on twice.
        result.urls.push(tab.url);
        browser.storage.local.set({urls: result.urls})
        .then(() => {
          sendToServer(tab, key);
        });
      }
    });
  }
}

function logNewTab(tab) {
  browser.storage.local.get('key')
  .then((result) => {
    maybeLogTab(tab, result.key);
  });
}

function logUpdatedTab(tabId, info, tab) {
  logNewTab(tab);
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
    });
  });
}

function end() {
  browser.storage.local.set({state: false})
  .then(() => {
    browser.browserAction.setBadgeText({text: ''});
  });
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