var background_page = browser.extension.getBackgroundPage();

function setOn(result) {
  document.getElementById('off').style.display = 'none';
  let on = document.getElementById('on');
  let a = on.getElementsByTagName('a')[0];
  a.href = background_page.getClickableURL(result.key);
  a.textContent = result.key;
  a.target = '_blank';
  document.getElementById('number-urls').textContent = result.urls.length;
  on.style.display = 'block';
}

function setOff(result) {
  console.log(result);
  document.getElementById('on').style.display = 'none';
  let off = document.getElementById('off');
  if (result.last) {
    document.getElementById('last-block').style.display = 'block';
    let a = off.getElementsByTagName('a')[0];
    a.href = background_page.getClickableURL(result.last);
    a.textContent = result.last;
    a.target = '_blank';
    off.style.display = 'block';
  }
}

document.getElementById('triage-resume').addEventListener('click', (e) => {
  background_page.resume().then((result) => {
    setOn(result);
  });
  e.preventDefault();
});

/*
document.getElementById('triage-copy').addEventListener('click', (e) => {
  let area = document.createElement("textarea");
  area.contentEditable = true;

  browser.storage.local.get()
  .then((result) => {
    area.textContent = 'foo'; //getClickableURL(result.key);
    area.select();
    console.log(document.execCommand("copy"));
    console.log('copied');
  });
});
*/

document.getElementById('turn-on').addEventListener('click', (e) => {
  background_page.start().then((result) => {
    setOn(result);
  });
  e.preventDefault();
});

document.getElementById('turn-off').addEventListener('click', (e) => {
  background_page.end().then((result) => {
    setOff(result);
  });
  e.preventDefault();
});

background_page.getState().then((result) => {
  if (!result.state || result.state === false) {
    setOff(result);
  } else {
    setOn(result);
  }
});
