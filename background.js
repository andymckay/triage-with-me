var server = 'https://triage-with-me.herokuapp.com/';
var server_api = server + 'api/';
var bugzilla = 'bugzilla.mozilla.org';
var github = 'github.com';
var ignore_paths = ['/process_bug.cgi'];


function notificationClick(notificationId) {
  browser.tabs.create({url: server + 'triage.html#' + notificationId});
}

function logURL(url, key) {
  var visited_url = new window.URL(visited);
  if (
      // only record github and bugzilla URLs.
      (visited_url.host === bugzilla || visited_url.host === github) &&
      // ignore some paths though...
      !ignore_paths.includes(visited_url.path)) {
    browser.notifications.create('foo',
      {
        title: 'Triage with me',
        message: 'URL sent for triage',
        iconUrl: browser.runtime.getURL('/') + 'data/full.png',
      }
    );
  }
}

function logTab(tab) {
  logURL(tab)
}

function start() {
  let key = '';
  console.log(server_api);
  fetch(server_api)//, {method: 'POST', body: null})
  .then((response) => {
    //console.log(JSON.loads(response.blob()).key);
    console.log(response);
  })
  /*
  browser.storage.local.set({state: true, key: })
  .then(() => {
    browser.browserAction.setBadgeText({text: 'ON'});
    browser.tabs.onCreated.addListener(logTab);
  })
  */
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
