/* iOS scrollpane jQuery plugin, v1.0
 * ==================================
 *
 * (c) 2011 Dave Gurnell
 * http://boxandarrow.com
 *
 * Distributed under the Creative Commons Attribution 3.0 Unported licence:
 * http://creativecommons.org/licenses/by/3.0/
 */


/* Initialise a scrollpane. Use this on HTML like:
 *
 *    <div id="viewport">
 *      <div>First page</div>
 *      <div>Second page</div>
 *      <div>Third page</div>
 *    </div>
 *
 *    $("#viewport").scrollpane();
 *
 * The method wil automatically position and resize the pages
 * so they're the same size as the viewport. Touching and dragging
 * on the pages will flip between them in the style of the iOS home 
 * screen. Options:
 *
 *  - direction: "horizontal" or "vertical", default "horizontal"
 *
 *      The scroll direction.
 *
 *  - deadzone: int, default 25
 *
 *      Distance the user has to drag before a page transition is
 *      triggered. Avoids accidental page transitions caused by
 *      brushing against the screen.
 *
 *  - draggable: boolean, default true
 *
 *      Setting this to false disables the touch gestures. This is
 *      useful if you only want to transition using the $().showpage()
 *      method (see bottom of the file).
 *
 *  - setupCss: boolean, default true
 *
 *      Whether to edit the CSS rules for the viewport and pages.
 *      Set this to false to do your own layout, but bear in mind the
 *      plugin only works if the pages are the same size as the viewport.
 *
 *      Note that this option does not affect whether the method sets
 *      -webkit-transition and -webkit-transform on the viewport.
 *
 *  - onscroll: (int int int -> void), default empty function
 *
 *      Callback function that gets invoked whenever the page scrolls. 
 *      Use this to hook up animations and status indicators elsewhere
 *      on the page. 
 *
 *      Arguments to the function are:
 *
 *        - pos : int
 *
 *          the (typically negative) position that we're scrolling to, in pixels
 *
 *        - page : real
 *
 *          the (typically positive, possibly fractional) position that we're
 *          scrolling to, in units of a page
 *
 *        - duration : int
 *
 *          the number of milliseconds we're going to take to get there
 *
 *   - onscrollfinish: (int int -> void), default empty function
 *  
 *       Callback function that gets invoked when the viewport settles on a
 *       new page. pos and page arguments are the same as for onscroll.
 *
 */
/*
$.fn.scrollpane = function(options) {
    options = $.extend({ 
        direction: "horizontal",
        deadzone: 25,
        draggable: true,
        setupCss: true,
        onscroll: function(pos, page, duration) { },
        onscrollfinish: function(pos, page) { }
    }, options);*/

