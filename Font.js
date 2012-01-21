/**
  This library adds Font objects to the general pool
  of available JavaScript objects.

  (c) Mike "Pomax" Kamermans, 2012
**/

// Make sure type arrays are available in IE9
// Code borrowed from pdf.js (https://gist.github.com/1057924)
(function() {
  try { var a = new Uint8Array(1); return; } catch(e) { }
  function subarray(start, end) { return this.slice(start, end); }
  function set_(array, offset) {
    if (arguments.length < 2) offset = 0;
    for (var i = 0, n = array.length; i < n; ++i, ++offset) {
      this[offset] = array[i] & 0xFF; }}
  function TypedArray(arg1) {
    var result;
    if (typeof arg1 === "number") {
       result = new Array(arg1);
       for (var i = 0; i < arg1; ++i) { result[i] = 0; }
    } else { result = arg1.slice(0); }
    result.subarray = subarray;
    result.buffer = result;
    result.byteLength = result.length;
    result.set = set_;
    if (typeof arg1 === "object" && arg1.buffer) { result.buffer = arg1.buffer; }
    return result; }
  window.Uint8Array = TypedArray;
  window.Uint32Array = TypedArray;
  window.Int32Array = TypedArray;
})();

// Also make sure XHR understands typing.
// Code borrowed from pdf.js (https://gist.github.com/1057924)
(function() {
  if(window.opera) return; // fairly necessary, since Opera actually already works
  if ("response" in XMLHttpRequest.prototype ||
      "mozResponseArrayBuffer" in XMLHttpRequest.prototype || 
      "mozResponse" in XMLHttpRequest.prototype ||
      "responseArrayBuffer" in XMLHttpRequest.prototype) { return; }
  Object.defineProperty(XMLHttpRequest.prototype, "response", {
    get: function() { return new Uint8Array(new VBArray(this.responseBody).toArray()); }});
})();

/**

  Code starts here!

 **/
function Font() {}

Font.prototype.fontFamily = "fjs"+(999999*Math.random()|0);
Font.prototype.url = "";
Font.prototype.format = "";

Font.prototype.data = "";

// these metrics represent the font-indicated values,
// not the values pertaining to text as it is rendered
// on the page (use fontmetrics.js for this instead).
Font.prototype.metrics = {
  quadsize: 0,
  leading: 0,
  ascent: 0,
  descent: 0,
  weightclass: 400
};

