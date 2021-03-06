// js
import {inject,customElement} from 'aurelia-framework';
import Context from '../app/context';
import Misc from '../utils/misc';
import {
    IMAGE_CONFIG_UPDATE, THUMBNAILS_UPDATE,
    EventSubscriber
} from '../events/events';

/**
 * Displays the image thumbnails
 *
 * @extends {EventSubscriber}
 */
@customElement('thumbnail-slider')
@inject(Context, Element)
export default class ThumbnailSlider extends EventSubscriber {
    /**
     * the present dataset id to see if we need to reissue a request
     * @memberof ThumbnailSlider
     * @type {number}
     */
    dataset_id = null;

    /**
     * a list of thumbnails with a url and an id property each
     * @memberof ThumbnailSlider
     * @type {Map}
     */
    thumbnails = new Map();

    /**
     * the default thumbnail length
     * @memberof ThumbnailSlider
     * @type {Array.<Object>}
     */
    thumbnail_length = 80;

    /**
     * our list of events we subscribe to via the EventSubscriber
     * @memberof ThumbnailSlider
     * @type {Map}
     */
    sub_list = [
        [IMAGE_CONFIG_UPDATE,
            (params={}) => this.init(params.dataset_id)],
        [THUMBNAILS_UPDATE,
            (params={}) => this.updateThumbnails(params)]];

    /**
     * @constructor
     * @param {Context} context the application context (injected)
     */
    constructor(context, element) {
        super(context.eventbus)
        this.context = context;
        this.element = element;
    }

    /**
     * Overridden aurelia lifecycle method:
     * called whenever the view is bound within aurelia
     * in other words an 'init' hook that happens before 'attached'
     *
     * @memberof ThumbnailSlider
     */
    bind() {
        this.subscribe();
    }

    /**
     * Overridden aurelia lifecycle method:
     * called whenever the view is unbound within aurelia
     * in other words a 'destruction' hook that happens after 'detached'
     *
     * @memberof ThumbnailSlider
     */
    unbind() {
        this.unsubscribe();
    }

    /**
     * Issues backend request to retrieve thumbnail information
     *
     * @memberof ThumbnailSlider
     * @param {number} dataset_id the dataset id needed for the request
     */
    init(dataset_id) {
        // we don't have a dataset id => hide us
        if (typeof dataset_id !== 'number') {
            this.hideMe();
            return;
        }

        // undo some hiding that might have been done prior
        this.showMe();

        // same id => we don't need to do anything...
        if (dataset_id  === this.dataset_id) return;
        this.dataset_id = dataset_id;

        let url =
            this.context.server +
            "/webgateway/dataset/" + dataset_id + '/children/';

        $.ajax(
            {url : url,
            dataType : "jsonp",
            success : (response) => {
                // we want an array
                if (!Misc.isArray(response)) return;

                // empty what has been there
                this.thumbnails.clear();
                 // traverse results and store them internally
                 response.map((item) => {
                     if (typeof item.thumb_url === "string" &&
                            item.thumb_url.length> 0 &&
                            typeof item.id === "number")
                        this.thumbnails.set(
                            item.id,
                            {url : item.thumb_url + this.thumbnail_length + "/",
                            revision : 0});
                 });
            },
            error : (response) => {
                this.dataset_id = null;
                this.hideMe();
            }
        });
    }

    /**
     * Hides thumbnail slider including resize bar
     *
     * @memberof ThumbnailSlider
     */
    hideMe() {
        $(this.element).hide();
        $('.col-splitter.left-split').css('visibility', 'hidden');
        $('.frame').addClass('left-hand-panel-hidden');
    }

    /**
     * Shows thumbnail slider including resize bar
     *
     * @memberof ThumbnailSlider
     */
    showMe() {
        $(this.element).css('visibility', 'visible');
        $('.col-splitter.left-split').css('visibility', 'visible');
        $('.frame').removeClass('left-hand-panel-hidden');
        let w =  $(this.element).width();
        $('.frame').css('margin-left', '' + (-w-5) + 'px');
        $('.frame').css('padding-left', '' + (w+10) + 'px');
    }

    /**
     * A click handler: sets the image id in the main view
     *
     * @memberof ThumbnailSlider
     * @param {number} image_id the image id for the clicked thumbnail
     */
    onClick(image_id) {
        this.context.addImageConfig(image_id);
    }

    /**
     * Updates one or more thumbnails
     *
     * @memberof ThumbnailSlider
     * @param {Object} params the parameter object received by the event
     */
    updateThumbnails(params = {}) {
        if (typeof params !== 'object' ||
            !Misc.isArray(params.ids)) return;

        params.ids.map((t) => {
            let thumb = this.thumbnails.get(t);
            if (thumb && typeof thumb.revision === 'number')
                thumb.revision++;
        });
    }
}
