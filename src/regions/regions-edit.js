// js
import Context from '../app/context';
import Misc from '../utils/misc';
import {Utils} from '../utils/regions';
import {Converters} from '../utils/converters';
import {REGIONS_MODE} from '../utils/constants';
import {
    REGIONS_CHANGE_MODES, REGIONS_SET_PROPERTY,
    REGIONS_GENERATE_SHAPES,REGIONS_MODIFY_SHAPES, REGIONS_COPY_SHAPES
} from '../events/events';
import {inject, customElement, bindable, BindingEngine} from 'aurelia-framework';
import {spectrum} from 'spectrum-colorpicker';

/**
 * Represents the regions section in the right hand panel
 */
@customElement('regions-edit')
@inject(Context, Element, BindingEngine)
export default class RegionsEdit {
    /**
     *a bound reference to regions_info
     * @memberof RegionsEdit
     * @type {RegionsEdit}
     */
    @bindable regions_info = null;

    /**
     * a list of keys we want to listen for
     * @memberof RegionsEdit
     * @type {Object}
     */
    key_actions = [
        { key: 65, func: this.selectAllShapes},                     // ctrl - a
        { key: 67, func: this.copyShapes},                          // ctrl - c
        { key: 86, func: this.pasteShapes}                          // ctrl - v
    ];

    /**
     * @constructor
     * @param {Context} context the application context (injected)
     */
    constructor(context, element, bindingEngine) {
        this.context = context;
        this.element = element;
        this.bindingEngine = bindingEngine;
    }

    /**
     * Overridden aurelia lifecycle method:
     * called whenever the view is bound within aurelia
     * in other words an 'init' hook that happens before 'attached'
     *
     * @memberof RegionsEdit
     */
    bind() {
        this.registerObserver();
    }

    /**
     * Overridden aurelia lifecycle method:
     * called whenever the view is unbound within aurelia
     * in other words a 'destruction' hook that happens after 'detached'
     *
     * @memberof RegionsEdit
     */
    unbind() {
        this.unregisterObserver();
    }

    /**
     * Overridden aurelia lifecycle method:
     * fired when PAL (dom abstraction) is ready for use
     *
     * @memberof RegionsEdit
     */
    attached() {
        // register key listeners
        this.key_actions.map(
            (action) =>
                this.context.addKeyListener(
                    action.key,
                        (event) => {
                            if (!this.context.show_regions ||
                                    !event.ctrlKey) return;
                            action.func.apply(this, action.args);
                        }));

        // set up ui widgets such as color pickers and spinners
        let strokeOptions = this.getColorPickerOptions(false);
        let strokeSpectrum =
            $(this.element).find(".shape-stroke-color .spectrum-input");
        strokeSpectrum.spectrum(strokeOptions);
        let fillOptions = this.getColorPickerOptions(true);
        let fillSpectrum =
            $(this.element).find(".shape-fill-color .spectrum-input");
        fillSpectrum.spectrum(fillOptions);

        let strokeWidthSpinner =
            $(this.element).find(".shape-stroke-width input");
        strokeWidthSpinner.spinner({
            min: 1, max: 10, disabled: true});
        strokeWidthSpinner.spinner("value", 10);

        let editComment = $(this.element).find(".shape-edit-comment input");
        editComment.prop("disabled", true);
        editComment.addClass("disabled-color");
        let fontSizeSpinner =
            $(this.element).find(".shape-font-size input");
        fontSizeSpinner.spinner({
            min: 1, max: 1000, disabled: true});
        fontSizeSpinner.spinner("value", 10);
    }

     /**
      * Handles fill/stroke color changes
      *
      * @param {string} color a color in rgba notation
      * @param {boolean} fill the fill color if true, the stroke color otherwise
      * @param {Object} shape the primary shape that the change was invoked on
      * @memberof RegionsEdit
      */
     onColorChange(color, fill=true, shape=null) {
         if (typeof shape !== 'object' || shape === null) return;
         if (typeof fill !== 'boolean') fill = true;

         let deltaProps = {type: shape.type};
         let properties =
             fill ? ['fillColor', 'fillAlpha'] : ['strokeColor', 'strokeAlpha'];
         let values = Converters.rgbaToHexAndAlpha(color);
         if (!Misc.isArray(values) || values.length !== 2) return;

         for (let i=0;i<properties.length;i++)
             deltaProps[properties[i]] = values[i];

         this.modifyShapes(
             deltaProps, this.createUpdateHandler(properties, values));
     }

