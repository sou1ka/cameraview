const { listen, once } = window.__TAURI__.event;
const { invoke, convertFileSrc } = window.__TAURI__.tauri;
const { open } = window.__TAURI__.dialog;
const { appDir } = window.__TAURI__.path;
const { appWindow } = window.__TAURI__.window;
//const { fetch } = window.__TAURI__.http;

/**
 * for(var i = 0, size = ts.length; i < size; i++) {
	var t = ts[i];
	document.querySelector('.list').insertAdjacentHTML("beforeend", '<div><a href="javascript:void(0);" onclick="changeView(\''+t+'\');"><img src="" id="tid-'+t+'" /></a></div>');
	var img = document.querySelector('#tid-'+t);
	sse[t] = new EventSource("./imagegetter.php?imagepath="+String(t).replaceAll("_", "."));
	sse[t].addEventListener("message", function(e) {
		if(!e.data) { return; }
		this.src = 'data:image/jpeg;base64,'+e.data;
		var tid = e.srcElement.url.match(/imagepath=(.+)/)[1].replaceAll(".", "_");
		var view =document.querySelector('#view-'+tid);
		if(view) {
			view.src = 'data:image/jpeg;base64,'+e.data;
		}
	}.bind(img), false);
}
 */

let ts = [];
let cityId = "";
let interval = 500;

async function getConfig() {
   let config = await invoke("get_config");
   let json = JSON.parse(config);
   ts = json.hosts;
   cityId = json.cityId;
   interval = json.interval;
}

document.addEventListener('keydown', async function(e) {
  if(e.key == 'F5' || (e.ctrlKey && e.key == 'r') || e.key == 'F7') {
    e.preventDefault();
    e.stopPropagation();

  } else if(e.altKey && e.key == 'Enter') {
    appWindow.toggleMaximize();

  } else if(e.key == 'F11') {
    if(await appWindow.isFullscreen()) {
      appWindow.setDecorations(true);
      appWindow.setTitle(true);
      appWindow.setFullscreen(false);
    } else {
      appWindow.setDecorations(false);
      appWindow.setTitle(false);
      appWindow.setFullscreen(true);
    }
 
  } else if(e.key == 'Escape') {
    appWindow.setFullscreen(false);
    appWindow.setDecorations(true);
    appWindow.setTitle(true);
  }
});

document.addEventListener('contextmenu', function(e) {
  e.preventDefault();
  e.stopPropagation();
}, false);

window.addEventListener("DOMContentLoaded", async function() {
  await getConfig();

  let t = setInterval(async function() {
    if(await appWindow.isFullscreen() === false) {
      setFullscreen();
    }

    clearInterval(t);
  }, 300);

  document.querySelector('.fa-expand').parentNode.addEventListener('click', setFullscreen);
  document.querySelector('.fa-rotate-right').parentNode.addEventListener('click', function() {
    window.location.reload();
  });
  document.querySelector('.fa-moon').parentNode.addEventListener('click', toggleNightMode);
  //document.querySelector('#overlay').parentNode.addEventListener('click', toggleNightMode);
  
  document.querySelector('#calendar').style.display = 'none';
  document.querySelector('.list .cal a').addEventListener('click', viewCal);

  var sse = {};

  let iid = setInterval(function() {
    if(ts.length == 0) { return; }

    document.querySelector('.view').insertAdjacentHTML("beforeend", '<div><img src="" class="viewimage" id="view-'+String(ts[0]).replaceAll(".", "_")+'" /></div>');

    ts.forEach(function(t, idx) {
      document.querySelector('.list').insertAdjacentHTML("beforeend", '<div><a href="javascript:void(0);" onclick="changeView(\''+String(t).replaceAll(".", "_")+'\');"><img src="" id="tid-'+String(t).replaceAll(".", "_")+'" /></a></div>');
      document.querySelector('.list #tid-'+String(t).replaceAll(".", "_")).parentNode.addEventListener('click', function() {
        changeView(t);
      });

      setInterval(async function() {
        let base64 = await invoke('get_cameraview', {
          url: "http://"+t+"/cgi-bin/get_jpeg.cgi"
        });
        document.querySelector('#view-'+String(ts[0]).replaceAll(".", "_")).src = 'data:image/jpeg;base64,'+base64;
        document.querySelector('#tid-'+String(ts[0]).replaceAll(".", "_")).src = 'data:image/jpeg;base64,'+base64;
      }, interval);
    });
    clearInterval(iid);
  }, 100);

  setInterval(updateWeather, (60*60*1000));
  await updateWeather();

  setInterval(function() {
    var now = new Date();
    var ymd = String(now.getFullYear())+String(now.getMonth())+String(now.getDate());
    var caldt = String(cal.today.getFullYear())+String(cal.today.getMonth())+String(cal.today.getDate());
  
    if(ymd != caldt) {
      cal.today = now;
      cal.createCalendarBody(now);
    }
  }, 60*1000);
});

