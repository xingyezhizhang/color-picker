// DONE: 
// 1. 是否存在冗余函数调用 可以认为冗余，配置的监听，多次调用颜色转换问题，不处理
// 2. 边界条件不正常，rgb转hsl算法，l的计算方式错误，应该是+，deepseek给的是-

class Color {
  constructor(colorStr = "") {
    this._listeners = new Set();
    this.setColor(colorStr);
  }

  setColor(colorStr = "") {
    if (colorStr.startsWith("hsl")) {
      const hslas = this.parseColorStr(colorStr);
      this._color = this.rgba2hsva(this.hsla2rgba(hslas));
    }
    else if (colorStr.startsWith("rgb")) {
      const ragbs = this.parseColorStr(colorStr);
      this._color = this.rgba2hsva(ragbs);
    }
    else if (colorStr.startsWith("#")) {
      const ragbs = this.parseHex(colorStr);
      this._color = this.rgba2hsva(ragbs);
    }
    else
      this._color = [360, 0, 100, 1];
    this.trigger();
  }

  /**
   * 
   * @param {string} colorStr 
   */
  parseColorStr(colorStr) {
    const colors = colorStr.slice(colorStr.indexOf("("), colorStr.indexOf(")")).split(",");
    for (i = 0; i < colors.length; i++) {
      switch (i) {
        case 0:
          colors[i] = parseInt(colors[i]) % 361;
          break;
        case 1:
        case 2:
          colors[i] = parseInt(colors[i]) % 101;
          break;
        case 3:
          if (typeof colors[i] === "string") {
            colors[i] = parseFloat(colors[i]);
          }
          if (typeof colors[i] !== "number" || isNaN(colors[i])) {
            throw new Error(`error colorStr: not is normal colorStr
  ${colorStr} `);
          }
          if (colors[i] < 0)
            colors[i] = Math.abs(colors[i]);
          if (colors[i] > 1 && colors[i] <= 255)
            colors[i] = colors[i] / 255;
          if (colors[i] > 255)
            colors[i] = (colors[i] % 255) / 255;
          break;

        default:
          break;
      }
    }
    if (colors.length === 3) colors.push(1);
    return colors;
  }

  /**
   * HEX 格式的色值
   * 
   * @param {string} hexStr 
   * @returns {Array} [r, g, b, a] r,g,b → [0,255] a → [0,1]
   */
  parseHex(hexStr) {
    if (hexStr.startsWith("#")) {
      hexStr = hexStr.slice(1);
    }
    const result = [];
    let len = hexStr.length;
    let gap = 2;
    if (len === 3) gap = 1;
    if (![3, 6, 8].includes(len)) throw new Error(`hexStr error: "${hexStr}" not is normal color hex`);
    try {
      for (let i = 0; i < len; i += gap) {
        let hex = hexStr.slice(i, gap + i);
        if (gap === 1) hex += hex;
        result.push(parseInt(hex, 16));
      }
      if (result.length < 4) result.push(1)
      else result[3] = (result[3] / 255);
      return result;
    } catch (error) {
      console.error(error);
      throw new Error(`hexStr error: "${hexStr}" not is normal color hex`);
    }
  }

  /**
   * 
   * @param {Array} hsla [360, "100%", "100", 1]
   * @returns 
   */
  parseHsla(hsla) {
    let [h = 0, s = "100%", l = "100%", a = 1] = hsla;
    h = h % 360;
    try {
      l = parseInt(l);
      s = parseInt(s);
    } catch (error) {
      console.error(error);
      throw new Error(`hslaList error: "${hsla}" not is normal color hslaList`);
    }
    if (l < 0 || l > 100 || s < 0 || s > 100) {
      throw new Error(`hslaList error: "${hsla}" not is normal color hslaList`);
    }
    return [h, s, l, a];
  }

  /**
   * 
   * @param {Array} rgba [255, 255, 255, 1]
   * @returns {[number,number,number,number]}
   */
  rgba2hsla(rgba) {
    const [r, g, b] = rgba.slice(0, 3).map(c => c / 255);
    let a = rgba[3];
    if (a === undefined) a = 1;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    // 灰度
    if (max === min) {
      h = s = 0;
      return [h, s * 100, l * 100, a];
    }
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
    if (h < 0) h += 360;
    return [h, s * 100, l * 100, a];
  }

  hsla2rgba(hsla) {
    let h = hsla[0] % 360;
    let s = hsla[1] / 100;
    let l = hsla[2] / 100;
    let a = hsla[3];

    const c = s * (1 - Math.abs(2 * l - 1));
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;

    let r, g, b;

    if (h >= 0 && h < 60) {
      [r, g, b] = [c, x, 0];
    } else if (h < 120) {
      [r, g, b] = [x, c, 0];
    } else if (h < 180) {
      [r, g, b] = [0, c, x];
    } else if (h < 240) {
      [r, g, b] = [0, x, c];
    } else if (h < 300) {
      [r, g, b] = [x, 0, c];
    } else {
      [r, g, b] = [c, 0, x];
    }

    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);