    /**
     * Handles stroke width changes
     *
     * @param {number} width the new stroke width
     * @param {Object} shape the primary shape that the change was invoked on
     * @memberof RegionsEdit
     */
    onStrokeWidthChange(width = 10,shape=null) {
        if (typeof shape !== 'object' || shape === null) return;
        if (typeof width !== 'number' || isNaN(width) || width < 1 ||
                width > 10) return;

        let deltaProps = {type: shape.type};
        deltaProps.strokeWidth = width;

        this.modifyShapes(
            deltaProps, this.createUpdateHandler(['strokeWidth'], [width]));
    }

    /**
     * Handles font size changes
     *
     * @param {number} size the new font size
     * @param {Object} shape the primary shape that the change was invoked on
     * @memberof RegionsEdit
     */
    onFontSizeChange(size = 10,shape=null) {
        if (typeof shape !== 'object' || shape === null) return;
        if (typeof size !== 'number' || isNaN(size) || size < 10 ||
                size > 1000) return;

        let deltaProps = {type: shape.type};
        deltaProps.fontStyle =
            typeof shape.fontStyle === 'string' ? shape.fontStyle : 'normal';
        deltaProps.fontFamily =
            typeof shape.fontFamily === 'string' ?
                shape.fontFamily : 'sans-serif';
        deltaProps.fontSize = size;

        this.modifyShapes(
            deltaProps, this.createUpdateHandler(
                ['fontSize', 'fontStyle', 'fontFamily'],
                [size, deltaProps.fontStyle, deltaProps.fontFamily]));
    }

    /**
     * Handles comment changes
     *
     * @param {string} comment the new  text  value
     * @param {Object} shape the primary shape that the change was invoked on
     * @memberof RegionsEdit
     */
    onCommentChange(comment = '',shape=null) {
        if (typeof shape !== 'object' || shape === null) return;
        if (typeof comment !== 'string') return;

        let deltaProps = {type: shape.type};
        deltaProps.textValue = comment;

        this.modifyShapes(
            deltaProps,
            this.createUpdateHandler(['textValue'], [comment]));
    }

    /**
     * Notifies the viewer to change the shaape according to the new shape
     * definition
     *
     * @param {Object} shape_definition the object definition incl. attributes
     *                                  to be changed
     * @param {function} callback a callback function on success
     * @memberof RegionsEdit
     */
    modifyShapes(shape_definition, callback = null) {
        if (typeof shape_definition !== 'object' ||
                shape_definition === null) return;

        this.context.publish(
           REGIONS_MODIFY_SHAPES, {
               config_id: this.regions_info.image_info.config_id,
               shapes : this.regions_info.selected_shapes,
               definition: shape_definition,
                callback: callback});
    }

    /**
     * Registers an observer to watch the selected shapes
     * to adjust the fill and line color options
     *
     * @memberof RegionsEdit
     */
    registerObserver() {
        this.unregisterObserver();
        this.observer =
            this.bindingEngine.collectionObserver(
                this.regions_info.selected_shapes)
                    .subscribe(
                        (newValue, oldValue) =>
                            this.adjustEditWidgets());
    }

    /**
     * Unregisters the selected shapes observer
     *
     * @memberof RegionsEdit
     */
    unregisterObserver() {
        if (this.observer) {
            this.observer.dispose();
            this.observer = null;
        }
    }

    /**
     * Selects all shapes
     *
     * @memberof RegionsEdit
     */
    selectAllShapes() {
        let ids = this.regions_info.unsophisticatedShapeFilter();
        this.context.publish(
           REGIONS_SET_PROPERTY, {
               config_id: this.regions_info.image_info.config_id,
               property: 'selected',
               shapes : ids, clear: true,
               value : true, center : false});
    }

