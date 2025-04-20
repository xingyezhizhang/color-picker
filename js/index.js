const color = new Color();

const dom = {
  colorShow: document.querySelector(".color-picker-box"),
  boxContainer: document.querySelector(".picker-box-container"),
  palette: document.querySelector(".color-priming"),
  cursor: document.querySelector(".plate-cursor"),
  hue: document.querySelector(".hue-strip-wrapper .strip"),
  hueSlider: document.querySelector(".hue-strip-wrapper .slider"),
  alpha: document.querySelector(".alpha-strip-wrapper .strip"),
  alphaSlider: document.querySelector(".alpha-strip-wrapper .slider"),
  select: document.querySelector(".edit-container select"),
  input: document.querySelector(".edit-container .color-input"),
  cancel: document.querySelector(".color-edit-btn.color-clear"),
  confirm: document.querySelector(".color-edit-btn.color-sure"),
  preDefine: document.querySelector(".pre-define-color-container"),
  pickerContainer: document.querySelector(".color-picker-container"),
}

const rects = { palette: undefined, hue: undefined, hueSlider: undefined, alpha: undefined, alphaSlider: undefined };

const colorSpaceMap = {
  /**
   * 
   * @param {Color} color 
   */
  HEX: (color) => {
    return "#" + color.getHex().join("")
  },

  /**
   * 
   * @param {Color} color 
   */
  RGB: (color) => {
    return `rgba(${color.getRgba().join(", ")})`
  },

  /**
   * 
   * @param {Color} color 
   */
  HSL: (color) => {
    return `hsla(${color.getHsla().join(", ")})`
  },
}

dom.palette.addEventListener("mousedown", (e) => {
  changeCursor(e, dom.cursor, rects.palette);
  window.addEventListener("mousemove", moveCursor);
  window.addEventListener("mouseup", clear);
});

function setColorCursor(x, y, ele, parentRect) {
  let cursorX = x - parentRect.left,
    cursorY = y - parentRect.top;
  if (cursorX < 0) cursorX = 0;
  if (cursorY < 0) cursorY = 0;
  if (cursorX > parentRect.width) cursorX = parentRect.width;
  if (cursorY > parentRect.height) cursorY = parentRect.height;
  ele.style.left = cursorX + "px";
  ele.style.top = cursorY + "px";
}

/**
 * 
 * @param {PointerEvent|MouseEvent} event 触发的事件
 * @param {Element} ele 游标元素
 * @param {DOMRect} parentRect 
 */
function changeCursor(event, ele, parentRect) {
  setColorCursor(event.clientX, event.clientY, ele, parentRect);
  const rect = ele.getBoundingClientRect();
  const [S, V] = calculateSV(parentRect.width, parentRect.height, rect.left - parentRect.left, rect.top - parentRect.top);
  color.HSVA = [, S, V];
}

function moveCursor(e) {
  changeCursor(e, dom.cursor, rects.palette);
}

function clear() {
  window.removeEventListener("mousemove", moveCursor);
  window.removeEventListener("mouseup", clear);
}


function getSliderHRatio(sliderRect, parentRect) {
  return (sliderRect.top - parentRect.top) / parentRect.height;
}

/**
 * 
 * @param {Element} slider 
 * @param {DOMRect} parentRect 
 * @param {(ratio :number)=>void} onRatioUpdate 回调函数
 * @returns 
 */
function createSliderHandler(slider, parentRect, onRatioUpdate) {
  /**
   * 
   * @param {PointerEvent|MouseEvent} event 触发的事件
   * @param {Element} ele 游标元素
   * @param {DOMRect} parentRect 
   */
  function setSlider(event, ele, parentRect) {
    let Y = event.clientY - parentRect.top;
    if (Y < 0) Y = 0;
    if (Y > parentRect.height) Y = parentRect.height;
    ele.style.top = Y + "px";
    return Y / parentRect.height;
  }

  /**
   * 
   * @param {PointerEvent|MouseEvent} event 触发的事件
   */
  function moveSlider(e) {
    const ratio = setSlider(e, slider, parentRect);
    onRatioUpdate(ratio);
  }

  function clear() {
    window.removeEventListener("mousemove", moveSlider);
    window.removeEventListener("mouseup", clear);
  }

  /**
   * 
   * @param {MouseEvent} event 触发的事件
   */
  function changeSlider(e) {
    setSlider(e, slider, rects.hue);
    window.addEventListener("mousemove", moveSlider);
    window.addEventListener("mouseup", clear);
  }

  return changeSlider;
}


function calculateSV(panelWidth, panelHeight, x, y) {
  // 计算饱和度 S（0% 到 100%）
  let S = (x / panelWidth) * 100;
  S = Math.max(0, Math.min(100, S)); // 确保在范围内

  // 计算明度 V（0% 到 100%，顶部到底部）
  let V = (1 - (y / panelHeight)) * 100;
  V = Math.max(0, Math.min(100, V));

  return [S, V];
}

color.addListener(() => {
  dom.palette.style.setProperty("--color", color.rgba2hex(color.hsla2rgba(color.colorPlate)));
  dom.colorShow.style.setProperty("--color", colorSpaceMap.HEX(color));
  dom.alpha.style.setProperty("--color", "#" + color.getHex().slice(0, 3).join(""));
  dom.input.value = colorSpaceMap[dom.select.value](color);
})

function init() {
  dom.hueSlider.style.top = (1 - color.H / 360) * rects.hue.height + "px";
  dom.alphaSlider.style.top = (1 - color.A) * rects.alpha.height + "px";
  const x = (1 - color.S / 100) * rects.palette.width + rects.palette.left;
  const y = (1 - color.V / 100) * rects.palette.height + rects.palette.top;
  setColorCursor(x, y, dom.cursor, rects.palette);
  dom.hue.addEventListener("mousedown", createSliderHandler(dom.hueSlider, rects.hue, (ratio) => {
    color.H = Math.round(ratio * 360);
  }));

  dom.alpha.addEventListener("mousedown", createSliderHandler(dom.alphaSlider, rects.alpha, (ratio) => {
    color.A = 1 - ratio;
  }));

  dom.confirm.addEventListener("click", () => { dom.pickerContainer.style.setProperty("display", "none") });

  dom.cancel.addEventListener("click", () => {
    // 此处逻辑不内聚
    color.HSVA = [360, 0, 100, 1];
    setColorCursor(rects.palette.left, rects.palette.top, dom.cursor, rects.palette);
  })
}

dom.boxContainer.addEventListener("click", () => {
  if (dom.pickerContainer.style.display !== "block") {
    dom.pickerContainer.style.setProperty("display", "block");
    for (const key in rects) {
      rects[key] = dom[key].getBoundingClientRect();
    }
    init();
  }
  else dom.pickerContainer.style.setProperty("display", "none");
});



