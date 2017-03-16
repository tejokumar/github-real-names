'use strict';

var url = require('url');
var request = require('then-request');
var he = require('he');

var showingRealNames = true;
var realNames = {
};

function loadRealName(username, path) {
  if (realNames[username]) return;
  realNames[username] = username;
  request('GET', url.resolve(location.href, path)).getBody().done(function (res) {
    var name = /\<span class\=\"vcard-fullname d-block\" itemprop\=\"name\">([^<]+)\<\/span\>/.exec(res);
    name = name && he.decode(name[1]);
    realNames[username] = name || username;
    update();
  });
}

chrome.runtime.sendMessage({action: "get-showingRealNames"}, function(response) {
  showingRealNames = response.showingRealNames;
  update();
  setInterval(update, 1000);
});

function updateList(list, filter, getUsername, getHref, shouldAt) {
  for (var i = 0; i < list.length; i++) {
    if (filter(list[i])) {
      var username =getUsername(list[i]);
      var href = getHref ? getHref(list[i]) : '/' + username;
      loadRealName(username, href);
      if (showingRealNames) {
        list[i].textContent = (shouldAt && realNames[username] === username ? '@' : '') + realNames[username];
      } else {
        list[i].textContent = (shouldAt ? '@' : '') + username;
      }
    }
  }
}
function update() {
  updateList(document.getElementsByClassName('author'), function (author) {
    return author.hasAttribute('href');
  }, function (author) {
    return /\/([^\/]+)$/.exec(author.getAttribute('href'))[1];
  }, function (author) {
    return author.getAttribute('href');
  });

  updateList(document.getElementsByClassName('discussion-item-entity'), function (author) {
    return author.parentElement.hasAttribute('href');
  }, function (author) {
    return /\/([^\/]+)$/.exec(author.parentElement.getAttribute('href'))[1];
  }, function (author) {
    return author.parentElement.getAttribute('href');
  });

  updateList(document.getElementsByClassName('assignee'), function (author) {
    return true;
  }, function (author) {
    return /\/([^\/]+)$/.exec(author.getAttribute('href'))[1];
  });

  updateList(document.querySelectorAll("[data-ga-click*='target:actor']"), function (author) {
    return author.hasAttribute('href');
  }, function (author) {
    return /\/([^\/]+)$/.exec(author.getAttribute('href'))[1];
  }, function (author) {
    return author.getAttribute('href');
  });
  updateList(document.getElementsByClassName('user-mention'), function (mention) {
    return mention.hasAttribute('href');
  }, function (mention) {
    return /\/([^\/]+)$/.exec(mention.getAttribute('href'))[1];
  }, function (mention) {
    return mention.getAttribute('href');
  }, true);
  updateList(document.querySelectorAll('.opened-by a.tooltipped.tooltipped-s'), function (author) {
    return true;
  }, function (author) {
    if (author.hasAttribute('data-user-name')) {
      return author.getAttribute('data-user-name');
    } else {
      var username = author.textContent;
      author.setAttribute('data-user-name', username);
      return username;
    }
  }, function (author) {
    return '/' + author.getAttribute('data-user-name');
  });
  updateList(document.querySelectorAll('.author-name a[rel="author"], .author a[rel="author"]'), function (author) {
    return author.hasAttribute('href');
  }, function (author) {
    return /\/([^\/]+)$/.exec(author.getAttribute('href'))[1];
  }, function (author) {
    return author.getAttribute('href');
  });
}

update();
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === 'toggle') {
    alert('updating.....');
    showingRealNames = message.showingRealNames;
    update();
  }
});
