// js
import Context from '../app/context';
import Misc from '../utils/misc';
import {inject, customElement, bindable} from 'aurelia-framework';
import { REGIONS_SET_PROPERTY} from '../events/events';

/**
 * Represents the regions section in the right hand panel
 */
@customElement('regions')
@inject(Context, Element)
export default class Regions {
    /**
     * which image config do we belong to (bound in template)
     * @memberof Regions
     * @type {number}
     */
    @bindable config_id = null;

    /**
     * a reference to the image config
     * @memberof Regions
     * @type {RegionsInfo}
     */
    regions_info = null;

    /**
     * @constructor
     * @param {Context} context the application context (injected)
     */
    constructor(context, element) {
        this.context = context;
        this.element = element;
    }

    /**
     * Overridden aurelia lifecycle method:
     * fired when PAL (dom abstraction) is ready for use
     *
     * @memberof Regions
     */
    attached() {
        $(".regions-table").on("scroll", (e) => {
                $('.regions-header').css(
                    "margin-left", "-" +
                     e.currentTarget.scrollLeft + "px");
        });
    }

    /**
     * Overridden aurelia lifecycle method:
     * called when the view and its elemetns are detached from the PAL
     * (dom abstraction)
     *
     * @memberof Regions
     */
    detached() {
        $(".regions-table").off("scroll");
    }

    /**
     * Overridden aurelia lifecycle method:
     * called whenever the view is bound within aurelia
     * in other words an 'init' hook that happens before 'attached'
     *
     * @memberof Regions
     */
    bind() {
        let img_conf = this.context.getImageConfig(this.config_id);
        if (img_conf && img_conf.regions_info)
            this.regions_info = img_conf.regions_info;

    }

    /**
     * Overridden aurelia lifecycle method:
     * called whenever the view is unbound within aurelia
     * in other words a 'destruction' hook that happens after 'detached'
     *
     * @memberof Regions
     */
    unbind() {
        this.regions_info = null;
    }

    /**
     * Select shapes handler
     *
     * @param {number} id the shape id
     * @param {boolean} selected the selected state
     * @memberof Regions
     */
    selectShape(id, selected, target) {
        let t = $(target);
        if (t.hasClass("shape-show") || t.parent().hasClass("shape-show"))
            return true;

        this.context.publish(
           REGIONS_SET_PROPERTY, {
               config_id: this.regions_info.image_info.config_id,
               property: 'selected', shapes : [id], value : selected,
               center : true});
    }

    /**
     * shape visibility toggler
     *
     * @param {number} id the shape id
     * @param {boolean} visible the visible state
     * @memberof Regions
     */
    toggleShapeVisibility(id, visible) {
        this.context.publish(
           REGIONS_SET_PROPERTY, {
               config_id: this.regions_info.image_info.config_id,
               property : "visible",
               shapes : [id], value : visible});
    }
}
