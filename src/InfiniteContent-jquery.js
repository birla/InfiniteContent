/**
 * Create Infinite Content (scrolling) for a page.
 * Uses prototype.js
 * 
 * @author Prakhar Birla
 * 
 * usage:
 *  new InfiniteContent('results_container', 'totalPages', {
 *		nextPageTriggerHeight : 750,
 *		button : false
 *	}, {
 *		'loadNextPage' : AJAXRequest.fetchResults
 *	});
 * additional:
 *  upon AJAX success:$('results_container').fire('inf:pageSuccess');
 *  upon AJAX faliure:$('results_container').fire('inf:pageFaliure');
 *  ...
 */
var InfiniteContent = function(contentContainer, lastPage, loadNextPage, options, callBacks) {
	/**
	 * Start observing scroll and resize
	 */
	this.bindScroll = function(){
		if(this.options.debug) {
			console.log("inf: Binding window scroll and resize");
		}
		
		$(window).bind('scroll', this.scrollEvent);
		$(window).bind('resize', this.scrollEvent);
	};
	
	/**
	 * Stop observing scroll and resize
	 */
	this.unbindScroll = function(){
		if(this.options.debug) {
			console.log("inf: ");
		}
		$(window).unbind('scroll', this.scrollEvent);
		$(window).unbind('resize', this.scrollEvent);
	};
	
	/**
	 * Reset scroll state (used when new result set is loaded via AJAX)
	 */
	this.reset = function(){
		if(this.options.debug) {
			console.log("inf: Reset");
		}
		this.hidePagination();
		//this.reachedLastPage();
		this.page = 1;
		this.state = 0;
		this.ajaxRequestCount=0;
		this.lastPage = parseInt($(this.lastPageElm).value, 10);
			if(this.lastPage === 0) {
				this.reachedLastPage();
			}
	};
	
	/**
	 * Handler for scrolling event on the window
	 */
	this.scrollEvent = function(){
		if(this.state === 0) {
			if(this.page === this.lastPage) {
				return this.reachedLastPage();
			}
			if(this.options.forceButtonPage!==0) {
				if((this.options.forceButtonPageRepeat && (this.page%this.options.forceButtonPage)===0) || 
						(this.page===this.options.forceButtonPage)) {
					if(this.options.debug) {
						console.log("inf: Trigger force button");
					}
					return this.showButton();
				}
			}
			var size = this.getDisplaySize(), remaining = 0;
			//try {
				remaining = (this.contentContainer.viewportOffset().top + this.contentContainer.height()) - size.height;
				console.log(remaining);
			/*} catch(e) {
				console.log(e);
				remaining = size.height;
			}*/
			if(this.options.button && this.ajaxRequestCount === 0 && remaining < this.options.buttonTriggerHeight) {
				if(this.options.debug) {
					console.log("inf: Trigger show button");
				}
				return this.showButton();
			}else if(remaining < this.options.nextPageTriggerHeight && this.ajaxRequestCount < 1){
				if(this.options.debug) {
					console.log("inf: Trigger next page");
				}
				this.contentContainer.trigger('inf:loadNextPage');
				return;
			}
		}
	};
	
	/**
	 * Loads the next page by calling the loadNextPage callback function
	 */
	this.nextPage = function() {
		if(this.options.debug) {
			console.log("inf: Next page");
		}
		this.page = this.page + 1;
			if(this.page > this.lastPage) {
				return this.reachedLastPage();
			}
		this.showLoading();
		this.ajaxRequestCount = 1;
		this.callBack.loadNextPage(this.page);
	};
	
	/**
	 * Call from AJAX Request in case of success to load results
	 */
	this.nextPageSuccess = function() {
		if(!(this.ajaxRequestCount === 0)) {
			if(this.options.debug) {
				console.log("inf: Page loaded");
			}
			this.ajaxRequestCount = this.ajaxRequestCount - 1;
			this.hidePagination();
			this.doneLoading();
		}
	};
	
	/**
	 * Call from AJAX Request in case of faliure to load results
	 */
	this.nextPageFaliure = function() {
		if(this.options.debug) {
			console.log("inf: Page load failed");
		}
		this.currentFaluire = this.currentFaluire + 1;
		this.ajaxRequestCount = this.ajaxRequestCount - 1;
		this.page = this.page - 1;
		this.doneLoading();
			if(this.options.maxFailure < this.currentFaluire) {
				this.state = -1;
			}
	};
	
	/**
	 * Returns the dimentions of the user window (display) size
	 */
	this.getDisplaySize = function() {
        w = window;
        return {
			width : w.innerWidth || (w.document.documentElement.clientWidth || w.document.body.clientWidth),
			height : w.innerHeight || (w.document.documentElement.clientHeight || w.document.body.clientHeight)
        };
	};
	
	/**
	 * Hide pagination (SEO Fiendly)
	 */
	this.hidePagination = function() {
		if(this.options.debug) {
			console.log("inf: Hide pagination");
		}
		if(this.options.paginationClasses) {
				$(this.options.paginationClasses).each(function (i, v) {
					$(v).hide();
				});
		}
	};
	
	/**
	 * Callback Handlers
	 */
	this.showLoading = function() {
		if(this.options.debug) {
			console.log("inf: Show loading");
		}
		this.state = 1;
		try {
			this.callBack.showLoading();
		} catch(e) {}
	};
	
	this.doneLoading = function() {
		if(this.options.debug) {
			console.log("inf: Done loading");
		}
		this.state = 0;
		try {
			this.callBack.doneLoading();
		} catch(e) {}
	};
	
	this.showButton = function() {
		if(this.options.debug) {
			console.log("inf: Show button");
		}
		this.state = 1;
		try {
			this.callBack.showButton();
		} catch(e) {}
	};
	
	this.reachedLastPage = function() {
		if(this.options.debug) {
			console.log("inf: Reached last page");
		}
		this.state = -1;
		try {
			this.callBack.reachedLastPage();
		} catch(e) {}
	};
	
	/**
	 * Event Handlers
	 */
	this.clickButtonEvent = function() {
		if(this.options.debug) {
			console.log("inf: Button click event");
		}
		this.contentContainer.trigger('inf:loadNextPage');
		return true;
	};
	
			/**
		 * Initialize function
		 */
		/**
		 * Variables and defaults
		 */
		this.page = 1;
		this.state = 0;
		this.ajaxRequestCount=0;
		this.lastPageElm = lastPage || null;
		this.lastPage = parseInt($(lastPage).val() || 1, 10);
		this.contentContainer = $(contentContainer) || null;
		this.currentFaluire = 0;
		
		this.options = $.extend({
				buttonTriggerHeight : 500,
				nextPageTriggerHeight : 1250,
				button : false,
				maxFailure : 2,
				forceButtonPage : 0,
				forceButtonPageRepeat : false,
				paginationClasses : null,
				debug : false
		}, options || {});
		
		console.log(this.options);
		
		this.callBack = $.extend({
			showLoading : null,
			doneLoading : null,
			showButton : null,
			reachedLastPage : null
		}, callBacks || {});
		
		this.callBack.loadNextPage = loadNextPage || null;
		
		if(this.options.debug) {
			console.log("inf: Binding internal functions");
		}
		
		this.nextPage = $.proxy(this.nextPage, this);
		this.nextPageSuccess = $.proxy( this.nextPageSuccess,this);
		this.nextPageFaliure = $.proxy( this.nextPageFaliure,this);
		this.reset = $.proxy( this.reset,this);
		this.clickButtonEvent = $.proxy( this.clickButtonEvent,this);
		this.bindScroll = $.proxy( this.bindScroll,this);
		this.unbindScroll = $.proxy( this.unbindScroll,this);
		this.scrollEvent = $.proxy( this.scrollEvent,this);
		
		/*this.nextPageSuccess = this.nextPageSuccess.bindAsEventListener(this);
		this.nextPageFaliure = this.nextPageFaliure.bindAsEventListener(this);
		this.reset = this.reset.bindAsEventListener(this);
		this.clickButtonEvent = this.clickButtonEvent.bindAsEventListener(this);
		this.bindScroll = this.bindScroll.bindAsEventListener(this);
		this.unbindScroll = this.unbindScroll.bindAsEventListener(this);
		this.scrollEvent = this.scrollEvent.bindAsEventListener(this);*/
		
		console.log(this);
		
		this.bindScroll();
		
		if(this.lastPage === 0) {
			this.reachedLastPage();
		}
		
		this.hidePagination();
		
		/*
		 * Infinite Content Events
		 */
		this.contentContainer.bind('inf:loadNextPage', this.nextPage);
		this.contentContainer.bind('inf:pageSuccess', this.nextPageSuccess);
		this.contentContainer.bind('inf:pageFaliure', this.nextPageFaliure);
		this.contentContainer.bind('inf:reset', this.reset);
		this.contentContainer.bind('inf:buttonClick', this.clickButtonEvent);
		this.contentContainer.bind('inf:start', this.bindScroll);
		this.contentContainer.bind('inf:stop', this.unbindScroll);
};
(function($){
	var win = $(window);  
	$.fn.viewportOffset = function() {
		var off = $(this).offset();
		return {
			top: off.top - win.scrollTop(),
			left: off.left - win.scrollLeft(),
		};
	};  
})(jQuery);