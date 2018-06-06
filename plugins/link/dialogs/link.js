﻿/*
 Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 For licensing, see LICENSE.md or http://ckeditor.com/license
*/

(function() {CKEDITOR.dialog.add("link", function(e) {var m = CKEDITOR.plugins.link,p, q = function() {var a = this.getDialog(),b = a.getContentElement("target", "popupFeatures"),a = a.getContentElement("target", "linkTargetName"),n = this.getValue();if (b && a) switch (b = b.getElement(), b.hide(), a.setValue(""), n) {case "frame":a.setLabel(e.lang.link.targetFrameName);a.getElement().show();break;case "popup":b.show();a.setLabel(e.lang.link.targetPopupName);a.getElement().show();break;default:a.setValue(n), a.getElement().hide()}},h = function(a) {a.target && this.setValue(a.target[this.id] || "")},f = function(a) {a.advanced && this.setValue(a.advanced[this.id] || "")},k = function(a) {a.target || (a.target = {});a.target[this.id] = this.getValue() || ""},l = function(a) {a.advanced || (a.advanced = {});a.advanced[this.id] = this.getValue() || ""},c = e.lang.common,b = e.lang.link,g;return {title: b.title,minWidth: "moono-lisa" == (CKEDITOR.skinName || e.config.skin) ? 450 : 350,minHeight: 240,contents: [{id: "info",label: b.info,title: b.info,elements: [{type: "text",id: "linkDisplayText",label: b.displayText,setup: function() {this.enable();this.setValue(e.getSelection().getSelectedText());p = this.getValue()},commit: function(a) {a.linkText = this.isEnabled() ? this.getValue() : ""}}, {id: "linkType",type: "select",label: b.type,"default": "url",items: [[b.toUrl, "url"],[b.toAnchor, "anchor"],[b.toEmail, "email"]],onChange: function() {var a = this.getDialog(),b = ["urlOptions", "anchorOptions", "emailOptions"],n = this.getValue(),d = a.definition.getContents("upload"),d = d && d.hidden;"url" == n ? (e.config.linkShowTargetTab &&a.showPage("target"), d || a.showPage("upload")) : (a.hidePage("target"), d || a.hidePage("upload"));for (d = 0; d < b.length; d++) {var c = a.getContentElement("info", b[d]);c && (c = c.getElement().getParent().getParent(), b[d] == n + "Options" ? c.show() : c.hide())}a.layout()},setup: function(a) {this.setValue(a.type || "url")},commit: function(a) {a.type = this.getValue()}}, {type: "vbox",id: "urlOptions",children: [{type: "hbox",widths: ["25%", "75%"],children: [{type: "text",id: "url",label: c.url,required: !0,onLoad: function() {this.allowOnChange = !0},onKeyUp: function() {},onChange: function() {},validate: function() {var a = this.getDialog();try {new URL(this.getValue());return a.getContentElement("info", "linkType") && "url" != a.getValueOf("info", "linkType") ? !0 : !e.config.linkJavaScriptLinksAllowed && /javascript\:/.test(this.getValue()) ? (alert(c.invalidValue), !1) : this.getDialog().fakeObj ? !0 : CKEDITOR.dialog.validate.notEmpty(b.noUrl).apply(this);}catch (ex) {return false}},setup: function(a) {this.allowOnChange = !1;a.url && this.setValue(a.url.protocol + a.url.url);this.allowOnChange = !0},commit: function(data) {data.url = { protocol: '', url: this.getValue() };this.allowOnChange = !1}}],setup: function() {this.getDialog().getContentElement("info", "linkType") || this.getElement().show()}}, {type: "button",id: "browse",hidden: "true",filebrowser: "info:url",label: c.browseServer}]}, {type: "vbox",id: "anchorOptions",width: 260,align: "center",padding: 0,children: [{type: "fieldset",id: "selectAnchorText",label: b.selectAnchor,setup: function() {g =m.getEditorAnchors(e);this.getElement()[g && g.length ? "show" : "hide"]()},children: [{type: "hbox",id: "selectAnchor",children: [{type: "select",id: "anchorName","default": "",label: b.anchorName,style: "width: 100%;",items: [[""]],setup: function(a) {this.clear();this.add("");if (g)for (var b = 0; b < g.length; b++) g[b].name && this.add(g[b].name);a.anchor && this.setValue(a.anchor.name);(a = this.getDialog().getContentElement("info", "linkType")) && "email" == a.getValue() && this.focus()},commit: function(a) {a.anchor || (a.anchor = {});a.anchor.name = this.getValue()}}, {type: "select",id: "anchorId","default": "",label: b.anchorId,style: "width: 100%;",items: [[""]],setup: function(a) {this.clear();this.add("");if (g)for (var b = 0; b < g.length; b++) g[b].id && this.add(g[b].id);a.anchor && this.setValue(a.anchor.id)},commit: function(a) {a.anchor || (a.anchor = {});a.anchor.id = this.getValue()}}],setup: function() {this.getElement()[g && g.length ? "show" : "hide"]()}}]}, {type: "html",id: "noAnchors",style: "text-align: center;",html: '\x3cdiv role\x3d"note" tabIndex\x3d"-1"\x3e' +CKEDITOR.tools.htmlEncode(b.noAnchors) + "\x3c/div\x3e",focus: !0,setup: function() {this.getElement()[g && g.length ? "hide" : "show"]()}}],setup: function() {this.getDialog().getContentElement("info", "linkType") || this.getElement().hide()}}, {type: "vbox",id: "emailOptions",padding: 1,children: [{type: "text",id: "emailAddress",label: b.emailAddress,required: !0,validate: function() {var a = this.getDialog();return a.getContentElement("info", "linkType") && "email" == a.getValueOf("info", "linkType") ? CKEDITOR.dialog.validate.notEmpty(b.noEmail).apply(this) :!0},setup: function(a) {a.email && this.setValue(a.email.address);(a = this.getDialog().getContentElement("info", "linkType")) && "email" == a.getValue() && this.select()},commit: function(a) {a.email || (a.email = {});a.email.address = this.getValue()}}, {type: "text",id: "emailSubject",label: b.emailSubject,setup: function(a) {a.email && this.setValue(a.email.subject)},commit: function(a) {a.email || (a.email = {});a.email.subject = this.getValue()}}, {type: "textarea",id: "emailBody",label: b.emailBody,rows: 3,"default": "",setup: function(a) {a.email &&this.setValue(a.email.body)},commit: function(a) {a.email || (a.email = {});a.email.body = this.getValue()}}],setup: function() {this.getDialog().getContentElement("info", "linkType") || this.getElement().hide()}}]}, {id: "target",requiredContent: "a[target]",label: b.target,title: b.target,elements: [{type: "hbox",widths: ["50%", "50%"],children: [{type: "select",id: "linkTargetType",label: c.target,"default": "notSet",style: "width : 100%;",items: [[c.notSet, "notSet"],[b.targetFrame, "frame"],[b.targetPopup, "popup"],[c.targetNew,"_blank"],[c.targetTop, "_top"],[c.targetSelf, "_self"],[c.targetParent, "_parent"]],onChange: q,setup: function(a) {a.target && this.setValue(a.target.type || "notSet");q.call(this)},commit: function(a) {a.target || (a.target = {});a.target.type = this.getValue()}}, {type: "text",id: "linkTargetName",label: b.targetFrameName,"default": "",setup: function(a) {a.target && this.setValue(a.target.name)},commit: function(a) {a.target || (a.target = {});a.target.name = this.getValue().replace(/([^\x00-\x7F]|\s)/gi, "")}}]}, {type: "vbox",width: "100%",align: "center",padding: 2,id: "popupFeatures",children: [{type: "fieldset",label: b.popupFeatures,children: [{type: "hbox",children: [{type: "checkbox",id: "resizable",label: b.popupResizable,setup: h,commit: k}, {type: "checkbox",id: "status",label: b.popupStatusBar,setup: h,commit: k}]}, {type: "hbox",children: [{type: "checkbox",id: "location",label: b.popupLocationBar,setup: h,commit: k}, {type: "checkbox",id: "toolbar",label: b.popupToolbar,setup: h,commit: k}]}, {type: "hbox",children: [{type: "checkbox",id: "menubar",label: b.popupMenuBar,setup: h,commit: k}, {type: "checkbox",id: "fullscreen",label: b.popupFullScreen,setup: h,commit: k}]}, {type: "hbox",children: [{type: "checkbox",id: "scrollbars",label: b.popupScrollBars,setup: h,commit: k}, {type: "checkbox",id: "dependent",label: b.popupDependent,setup: h,commit: k}]}, {type: "hbox",children: [{type: "text",widths: ["50%", "50%"],labelLayout: "horizontal",label: c.width,id: "width",setup: h,commit: k}, {type: "text",labelLayout: "horizontal",widths: ["50%", "50%"],label: b.popupLeft,id: "left",setup: h,commit: k}]}, {type: "hbox",children: [{type: "text",labelLayout: "horizontal",widths: ["50%", "50%"],label: c.height,id: "height",setup: h,commit: k}, {type: "text",labelLayout: "horizontal",label: b.popupTop,widths: ["50%", "50%"],id: "top",setup: h,commit: k}]}]}]}]}, {id: "upload",label: b.upload,title: b.upload,hidden: !0,filebrowser: "uploadButton",elements: [{type: "file",id: "upload",label: c.upload,style: "height:40px",size: 29}, {type: "fileButton",id: "uploadButton",label: c.uploadSubmit,filebrowser: "info:url","for": ["upload","upload"]}]}, {id: "advanced",label: b.advanced,title: b.advanced,elements: [{type: "vbox",padding: 1,children: [{type: "hbox",widths: ["45%", "35%", "20%"],children: [{type: "text",id: "advId",requiredContent: "a[id]",label: b.id,setup: f,commit: l}, {type: "select",id: "advLangDir",requiredContent: "a[dir]",label: b.langDir,"default": "",style: "width:110px",items: [[c.notSet, ""],[b.langDirLTR, "ltr"],[b.langDirRTL, "rtl"]],setup: f,commit: l}, {type: "text",id: "advAccessKey",requiredContent: "a[accesskey]",width: "80px",label: b.acccessKey,maxLength: 1,setup: f,commit: l}]}, {type: "hbox",widths: ["45%", "35%", "20%"],children: [{type: "text",label: b.name,id: "advName",requiredContent: "a[name]",setup: f,commit: l}, {type: "text",label: b.langCode,id: "advLangCode",requiredContent: "a[lang]",width: "110px","default": "",setup: f,commit: l}, {type: "text",label: b.tabIndex,id: "advTabIndex",requiredContent: "a[tabindex]",width: "80px",maxLength: 5,setup: f,commit: l}]}]}, {type: "vbox",padding: 1,children: [{type: "hbox",widths: ["45%", "55%"],children: [{type: "text",label: b.advisoryTitle,requiredContent: "a[title]","default": "",id: "advTitle",setup: f,commit: l}, {type: "text",label: b.advisoryContentType,requiredContent: "a[type]","default": "",id: "advContentType",setup: f,commit: l}]}, {type: "hbox",widths: ["45%", "55%"],children: [{type: "text",label: b.cssClasses,requiredContent: "a(cke-xyz)","default": "",id: "advCSSClasses",setup: f,commit: l}, {type: "text",label: b.charset,requiredContent: "a[charset]","default": "",id: "advCharset",setup: f,commit: l}]}, {type: "hbox",widths: ["45%", "55%"],children: [{type: "text",label: b.rel,requiredContent: "a[rel]","default": "",id: "advRel",setup: f,commit: l}, {type: "text",label: b.styles,requiredContent: "a{cke-xyz}","default": "",id: "advStyles",validate: CKEDITOR.dialog.validate.inlineStyle(e.lang.common.invalidInlineStyle),setup: f,commit: l}]}, {type: "hbox",widths: ["45%", "55%"],children: [{type: "checkbox",id: "download",requiredContent: "a[download]",label: b.download,setup: function(a) {void 0 !== a.download && this.setValue("checked", "checked")},commit: function(a) {this.getValue() && (a.download =this.getValue())}}]}]}]}],onShow: function() {var a = this.getParentEditor(),b = a.getSelection(),c = b.getSelectedElement(),d = this.getContentElement("info", "linkDisplayText").getElement().getParent().getParent(),e = null;(e = m.getSelectedLink(a)) && e.hasAttribute("href") ? c || (b.selectElement(e), c = e) : e = null;m.showDisplayTextForElement(c, a) ? d.show() : d.hide();a = m.parseLinkAttributes(a, e);this._.selectedElement = e;this.setupContent(a)},onOk: function() {var a = {};this.commitContent(a);var b = e.getSelection(),c = m.getLinkAttributes(e,a);if (this._.selectedElement) {var d = this._.selectedElement,g = d.data("cke-saved-href"),h = d.getHtml(),f;d.setAttributes(c.set);d.removeAttributes(c.removed);if (a.linkText && p != a.linkText) f = a.linkText;else if (g == h || "email" == a.type && -1 != h.indexOf("@")) f = "email" == a.type ? a.email.address : c.set["data-cke-saved-href"];f && (d.setText(f), b.selectElement(d));delete this._.selectedElement} else {b = b.getRanges()[0];b.collapsed ? (a = new CKEDITOR.dom.text(a.linkText || ("email" == a.type ? a.email.address : c.set["data-cke-saved-href"]),e.document), b.insertNode(a), b.selectNodeContents(a)) : p !== a.linkText && (a = new CKEDITOR.dom.text(a.linkText, e.document), b.shrink(CKEDITOR.SHRINK_TEXT), e.editable().extractHtmlFromRange(b), b.insertNode(a));a = b._find("a");for (d = 0; d < a.length; d++) a[d].remove(!0);c = new CKEDITOR.style({element: "a",attributes: c.set});c.type = CKEDITOR.STYLE_INLINE;c.applyToRange(b, e);b.select()}},onLoad: function() {e.config.linkShowAdvancedTab || this.hidePage("advanced");e.config.linkShowTargetTab || this.hidePage("target")},onFocus: function() {var a =this.getContentElement("info", "linkType");a && "url" == a.getValue() && (a = this.getContentElement("info", "url"), a.select())}}})})();