// This gets called when the file is done downloading.
Font.prototype.ondownloaded = function() {
  var chr = function(val) {
    return String.fromCharCode(val);
  };

  var ushort = function(b1,b2) {
    return 256*b1 + b2;
  };
  
  var fword = function(b1,b2) {
    var val, negative = b1>>7===1;
    b1 = b1 & 0x7F;
    // position numbers are already done
    if(!negative) { return 256*b1 + b2; }
    // negative numbers need the two's complement treatment
    return -(256*(~b1&0x7F) + (~b2&0x7f) + 1);
  }

  var ulong = function(b1,b2,b3,b4) {
    return 16777216*b1 + 65536*b2 + 256*b3 + b4;
  };

  // we know about TTF (0x00010000) and CFF ('OTTO') fonts
  var ttf = chr(0) + chr(1) + chr(0) + chr(0);
  var cff = "OTTO";

  // so what kind of font is this?
  var data = this.data;
  var version = chr(data[0]) + chr(data[1]) + chr(data[2]) + chr(data[3]);
  var isTTF = version===ttf;
  var isCFF = isTTF? false : version===cff;
  if(isTTF) { this.format = "truetype"; }
  else if(isCFF) { this.format = "opentype"; }
  else { throw("Error: file at "+this.url+" cannot be interpreted as OpenType font."); }

  // if we get here, the font is good. Extract font metrics,
  // and then wait for it to be available for styling.

  var numTables = ushort(data[4], data[5]);
  var tagStart = 12, ptr, end = tagStart + 16 * numTables, tags={};
  for(ptr = tagStart; ptr<end; ptr += 16) {
    tag = String.fromCharCode(data[ptr]) + String.fromCharCode(data[ptr+1]) + String.fromCharCode(data[ptr+2]) + String.fromCharCode(data[ptr+3]);
    tags[tag] = {
      name: tag,
      checksum: ulong(data[ptr+4], data[ptr+5], data[ptr+6], data[ptr+7]),
      offset:   ulong(data[ptr+8], data[ptr+9], data[ptr+10], data[ptr+11]),
      length:   ulong(data[ptr+12], data[ptr+13], data[ptr+14], data[ptr+15]) };
  }
  
  // access HEAD table (for "units per EM" value)
  tag = "head";
  if(!tags[tag]) { throw("Error: font is missing the OpenType '"+tag+"' table."); }
  ptr = tags[tag].offset;
  tags[tag].version = "" + data[ptr] + data[ptr+1] + data[ptr+2] + data[ptr+3];
  this.metrics.quadsize = ushort(data[ptr+18], data[ptr+19]);

  // access HHEA table (for ascent/descent/leading values)
  tag = "hhea";
  if(!tags[tag]) { throw("Error: font is missing the OpenType '"+tag+"' table."); }
  ptr = tags[tag].offset;
  tags[tag].version = "" + data[ptr] + data[ptr+1] + data[ptr+2] + data[ptr+3];
  this.metrics.ascent  = fword(data[ptr+4], data[ptr+5]);
  this.metrics.descent = fword(data[ptr+6], data[ptr+7]);
  this.metrics.leading = fword(data[ptr+8], data[ptr+9]);

  // access OS/2 table (for font-indicated weight class)
  tag ="OS/2";
  if(!tags[tag]) { throw("Error: font is missing the OpenType '"+tag+"' table."); }
  ptr = tags[tag].offset;
  tags[tag].version = "" + data[ptr] + data[ptr+1];
  this.metrics.weightclass = ushort(data[ptr+4], data[ptr+5]);

  // For the moment we use a test font that has a hard coded "A",
  // but what we really want to do is grab a glyph we know exists
  // in the font, instead, like in github.com/Pomax/Minimal-font-generator
  var base64 = "AAEAAAAKAIAAAwAgT1MvMgAAAAAAAACsAAAAWGNtYXAA"+
               "AAAAAAABBAAAACxnbHlmAAAAAAAAATAAAAAQaGVhZAAAA"+
               "AAAAAFAAAAAOGhoZWEAAAAAAAABeAAAACRobXR4AAAAAA"+
               "AAAZwAAAAIbG9jYQAAAAAAAAGkAAAACG1heHAAAAAAAAA"+
               "BrAAAACBuYW1lAAAAAAAAAcwAAAAgcG9zdAAAAAAAAAHs"+
               "AAAAEAAEAAEAZAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"+
               "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"+
               "AAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAABAAMAAQA"+
               "AAAwABAAgAAAABAAEAAEAAABB//8AAABB////wAABAAAA"+
               "AAABAAAAAAAAAAAAAAAAMQAAAQAAAAAAAAAAAABfDzz1A"+
               "AAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAEAAg"+
               "AAAAAAAAABAAAAAQAAAAEAAAAAAAAAAAAAAAAAAAAAAAA"+
               "AAAAAAAAAAQAAAAAAAAAAAAAAAAAIAAAAAQAAAAIAAQAB"+
               "AAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAIAHgADAAEEC"+
               "QABAAAAAAADAAEECQACAAIAAAAAAAEAAAAAAAAAAAAAAA"+
               "AAAA==";
  
  // test font stylesheet
  var tfName = this.fontFamily+" testfont";
  var zerowidth = document.createElement("style");
  zerowidth.setAttribute("type","text/css");
  zerowidth.innerHTML =  "@font-face {\n" +
                        "  font-family: '"+tfName+"';\n" +
                        "  src: url('data:application/x-font-ttf;base64,"+base64+"')\n" + 
                        "       format('truetype');}";
  document.head.appendChild(zerowidth);
  
  // validation stylesheet
  var realfont = this.toStyleNode();
  document.head.appendChild(realfont);

  // validation paragraph
  var para = document.createElement("p");
  para.style.cssText = "position: absolute; top: 0; left: 0; opacity: 1.0;";
  para.style.fontFamily = "'"+this.fontFamily+"', '"+tfName+"'";
  para.innerHTML = "AAAAAAAAAA";
  document.body.appendChild(para);

  // if there is no getComputedStyle, claim loading is done.
  if(!document.defaultView.getComputedStyle) {
    this.onload();
    throw("Error: document.defaultView.getComputedStyle is not supported by this browser.\n"+
           "Consequently, Font.onload cannot be trusted."); }

  // if there is getComputedStyle, we do proper load completion verification, instead.
  else { this.validate(para, zerowidth, realfont, this); }
};

// validation function to see if the zero-width styled
// text is no longer zero-width. If this is true, the
// font is properly done loading.
Font.prototype.validate = function(target, zero, mark, font) {
  var computedStyle = document.defaultView.getComputedStyle(target,"");
  var width = computedStyle.getPropertyValue("width").replace("px",'');
  if(width>0) {
    document.head.removeChild(zero);
    document.head.removeChild(mark);
    document.body.removeChild(target);
    this.onload();
  } else { 
    // font has not finished loading - wait 50ms and try again
    setTimeout(function() { font.validate(target, zero, mark, font); }, 50); }
};

// this gets called when src is set
Font.prototype.loadFont = function() {
  var font = this;
  var xhr = new XMLHttpRequest();
  xhr.open('GET', this.url, true);  
  xhr.responseType = "arraybuffer";  
  xhr.onload = function (evt) {  
    var arrayBuffer = xhr.response; // Note: not oXHR.responseText  
    if (arrayBuffer) {  
      font.data =  new Uint8Array(arrayBuffer);
      font.ondownloaded();
    } else { throw("Error!"); }
  };  
  xhr.send(null);  
};

// this gets called once the font is done loading,
// and all its metrics have been determined.
Font.prototype.onload = function() {
};

// The stylenode can be added to the document head
// to make the font available for on-page styling.
Font.prototype.styleNode = false;
Font.prototype.toStyleNode = function() {
  if(this.styleNode) { return this.styleNode; }
  this.styleNode = document.createElement("style");
  var styletext = "@font-face {\n";
     styletext += "  font-family: '"+this.fontFamily+"';\n";
     styletext += "  src: url('"+this.url+"') format('"+this.format+"');\n";
     styletext += "}";
  this.styleNode.innerHTML = styletext;
  return this.styleNode;
}

// we want Font to do the same thing Image does when
// we set the "src" property value, so we use the 
// Object.defineProperty function to bind a setter
// that does more than just bind values.
Object.defineProperty(Font.prototype, "src", { set: function(url) { this.url=url; this.loadFont(); }});