var SwipePane = SwipePane || function(domElem, optionsOverride){
	
	optionsOverride = optionsOverride? optionsOverride : {};
	var options = {};
	options.direction = optionsOverride.direction? optionsOverride.direction: "vertical";
    options.deadzone = optionsOverride.deadzone? optionsOverride.deadzone: 25;
    options.draggable = optionsOverride.draggable? optionsOverride.draggable: true;
    options.setupCss = true;
    options.onscroll = optionsOverride.onscroll? optionsOverride.onscroll : function(pos, page, duration) { };
    options.onscrollfinish = optionsOverride.onscrollfinish? optionsOverride.onscrollfinish : function(pos, page) { };
    
    
	
    // the scroll pane viewport
    // jQuery
    var outerElem = domElem;
    
    // a large div containing the scrolling content
    // jQuery
    //var innerElem = $("<div></div>");
    var innerElem = document.createElement("div");
    innerElem.style.position = 'absolute';
    //innerElem.append(outerElem.children().remove());
    
    var noOfchildren = outerElem.children.length;
    for(var i=0; i<noOfchildren; i++){        	
    	var node = outerElem.removeChild(outerElem.children[0]);
    	innerElem.appendChild(node);
    }
    
    //outerElem.append(innerElem);
    outerElem.appendChild(innerElem);
    
    // cache these for later
    // natural
    //var outerWidth = outerElem.width();
    var outerWidth = outerElem.offsetWidth;
    //var outerHeight = outerElem.height();
    var outerHeight = outerElem.offsetHeight;
    
    // boolean
    var horizontal = (options.direction == "horizontal");
    
    // the number of pixels the user has to drag and release to trigger a page transition
    // natural
    var deadzone = Math.max(0, options.deadzone);
    
    // the index of the current page. changed after the user completes each scrolling gesture.
    // integer
    var currentPage = 0;
    
    // width of a page
    // integer
    var scrollUnit = horizontal ? outerWidth : outerHeight;

    // x coordinate on the transform. -ve numbers go to the right,
    // so this goes -ve as currentPage goes +ve
    // integer (pixels)
    var currentPos = 0;

    // min and max scroll position:
    // integer (pixels)
    var scrollMax = 0;
    //var scrollMin = -scrollUnit * (innerElem.children().length - 1);
    var scrollMin = -scrollUnit * (innerElem.children.length - 1);

    // time to settle after touched:
    // natural (ms)
    var settleTime = 500;

    // dragMid and dragEnd are updated each frame of dragging:
    // integer (pixels)
    var dragStart = 0; // touch position when dragging starts
    var dragMid = 0;   // touch position on the last touchmove event
    var dragEnd = 0;   // touch position on this touchmove event

    // +1 if dragging in +ve x direction, -1 if dragging in -ve x direction
    // U(-1, +1)
    var dragDir = 0;
    
    var mouseDown = false;      // added for mouse events to work
    var thisIsIos = false;
    
    
    var easeOut = 0.3;	//lower for more easeing
	var reachY = 0.6;	//higher for slower movement
	var yDist = 0, easedYpos = 0;//diffX = 0, previousX = 0
        
        
    if(options.setupCss) {        	          
    	outerElem.style.position = 'relative';
      	outerElem.style.overflow = 'hidden';

      // position the pages:
     
		for(var j=0; j< innerElem.children.length; j++){
			//console.log(innerElem.children);
			innerElem.children[j].style.position = 'absolute';
			innerElem.children[j].style.display = 'block';
			innerElem.children[j].style.width = outerWidth+'px';
			innerElem.children[j].style.height = outerHeight+'px';
			if(horizontal){
				innerElem.children[j].style.left = scrollUnit * j+'px';
			}else{
				innerElem.children[j].style.top = scrollUnit * j+'px';         		
			}
		}
     
    }
    if (navigator.userAgent.match(/(iPod|iPhone|iPad)/)){
        thisIsIos = true;
    }
        
    // natural natural boolean -> void
    function scrollTo(position, duration, finish) {
        options.onscroll(position, -position/scrollUnit, duration);
        // use the 3d tansitions for ios to use the hardware acceleration
      	if(supportsTransitions()){
	        innerElem.style['-webkit-transition'] = "all " + (duration == 0 ? "0" : duration + "ms");
	        innerElem.style.transition = "all " + (duration == 0 ? "0" : duration + "ms");
	        
	        innerElem.style['-webkit-transform'] = horizontal ? ("translate3d(" + position + "px, 0, 0)") : ("translate3d(0, " + position + "px, 0)");
	        innerElem.style.transform = horizontal ? ("translate3d(" + position + "px, 0, 0)") : ("translate3d(0, " + position + "px, 0)");
		}
		else{      
        	if(horizontal){
        		innerElem.style.left =  position + "px";
        	}else{
        		innerElem.style.top =  position + "px";        		
        	}
       	}
        
        if(finish) {
            window.setTimeout(function() { 
              options.onscrollfinish(position, -position/scrollUnit, duration);
            },duration);
        }
    }
    
    // Immediately set the 3D transform on the scroll pane.
    // This causes Safari to create OpenGL resources to manage the animation.
    // This sometimes causes a brief flicker, so best to do it at page load
    // rather than waiting until the user starts to drag.
    scrollTo(0, 0, true);

    
        
    if(options.draggable) {    	
    	if(window.addEventListener){    	
        	outerElem.addEventListener('touchstart', onStart ,false);        	
        	outerElem.addEventListener('touchmove',onMove,false);        	
        	outerElem.addEventListener('touchend',onEnd,false);
        	
        	outerElem.addEventListener('mousedown', onStart ,false);        	
        	outerElem.addEventListener('mousemove',onMove,false);        	
        	outerElem.addEventListener('mouseup',onEnd,false);
        	
        	window.addEventListener('keydown',onKeyDown,false);
    	}
    	else{
        	outerElem.attachEvent('onmousedown', onStart);        	
        	outerElem.attachEvent('onmousemove',onMove);        	
        	outerElem.attachEvent('onmouseup',onEnd);        		
        	document.attachEvent('onkeydown',onKeyDown);
    	}     	
    	preventDraggingOfImage(outerElem); 
    }
    
    if(!supportsTransitions()){
    	if(!window.requestAnimFrame){
			window.requestAnimFrame = (function(callback) {
			    return window.requestAnimationFrame || 
			        window.webkitRequestAnimationFrame || 
			        window.mozRequestAnimationFrame || 
			        window.oRequestAnimationFrame || 
			        window.msRequestAnimationFrame ||
			        function(callback) {
			        	window.setTimeout(callback, 1000 / 60);
			    	};
			})();
		}
		animatePos();
    }
    
    function setSize(width, height){    
    	outerElem.style.width = width + 'px';	
    	outerElem.style.height = height + 'px';	
    	outerWidth = width;    
    	outerHeight = height;
    	scrollUnit = horizontal ? outerWidth : outerHeight;
    	scrollMin = -scrollUnit * (innerElem.children.length - 1);
    	
    	for(var j=0; j< innerElem.children.length; j++){
			innerElem.children[j].style.width = outerWidth+'px';
			innerElem.children[j].style.height = outerHeight+'px';
			if(horizontal){
				innerElem.children[j].style.left = scrollUnit * j+'px';
			}else{
				innerElem.children[j].style.top = scrollUnit * j+'px';         		
			}
		}
		onEnd();
    }
    
    function onKeyDown(e){
		var evt = window.event || e;	
		console.log(evt.keyCode);	
 		switch(evt.keyCode){
            case 39:    // right arrow
                showPage(currentPage+1);
                break;
            case 37:    // left arrow
                showPage(currentPage-1);
                break;
        }	
    }
    
	function onStart(e){
		var evt = window.event || e;		
		if(evt.type === "mousedown"){
			//if(evt.preventDefault) evt.preventDefault();
			//evt.returnValue = false;
			var pageX = evt.pageX || evt.x;
			var pageY = evt.pageY || evt.y;
            mouseDown = true;
			dragStart = dragEnd = dragMid = horizontal ? pageX : pageY;
		} else if(evt.touches.length == 1) {                    
            dragStart = dragEnd = dragMid = horizontal ? evt.touches[0].pageX : evt.touches[0].pageY;
        } 
	}
	
	function onMove(e){
		var evt = window.event || e;
		if(mouseDown){	
			var pageX = evt.pageX || evt.x;
			var pageY = evt.pageY || evt.y;		
            dragEnd = horizontal ? pageX : pageY;
	        dragDir = (dragEnd - dragMid) > 0 ? 1 : -1;
	        currentPos += dragEnd - dragMid;
	        dragMid = dragEnd;
	        scrollTo(currentPos, 0, false);
		}
		else if(evt.touches && evt.touches.length == 1) {
            dragEnd = horizontal ? evt.touches[0].pageX : evt.touches[0].pageY;
	        dragDir = (dragEnd - dragMid) > 0 ? 1 : -1;
	        currentPos += dragEnd - dragMid;
	        dragMid = dragEnd;
	        scrollTo(currentPos, 0, false);
        }  
	}
	
	function onEnd(e){
		//var evt = window.event || e;		
        mouseDown = false;        
        // boolean
        var reset = Math.abs(dragEnd - dragStart) < deadzone;
        
        // real
        var scrollPage = -1.0 * currentPos / scrollUnit;
        
        // natural
        var nextPage = reset? currentPage: (dragDir < 0 ? Math.ceil(scrollPage) : Math.floor(scrollPage));

        // int
        var nextPos = Math.max(scrollMin,
                                   Math.min(scrollMax,
                                            -scrollUnit * nextPage));
 
        currentPos = nextPos;
        currentPage = nextPage;
        

        if(supportsTransitions()){
        	scrollTo(nextPos, settleTime, true);
        }else{
	        yDist = nextPos*0.6;    	
        }
	}
	
	function showPage(page){
		page = page < 0 ? innerElem.children.length + page : page;                
	    currentPos = Math.max(scrollMin, Math.min(scrollMax, -page * scrollUnit));
	    currentPage = -currentPos / scrollUnit; 
	    if(supportsTransitions()){        	
	    	scrollTo(currentPos, settleTime, true);			
	    }else{
	        yDist = currentPos*0.6;    	
	    }  
	}
	
	function animatePos(){
		if(!mouseDown){
			easedYpos += (yDist - easedYpos * reachY) * easeOut;										
			scrollTo(easedYpos, 0, false);
		}		
		requestAnimFrame(animatePos);
	}
	
	function supportsTransitions(){
		var testDiv = document.createElement('div');
		if(testDiv.style.transition != undefined || testDiv.style['-webkit-transition'] != undefined){
			return true;
		}else{
			return false;			
		}
	}
	
	function preventDraggingOfImage(imgElem){
		imgElem.ondragstart = function(e){
			var evt = e || window.event;
			if(evt.preventDefault) evt.preventDefault();
			// Need for IE < 9
			evt.returnValue = false;
		};
	}
	

	
/////// PUBLIC METHODS ///////////////////////////////////////////////////////////////
        
	return{
		showpage:function(page){
           showPage(page);       
		},
		setSize:function(w,h){
			setSize(w,h);
		}
	};
};