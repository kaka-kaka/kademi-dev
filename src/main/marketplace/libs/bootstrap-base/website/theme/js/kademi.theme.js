/**
 *  Editor support: Note that this relies on a global variable called toolbarSets
 *
 *  A default is defined in toolbars.js. You should override that file in your
 *  application to get the toolbars you want
 */

// Templates should push theme css files into this array, so they will be included in the editor
function initCollapseListGroup() {
    flog('initCollapseListGroup');
    
    $(document.body).on({
        'hide.bs.collapse': function () {
            var id = this.id;
            var toggler = $('[data-toggle="collapse"][href="#' + id + '"]');
            var icon = toggler.find('.glyphicon');
            
            icon.addClass('glyphicon-chevron-right').removeClass('glyphicon-chevron-down');
        },
        'show.bs.collapse': function () {
            var id = this.id;
            var toggler = $('[data-toggle="collapse"][href="#' + id + '"]');
            var icon = toggler.find('.glyphicon');
            
            icon.addClass('glyphicon-chevron-down').removeClass('glyphicon-chevron-right');
        }
    }, '.list-group.collapse');
}

function runPageInitFunctions() {
    flog('runPageInitFunctions');
    
    $.each(window.pageInitFunctions, function (i) {
        flog('runPageInitFunctions | Run function #' + i);
        pageInitFunctions[i]();
        flog('runPageInitFunctions | Done in run function #', i);
    });
}

function initTappyTable() {
    flog('initTappyTable');
    
    $(document.body).on('click', 'table.table-tappy tbody td', function (e) {
        var target = $(e.target);
        if (target.is('a')) {
            return;
        }
        
        var td = target.closest('td');
        var href = td.find('a').attr('href');
        flog('Click on table-tappy', td, href);
        window.location.href = href;
    });
}

function initTimeago() {
    if ($.timeago) {
        $.timeago.settings.allowFuture = true;
        $(".timeago").timeago();
    }
}

function initContentFeatures() {
    flog('initContentFeatures');
    
    // Add or remove collapsed class to panels, so we can use that to switch the glyphicon symbol
    $(document.body).on({
        'shown.bs.collapse': function (e) {
            var n = $(e.target);
            n.closest('.panel.dropdown-btn')
                .removeClass('collapsed')
                .find('.glyphicon').removeClass('glyphicon-chevron-right').addClass('glyphicon-chevron-down');
        },
        'hidden.bs.collapse': function (e) {
            var n = $(e.target);
            n.closest('.panel.dropdown-btn')
                .addClass('collapsed')
                .find('.glyphicon').removeClass('glyphicon-chevron-down').addClass('glyphicon-chevron-right');
            
        }
    });
    
    // Find any dropdown-btn and add appropriate classes and markup to allow dynamic dropdowns
    $('.dropdown-btn').each(function () {
        var dropdown = $(this);
        
        dropdown.addClass('collapsed');
        dropdown.find('.panel-body').wrap('<div class="panel-collapse collapse"></div>');
        dropdown.find('.panel-title').append('<span class="glyphicon glyphicon-chevron-right"></span>');
    });
    
    // dropdown-btn needs explicit collapse, because we dont want to use ID's, required for attributes usage
    $(document).on('click', '.dropdown-btn .panel-heading', function (e) {
        var n = $(e.target);
        
        n.closest('.panel').find('.panel-collapse').collapse('toggle');
    });
}

function initLogin() {
    flog('initLogin');
    
    // init the login form
    $(".login").user({});
    
    // the login box in header is normally for logging in from a public page. So
    // in this case we want to navigate to the user's dashboard
    $(".header .Login").user({});
    // the login form appears in content when the requested page requires a login
    // so in this case we do not give a post-login url, we will just refresh the current page
    $("#content .Login").user();
}

/**
 * Make sure you push any required css files into "themeCssFiles" before calling
 *
 * See /static/js/toolbars.js
 */
