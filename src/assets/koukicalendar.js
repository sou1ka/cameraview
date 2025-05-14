// @name @KoukiCalendar
// @version 1.0.5
// @update 2023-06-28
// @homepage http://www.plasmasphere.net/
// @author sou1ka
function KoukiCalendar(t, o) {
	let prop = o || {};
	this.target = (typeof t == 'string' ? document.querySelector(t) : t);
	this.targetId = (this.target.className ? '.' + this.target.className : '#' + this.target.id);
	this.date = new Date();
	this.today = prop.today ? new Date(prop.today) : new Date();
	this.className = 'koukicalendar-container';
	this.weekCls = prop.monthCls || ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
	this.weekNames = prop.weekNames || ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	this.monthNames = prop.monthNames || ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	this.holiday = prop.holiday || null;
	this.datas = prop.datas || null;
	this.startOfDate = prop.startOfDate || '1970-01-01';
	this.endOfDate = prop.endOfDate || '2050-12-31';
	this.click = prop.click || function(e) {console.log(arguments);}
	this.changeCalendar = prop.changeCalendar || function() {console.log(arguments);}
	this.emperorTime = prop.emperorTime || false;

	this.getCalendarHeaderMonth = function(month) {
		return this.monthNames[month-1];
	}

	this.getCalendarHeaderYear = function(year) {
		return year;
	}

	if(this.emperorTime === true) {
		this.weekNames = ['日', '月', '火', '水', '木', '金', '土'];
		this.monthNames = ['睦月', '如月', '弥生', '卯月', '皐月', '水無月', '文月', '葉月', '長月', '神無月', '霜月', '師走'];
		this.getCalendarHeaderYear = function(year) {
			return year + 660;
		}
	}

	// 外側のコンテナ
	this.outerDiv = document.createElement('div');
	this.outerDiv.className = this.className + ' outerdiv';
	this.target.appendChild(this.outerDiv);

	// ヘッダー
	let headDiv = document.createElement('div');
	headDiv.style.display = 'flex';
	headDiv.style.justifyContent = 'space-between';
	headDiv.style.alignItems = 'center';
	headDiv.className = 'calendarheader';
	this.outerDiv.appendChild(headDiv);

	// 月、年表示
	this.ym = document.createElement('p');
	this.ym.className = 'year-month';
	let yearmonth = document.createElement('span');
	this.ym.appendChild(yearmonth);
	headDiv.appendChild(this.ym);

	// 前の月
	let leftP = document.createElement('p');
	leftP.style.order = '-1';
	headDiv.appendChild(leftP);

	this.leftA = document.createElement('a');
	this.leftA.className = 'pastmonth';
	this.leftA.href = 'javascript:void(0);';
	this.leftA.appendChild(document.createTextNode("<<"));
	leftP.appendChild(this.leftA);
	this.leftA.addEventListener('click', function() {
		let d = new Date(this.date);
		let now = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2, 0)+'-01';
		d.setMonth(d.getMonth()-1);
		this.createCalendarBody.call(this, d);
		this.changeCalendar.call(this, d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2, 0)+'-01', now);
	}.bind(this));

	// 次の月
	let rightP = document.createElement('p');
	headDiv.appendChild(rightP);

	this.rightA = document.createElement('a');
	this.rightA.className = 'nextmonth';
	this.rightA.href = 'javascript:void(0);';
	this.rightA.appendChild(document.createTextNode(">>"));
	rightP.appendChild(this.rightA);
	this.rightA.addEventListener('click', function() {
		let d = new Date(this.date);
		let now = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2, 0)+'-01';
		d.setMonth(d.getMonth()+1);
		this.createCalendarBody.call(this, d);
		this.changeCalendar.call(this, d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2, 0)+'-01', now);
	}.bind(this));

	// カレンダーヘッダ
	this.weekheader = document.createElement('div');
	this.weekheader.style.display = 'flex';
	this.weekheader.style.flexWrap = 'wrap';
	this.weekheader.style.justifyContent = 'center';
	this.weekheader.className = 'weekheader';
	this.outerDiv.appendChild(this.weekheader);

	for(let i = 0, cnt = this.weekNames.length; i < cnt; i++) {
		let span = document.createElement('span');
		span.style.display = 'block';
		span.style.width = 'calc( 100% / 7 )';
		span.style.textAlign = 'center';
		span.className = 'week-' + String(this.weekCls[i]);
		span.appendChild(document.createTextNode(this.weekNames[i]));
		this.weekheader.appendChild(span);
	}

	// カレンダー日付
	let weekbody = document.createElement('div');
	weekbody.className = 'weekbody';
	this.outerDiv.appendChild(weekbody);

	this.setCalendarHeader = function(year, month) {
		let m = document.createElement('a');
		m.className = 'calendarheader-month';
		m.style.cursor = 'pointer';
		m.insertAdjacentHTML('beforeend', this.getCalendarHeaderMonth(month));
		m.addEventListener('click', this.showMonthSelector.bind(this));
		let y = document.createElement('a');
		y.className = 'calendarheader-year';
		y.style.cursor = 'pointer';
		y.insertAdjacentHTML('beforeend', this.getCalendarHeaderYear(year));
		y.addEventListener('click', this.showYearSelector.bind(this));
		let sp = document.createElement('span');
		sp.appendChild(m);
		sp.appendChild(document.createTextNode(' '));
		sp.appendChild(y);
		return sp;
	}

	this.showMonthSelector = function(e) {
		if(this.monthSelector === undefined) {// 月選択
			this.monthSelector = document.createElement('div');
			this.monthSelector.className = 'monthselector';
			this.monthSelector.style.display = 'flex';
			this.monthSelector.style.flexWrap = 'wrap';
			this.monthSelector.style.justifyContent = 'space-between';
			this.monthSelector.style.alignItems = 'center';
			this.monthSelector.style.cursor = 'pointer';
			this.monthSelector.style.position = 'absolute';
			this.monthSelector.style.visibility = 'hidden';
			this.monthSelector.style.opacity = '.9';
			for(let i = 0, cnt = this.monthNames.length; i < cnt; i++) {
				let span = document.createElement('span');
				span.style.display = 'block';
				span.style.width = 'calc( 100% / 3 )';
				span.style.textAlign = 'center';
				span.className = 'month-' + String(this.monthNames[i]);
				span.dataset.month = i+1;
				span.dataset.year = this.date.getFullYear();
				span.addEventListener('click', function(e) {
					this.monthSelectorClick.call(this, e.target.dataset.month, e.target.dataset, e.target, e);
				}.bind(this));
				span.appendChild(document.createTextNode(this.getCalendarHeaderMonth(i+1)));
				this.monthSelector.appendChild(span);
			}

			this.outerDiv.insertBefore(this.monthSelector, this.outerDiv.firstChild);
		}

		this.monthSelector.style.width = this.outerDiv.clientWidth + 'px';
		this.monthSelector.style.height = this.outerDiv.clientHeight + 'px';
		this.monthSelector.style.backgroundColor = '#fff';
		this.monthSelector.style.visibility = 'visible';
	}

	this.monthSelectorClick = function(month, dataset, target, e) {
		if(month != (this.date.getMonth()+1)) {
			let past = this.date.getFullYear()+'-'+(this.date.getMonth()+1)+'-'+this.date.getDate();
			let now = this.date.getFullYear()+'-'+month+'-01';
			this.createCalendarBody(new Date(now));
			this.changeCalendar.call(this, now, past);
		}

		this.monthSelector.style.visibility = 'hidden';
	};

	this.showYearSelector = function(e) {
		if(this.yearSelector === undefined) {
			this.startOfDate = new Date(this.startOfDate);
			this.endOfDate = new Date(this.endOfDate);
			this.yearSelector = document.createElement('div');
			this.yearSelector.className = 'yearselector';
			this.yearSelector.style.cursor = 'pointer';
			this.yearSelector.style.overflow = 'auto';
			this.yearSelector.style.position = 'absolute';
			this.yearSelector.style.visibility = 'hidden';
			this.yearSelector.style.opacity = '.9';
			for(let i = this.startOfDate.getFullYear(), cnt = this.endOfDate.getFullYear(); i <= cnt; i++) {
				let span = document.createElement('span');
				span.style.display = 'block';
				span.style.margin = '5px auto';
				span.style.textAlign = 'center';
				span.className = 'year-' + i;
				span.dataset.year = i;
				span.dataset.month = this.date.getMonth()+1;
				span.addEventListener('click', function(e) {
					this.yearSelectorClick.call(this, e.target.dataset.year, e.target.dataset, e.target, e);
				}.bind(this));
				span.appendChild(document.createTextNode(this.getCalendarHeaderYear(i)));
				this.yearSelector.appendChild(span);
			}

			this.outerDiv.insertBefore(this.yearSelector, this.outerDiv.firstChild);
		}

		this.yearSelector.style.width = this.outerDiv.clientWidth + 'px';
		this.yearSelector.style.height = this.outerDiv.clientHeight + 'px';
		this.yearSelector.style.backgroundColor = '#fff';
		this.yearSelector.style.visibility = 'visible';
		document.querySelector(this.targetId  + ' .' + this.className + ' .yearselector .year-' + this.date.getFullYear()).scrollIntoView({behavior: 'smooth', block: 'center'});
	}

	this.yearSelectorClick = function(year, dataset, target, e) {
		if(year != this.date.getFullYear()) {
			let past = this.date.getFullYear()+'-'+(this.date.getMonth()+1)+'-'+this.date.getDate();
			let now = year+'-'+(this.date.getMonth()+1)+'-01';
			this.createCalendarBody(new Date(now));
			this.changeCalendar.call(this, now, past);
		}

		this.yearSelector.style.visibility = 'hidden';
	};

	// カレンダー日付構築
	this.createCalendarBody = function(targetDate) {
		this.date = targetDate;
		let year = this.date.getFullYear();
		let month = this.date.getMonth()+1;
		let firstDay = new Date(year, month - 1, 1); // 月初日
		let lastDay = new Date(year, month, 0); // 月の末日
		let lastMonthDay = new Date(year, month - 1, 0); // 前月の末日
		let startDate = new Date(lastMonthDay.setDate(lastMonthDay.getDate() - firstDay.getDay()+1));
		let endDate = new Date(lastDay.setDate(lastDay.getDate() + (6 - lastDay.getDay())));

		this.ym.children[0].remove();
		let yearmonth = document.createElement('span');
		yearmonth.appendChild(this.setCalendarHeader(year, month));
		this.ym.insertAdjacentElement('beforeend', yearmonth);

		document.querySelector(this.targetId + ' .' + this.className + ' .weekbody').remove();
		let weekbody = document.createElement('div');
		weekbody.className = 'weekbody';
		weekbody.style.display = 'flex';
		weekbody.style.flexWrap = 'wrap';
		weekbody.style.justifyContent = 'center';
		this.outerDiv.appendChild(weekbody);

		while(true) {
			if(endDate.getTime() < startDate.getTime()) { break; }

			let span = document.createElement('span');
			span.style.display = 'block';
			span.style.width = 'calc( 100% / 7 )';
			span.style.textAlign = 'center';
			span.className = 'day week-' + String(this.weekCls[startDate.getDay()]);

			let anc = document.createElement('a');
			anc.className = 'date';
			anc.href = 'javascript:void(0);';
			anc.dataset.date = startDate.getFullYear() + '-' + String(startDate.getMonth()+1).padStart(2, 0) + '-' + String(startDate.getDate()).padStart(2, 0);

			if(this.date.getMonth() != startDate.getMonth()) {
				anc.style.color = '#999';
			}

			if(startDate.getMonth() == this.today.getMonth() && startDate.getDate() == this.today.getDate()) {
				span.className += ' today';
			}

			anc.appendChild(document.createTextNode(startDate.getDate()));
			anc.addEventListener('click', function(e) {
				this.click(e.target.dataset.date, e.target.dataset, e.target, e);
			}.bind(this));
			span.appendChild(anc);
			weekbody.appendChild(span);
			this.startDate = new Date(startDate.setDate(startDate.getDate() + 1));
		}
		this.setHoliday(this.holiday);
		this.setDatas(this.datas);
	};

	this.setHoliday = function(holiday) {
		if(!holiday || holiday.length === 0 || Object.keys(holiday).length === 0) { return; }

		this.holiday = holiday || this.holiday;

		if(!Array.isArray(holiday)) {
			holiday = Object.keys(holiday);
		}

		for(let i = 0, cnt = holiday.length; i < cnt; i++) {
			let h = holiday[i];
			let t = document.querySelector(this.targetId + ' [data-date="' + h + '"]');
			if(!t) { continue; }
			t.parentNode.className += ' holiday'
		}
	};

	this.setDatas = function(datas) {
		if(!datas || Array.isArray(datas) || Object.keys(datas).length === 0) { return; }

		this.datas = datas || this.datas;

		let keys = Object.keys(datas);
		for(let i = 0, cnt = keys.length; i < cnt; i++) {
			let key = keys[i];
			let t = document.querySelector(this.targetId + ' [data-date="' + key + '"]');
			if(!t) { continue; }
			t.dataset.datas = datas[key];
			t.className += ' dataset';
		}
	}

	this.createCalendarBody(this.date);
	this.changeCalendar(this.date);
}
