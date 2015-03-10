var main = require("../lib/main");
var { getMostRecentBrowserWindow } = require("sdk/window/utils")

exports["test menuitem exists"] = function(assert) {
  var browser = getMostRecentBrowserWindow();
  var node = browser.document.getElementById("triage-with-me");
  assert.ok(node, "the menuitem exists");
  assert.equal(node.parentNode.id,
               "menu_ToolsPopup",
               "the menuitem has the correct parent node");
};

require("sdk/test").run(exports);
