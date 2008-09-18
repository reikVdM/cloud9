/*
 * See the NOTICE file distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation; either version 2.1 of
 * the License, or (at your option) any later version.
 *
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this software; if not, write to the Free
 * Software Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301 USA, or see the FSF site: http://www.fsf.org.
 *
 */

__INTERACTIVE__ = 1 << 21;

//#ifdef __WITH_INTERACTIVE

/**
 * Baseclass giving interactive features to this component, it adds a
 * draggable and resizable attribute to the component
 *
 * @classDescription		
 * @return
 * @type
 * @constructor
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       1.0
 */
jpf.Interactive = function(){
    var nX, nY, rX, rY, startPos, lastCursor, l, t, lMax, tMax, 
        w, h, we, no, ea, so, rszborder, rszcorner, marginBox,
        verdiff, hordiff, _self = this, posAbs;
        
    this.__regbase = this.__regbase|__INTERACTIVE__;

    this.__propHandlers["draggable"] = function(value){
        var o = this.oDrag || this.oExt;
        if (o.interactive & 1) 
            return;
        
        var mdown = o.onmousedown;
        o.onmousedown = function(){
            if (mdown && mdown.apply(this, arguments) === false)
                return;

            _self.dragStart.apply(this, arguments);
        }
        o.interactive = (o.interactive||0)+1;
        
        //this.oExt.style.position = "absolute";
    }
    
    this.__propHandlers["resizable"] = function(value){
        var o = this.oResize || this.oExt;
        if (o.interactive & 2) 
            return;
        
        var mdown = o.onmousedown;
        var mmove = o.onmousemove;
        
        o.onmousedown = function(){
            if (mdown && mdown.apply(this, arguments) === false)
                return;

            _self.resizeStart.apply(this, arguments);
        }
        o.onmousemove = function(){
            if (mmove && mmove.apply(this, arguments) === false)
                return;

            _self.resizeIndicate.apply(this, arguments);
        }
        
        o.interactive = (o.interactive||0)+2;
        
        //this.oExt.style.position = "absolute";
        
        rszborder = this.__getOption("Main", "resize-border") || 3;
        rszcorner = this.__getOption("Main", "resize-corner") || 10;
        marginBox = jpf.getBox(jpf.getStyle(this.oExt, "borderWidth"));
        
        if (!_self.minwidth)  _self.minwidth  = 0;
        if (!_self.minheight) _self.minheight = 0;
        if (!_self.maxwidth)  _self.maxwidth  = 10000;
        if (!_self.maxheight) _self.maxheight = 10000;
    }
    
    this.dragStart = function(e){
        if (!e) e = event;

        if (!_self.draggable || jpf.dragmode.isDragging)
            return;

        jpf.dragmode.isDragging = true;
        
        //jpf.Plane.show(this);
        
        var diff = jpf.getDiff(_self.oExt);
        hordiff  = diff[0];
        verdiff  = diff[1];

        posAbs = jpf.getStyle(_self.oExt, "position") == "absolute";
        if (!posAbs)
            _self.oExt.style.position = "relative";

        var pos = posAbs 
            ? jpf.getAbsolutePosition(_self.oExt, _self.oExt.offsetParent) 
            : [parseInt(_self.oExt.style.left) || 0, 
               parseInt(_self.oExt.style.top) || 0];
            
        nX = pos[0] - e.clientX;
        nY = pos[1] - e.clientY;
        
        if (_self.hasFeature(__ANCHORING__))
            _self.disableAnchoring();

        document.onmousemove = _self.dragMove;
        document.onmouseup   = function(){
            document.onmousemove = document.onmouseup = null;
            //jpf.Plane.hide();
            
            if(l) _self.setProperty("left", l);
            if(t) _self.setProperty("top", t);
            
            if (!posAbs)
                _self.oExt.style.position = "relative";
                
            jpf.dragmode.isDragging = false;
        }

        return false;
    }
    
    this.dragMove = function(e){
        if(!e) e = event;
        
        _self.oExt.style.left = (l = e.clientX + nX) + "px";
        _self.oExt.style.top  = (t = e.clientY + nY) + "px";
    }
    
    this.resizeStart = function(e){
        if (!e) e = event;

        if (!_self.resizable)
            return;
        
        if (_self.hasFeature(__ANCHORING__))
            _self.disableAnchoring();

        var diff = jpf.getDiff(_self.oExt);
        hordiff  = diff[0];
        verdiff  = diff[1];

        startPos = jpf.getAbsolutePosition(_self.oExt, _self.oExt.offsetParent);
        startPos.push(_self.oExt.offsetWidth);
        startPos.push(_self.oExt.offsetHeight);
        var x = e.clientX - startPos[0];
        var y = e.clientY - startPos[1];

        var resizeType = getResizeType.call(_self.oExt, x, y);
        rX = x;
        rY = y;

        if (!resizeType)
            return;

        jpf.dragmode.isDragging = true;

        var r = "|" + resizeType + "|"
        we = "|w|nw|sw|".indexOf(r) > -1;
        no = "|n|ne|nw|".indexOf(r) > -1;
        ea = "|e|se|ne|".indexOf(r) > -1;
        so = "|s|se|sw|".indexOf(r) > -1;
        
        if (posAbs) {
            lMax = startPos[0] + startPos[2] - _self.minwidth;
            tMax = startPos[1] + startPos[3] - _self.minheight;
        }
        
        if (posAbs)
            jpf.Plane.show(_self.oExt);
        
        lastCursor = document.body.style.cursor;
        document.body.style.cursor = resizeType + "-resize";

        document.onmousemove = _self.resizeMove;
        document.onmouseup   = function(){
            document.onmousemove = document.onmouseup = null;
            if (posAbs)
                jpf.Plane.hide();
            
            if (l) _self.setProperty("left", l);
            if (t) _self.setProperty("top", t);
            if (w) _self.setProperty("width", w + hordiff) 
            if (h) _self.setProperty("height", h + verdiff); 
            
            l = t = w = h = null;
            
            document.body.style.cursor = lastCursor;
            
            jpf.dragmode.isDragging = false;
        }
        
        return false;
    }
    
    this.resizeMove = function(e){
        if(!e) e = event;
        
        if (we) {
            _self.oExt.style.left = (l = Math.min(lMax, e.clientX - rX)) + "px";
            _self.oExt.style.width = (w = Math.min(_self.maxwidth, 
                Math.max(hordiff, _self.minwidth, 
                    startPos[2] - (e.clientX - startPos[0]) - rX 
                    + (jpf.isIE ? 8 : 4)) - hordiff)) + "px";
        }
        
        if (no) {
            _self.oExt.style.top = (t = Math.min(tMax, e.clientY - rY)) + "px";
            _self.oExt.style.height = (h = Math.min(_self.maxheight, 
                Math.max(verdiff, _self.minheight, 
                    startPos[3] - (e.clientY - startPos[1]) - rY 
                    + (jpf.isIE ? 8 : 4)) - verdiff)) + "px";
        }
        
        if (ea)
            _self.oExt.style.width  = (w = Math.min(_self.maxwidth, 
                Math.max(hordiff, _self.minwidth, 
                    e.clientX - startPos[0] + (startPos[2] - rX))
                    - hordiff)) + "px";
        
        if (so)
            _self.oExt.style.height = (h = Math.min(_self.maxheight, 
                Math.max(verdiff, _self.minheight, 
                    e.clientY - startPos[1] + (startPos[3] - rY))
                    - verdiff)) + "px";
        
        if (jpf.hasSingleRszEvent)
            window.onresize();
    }
    
    function getResizeType(x, y){
        var cursor  = "", 
            tcursor = "";
        posAbs = jpf.getStyle(_self.oExt, "position") == "absolute";

        if (y < rszborder + marginBox[0]) 
            cursor = posAbs ? "n" : "";
        else if (y > this.offsetHeight - marginBox[0] - marginBox[2] - rszborder) 
            cursor = "s";
        else if (y < rszcorner + marginBox[0]) 
            tcursor = posAbs ? "n" : "";
        else if (y > this.offsetHeight - marginBox[0] - marginBox[2] - rszcorner) 
            tcursor = "s";
        
        if (x < (cursor ? rszcorner : rszborder) + marginBox[3]) 
            cursor += tcursor + (posAbs ? "w" : "");
        else if (x > this.offsetWidth - marginBox[1] - marginBox[3] - (cursor ? rszcorner : rszborder)) 
            cursor += tcursor + "e";
        
        return cursor;
    }
    
    this.resizeIndicate = function(e){
        if(!e) e = event;
        
        if (!_self.resizable || document.onmousemove)
            return;

        var pos = jpf.getAbsolutePosition(_self.oExt, _self.oExt.offsetParent);
        var x = e.clientX - pos[0];
        var y = e.clientY - pos[1];
        
        var cursor = getResizeType.call(_self.oExt, x, y);
        this.style.cursor = cursor 
            ? cursor + "-resize" 
            : "default";
    }
}