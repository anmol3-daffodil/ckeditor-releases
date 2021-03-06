/**
 * @license Copyright (c) CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.html or http://ckeditor.com/license
 */

CKEDITOR.plugins.add("wordcount", {
    lang: "en", // %REMOVE_LINE_CORE%
    version: 1.15,
    requires: 'htmlwriter,notification,undo',
    onLoad: function(editor) {
        CKEDITOR.document.appendStyleSheet(this.path + "css/wordcount.css");
    },
    init: function (editor) {
        var defaultFormat = "",
            intervalId,
            lastWordCount = -1,
            lastCharCount = -1,
            limitReachedNotified = false,
            limitRestoredNotified = false,
            snapShot = editor.getSnapshot();


        var dispatchEvent = function (type, currentLength, maxLength) {
            if (typeof document.dispatchEvent == 'undefined') {
                return;
            }

            type = 'ckeditor.wordcount.' + type;

            var cEvent;
            var eventInitDict = {
                bubbles: false,
                cancelable: true,
                detail: {
                    currentLength: currentLength,
                    maxLength: maxLength
                }
            };

            try {
                cEvent = new CustomEvent(type, eventInitDict);
            } catch (o_O) {
                cEvent = document.createEvent('CustomEvent');
                cEvent.initCustomEvent(
                    type,
                    eventInitDict.bubbles,
                    eventInitDict.cancelable,
                    eventInitDict.detail
                );
            }

            document.dispatchEvent(cEvent);
        };

        // Default Config
        var defaultConfig = {
            showParagraphs: true,
            showWordCount: true,
            showCharCount: false,
            showInches: false,
            charactersPerInch: 225,
            countSpacesAsChars: false,
            countHTML: false,
            hardLimit: true,

            //MAXLENGTH Properties
            maxWordCount: -1,
            maxCharCount: -1,

            //SEO Check Flag
            enableSEOCheck: false,

            // Filter
            filter: null,

            //DisAllowed functions
            wordCountGreaterThanMaxLengthEvent: function (currentLength, maxLength) {
                dispatchEvent('wordCountGreaterThanMaxLengthEvent', currentLength, maxLength);
            },
            charCountGreaterThanMaxLengthEvent: function (currentLength, maxLength) {
                dispatchEvent('charCountGreaterThanMaxLengthEvent', currentLength, maxLength);
            },

            //Allowed Functions
            wordCountLessThanMaxLengthEvent: function (currentLength, maxLength) {
                dispatchEvent('wordCountLessThanMaxLengthEvent', currentLength, maxLength);
            },
            charCountLessThanMaxLengthEvent: function (currentLength, maxLength) {
                dispatchEvent('charCountLessThanMaxLengthEvent', currentLength, maxLength);
            }
        };

        // Get Config & Lang
        var config = CKEDITOR.tools.extend(defaultConfig, editor.config.wordcount || {}, true);

        if (config.showParagraphs) {
            defaultFormat += editor.lang.wordcount.Paragraphs + " %paragraphs%";
        }

        if (config.showParagraphs && (config.showWordCount || config.showCharCount)) {
            defaultFormat += ", ";
        }

        if (config.showWordCount) {
            defaultFormat += editor.lang.wordcount.WordCount + " %wordCount%";
            if (config.maxWordCount > -1) {
                defaultFormat += "/" + config.maxWordCount;
            }
        }

        if (config.showCharCount && config.showWordCount) {
            defaultFormat += ", ";
        }

        if (config.showCharCount) {
            var charLabel = editor.lang.wordcount[config.countHTML ? "CharCountWithHTML" : "CharCount"];

            defaultFormat += charLabel + " %charCount%";
            if (config.maxCharCount > -1) {
                defaultFormat += "/" + config.maxCharCount;
            }
        }

        if ((config.showCharCount || config.showWordCount) && config.showInches) {
            defaultFormat += ", ";
        }

        if (config.showInches) {
            defaultFormat += editor.lang.wordcount.Inches + " %inches%";
        }

        var format = defaultFormat;

        function counterId(editorInstance) {
            return "cke_wordcount_" + editorInstance.name;
        }

        function counterElement(editorInstance) {
            return document.getElementById(counterId(editorInstance));
        }

        function strip(html) {
            var tmp = document.createElement("div");

            // Add filter before strip
            html = filter(html);

            tmp.innerHTML = html;

            // START: Presto edge-case
            var divs = tmp.querySelectorAll('[assetid]');
            divs.forEach(function(assetCard) {
                if (assetCard.className) {
                    assetCard.remove();
                }
            });

            var markAsNotesTexts = tmp.querySelectorAll('.notes');

            markAsNotesTexts.forEach(function(note) {
                note.remove();
            });

            var markAsExcludeFromNewsGate = tmp.querySelectorAll('.exclude-from-newsgate');

            markAsExcludeFromNewsGate.forEach(function(note) {
                note.remove();
            });
            var tagsExcludedFromWordCount = tmp.querySelectorAll('.exclude-from-wordcount');

            tagsExcludedFromWordCount.forEach(function(tag) {
                tag.remove();
            });
            // END: Presto edge-case

            if (tmp.textContent == "" && typeof tmp.innerText == "undefined") {
                return "";
            }

            return tmp.textContent || tmp.innerText;
        }

        /**
         * Implement filter to add or remove before counting
         * @param html
         * @returns string
         */
        function filter(html) {
            if(config.filter instanceof CKEDITOR.htmlParser.filter) {
                var fragment = CKEDITOR.htmlParser.fragment.fromHtml(html),
                    writer = new CKEDITOR.htmlParser.basicWriter();
                config.filter.applyTo( fragment );
                fragment.writeHtml( writer );
                return writer.getHtml();
            }
            return html;
        }

        function doSEOCheck(text) {
            removeClass(document.querySelectorAll('.exclude-from-newsgate'), -1);
            removeClass(document.querySelectorAll('.assetcard'), -1);
            var seoWordCount = 0;
            var assetCartCount = 0;
            var relatedLinkCount = 0;

            while (seoWordCount < 100 && text != null) {
                var seoObjectInfo = getSEOObjectInfo(text);
                if (seoObjectInfo) {
                    text = seoObjectInfo.remainingBody;
                    var index = 0;
                    if (seoObjectInfo.type == 'assetcard'){
                        index = assetCartCount;
                        assetCartCount += 1;
                    } else if (seoObjectInfo.type == 'exclude-from-newsgate') {
                        index = relatedLinkCount;
                        relatedLinkCount += 1;
                    }
                    if (seoObjectInfo.text != null) {
                        seoWordCount += countWords(seoObjectInfo.text);
                        if (seoWordCount < 100) {
                            addClass(document.querySelectorAll('.' + seoObjectInfo.type), index);
                        }
                    }
                } else {
                    text = null;
                }
            }
        }

        function getSEOObjectInfo(text) {
            var assetCardSeperator = '<div asset="::asset"';
            var relatedLinkSeperator = '<span class="exclude-from-newsgate';
            var indexOfAssetCard = text.indexOf(assetCardSeperator);
            var indexOfRelatedLink = text.indexOf(relatedLinkSeperator);
            var textArray = [];
            //If condition to check if the relatedlink exists before a asset card.
            if (indexOfRelatedLink != -1 && (indexOfAssetCard == -1 || indexOfRelatedLink < indexOfAssetCard)) {
                textArray = text.split('<span class="exclude-from-newsgate');
                return {type: 'exclude-from-newsgate', text: textArray[0], remainingBody: '<span class="exclude-from-wordcount"' + text.substring(indexOfRelatedLink + 1)};
            } else if (indexOfAssetCard != -1) {
                textArray = text.split('<div asset="::asset"');
                if (indexOfAssetCard == 0) {
                    return {type: 'assetcard', text: null, remainingBody: '<div class="exclude-from-wordcount"' + text.substring(indexOfAssetCard + 1)};
                }
                return {type: 'assetcard', text: textArray[0], remainingBody: '<div class="exclude-from-wordcount"' + text.substring(indexOfAssetCard + 1)};
            } else {
                return null;
            }
        }

        function removeClass(collection) {
            if (collection != null && collection.length > 0) {
                var index = 0, length = collection.length;
                for (; index < length; index++) {
                    collection[index].className = collection[index].className.replace(' px-seo-warning', '');
                }
            }
        }

        function addClass(collection, position) {
            if (collection != null && collection.length > 0) {
                if (position > -1) {
                    collection[position].className += " px-seo-warning";
                    return;
                }
            }
        }

        function countCharacters(text, editorInstance) {
            if (config.countHTML) {
                return (filter(text).length);
            } else {
                var normalizedText;

                // strip body tags
                if (editor.config.fullPage) {
                    var i = text.search(new RegExp("<body>", "i"));
                    if (i != -1) {
                        var j = text.search(new RegExp("</body>", "i"));
                        text = text.substring(i + 6, j);
                    }
                }

                normalizedText = text;

                if (!config.countSpacesAsChars) {
                    normalizedText = text.
                    replace(/\s/g, "").
                    replace(/&nbsp;/g, "");
                }

                normalizedText = normalizedText.
                replace(/(\r\n|\n|\r)/gm, "").
                replace(/&nbsp;/gi, " ");

                normalizedText = strip(normalizedText).replace(/^([\t\r\n]*)$/, "");

                return(normalizedText.length);
            }
        }

        function countParagraphs(text) {
            return (text.replace(/&nbsp;/g, " ").replace(/(<([^>]+)>)/ig, "").replace(/^\s*$[\n\r]{1,}/gm, "++").split("++").length);
        }

        function countWords(text) {
            var normalizedText = text.
            replace(/(\r\n|\n|\r)/gm, " ").
            replace(/^\s+|\s+$/g, "").
            replace("&nbsp;", " ");

            normalizedText = strip(normalizedText);

            var words = normalizedText.split(/\s+/);

            for (var wordIndex = words.length - 1; wordIndex >= 0; wordIndex--) {
                if (words[wordIndex].match(/^([\s\t\r\n]*)$/)) {
                    words.splice(wordIndex, 1);
                }
            }

            return (words.length);
        }

        function countInches(text) {
            var inches = countCharacters(text) / config.charactersPerInch;
            return Math.round(inches * 10) / 10;
        }

        function limitReached(editorInstance, notify) {
            limitReachedNotified = true;
            limitRestoredNotified = false;

            if (config.hardLimit) {
                editorInstance.loadSnapshot(snapShot);
                // lock editor
                editorInstance.config.Locked = 1;
            }

            if (!notify) {
                counterElement(editorInstance).className = "cke_path_item cke_wordcountLimitReached";
                editorInstance.fire("limitReached", {}, editor);
            }
        }

        function limitRestored(editorInstance) {
            limitRestoredNotified = true;
            limitReachedNotified = false;
            editorInstance.config.Locked = 0;
            snapShot = editor.getSnapshot();

            counterElement(editorInstance).className = "cke_path_item";
        }

        function debounce(func, wait, immediate) {
            var timeout;
            return function() {
                var context = this,
                    args = arguments;
                var later = function() {
                    timeout = null;
                    if (!immediate) func.apply(context, args);
                };
                var callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                if (callNow) func.apply(context, args);
            };
        };

        function updateCounter(editorInstance) {
            var paragraphs = 0,
                wordCount = 0,
                charCount = 0,
                inches = 0,
                text;

            if (text = editorInstance.getData()) {
                if (config.showCharCount) {
                    charCount = countCharacters(text, editorInstance);
                }

                if (config.showParagraphs) {
                    paragraphs = countParagraphs(text);
                }

                if (config.showWordCount) {
                    wordCount = countWords(text);
                }

                if (config.showInches) {
                    inches = countInches(text);
                }

                if (config.enableSEOCheck) {
                    doSEOCheck(text, editorInstance);
                }
            }

            var html = format.replace("%wordCount%", wordCount).replace("%charCount%", charCount).replace("%paragraphs%", paragraphs).replace("%inches%", inches);

            (editorInstance.config.wordcount || (editorInstance.config.wordcount = {})).wordCount = wordCount;
            (editorInstance.config.wordcount || (editorInstance.config.wordcount = {})).charCount = charCount;
            (editorInstance.config.wordcount || (editorInstance.config.wordcount = {})).printInches = inches;

            if (CKEDITOR.env.gecko) {
                counterElement(editorInstance).innerHTML = html;
            } else {
                counterElement(editorInstance).innerText = html;
            }

            if (charCount == lastCharCount && wordCount == lastWordCount) {
                return true;
            }

            //If the limit is already over, allow the deletion of characters/words. Otherwise,
            //the user would have to delete at one go the number of offending characters
            var deltaWord = wordCount - lastWordCount;
            var deltaChar = charCount - lastCharCount;

            lastWordCount = wordCount;
            lastCharCount = charCount;

            if (lastWordCount == -1) {
                lastWordCount = wordCount;
            }
            if (lastCharCount == -1) {
                lastCharCount = charCount;
            }

            // Check for word limit and/or char limit
            if ((config.maxWordCount > -1 && wordCount > config.maxWordCount && deltaWord > 0) ||
                (config.maxCharCount > -1 && charCount > config.maxCharCount && deltaChar > 0)) {

                limitReached(editorInstance, limitReachedNotified);
            } else if ((config.maxWordCount == -1 || wordCount < config.maxWordCount) &&
                (config.maxCharCount == -1 || charCount < config.maxCharCount)) {

                limitRestored(editorInstance);
            } else {
                snapShot = editorInstance.getSnapshot();
            }

            // Fire Custom Events
            if (config.charCountGreaterThanMaxLengthEvent && config.charCountLessThanMaxLengthEvent) {
                if (charCount > config.maxCharCount && config.maxCharCount > -1) {
                    config.charCountGreaterThanMaxLengthEvent(charCount, config.maxCharCount);
                } else {
                    config.charCountLessThanMaxLengthEvent(charCount, config.maxCharCount);
                }
            }

            if (config.wordCountGreaterThanMaxLengthEvent && config.wordCountLessThanMaxLengthEvent) {
                if (wordCount > config.maxWordCount && config.maxWordCount > -1) {
                    config.wordCountGreaterThanMaxLengthEvent(wordCount, config.maxWordCount);

                } else {
                    config.wordCountLessThanMaxLengthEvent(wordCount, config.maxWordCount);
                }
            }

            return true;
        }

        var updateCounterDebounced = debounce(function(editorInstance){
            updateCounter(editorInstance);
        }, 250);

        editor.on("key", function (event) {
            if (editor.mode === "source") {
                updateCounterDebounced(event.editor);
            }
        }, editor, null, 100);

        editor.on("change", function (event) {
            updateCounterDebounced(event.editor);
        }, editor, null, 100);

        editor.on("uiSpace", function (event) {
            if (editor.elementMode === CKEDITOR.ELEMENT_MODE_INLINE) {
                if (event.data.space == "top") {
                    event.data.html += "<div class=\"cke_wordcount\" style=\"\"" +
                        " title=\"" +
                        editor.lang.wordcount.title +
                        "\"" +
                        "><span id=\"" +
                        counterId(event.editor) +
                        "\" class=\"cke_path_item\">&nbsp;</span></div>";
                }
            } else {
                if (event.data.space == "bottom") {
                    event.data.html += "<div class=\"cke_wordcount\" style=\"\"" +
                        " title=\"" +
                        editor.lang.wordcount.title +
                        "\"" +
                        "><span id=\"" +
                        counterId(event.editor) +
                        "\" class=\"cke_path_item\">&nbsp;</span></div>";
                }
            }

        }, editor, null, 100);

        editor.on("dataReady", function (event) {
            updateCounter(event.editor);
        }, editor, null, 100);

        editor.on("paste", function(event) {
            if (config.maxWordCount > 0 || config.maxCharCount > 0) {

                // Check if pasted content is above the limits
                var wordCount = -1,
                    charCount = -1,
                    text = event.editor.getData() + event.data.dataValue;


                if (config.showCharCount) {
                    charCount = countCharacters(text, event.editor);
                }

                if (config.showWordCount) {
                    wordCount = countWords(text);
                }

                var notification = new CKEDITOR.plugins.notification(event.editor, { message: event.editor.lang.wordcount.pasteWarning, type: 'warning' });

                if (config.maxCharCount > 0 && charCount > config.maxCharCount && config.hardLimit) {
                    notification.show();
                    event.cancel();
                }

                if (config.maxWordCount > 0 && wordCount > config.maxWordCount && config.hardLimit) {
                    notification.show();
                    event.cancel();
                }
            }
        }, editor, null, 100);

        editor.on("afterPaste", function (event) {
            updateCounter(event.editor);
        }, editor, null, 100);

        editor.on("blur", function () {
            if (intervalId) {
                window.clearInterval(intervalId);
            }
        }, editor, null, 300);
    }
});