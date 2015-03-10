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

var self = require("sdk/self");
var menus = require("menuitem");
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
  var host = url.URL(visited).host;
  if ((host === bugzilla || host === github) && ss.storage.running) {
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

var menuitem = menus.Menuitem({
  id: "triage-with-me",
  menuid: "menu_ToolsPopup",
  label: "Toggle triaging",
  checked: false,
  onCommand: function() {
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
                menuitem.checked = true;
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
        menuitem.checked = false;
    }
  },
  insertbefore: "menu_pageInfo"
});
