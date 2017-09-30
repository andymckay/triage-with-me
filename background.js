var server = 'https://triage-with-me.herokuapp.com/';
//var server = 'http://localhost:3000/';
var server_api = server + 'api/';
var bugzilla = 'bugzilla.mozilla.org';
var github = 'github.com';
var ignore_paths = ['/process_bug.cgi'];
var noid = 'noid';


function notificationClick(notificationId) {
  if (notificationId !== noid) {
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

function getURL(key) {
  return `${server_api}${key}/`;
}

function getClickableURL(key) {
  return `${server}triage.html#${key}`;
}

function sendToServer(tab, key) {
  let headers = new Headers({'content-type': 'application/json'});
  let data = JSON.stringify({url: tab.url, title: tab.title});
  fetch(getURL(key), {
    body: data,
    headers: headers,
    method: 'POST'
  })
  .then((response) => {
    if (response.status == 200) {
      sendNotification(key, 'URL sent for triage.');
    } else {
      sendNotification(key, 'Failure sending the URL.');
    }
  });
}

function maybeLogTab(tab, key) {
  var visited_url = new window.URL(tab.url);
  if (
      // ignore private tabs
      !tab.incognito &&
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
      } else {
        sendNotification(key, 'URL already sent for triage, ignoring.');
      }
    });
  }
}

function log(details) {
  browser.tabs.get(details.tabId)
  .then((tab) => {
    browser.storage.local.get('key')
    .then((result) => {
      maybeLogTab(tab, result.key);
    });
  });
}

function start() {
  return new Promise((resolve, reject) => {
    fetch(server_api, {method: 'POST'})
    .then((response) => {
      return response.json();
    })
    .then((json) => {
      let key = json.key;
      browser.storage.local.set({state: true, key: key, urls: []})
      .then(() => {
        browser.browserAction.setIcon({path: 'data/full.png'});
        browser.browserAction.setBadgeText({text: 'ON'});
        browser.webNavigation.onCompleted.addListener(log);
        resolve({state: true, key: key, urls: []});
      });
    });
  });
}

function resume() {
  return new Promise((resolve, reject) => {
    browser.storage.local.get()
    .then((result) => {
      let data = {state: true, key: result.last, urls: [], last: result.last};
      browser.storage.local.set(data)
      .then(() => {
        browser.browserAction.setIcon({path: 'data/full.png'});
        browser.browserAction.setBadgeText({text: 'ON'});
        browser.webNavigation.onCompleted.addListener(log);
        resolve(data);
      });
    });
  });
}

function end() {
  return new Promise((resolve, reject) => {
    browser.storage.local.get()
    .then((result) => {
      browser.storage.local.set({state: false, last: result.key})
      .then(() => {
        browser.browserAction.setIcon({path: 'data/bw.png'});
        browser.browserAction.setBadgeText({text: ''});
        browser.webNavigation.onCompleted.removeListener(log);
        resolve({state: false, last: result.key});
      });
    });
  });
}

function getState() {
  return new Promise((resolve, reject) => {
    browser.storage.local.get()
    .then((result) => {
      if (!result.state || result.state === false) {
        browser.browserAction.setBadgeText({text: ''});
      } else {
        browser.browserAction.setBadgeText({text: 'ON'});
      }
      resolve(result);
    });
  });
}

browser.browserAction.setBadgeBackgroundColor({color: "green"});
browser.notifications.onClicked.addListener(notificationClick);
getState();
