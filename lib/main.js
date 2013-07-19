var notifications = require('sdk/notifications');
var request = require("sdk/request").Request;
var tabs = require('sdk/tabs');
var url = require('sdk/url');
var windows = require("sdk/windows").browserWindows;

var ss = require("simple-storage");
ss.storage.running = false;

var browser = "http://triage-with-me.paas.allizom.org/";
var server = browser + "api/";
var bugzilla = 'bugzilla.mozilla.org';

var self = require("self");
var bw_url = self.data.url("bw.png");
var partial_url = self.data.url("icon.png");
var full_url = self.data.url("full.png");

tabs.on('ready', logURL);

function logURL(tab) {
  var visited = tab.url;
  var host = url.URL(visited).host;
  if (host === bugzilla && ss.storage.running) {
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
        url: server + ss.storage.key + '/',
        conentType: 'application/json',
        content: {url: tab.url}
    }).post();
  }
}

var menuitem = require("menuitems").Menuitem({
  id: "triage-with-me",
  menuid: "menu_ToolsPopup",
  label: "Toggle triaging",
  onCommand: function() {
    ss.storage.running = !ss.storage.running;
    if (ss.storage.running) {
        var send = request({
            url: server,
            onComplete: function (response) {
                ss.storage.key = response.json.key;
                notifications.notify({
                    title: 'Triage with me',
                    text: 'Triage turned on: ' + ss.storage.key,
                    data: (ss.storage.key).toString(),
                    onClick: function(data) {
                        windows.open(browser + 'triage.html#' + ss.storage.key);
                    },
                    iconURL: partial_url
                });
            }
        }).post();
    } else {
        ss.storage.key = null;
        notifications.notify({
            title: 'Triage with me',
            text: 'Triage turned off',
            iconURL: bw_url
        });
    }
  },
  insertbefore: "menu_pageInfo",
  checked: true
});
