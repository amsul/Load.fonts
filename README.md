Load.fonts
==========

Load.fonts is a fork of [Font.js](https://github.com/Pomax/Font.js) ported over to CoffeeScript.

---

Load.fonts adds <code>new Font()</code> functionality to the JavaScript toolbox, akin to how you use <code>new Image()</code> for images. It adds an <code>onload</code> event hook so that you don't deploy a font resource on your webpage before it's actually ready for use, as browsers can tell you when a font has downloaded, but not when it has been parsed and made ready for on-page rendering. This object can. It can also do this for system fonts, so you can also use Load.fonts to detect whether a specific system font is installed at the client, for fallbacks and failsafes.


## Basic API

  * constructor
    
      <code>var font = new Font();</code>

  * load event handler

    <code>font.onload = function() {
      /\* your code here \*/
    };</code>

  * error event handler

    <code>font.onerror = function(error_message) {
      /\* your code here \*/
    };</code>

  * name assignment

    <code>font.fontFamily = "name goes here";</code>

  * font loading

    - remote fonts:

      <code>font.src = "http://your.font.location/here.ttf";</code>

    (!) This line will kick off font loading and will make the font available on-page (if a remote font was requested).


    - system fonts / already @font-face loaded fonts:

      <code>font.src = font.fontFamily;</code>

    (!) Note that this also works for google webfont and typekit fonts that have been loaded through an HTML stylesheet. Any font that is available by name, rather than by font file, can be loaded using the above <code>src=fontFamily</code> solution.


  * DOM removal

    <code>document.head.removeChild(font.toStyleNode());</code>
    
    (!) this only applies to fonts loaded from a remote resource. System fonts do not have an associated style node.

  * DOM (re)insertion

    <code>document.head.appendChild(font.toStyleNode());</code>

    (!) This is only required if you removed the font from the page, as the font is added to the DOM for use on-page during font loading already.

    (!) this only applies to fonts loaded from a remote resource. System fonts do not have an associated style node.



##Font Metrics API

  * <code>font.metrics.quadsize</code>

    The font-indicated number of units per em
    
  * <code>font.metrics.leading</code>

    The font-indicated line height, in font units
    (this vaue is, often, useless)

  * <code>font.metrics.ascent</code>

    The maximum ascent for this font, as a ratio
    of the fontsize

  * <code>font.metrics.decent</code>

    The maximum descent for this font, as a ratio
    of the fontsize

  * <code>font.metrics.weightclass</code>

    The font-indicated weight class
      
  (!) As system font files cannot be inspected, they do not have an associated font.metrics object. Instead, font.metrics is simply "false".


Text Metrics API
----------------

  * <code>font.measureText(string, size)</code>

    Compute the metrics for a particular string, with this font applied at the specific font size in pixels

  * <code>font.measureText(...).width</code>

    the width of the string in pixels, using this font at the specified font size

  * <code>font.measureText(...).fontsize</code>

    the specified font size

  * <code>font.measureText(...).height</code>

    the height of the string. This may differ from the
    font size

  * <code>font.measureText(...).leading</code>

    the actual line spacing for this font based on ten
    lines.

  * <code>font.measureText(...).ascent</code>

    the ascent above the baseline for this string

  * <code>font.measureText(...).descent</code>

    the descent below the baseline for this string

  * <code>font.measureText(...).bounds</code>

    An object <code>{xmin:\<num\>, ymin:\<num\>, xmax:\<num\>, ymax:\<num\>}</code> indicating the string's bounding box.

When <code>font.src</code> is set, the whole shebang kicks in, just like for <code>new Image()</code>, so make sure to define your <code>onload()</code> handler BEFORE setting the <code>src</code> property, or your handler may not get called.

Demonstrator
------------

A demonstrator of this object can be found at:

  * <http://pomax.nihongoresources.com/pages/Font.js>

Load.fonts is compatible with all browsers that support canvas and Object.defineProperty --  This includes all versions of Firefox, Chrome, Opera, IE and Safari that were 'current' (Firefox 9, Chrome 16, Opera 11.6, IE9, Safari 5.1) at the time Font.js was released.

Load.fonts will not work on IE8 or below due to the lack of Object.defineProperty - I recommend using the solution outlined in http://ie6update.com/ for websites that are not corporate intranet sites, because as a home user you have no excuse not to have upgraded to Internet Explorer 9 yet, or simply not using Internet Explorer if you're still using Windows XP. If you have friends or family that still use IE8 or below: intervene.

This code is (c) Amsul Naeem, 2012 – Licensed under the MIT ("expat" flavor) license.