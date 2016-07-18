var notifications = require('sdk/notifications');
var request = require("sdk/request").Request;
var tabs = require('sdk/tabs');
var url = require('sdk/url');
var windows = require("sdk/windows").browserWindows;

var ss = require("sdk/simple-storage");
ss.storage.running = false;

var browser = require('sdk/simple-prefs').prefs.server;
var bugzilla = 'bugzilla.mozilla.org';
var github = 'github.com';
var ignore_paths = ['/process_bug.cgi'];

var self = require("sdk/self");
var ui = require("sdk/ui");

var bw_url = self.data.url("bw.png");
var partial_url = self.data.url("icon.png");
var full_url = self.data.url("full.png");


var {setInterval, clearInterval, setTimeout} = require("sdk/timers");
var urls = [];
var interval = null;

tabs.on('ready', logURL);

function getServerURL() {
  return browser + "api/";
}

function logURL() {
  var tab = tabs.activeTab;
  var visited = tab.url;
  var visited_url = url.URL(visited);
  if (
      // only record github and bugzilla URLs.
      (visited_url.host === bugzilla || visited_url.host === github) &&
      // ignore some paths though...
      !ignore_paths.includes(visited_url.path) &&
      // and only if storage is running so we can send them.
      ss.storage.running
    ) {
    notifications.notify({
        title: 'Triage with me',
        text: 'URL sent for triage',
        data: (ss.storage.key).toString(),
        onClick: function(data) {
            windows.open(browser + 'triage.html#' + ss.storage.key);
        },
        iconURL: full_url
    });
    var send = request({
        url: getServerURL() + ss.storage.key + '/',
        contentType: 'application/json',
        content: JSON.stringify({url: tab.url, title: tab.title})
    }).post();
  }
}

function watchTabs() {
  var tab = tabs.activeTab;
  if (tab === undefined) {
    return;
  } else {
    if (urls.indexOf(tab.url) == -1) {
      urls.push(tab.url);
      // push this into a timeout so the frame has change to update.
      setTimeout(logURL, 100);
    }
  }
}

var action_button = ui.ActionButton({
  id: "triage-with-me",
  label: "Toggle triaging",
  icon: {
    "16": "./bw-16.png",
    "32": "./bw-32.png"
  },
  onClick: toggle
});

function toggle(state) {
  ss.storage.running = !ss.storage.running;
  if (ss.storage.running) {
    var send = request({
      url: getServerURL(),
      onComplete: function (response) {
        ss.storage.key = response.json.key;
        interval = setInterval(watchTabs, 100);
        notifications.notify({
          title: 'Triage with me',
          text: 'Triage turned on: ' + ss.storage.key,
          data: (ss.storage.key).toString(),
          onClick: function(data) {
            windows.open(browser + 'triage.html#' + ss.storage.key);
          },
          iconURL: partial_url
        });
        action_button.state("window", {
          icon: {
            "16": "./full-16.png",
            "32": "./full-32.png"
          }
        });
      }
    }).post();
  } else {
    ss.storage.key = null;
    clearInterval(interval);
    urls.length = 0;
    notifications.notify({
      title: 'Triage with me',
      text: 'Triage turned off',
      iconURL: bw_url
    });
    action_button.state("window", {
      icon: {
        "16": "./bw-16.png",
        "32": "./bw-32.png"
      }
    });
  }
}
