/**
 * Annotator module for Rangy, a cross-browser JavaScript range and selection library
 * http://code.google.com/p/rangy/
 *
 * Depends on Rangy core and CssClassApplier.
 *
 * Copyright 2012, Victor Saiz
 * Version: 0.01
 * Build date: 15-08-2012
 */
rangy.createModule("Annotator", function(api, module) {
    api.requireModules( ["CssClassApplier"] );

    var log = window.console;
    var dom = api.dom;
    var contains = dom.arrayContains;

    // Puts annotations in order, last in document first.
    function compareAnnotations(h1, h2) {
        return h2.range.compareBoundaryPoints(h1.range.START_TO_START, h1.range);
    }

    var nextAnnotationId = 1;

    function Annotation(range, cssClassApplier, id) {
        if (id) {
            this.id = id;
            nextAnnotationId = Math.max(nextAnnotationId, id + 1);
        } else {
            this.id = nextAnnotationId++;
        }
        this.range = range;
        this.cssClassApplier = cssClassApplier;
    }

    Annotation.prototype = {
        containsElement: function(el) {
            return this.range.containsNodeContents(el.firstChild);
        },

        toString: function() {
            // return "[Annotation(ID: " + this.id + ", class: " + this.cssClassApplier.cssClass + ", range: " + this.range.inspect() + ")]";
        }
    };

    /*
    - Annotation object with range, class applier and id
    - Serialize range plus class and id
     */

    function Annotator() {
        // CSS class applier must normalize so that it can restore the DOM exactly after removing highlights
        this.cssClassAppliers = {};
        this.annotations = [];
    }

    Annotator.prototype = {
        addCssClassApplier: function(cssClassApplier) {
            this.cssClassAppliers[cssClassApplier.cssClass] = cssClassApplier;
        },

        getAnnotationForElement: function(el) {
            var annotations = this.annotations;
            for (var i = 0, len = annotations.length; i < len; ++i) {
                if (annotations[i].containsElement(el)) {
                    return annotations[i];
                }
            }
            return null;
        },

        annotateRanges: function(ranges, cssClassApplier) {
            // log.info("Current annotations ", this.annotations, "Adding new ranges", ranges);

            var annotations = this.annotations
            ,   cssClassAppliers = this.cssClassAppliers
            ,   originalAnnotations = annotations.slice(0);

            for (var i = 0, len = ranges.length; i < len; ++i) {
                annotations.push( new Annotation(ranges[i], cssClassApplier) );
            }

            annotations.sort(compareAnnotations);

            var annotateRanges = [];
            for (i = 0, len = annotations.length; i < len; ++i) {
                annotateRanges[i] = annotations[i].range;
            }

            var rangeInfos = annotateRanges, range;
            // log.info(rangeInfos);

            // Temporarily restore each highlight range in turn and add the highlight class if not already applied.
            for (i = rangeInfos.length; i-- > 0; ) {
                // range = api.restoreRange(rangeInfos[i]);
                range = rangeInfos[i];
                var applierForRange = cssClassApplier;

                for (var c in cssClassAppliers) {
                    if (cssClassAppliers.hasOwnProperty(c)) {
                        if (cssClassAppliers[c].isAppliedToRange(range)) {
                            applierForRange = cssClassAppliers[c];
                        }
                        cssClassAppliers[c].undoToRange(range);
                    }
                }
                applierForRange.applyToRange(range);
                // rangeInfos[i] = api.saveRanges([range])[0];
                rangeInfos[i] = range;
            }

            // var restoredRanges = api.restoreRanges(rangeInfos)
            var restoredRanges = rangeInfos
            ,   newAnnotations = []
            ,   annotations;

            for (i = 0, len = annotations.length; i < len; ++i) {
                annotation = annotations[i];
                annotation.range = restoredRanges[i];
                if (!contains(originalAnnotations, annotation)) {
                    newAnnotations.push(annotation);
                }
            }

            return newAnnotations;
        },

        removeAnnotations: function(annotations) {
            var ranges = []
            ,   currentAnnotations = this.annotations
            ,   cssClassAppliers = this.cssClassAppliers;

            for (var i = 0, len = annotations.length; i < len; ++i) {
                ranges[i] = annotations[i].range;
            }

            currentAnnotations.sort(compareHighlights);

            var rangeInfos = [], annotateRange;

            for (i = 0; i < currentAnnotations.length; ++i) {
                annotationRange = currentAnnotations[i].range;
                if (contains(ranges, annotationRange)) {
                    for (var c in cssClassAppliers) {
                        if (cssClassAppliers.hasOwnProperty(c)) {
                            cssClassAppliers[c].undoToRange(annotationRange);
                        }
                    }
                    currentAnnotations.splice(i--, 1);
                } else {
                    rangeInfos.push.apply(rangeInfos, api.saveRanges( [annotationRange] ));
                }
            }
            var restoredRanges = api.restoreRanges(rangeInfos);
            for (i = 0; i < currentAnnotations.length; ++i) {
                currentAnnotations[i].range = restoredRanges[i];
            }
        },

        getIntersectingAnnotations: function(ranges) {
            // Test each range against each of the highlighted ranges to see whether they overlap
            var intersectingAnnotations = []
            ,   annotations = this.annotations;

            for (var i = 0, len = ranges.length, selRange, annotationRange; i < len; ++i) {
                selRange = ranges[i];
                for (var j = 0, jLen = annotations.length; j < jLen; ++j) {
                    annotationRange = annotations[j].range;
                    if (selRange.intersectsRange(annotationRange) && !contains(intersectingAnnotations, annotationRange)) {
                        intersectingAnnotations.push(annotations[j]);
                    }
                }
            }
            return intersectingAnnotations;
        },

        annotateSelection: function(cssClass, selection) {
            selection = selection || rangy.getSelection();
            var cssClassApplier = this.cssClassAppliers[cssClass];
            var annotations = this.annotations;
            if (!cssClassApplier) {
                throw new Error("No CSS class applier found for class '" + cssClass + "'");
            }

            var ranges = selection.getAllRanges();
            for (var i = 0, len = ranges.length, annotationRange; i < len; ++i) {
                ranges[i] = ranges[i].cloneRange();

                // Check for intersection with existing annotations. For each intersection, extend the existing highlight
                // to be the union of the highlight range and the selected range
                for (var j = 0; j < annotations.length; ++j) {
                    annotationRange = annotations[j].range;
                    if (ranges[i].intersectsRange(annotationRange)) {
                        ranges[i] = ranges[i].union(annotationRange);
                        annotations.splice(j--, 1);
                    }
                }
            }
            console.log(ranges);

            selection.removeAllRanges();
            return this.annotateRanges(ranges, cssClassApplier);
        },

        deannotateSelection: function(selection) {
            selection = selection || rangy.getSelection();
            var intersectingAnnotations = this.getIntersectingAnnotations(selection.getAllRanges());

            // Now unhighlight all the highlighted ranges that overlap with the selection
            if (intersectingAnnotations.length > 0) {
                this.removeAnnotations(intersectingAnnotations);
                selection.removeAllRanges();
            }
        },

        selectionOverlapsAnnotation: function(selection) {
            selection = selection || rangy.getSelection();
            return this.getIntersectingAnnotations(selection.getAllRanges()).length > 0;
        }

    };

    api.createAnnotator = function(cssClass, tagNames) {
        return new Annotator(cssClass, tagNames);
    };
});