    /**
     * Overridden aurelia lifecycle method:
     * called when the view and its elemetns are detached from the PAL
     * (dom abstraction)
     *
     * @memberof RegionsEdit
     */
    detached() {
        this.key_actions.map(
            (action) => this.context.removeKeyListener(action.key));
         $(this.element).find(".spectrum-input").spectrum("destroy");
         $(this.element).find(".shape-stroke-width input").spinner("destroy");
    }

    /**
     * Gets the last item in the selected_shapes array or null if empty
     *
     * @return {Object|null} the last shape in the selected array or null
     * @private
     * @memberof RegionsEdit
     */
    getLastSelected() {
        let lastId =
            this.regions_info.selected_shapes.length === 0 ?
                -1 :
                this.regions_info.selected_shapes.length-1;
        let lastSelection =
            lastId === -1 ? null :
            this.regions_info.data.get(
                this.regions_info.selected_shapes[lastId]);

        return lastSelection;
    }

    /**
     * Reacts to shape selections, adjusting the edit widgets accordingly
     *
     * @memberof RegionsEdit
     */
    adjustEditWidgets() {
        let lastSelection = this.getLastSelected();
        let type =
            lastSelection ? lastSelection.type.toLowerCase() : null;

        // COMMENT
        let editComment = $(this.element).find(".shape-edit-comment input");
        editComment.off('input');
        editComment.prop("disabled", true);
        editComment.addClass("disabled-color");
        editComment.val('Comment');
        if (lastSelection) {
            editComment.prop("disabled", false);
            editComment.removeClass("disabled-color");
            editComment.val(
                typeof lastSelection.textValue === 'string' ?
                    lastSelection.textValue : '');
            editComment.on('input',
                (event) =>
                    this.onCommentChange(event.target.value, lastSelection));
        }
        let fontSize =
            lastSelection ?
                (typeof lastSelection.fontSize === 'number' ?
                lastSelection.fontSize : 10) : 10;
        let fontSizeSpinner = $(this.element).find(".shape-font-size input");
        fontSizeSpinner.off("input spinstop");
        fontSizeSpinner.spinner("value", fontSize);
        fontSizeSpinner.spinner("disable");
        if (lastSelection) {
            fontSizeSpinner.spinner("enable");
            fontSizeSpinner.on("input spinstop",
               (event, ui) => this.onFontSizeChange(
                   parseInt(event.target.value), lastSelection));
        } else fontSizeSpinner.spinner("disable");

        // STROKE COLOR & WIDTH
        let strokeOptions =
            this.getColorPickerOptions(false, lastSelection);
        let strokeSpectrum =
            $(this.element).find(".shape-stroke-color .spectrum-input");
        let strokeWidthSpinner =
            $(this.element).find(".shape-stroke-width input");
        let strokeColor =
            lastSelection ?
                lastSelection.strokeColor : '#FFFFFF';
        let strokeAlpha =
            lastSelection ?
                lastSelection.strokeAlpha : 0;
        let strokeWidth =
            lastSelection ?
                (typeof lastSelection.strokeWidth === 'number' ?
                    lastSelection.strokeWidth : 10) : 10;
        strokeOptions.color =
            Converters.hexColorToRgba(strokeColor, strokeAlpha);
        strokeSpectrum.spectrum(strokeOptions);
        // STROKE width
        strokeWidthSpinner.off("input spinstop");
        strokeWidthSpinner.spinner("value", strokeWidth);
        if (lastSelection) {
            strokeSpectrum.spectrum("enable");
            strokeWidthSpinner.spinner("enable");
            strokeWidthSpinner.on("input spinstop",
               (event, ui) => this.onStrokeWidthChange(
                   parseInt(event.target.value), lastSelection));
        } else strokeWidthSpinner.spinner("disable");

        // ARROW
        let arrowButton = $(this.element).find(".arrow-button button");
        if (type && type.indexOf('line') >= 0) {
            arrowButton.prop('disabled', false);
            arrowButton.removeClass('disabled-color');
        } else {
            arrowButton.prop('disabled', true);
            arrowButton.addClass('disabled-color');
        }

        // FILL COLOR
        let fillOptions = this.getColorPickerOptions(true, lastSelection);
        let fillSpectrum =
            $(this.element).find(".shape-fill-color .spectrum-input");
        // set fill (if not disabled)
        let fillDisabled = type === null ||
                type === 'line' || type === 'polyline' || type === 'label';
        if (fillDisabled) {
            fillSpectrum.spectrum(fillOptions);
            return;
        }
        let fillColor =
            lastSelection ?
                lastSelection.fillColor : '#FFFFFF';
        let fillAlpha =
            lastSelection ?
                lastSelection.fillAlpha : 1.0;
        fillOptions.color = Converters.hexColorToRgba(fillColor, fillAlpha);
        fillSpectrum.spectrum(fillOptions);
        fillSpectrum.spectrum("enable");
    }