function initHtmlEditors(elements, height, width, extraPlugins, removePlugins, callback) {
    var fullUrl = false;
    if ($.isPlainObject(height)) {
        var options = $.extend({}, height);
        height = options.height;
        width = options.width;
        extraPlugins = options.extraPlugins;
        removePlugins = options.removePlugins;
        callback = options.callback;
        fullUrl = options.fullUrl;
    }
    
    flog('initHtmlEditors', elements, height, width, extraPlugins, removePlugins);
    
    loadCKEditor(function () {
        if (!elements) {
            elements = $('.htmleditor');
        }
        if (!extraPlugins) {
            extraPlugins = standardExtraPlugins;
        }
        if (!removePlugins) {
            removePlugins = standardRemovePlugins;
        }
        
        flog('Prepare html editors using templates=' + templatesPath + ' and styles=' + stylesPath); // see toolbars.js for templatesPath
        elements.each(function () {
            var element = $(this);
            
            // Add id for editor if dont have id
            if (!element.attr('id')) {
                element.attr('id', 'editor-' + Math.round(Math.random() * 123456789));
            }
            
            var inputClasses = element.attr('class');
            var toolbar = 'Default';
            if (inputClasses) {
                inputClasses = inputClasses.split(' ');
                for (var i = 0; i < inputClasses.length; i++) {
                    var s = inputClasses[i];
                    if (s.startsWith('toolbar-')) {
                        s = s.substring(8);
                        toolbar = s;
                        break;
                    }
                }
            }
            
            flog('Using toolbar=' + toolbar + ' => ', toolbarSets[toolbar]);
            
            themeCssFiles.push('/static/bootstrap/3.3.7/css/bootstrap.min.css');
            themeCssFiles.push('/static/bootstrap/ckeditor/bootstrap-ckeditor.css');
            
            var config = {
                skin: editorSkin,
                allowedContent: true, // DISABLES Advanced Content Filter. This is so templates with classes are allowed through
                contentsCss: themeCssFiles, // mainCssFile,
                bodyId: 'editor',
                templates_files: [templatesPath],
                templates_replaceContent: false,
                toolbarGroups: toolbarSets[toolbar],
                extraPlugins: extraPlugins,
                removePlugins: removePlugins,
                enterMode: 'P',
                forceEnterMode: true,
                filebrowserBrowseUrl: '/static/fckfilemanager/browser/default/browser.html?Type=Image&Connector=/fck_connector.html',
                filebrowserUploadUrl: '/uploader/upload',
                format_tags: 'p;h1;h2;h3;h4;h5;h6', // removed p2
                format_p2: {
                    element: 'p',
                    attributes: {
                        'class': 'lessSpace'
                    }
                },
                minimumChangeMilliseconds: 100,
                fullUrl: fullUrl
            };
            
            if (height) {
                if (height !== 'auto') {
                    config.height = height;
                }
            } else {
                config.height = '300';
            }
            if (width) {
                config.width = width;
            }
            
            config.stylesSet = 'myStyles:' + stylesPath; // See toolbars.js, or overridden elsewhere
            
            flog('Create editor', element, config);
            var editor = element.ckeditor(config).editor;
            
            editor.on('instanceReady', function () {
                if (typeof callback === 'function') {
                    callback.call(this, editor);
                }
            });
        });
    });
}

function initHelp() {
    $(".helpIcon").click(function (e) {
        
        e.preventDefault();
        
        var page = $(document).find("meta[name=templateName]").attr("value");
        var href = "http://docs.fuselms.com/ref/screens";
        href += page;
        window.open(href);
    });
}

function initPrintLink() {
    var links = $("a.print2");
    flog("initPrintLink", links);
    links.off('click').on('click', function (e) {
        e.preventDefault();
        window.print();
        return false;
    });
}

/**
 *  Although this function is defined here in the theme, it should be called
 *  from each page.
 *
 *  Each page should decide what url to pass as the pageUrl, as this can be used
 *  to share comments across pages (such as when the logical context is the folder
 *  the pages are in, rather then each page)
 *
 *  Eg initComments(window.location.pathname);
 */
function initComments(pageUrl) {
    flog("initComments", pageUrl);
    $(".hideBtn").click(function () {
        var oldCommentsHidden = $("#comments:visible").length == 0;
        flog("store new comments hidden", oldCommentsHidden);
        jQuery.cookie("commentsHidden", !oldCommentsHidden, {
            path: "/"
        });
        $("#comments").toggle(100, function () {
            if (!oldCommentsHidden) {
                $(".hideBtn a").text("Show comments");
                $(".hideBtn a").addClass("ishidden");
            } else {
                $(".hideBtn a").text("Hide comments");
                $(".hideBtn a").removeClass("ishidden");
            }
        });
        return false;
    });
    var commentsHidden = jQuery.cookie("commentsHidden", {
        path: "/"
    });
    flog("comments hidden", commentsHidden);
    if (commentsHidden === "true") {
        $("#comments").hide();
        $(".hideBtn a").text("Show comments");
        $(".hideBtn a").addClass("ishidden");
    }
    
    $("body").on("click focus", ".commentContainer textarea", function (e) {
        $(e.target).closest("div").find(".commentControls").show();
    });
    $('.commentContainer textarea').autogrow()
    
    var currentUser = {
        name: userName,
        href: userUrl,
        photoHref: "/profile/pic"
    };
    
    // This is for deferred logins, ie someone logs in after going to a page with comments
    $('body').on('userLoggedIn', function (event, userUrl, userName) {
        currentUser.name = userName;
        currentUser.href = userUrl;
    });
    
    var comments = $("#comments");
    if (comments.length > 0) {
        comments.comments({
            currentUser: currentUser,
            pageUrl: pageUrl
        });
    }
}

function initSelectAll() {
    $(document.body).on('click', '.selectAll', function (e) {
        var chkAll = $(this);
        var chkName = chkAll.attr('name');
        flog('SelectAll', chkAll, this.checked);
        
        chkAll.closest('table').find('tbody td input[type=checkbox][name=' + chkName + ']').prop('checked', this.checked);
    });
}

