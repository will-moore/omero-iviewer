import Context from '../app/context';
import {inject, customElement, bindable} from 'aurelia-framework';
import {REGIONS_SHOW_TAGS, LINK_TAG, EventSubscriber} from '../events/events';
import {WEBCLIENT} from '../utils/constants';
import {sendRequest} from '../viewers/viewer/utils/Net';

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

    /** @type {Array.<{id: number, value: string}>} */
    tags = [];
    tags_loaded = false;

    /** @type {Array.<{id: number, value: string}>} */
    selected_tags = [];

    /** which tab is currently showing: 'all' or 'selected' */
    active_tab = 'all';

    /** popup position in px (viewport coordinates) */
    left = window.innerWidth - 350;
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
        this.loadTags();
    }

    loadTags() {
        this.tags_loaded = false;
        sendRequest({
            server: this.context.server,
            uri: this.context.getPrefixedURI(WEBCLIENT) +
                '/api/tags/?orphaned=true&experimenter_id=-1',
            method: 'GET',
            success: (rsp) => {
                let json = typeof rsp === 'string' ? JSON.parse(rsp) : rsp;
                this.tags = this.parseTags(json);
                this.tags_loaded = true;
            },
            error: () => {
                this.tags = [];
                this.tags_loaded = true;
            }
        });
    }

    parseTags(json) {
        return (json.tags || []).map(
            (t) => ({
                id: t['id'],
                value: t['value'],
                tagset: t['set'],
                expanded: false,
                children: []
            })).sort((a, b) => a.value.localeCompare(b.value));
    }

    /**
     * Expands/collapses a tagset, loading its child tags on first expansion
     * @param {Object} tagset the tagset
     */
    toggleTagset(tagset, callback) {
        console.log('toggleTagset', tagset);
        tagset.expanded = !tagset.expanded;
        if (!tagset.expanded || tagset.children_loaded) return;
        sendRequest({
            server: this.context.server,
            uri: this.context.getPrefixedURI(WEBCLIENT) +
                '/api/tags/?id=' + tagset.id,
            method: 'GET',
            success: (rsp) => {
                let json = typeof rsp === 'string' ? JSON.parse(rsp) : rsp;
                tagset.children = this.parseTags(json);
                tagset.children_loaded = true;
                if (callback) callback();
            },
            error: () => {
                tagset.children = [];
                if (callback) callback();
            }
        });
    }

    /**
     * @param {{id: number, value: string}} tag the double-clicked tag
     */
    linkTag(tag) {
        // We don't link tagsets, only individual tags
        if (tag.tagset) return;
        this.context.publish(LINK_TAG, {tag_id: tag.id});
    }

    /**
     * Switches between the 'all' and 'selected' tabs
     * @param {string} tab the tab to switch to
     */
    selectTab(tab) {
        this.active_tab = tab;
    }

    /**
     * Adds a tag to the selected_tags list (if not already present)
     * @param {{id: number, value: string}} tag the tag to select
     */
    selectTag(tag) {
        // If a tagset is passed, we instead select all child tags
        if (tag.tagset) {
            let addChildren = (children) => {
                children.forEach((child) => {
                    if (!this.selected_tags.some((t) => t.id === child.id)) {
                        this.selected_tags.push(child);
                    }
                });
            };
            // If children are not loaded yet, they should be loaded first
            if (!tag.children_loaded) {
                this.toggleTagset(tag, () => {
                    addChildren(tag.children);
                });
            } else {
                addChildren(tag.children);
            }
        } else {
            if (this.selected_tags.some((t) => t.id === tag.id)) return;
            this.selected_tags.push(tag);
        }
    }

    /**
     * Removes a tag from the selected_tags list
     * @param {{id: number, value: string}} tag the tag to deselect
     */
    deselectTag(tag) {
        this.selected_tags = this.selected_tags.filter((t) => t.id !== tag.id);
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
