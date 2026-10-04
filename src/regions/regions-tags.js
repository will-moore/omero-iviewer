import Context from '../app/context';
import {inject, customElement, bindable} from 'aurelia-framework';
import {REGIONS_SHOW_TAGS, EventSubscriber} from '../events/events';

/**
 * A small, initially hidden, draggable popup for ROI tags
 * @extends {EventSubscriber}
 */
@customElement('regions-tags')
@inject(Context)
export default class RegionsTags extends EventSubscriber {
    /**
     * a bound reference to regions_info
     * @type {RegionsInfo}
     */
    @bindable regions_info = null;

    /** whether the popup is visible */
    visible = false;

    /** popup position in px (viewport coordinates) */
    left = 100;
    top = 100;

    /** @type {Array.<string,function>} */
    sub_list = [
        [REGIONS_SHOW_TAGS, () => this.show()],
    ];

    /**
     * @param {Context} context the application context (injected)
     */
    constructor(context) {
        super(context.eventbus);
        this.context = context;
        this.onDragMove = this.onDragMove.bind(this);
        this.onDragEnd = this.onDragEnd.bind(this);
    }

    bind() {
        this.subscribe();
    }

    unbind() {
        this.unsubscribe();
        this.onDragEnd();
    }

    show() {
        this.visible = true;
    }

    hide() {
        this.visible = false;
    }

    /**
     * Starts dragging when the title bar is pressed
     * @param {MouseEvent} event
     */
    onDragStart(event) {
        if (event.button !== 0) return true;
        this.dragOffsetX = event.clientX - this.left;
        this.dragOffsetY = event.clientY - this.top;
        document.addEventListener('mousemove', this.onDragMove);
        document.addEventListener('mouseup', this.onDragEnd);
        event.preventDefault();
        return false;
    }

    onDragMove(event) {
        const maxLeft = Math.max(0, window.innerWidth - 40);
        const maxTop = Math.max(0, window.innerHeight - 30);
        this.left = Math.min(Math.max(0, event.clientX - this.dragOffsetX), maxLeft);
        this.top = Math.min(Math.max(0, event.clientY - this.dragOffsetY), maxTop);
    }

    onDragEnd() {
        document.removeEventListener('mousemove', this.onDragMove);
        document.removeEventListener('mouseup', this.onDragEnd);
    }
}