    /**
     * Gets the appropriate color picker options for the given needs
     *
     * @memberof RegionsEdit
     * @param {boolean} fill true if we want fill color options, otherwise stroke
     * @param {Object} shape the last selection to be used for the change handler
     * @private
     */
    getColorPickerOptions(fill=true, shape=null) {
        let options =  {
            disabled: true,
            color: 'rgba(255,255,255,0)',
            showInput: true,
            showAlpha: true,
            showInitial: true,
            preferredFormat: "rgb",
            containerClassName: 'color-spectrum-container',
            replacerClassName:
                fill ? 'shape-fill-color-replacer' :
                        'shape-stroke-color-replacer',
            appendTo: fill ?
                $(this.element).find('.shape-fill-color') :
                $(this.element).find('.shape-stroke-color')
        };
        if (shape)
            options.change =
                (color) => this.onColorChange(color.toRgbString(), fill, shape);

        return options;
    }

    /**
     * Sets edit mode to either modify or translate
     *
     * @memberof RegionsEdit
     */
    setEditMode(modify=false) {
        let mode = [REGIONS_MODE.TRANSLATE];
        if (typeof modify === 'boolean' && modify) mode = [REGIONS_MODE.MODIFY];

        this.context.publish(
            REGIONS_CHANGE_MODES, {
                config_id : this.regions_info.image_info.config_id,
                modes : mode});
    }

    /**
     * Toggles if line has an arrow
     *
     * @param {boolean} head if true we append arrow at head, otherwise tail
     * @memberof RegionsEdit
     */
    toggleArrow(head=true) {
        if (typeof head !== 'boolean') head = true;

        let lastSelection = this.getLastSelected();
        if (lastSelection === null) return;

        let deltaProps = {type: 'polyline'};

        let property = head ? 'markerStart' : 'markerEnd';
        let hasArrowMarker =
            typeof lastSelection[property] === 'string' &&
                lastSelection[property] === 'Arrow';

        let value = hasArrowMarker ? "" : "Arrow";
        deltaProps[property] = value;

        this.modifyShapes(
            deltaProps, this.createUpdateHandler([property], [value]));
    }

    /**
     * Creates a more custom update handler than the standard one
     *
     * @return {function} the wrapped standard update handler
     * @memberof RegionsEdit
     */
    createUpdateHandler(properties, values) {
        let func =
            Utils.createUpdateHandler(
                properties,values,
                this.regions_info.history,
                this.regions_info.history.getHistoryId(),
                this.adjustEditWidgets.bind(this));
        return func;
    }

    /**
     * Copy Shapes
     *
     * @memberof RegionsEdit
     */
    copyShapes() {
        this.context.publish(
            REGIONS_COPY_SHAPES,
            {config_id : this.regions_info.image_info.config_id});
   }

    /**
     * Paste Shapes
     *
     * @memberof RegionsEdit
     */
    pasteShapes() {
        let hist_id = this.regions_info.history.getHistoryId();
        this.context.publish(
            REGIONS_GENERATE_SHAPES,
            {config_id : this.regions_info.image_info.config_id,
                shapes : this.regions_info.copied_shapes,
                number : 1, random : true, hist_id : hist_id,
                propagated: true});
    }
}