function initTablesForCkeditor() {
    flog('Checking tables for cellpadding or cellspacing, if yes make a workaround since bootstrap doesnt support this');
    
    $('table').each(function () {
        var table = $(this);
        var cellPadding = table.attr('cellpadding');
        var cellSpacing = table.attr('cellspacing');
        
        if (cellSpacing) {
            // Support cellpadding and cellspacing in css way
            flog('cellspacing found', this, cellSpacing);
            table.css({
                'border-collapse': 'separate',
                'border-spacing': cellSpacing + 'px'
            });
            table.removeAttr('cellspacing');
        }
        
        if (cellPadding) {
            flog('cellpadding found', this, cellPadding);
            table.find('th, td').css('padding', cellPadding + 'px');
            table.removeAttr('cellpadding');
        }
    })
}


/**
 * Provided by each theme to integrate modals
 */
var lastOpenedModal;

function showModal(modal, title) {
    flog("showModal-bootstrap3", modal);
    modal.find(".close-modal").remove(); // added by old fuse theme, need to remove
    if (!modal.hasClass("modal")) {
        modal.addClass("modal fade");
    }
    if (modal.find(".modal-body").length === 0) {
        modal.wrapInner("<div class='modal-body'></div>");
        var headerHtml = "<div class='modal-header'>"
            + "<button type='button' class='close' data-dismiss='modal' aria-hidden='true'>&times;</button>";
        if (title) {
            headerHtml += "<h4 class='modal-title'>" + title + "</h4>"
        }
        headerHtml += "</div>";
        modal.prepend(headerHtml);
    }
    if (modal.find(".modal-content").length === 0) {
        modal.wrapInner("<div class='modal-content'></div>");
        flog("wrap inner", modal);
    }
    if (modal.find(".modal-dialog").length === 0) {
        modal.wrapInner("<div class='modal-dialog'></div>");
        flog("wrap inner", modal);
    }
    lastOpenedModal = modal;
    flog("showModal", "lastOpenedModal", lastOpenedModal);
    modal.modal();
}

function closeModals() {
    flog("closeModals", $(".modal"));
    if (lastOpenedModal) {
        lastOpenedModal.modal('hide');
    }
}

function closeMyPrompt() {
    closeModals();
}

function myPrompt(id, url, title, instructions, caption, buttonName, buttonText, inputClass, inputPlaceholder, callback) {
    flog("myPrompt: bootstrap-base", id, url);
    var body = $("body")
    var modal = body.find("div.myprompt");
    if (modal.length === 0) {
        modal = $(
            '<div class="modal fade" style="display: none">' +
            '    <div class="modal-dialog">' +
            '        <div class="modal-content">' +
            '            <div class="modal-header">' +
            '                <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
            '                <h3>Modal header</h3>' +
            '            </div>' +
            '            <form method="POST" class="form-horizontal">' +
            '                <div class="modal-body">' +
            '                    <div class="form-message alert alert-danger" style="display: none;"></div>' +
            '                </div>' +
            '                <div class="modal-footer">' +
            '                    <a href="#" class="btn">Close</a>' +
            '                    <button type="submit" href="#" class="btn btn-primary">Save changes</button>' +
            '                </div>' +
            '            </form>' +
            '        </div>' +
            '    </div>' +
            '</div>'
        );
        modal.attr("id", id);
        body.append(modal);
    }
    modal.find(".modal-header").text(title);
    var form = modal.find("form");
    form.attr("action", url);
    form.find(".modal-body").append("<p class='notes'></p>");
    form.find(".notes").html(instructions);
    form.find(".modal-body").append("<div class='form-group'><label class='col-md-4 control-label' for='inputEmail'>label</label><div class='col-md-8'><input type='text' id='inputEmail' required='true' class='required form-control'></div></div>");
    
    var row1 = form.find(".form-group");
    var inputId = id + "_" + buttonName;
    row1.find("input").addClass(inputClass);
    row1.find("input").attr("name", buttonName).attr("id", inputId).attr("placeholder", inputPlaceholder);
    row1.find("label").attr("for", inputId).text(caption);
    form.find(".btn-primary").text(buttonText);
    
    form.submit(function (e) {
        flog("submit");
        e.preventDefault();
        resetValidation(form);
        if (checkRequiredFields(form)) {
            var newName = form.find("input").val();
            if (callback(newName, form)) {
                closeModals();
                modal.remove();
            }
        }
    });
    
    modal.find("a.btn").click(function () {
        closeModals();
    });
    
    showModal(modal);
}

$(function () {
    flog("init: bootstrap-base/js/theme.js");
    
    initLogin();
    initCollapseListGroup();
    runPageInitFunctions();
    initTappyTable();
    initPrintLink();
    initTablesForCkeditor();
    initContentFeatures();
    initTimeago();
    initEdify();
    initActiveNav(".initActive");
    initHelp();
});
