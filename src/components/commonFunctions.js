//获取最后更新时间
export const compareDate = (date, standard = true) => {
  let presentDate = new Date();
  let presentDay = presentDate.getDate();
  let presentMonth = presentDate.getMonth() + 1;
  let presentYear = presentDate.getFullYear();
  let lastFreshDate = new Date(date);
  let lastFreshDay = lastFreshDate.getDate();
  let lastFreshMonth = lastFreshDate.getMonth() + 1;
  let lastFreshYear = lastFreshDate.getFullYear();
  let lastFreshHour = lastFreshDate.getHours();
  let lastFreshMinute = lastFreshDate.getMinutes();
  if (lastFreshHour < 10) {
    lastFreshHour = "0" + lastFreshHour;
  }
  if (lastFreshMinute < 10) {
    lastFreshMinute = "0" + lastFreshMinute;
  }

  if (
    presentDay === lastFreshDay &&
    presentMonth === lastFreshMonth &&
    presentYear === lastFreshYear &&
    standard
  ) {
    return "今天 " + lastFreshHour + ":" + lastFreshMinute;
  } else {
    return (
      lastFreshMonth +
      "-" +
      lastFreshDay +
      "-" +
      lastFreshYear +
      " " +
      lastFreshHour +
      ":" +
      lastFreshMinute
    );
  }
};

export const numberToTime = number => {
  let hours = parseInt(number / 3600, 10);
  let minutes = parseInt((number - hours * 3600) / 60, 10);
  let seconds = number - hours * 3600 - minutes * 60;
  let hourTxt = hours >= 10 ? hours : "0" + hours;
  let minuTxt = minutes >= 10 ? minutes : "0" + minutes;
  let secondTxt = seconds >= 10 ? seconds : "0" + seconds;
  return hourTxt + ":" + minuTxt + ":" + secondTxt;
};
//获取移动设备操作系统
export const getMobileOperatingSystem = () => {
  var userAgent = navigator.userAgent || navigator.vendor || window.opera;

  // Windows Phone must come first because its UA also contains "Android"
  if (/windows phone/i.test(userAgent)) {
    return "Windows Phone";
  }

  if (/android/i.test(userAgent)) {
    return "Android";
  }

  // iOS detection from: http://stackoverflow.com/a/9039885/177710
  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    return "iOS";
  }

  return "unknown";
};

//判读是否横屏
export const isLandscape = () => {
  return window.orientation === 90 || window.orientation === -90;
};
//移除url的amp字符串
export const removeUrlAmp = url => {
  return url.replace(new RegExp("&amp;", "g"), "&");
};

//判断是否微信浏览器
export const isWechat = () => {
  return /micromessenger/.test(navigator.userAgent.toLowerCase());
};
