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
var InfiniteContent = Class.create({
	/**
	 * Initialize function
	 */
	initialize : function(contentContainer, lastPage, loadNextPage, options, callBacks){
		/**
		 * Variables and defaults
		 */
		this.page = 1;
		this.state = 0;
		this.ajaxRequestCount=0;
		this.lastPageElm = lastPage || null;
		this.lastPage = parseInt($(lastPage).value || 1, 10);
		this.contentContainer = $(contentContainer) || null;
		this.currentFaluire = 0;
		
		this.options = Object.extend({
				buttonTriggerHeight : 500,
				nextPageTriggerHeight : 1250,
				button : false,
				maxFailure : 2,
				forceButtonPage : 0,
				forceButtonPageRepeat : false,
				paginationClasses : null,
				debug : false
		}, options || {});
		
		this.callBack = Object.extend({
			showLoading : null,
			doneLoading : null,
			showButton : null,
			reachedLastPage : null
		}, callBacks || {});
		
		this.callBack.loadNextPage = loadNextPage || null;
		
		if(this.options.debug) {
			console.log("inf: Binding internal functions");
		}
		
		this.nextPage = this.nextPage.bindAsEventListener(this);
		this.nextPageSuccess = this.nextPageSuccess.bindAsEventListener(this);
		this.nextPageFaliure = this.nextPageFaliure.bindAsEventListener(this);
		this.reset = this.reset.bindAsEventListener(this);
		this.clickButtonEvent = this.clickButtonEvent.bindAsEventListener(this);
		this.bindScroll = this.bindScroll.bindAsEventListener(this);
		this.unbindScroll = this.unbindScroll.bindAsEventListener(this);
		this.scrollEvent = this.scrollEvent.bindAsEventListener(this);
		
		this.bindScroll();
		
		if(this.lastPage === 0) {
			this.reachedLastPage();
		}
		
		this.hidePagination();
		
		/*
		 * Infinite Content Events
		 */
		Event.observe(this.contentContainer, 'inf:loadNextPage', this.nextPage);
		Event.observe(this.contentContainer, 'inf:pageSuccess', this.nextPageSuccess);
		Event.observe(this.contentContainer, 'inf:pageFaliure', this.nextPageFaliure);
		Event.observe(this.contentContainer, 'inf:reset', this.reset);
		Event.observe(this.contentContainer, 'inf:buttonClick', this.clickButtonEvent);
		Event.observe(this.contentContainer, 'inf:start', this.bindScroll);
		Event.observe(this.contentContainer, 'inf:stop', this.unbindScroll);
	},
	/**
	 * Start observing scroll and resize
	 */
	bindScroll : function(){
		if(this.options.debug) {
			console.log("inf: Binding window scroll and resize");
		}
		Event.observe(window, 'scroll', this.scrollEvent);
		Event.observe(window, 'resize', this.scrollEvent);
	},
	/**
	 * Stop observing scroll and resize
	 */
	unbindScroll : function(){
		if(this.options.debug) {
			console.log("inf: ");
		}
		Event.stopObserving(window, 'scroll', this.scrollEvent);
		Event.stopObserving(window, 'resize', this.scrollEvent);
	},
	/**
	 * Reset scroll state (used when new result set is loaded via AJAX)
	 */
	reset : function(){
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
	},
	/**
	 * Handler for scrolling event on the window
	 */
	scrollEvent : function(){
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
			try {
				remaining = (this.contentContainer.viewportOffset()[1] + this.contentContainer.getHeight()) - size.height;
			} catch(e) {
				remaining = size.height;
			}
			if(this.options.button && this.ajaxRequestCount === 0 && remaining < this.options.buttonTriggerHeight) {
				if(this.options.debug) {
					console.log("inf: Trigger show button");
				}
				return this.showButton();
			}else if(remaining < this.options.nextPageTriggerHeight && this.ajaxRequestCount < 1){
				if(this.options.debug) {
					console.log("inf: Trigger next page");
				}
				this.contentContainer.fire('inf:loadNextPage');
				return;
			}
		}
	},
	/**
	 * Loads the next page by calling the loadNextPage callback function
	 */
	nextPage : function() {
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
	},
	/**
	 * Call from AJAX Request in case of success to load results
	 */
	nextPageSuccess : function() {
		if(!(this.ajaxRequestCount === 0)) {
			if(this.options.debug) {
				console.log("inf: Page loaded");
			}
			this.ajaxRequestCount = this.ajaxRequestCount - 1;
			this.hidePagination();
			this.doneLoading();
		}
	},
	/**
	 * Call from AJAX Request in case of faliure to load results
	 */
	nextPageFaliure : function() {
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
	},
	/**
	 * Returns the dimentions of the user window (display) size
	 */
	getDisplaySize : function() {
        w = window;
        return {
			width : w.innerWidth || (w.document.documentElement.clientWidth || w.document.body.clientWidth),
			height : w.innerHeight || (w.document.documentElement.clientHeight || w.document.body.clientHeight)
        };
	},
	/**
	 * Hide pagination (SEO Fiendly)
	 */
	hidePagination : function() {
		if(this.options.debug) {
			console.log("inf: Hide pagination");
		}
		if(this.options.paginationClasses) {
				$A(this.options.paginationClasses).each(function (v) {
					$$(v).invoke('hide');
				});
		}
	},
	/**
	 * Callback Handlers
	 */
	showLoading : function() {
		if(this.options.debug) {
			console.log("inf: Show loading");
		}
		this.state = 1;
		try {
			this.callBack.showLoading();
		} catch(e) {}
	},
	doneLoading : function() {
		if(this.options.debug) {
			console.log("inf: Done loading");
		}
		this.state = 0;
		try {
			this.callBack.doneLoading();
		} catch(e) {}
	},
	showButton : function() {
		if(this.options.debug) {
			console.log("inf: Show button");
		}
		this.state = 1;
		try {
			this.callBack.showButton();
		} catch(e) {}
	},
	reachedLastPage : function() {
		if(this.options.debug) {
			console.log("inf: Reached last page");
		}
		this.state = -1;
		try {
			this.callBack.reachedLastPage();
		} catch(e) {}
	},
	/**
	 * Event Handlers
	 */
	clickButtonEvent : function() {
		if(this.options.debug) {
			console.log("inf: Button click event");
		}
		this.contentContainer.fire('inf:loadNextPage');
		return true;
	}
});