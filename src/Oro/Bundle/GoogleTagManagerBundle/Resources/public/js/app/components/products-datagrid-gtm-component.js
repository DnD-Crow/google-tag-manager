define(function(require) {
    'use strict';

    const mediator = require('oroui/js/mediator');
    const BaseComponent = require('oroui/js/app/components/base/component');
    const $ = require('jquery');
    const _ = require('underscore');
    const productDetailsGtmHelper = require('orogoogletagmanager/js/app/product-details-gtm-helper');
    const localeSettings = require('orolocale/js/locale-settings');

    /**
     * Handles clicks on products datagrid to invoke GTM productClick events.
     */
    const ProductsDatagridGtmComponent = BaseComponent.extend({
        relatedSiblingComponents: {
            // The option must be overridden in 'data-page-component-options' with the name of the related instance
            // of products datagrid component.
            productsDatagridComponent: 'frontend-product-search-grid'
        },

        /**
         * @property {Object}
         */
        options: _.extend({}, BaseComponent.prototype.options, {
            productSelector: '.grid-row.product-item',
            batchSize: 30,
            listName: ''
        }),

        /**
         * @property {Boolean}
         */
        _gtmReady: false,

        /**
         * @property {jQuery.Element}
         */
        $datagridEl: null,

        /**
         * @inheritdoc
         */
        constructor: function ProductsDatagridGtmComponent(options) {
            ProductsDatagridGtmComponent.__super__.constructor.call(this, options);
        },

        /**
         * @inheritdoc
         */
        initialize: function(options) {
            ProductsDatagridGtmComponent.__super__.initialize.call(this, options);

            if (!this.productsDatagridComponent) {
                throw new Error('Sibling component `productsDatagridComponent` is required.');
            }

            this.options = _.defaults(options || {}, this.options);

            this.$datagridEl = this.productsDatagridComponent.$el;

            mediator.once('page:afterChange', this._onView.bind(this));
        },

        /**
         * @inheritdoc
         */
        delegateListeners: function() {
            ProductsDatagridGtmComponent.__super__.delegateListeners.call(this);

            mediator.once('gtm:data-layer-manager:ready', this._onGtmReady, this);

            // Both click and mouseup needed to be able to track both left and middle buttons clicks.
            this.$datagridEl.on('click mouseup', this.options.productSelector + ' a', this._onClick.bind(this));

            this.listenTo(this.productsDatagridComponent.grid, 'content:update', this._onView.bind(this));
        },

        /**
         * @private
         */
        _onView: function() {
            const productsDetails = [];
            const listName = this._getListName();

            this.$datagridEl.find(this.options.productSelector).each((function(i, product) {
                const details = this._getProductDetails(product);
                if (details) {
                    productsDetails.push(_.extend(details, {list: listName}));
                }
            }).bind(this));

            _.each(this._chunk(productsDetails, this.options.batchSize), function(productsDetailsChunk) {
                mediator.trigger(
                    'gtm:event:productImpressions',
                    productsDetailsChunk,
                    localeSettings.getCurrency()
                );
            });
        },

        _onGtmReady: function() {
            this._gtmReady = true;
        },

        /**
         * @param {jQuery.Event} event
         * @private
         */
        _onClick: function(event) {
            if (!event || event.isDefaultPrevented()) {
                return;
            }

            if (event.type === 'mouseup' && event.which !== 2) {
                // Skips when mouseup triggered for the left mouse button, as it will be fired by click afterwards.
                return;
            }

            // Skips links without new url ("javascript:void(null)", "#" and equal)
            const link = event.currentTarget;
            if (link.protocol !== window.location.protocol ||
                (link.pathname === window.location.pathname && link.search === window.location.search)
            ) {
                return;
            }

            const product = $(event.currentTarget).parents(this.options.productSelector)[0];
            const productDetails = this._getProductDetails(product);
            if (!productDetails) {
                return;
            }

            let destinationUrl = link.href;
            if (event.which === 2 || event.altKey || event.shiftKey || event.metaKey) {
                destinationUrl = null;
            } else if (this._gtmReady) {
                // Prevent going by the link destination URL. We will get there in GTM eventCallback.
                event.preventDefault();
            }

            mediator.trigger('gtm:event:productClick', [productDetails], destinationUrl, this._getListName());
        },

        /**
         * @param {HTMLElement} product
         * @returns {Object|undefined}
         * @private
         */
        _getProductDetails: function(product) {
            const details = productDetailsGtmHelper.getDetails(product);
            if (!details) {
                return undefined;
            }

            return _.extend({}, details, {
                position: this._getPosition(product),
                viewMode: this.productsDatagridComponent.themeOptions.currentRowView || 'default'
            });
        },

        /**
         * @param {HTMLElement} product
         * @returns {Number}
         * @private
         */
        _getPosition: function(product) {
            return $(this.$datagridEl).find(this.options.productSelector).index(product);
        },

        /**
         * @returns {String} List name
         * @private
         */
        _getListName: function() {
            return this.options.listName;
        },

        /**
         * Chunks an array into multiple arrays, each containing size or fewer items.
         *
         * @param {Array} array
         * @param {Number} size
         * @returns {Array}
         * @private
         */
        _chunk: function(array, size) {
            return array.reduce(function(res, item, index) {
                if (index % size === 0) {
                    res.push([]);
                }
                res[res.length - 1].push(item);

                return res;
            }, []);
        },

        /**
         * @inheritdoc
         */
        dispose: function() {
            if (this.disposed) {
                return;
            }

            mediator.off('gtm:data-layer-manager:ready', this._onGtmReady, this);

            this.$datagridEl.off('click mouseup', this.options.productSelector, this._onClick.bind(this));

            ProductsDatagridGtmComponent.__super__.dispose.call(this);
        }
    });

    return ProductsDatagridGtmComponent;
});
