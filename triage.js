var background_page = browser.extension.getBackgroundPage();

function setOn(result) {
  console.log('setOn');
  document.getElementById('off').style.display = 'none';
  let on = document.getElementById('on');
  let a = on.getElementsByTagName('a')[0];
  a.href = background_page.getURL(result.key);
  a.textContent = result.key;
  document.getElementById('number-urls').textContent = result.urls.length;
  on.style.display = 'block';
}

function setOff() {
  console.log('setOff');
  document.getElementById('on').style.display = 'none';
  document.getElementById('off').style.display = 'block';
}

document.getElementById('turn-on').addEventListener('click', (e) => {
  background_page.start().then((result) => {
    setOn(result);
  });
  e.preventDefault();
});

document.getElementById('turn-off').addEventListener('click', (e) => {
  background_page.end();
  setOff();
  e.preventDefault();
});

background_page.getState().then((result) => {
  if (!result.state || result.state === false) {
    setOff();
  } else {
    setOn(result);
  }
});