    return [r, g, b, a];
  }

  rgba2hsva(rgba) {
    // 将RGB分量归一化到0-1范围
    const red = rgba[0] / 255;
    const green = rgba[1] / 255;
    const blue = rgba[2] / 255;
    const alpha = rgba[3];

    // 计算最大值、最小值和差值delta
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const delta = max - min;

    let h = 0; // 色相（Hue）
    const v = max; // 明度（Value）
    const s = max === 0 ? 0 : delta / max; // 饱和度（Saturation）

    // 计算色相（H）
    if (delta !== 0) {
      if (max === red) {
        h = (green - blue) / delta;
      } else if (max === green) {
        h = (blue - red) / delta + 2;
      } else {
        h = (red - green) / delta + 4;
      }
      h *= 60; // 转换为度数
      if (h < 0) h += 360; // 确保色相在0-360之间
    }

    return [h, s * 100, v * 100, alpha];
  }

  hsva2rgba(hsva) {
    let h = hsva[0] % 360;
    if (h < 0) h += 360;
    let s = Math.max(0, Math.min(hsva[1] / 100, 1));
    let v = Math.max(0, Math.min(hsva[2] / 100, 1));
    let a = hsva[3];

    const c = v * s;
    const hp = h / 60;
    const x = c * (1 - Math.abs((hp % 2) - 1));
    const m = v - c;

    let r, g, b;

    if (hp >= 0 && hp < 1) [r, g, b] = [c, x, 0];
    else if (hp < 2) [r, g, b] = [x, c, 0];
    else if (hp < 3) [r, g, b] = [0, c, x];
    else if (hp < 4) [r, g, b] = [0, x, c];
    else if (hp < 5) [r, g, b] = [x, 0, c];
    else[r, g, b] = [c, 0, x];

    return [
      Math.round((r + m) * 255),
      Math.round((g + m) * 255),
      Math.round((b + m) * 255),
      a
    ];
  }

  /**
   * 
   * @param {Array} rgba [r, g, b, a]
   * @returns 
   */
  rgba2hex(rgba) {
    const res = rgba.slice(0, 3).map(c => c.toString(16).padStart(2, "0"));
    res.push((rgba[3] * 255).toString(16).padStart(2, "0"));
    return "#" + res.join("");
  }

  getHsva() {
    const [h, s, v, a] = this._color;
    return [Math.round(h), s.toFixed() + "%", v.toFixed() + "%", a === 1 ? 1 : Math.round(a * 1000) / 1000];
  }

  getHsla() {
    const [h, s, l, a] = this.rgba2hsla(this.hsva2rgba(this._color));
    return [Math.round(h), s.toFixed() + "%", l.toFixed() + "%", a === 1 ? 1 : Math.round(a * 1000) / 1000];
  }

  getRgba() {
    return this.hsva2rgba(this._color);
  }

  getHex() {

    const rgba = this.hsva2rgba(this._color);
    rgba[3] = Math.round(this._color[3] * 255);
    return rgba.map(c => c.toString(16).padStart(2, "0"));
  }

  /**
   * @param {number} num 
   */
  set H(num) {
    this._color[0] = num % 360;
    this.trigger();
  }

  /**
   * @param {string|number} value 
   */
  set S(value) {
    this._color[1] = this._setRatio(value);
    this.trigger();
  }

  /**
   * @param {string|number} value 
   */
  set V(value) {
    this._color[2] = this._setRatio(value);
    this.trigger();
  }

  /**
   * @param {string|number} value 
   */
  set A(value) {
    if (typeof value === "string") {
      value = parseFloat(value);
    }
    if (isNaN(value)) {
      throw new Error(`error value: not is normal alpha vaule
${value} `);
    }
    if (value < 0)
      value = Math.abs(value);
    if (value > 1 && value <= 255)
      value = value / 255;
    if (value > 255)
      value = (value % 255) / 255;
    this._color[3] = parseFloat(value.toFixed(3));
    this.trigger();
  }

  /**
   * @param {Array} colors [360, 100, 100, 1] or [,,,0.2]
   */
  set HSVA(colors) {

    colors = [...colors];
    for (let i = 0; i < colors.length; i++) {
      switch (i) {
        case 0:
          if (colors[i])
            this._color[i] = parseInt(colors[i]).toFixed(2) % 361;
          break;
        case 1:
        case 2:
          if (colors[i] || colors[i] === 0) {
            this._color[i] = parseInt(colors[i]).toFixed(2) % 101;
          }
          break;
        case 3:
          if (!colors[i]) break;
          if (typeof colors[i] === "string") {
            colors[i] = parseFloat(colors[i]);
          }
          if (isNaN(colors[i])) {
            throw new Error(`error colorStr: not is normal colorStr
  ${colorStr} `);
          }
          if (colors[i] < 0)
            colors[i] = Math.abs(colors[i]);

          if (colors[i] > 1 && colors[i] <= 255)
            this._color[i] = colors[i] / 255;
          if (colors[i] > 255)
            this._color[i] = (colors[i] % 255) / 255;
          break;

        default:
          break;
      }
    }
    this.trigger();
  }

  get H() {
    return this._color[0];
  }

  get S() {
    return this._color[1];
  }

  get V() {
    return this._color[2];
  }

  get A() {
    return this._color[3];
  }

  /**
   * @returns [h, s, l, a]
   */
  get colorPlate() {
    return [this._color[0], 100, 50, 1];
  }


  _setRatio(value) {
    if (typeof value === "string" && value.endsWith("%")) {
      value = parseInt(value);
    }
    if (typeof value !== "number" || isNaN(value)) {
      throw new Error(`error value: not is normal per
${value}`);
    }
    return value % 101;
  }

  /**
   * 
   * @param {(...args)=>void} fn 
   */
  addListener(fn) {
    if (typeof fn === "function") {
      if (this._listeners.has(fn)) return;
      this._listeners.add(fn);
      return;
    }
    throw new Error(`error fn: addListener not is function
${fn}`);

  }

  removeListener(fn) {
    this._listeners.delete(fn);
  }

  trigger() {
    for (const listener of this._listeners) {
      listener();
    }
  }
}