let setFullscreen = async function() {
  if(await appWindow.isFullscreen()) {
    appWindow.setDecorations(true);
    appWindow.setTitle(true);
    appWindow.setFullscreen(false);
  } else {
    appWindow.setDecorations(false);
    appWindow.setTitle(false);
    appWindow.setFullscreen(true);
  }
}

let toggleNightMode = function() {
  let overlay = document.querySelector('#overlay');

  if(overlay.classList.contains('night-mode-overlay')) {
    overlay.classList.remove('night-mode-overlay');
    overlay.style.opacity = 0;
  } else {
    overlay.classList.add('night-mode-overlay');
    overlay.style.opacity = 1;
  }
}

let changeView = function(t) {
  document.querySelector('#calendar').style.display = 'none';
  document.querySelector('.viewimage').style.display = 'block';
  document.querySelector('.viewimage').id = 'view-'+t;
}

let viewCal = function() {
  document.querySelector('.viewimage').style.display = 'none';
  document.querySelector('#calendar').style.display = 'flex';
}

let temp = { min: null, max: null };
let updateWeather = async function() {
  let w = await invoke('get_body', {
    url: 'https://weather.tsukumijima.net/api/forecast?city='+cityId
  });
  var json = JSON.parse(w);
  document.querySelector('#weather div').remove();
  temp.min = json.forecasts[0].temperature.min.celsius || temp.min || null;
  temp.max = json.forecasts[0].temperature.max.celsius || temp.max || null;
  let svg = await invoke('get_body', {
    url: json.forecasts[0].image.url
  });
  document.querySelector('#weather').insertAdjacentHTML("beforeend", '<div><p class="icon"><img src="'+'data:image/svg+xml;charset=utf8,' + encodeURIComponent(svg)+'" width="120" /></p><p>'+temp.min+'℃ - '+temp.max+'℃</p><p>00-06: '+json.forecasts[0].chanceOfRain.T00_06+'<br />06-12: '+json.forecasts[0].chanceOfRain.T06_12+'<br />12-18: '+json.forecasts[0].chanceOfRain.T12_18+'<br />18-24: '+json.forecasts[0].chanceOfRain.T18_24+'</p></div>');
}

let cal = new KoukiCalendar('.koukicalendar', {
  changeCalendar: async function(d, past) {
    if(!this.holiday || new Date(d).getFullYear() != new Date(past).getFullYear()) {
      let f = await invoke('get_body', {
        url: 'https://holidays-jp.github.io/api/v1/' + new Date(d).getFullYear()  + '/date.json'
      });
      this.setHoliday(JSON.parse(f));
    }
  }
});

let updateClock = function() {
  var now = new Date();
  var h = String(now.getHours()).padStart(2, '0');
  var m = String(now.getMinutes()).padStart(2, '0');
  var s = String(now.getSeconds()).padStart(2, '0');
/*	var dayOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][now.getDay()];
  var y = now.getFullYear();
  var m = String(now.getMonth() + 1).padStart(2, '0');
  var d = String(now.getDate()).padStart(2, '0');*/

  document.getElementById('clock').textContent = `${h}:${m}:${s}`;
}

setInterval(updateClock, 1000);
updateClock();
