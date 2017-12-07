(function ($) {
    var DEFAULTS = {
        btnClass: 'btn btn-success',
        btnOkClass: 'btn btn-sm btn-primary',
        modalTitle: 'Select file',
        contentTypes: ['image', 'video', 'audio'],
        mselectAll: false, // when true, all file types are allowed so contentTypes is ignored
        excludedEndPaths: ['.mil/'],
        basePath: '/',
        pagePath: window.location.pathname,
        zIndex: null,
        showModal: function (modal) {
            modal.modal('show');
        },
        onSelectFile: function (selectedUrl, selectedRelUrl) {
        },
        onSelectFolder: function (selectedUrl, selectedRelUrl) {
            
        },
        onPreviewFile: function (type, selectedUrl, hash) {
        },
        useModal: true
    };
    
    function MSelect(target, options) {
        this.target = target;
        this.options = $.extend({}, DEFAULTS, options);
        this.init();
    }
    
    MSelect.prototype.init = function () {
        var self = this;
        var options = self.options;
        var target = self.target;
        
        $.getStyleOnce('/static/jquery.mselect/1.1.0/jquery.mselect-1.1.0.css');
        $.when(
            $.getScriptOnce('/static/js/jquery.jstree.js'),
            $.getScriptOnce('/static/js/jquery.milton-tree.js'),
            $.getScriptOnce('/static/milton-upload/1.0.1/jquery.milton-upload.js')
        ).then(function () {
            flog('[jquery.mselect] Initializing mselect', target);
            
            if (options.useModal) {
                flog('[jquery.mselect] Initializing button and modal...', target);
                
                target.on('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (!self.modal) {
                        self.getModal();
                    }
                    
                    options.showModal(self.modal);
                    
                    if (options.zIndex) {
                        self.modal.css('z-index', options.zIndex + 1).siblings('.modal-backdrop').last().css('z-index', options.zIndex);
                    }
                });
            } else {
                flog('[jquery.mselect] Initializing mselect container only', target);
                
                target.html(self.getSelectContainer());
                self.initSelectContainer(target);
            }
            
            flog('[jquery.mselect] Initialized mselect');
        });
    };
    
    MSelect.prototype.getModal = function () {
        var self = this;
        var options = self.options;
        var modalId = 'modal-milton-file-select-' + (new Date()).getTime();
        
        var modal = $(
            '<div id="' + modalId + '" class="modal fade" aria-hidden="true" tabindex="-1">' +
            '   <div class="modal-dialog modal-lg">' +
            '       <div class="modal-content">' +
            '           <div class="modal-header">' +
            '               <button aria-hidden="true" data-dismiss="modal" class="close" type="button">&times;</button>' +
            '               <h4 class="modal-title">' + options.modalTitle + '</h4>' +
            '           </div>' +
            '           <div class="modal-body">' + self.getSelectContainer() + '</div>' +
            '           <div class="modal-footer">' +
            '               <button class="' + options.btnOkClass + ' btn-ok" type="button"> OK </button>' +
            '           </div>' +
            '       </div>' +
            '   </div>' +
            '</div>'
        );
        
        $(document.body).append(modal);
        
        self.initSelectContainer(modal, function () {
            modal.modal('hide');
        });
        
        self.modal = modal;
    };
    
    MSelect.prototype.selectFile = function (hash, callback) {
        var self = this;
        var target = self.target;
        var tree = target.find('div.milton-tree-wrapper');
        try {
            tree.mtree('select', tree.find('[data-hash="' + hash + '"]'), callback);
        } catch (e) {
        }
    }
    
    MSelect.prototype.updateOption = function (key, value) {
        this.options[key] = value;
    }
    
    MSelect.prototype.getExtension = function (filename) {
        var parts = filename.split('.');
        return parts[parts.length - 1];
    }
    
    MSelect.prototype.isImage = function (filename) {
        var ext = this.getExtension(filename);
        switch (ext.toLowerCase()) {
            case 'jpg':
            case 'gif':
            case 'bmp':
            case 'png':
                //etc
                return true;
        }
        return false;
    };
    
    MSelect.prototype.isVideo = function (filename) {
        var ext = this.getExtension(filename);
        switch (ext.toLowerCase()) {
            case 'm4v':
            case 'avi':
            case 'mpg':
            case 'mp4':
                // etc
                return true;
        }
        return false;
    };
    
    MSelect.prototype.isAudio = function (filename) {
        var ext = this.getExtension(filename);
        switch (ext.toLowerCase()) {
            // Since jwplayer supports mp3, aac and Vorbis
            case 'mp3':
            case 'aac':
            case 'ogg':
            case 'oga':
                // etc
                return true;
        }
        return false;
    };
    
    MSelect.prototype.getFileType = function (fileUrl) {
        // Remove '/_DAV/....' before checking file type
        fileUrl = fileUrl.replace(/^(.+)(\/_DAV\/.+)$/, '$1')
        
        var fileType = 'other';
        if (this.isVideo(fileUrl)) {
            fileType = 'video';
        } else if (this.isImage(fileUrl)) {
            fileType = 'image';
        } else if (this.isAudio(fileUrl)) {
            fileType = 'audio';
        }
        
        return fileType;
    };
    
    MSelect.prototype.getAcceptedFiles = function (contentTypes) {
        return contentTypes.map(function (a) {
            return a + '/*'
        }).join(',');
    };
    
    MSelect.prototype.getCleanUrl = function (url) {
        return (url || '').replace(/\/\//g, '/');
    };
    
    MSelect.prototype.initSelectContainer = function (container, onOk) {
        flog('[jquery.mselect] initSelectContainer', container);
        
        var self = this;
        var options = self.options;
        
        options.basePath = self.getCleanUrl(options.basePath);
        options.pagePath = self.getCleanUrl(options.pagePath);
        
        var treeContainer = self.treeContainer = container.find('div.milton-tree-wrapper');
        var progressBar = self.progressBar = container.find('.milton-file-progress');
        var progressBarInner = progressBar.find('.progress-bar');
        var previewContainer = self.previewContainer = container.find('.milton-file-preview');
        var btnUpload = self.btnUpload = container.find('.milton-btn-upload-file');
        
        var mtreeOptions = {
            basePath: options.basePath,
            pagePath: options.pagePath,
            excludedEndPaths: options.excludedEndPaths,
            onselectFolder: function (nodeFolder, selectedUrl, hash) {
                flog('[jquery.mselect] Selected folder', nodeFolder, selectedUrl, hash);
                
                if (selectedUrl.indexOf('/') !== 0) {
                    selectedUrl = '/' + selectedUrl;
                }
                btnUpload.mupload('setUrl', selectedUrl);
                previewContainer.attr('data-url', selectedUrl);
                previewContainer.attr('data-hash', hash);
            },
            onselectFile: function (nodeFile, selectedUrl, hash) {
                flog('[jquery.mselect] Selected file', nodeFile, selectedUrl, hash);
                
                if (selectedUrl.indexOf('/') !== 0) {
                    selectedUrl = '/' + selectedUrl;
                }
                var newUrl = self.getCleanUrl(selectedUrl.substr(0, selectedUrl.lastIndexOf('/')) + '/');
                btnUpload.mupload('setUrl', newUrl);
                
                var fileType = self.getFileType(selectedUrl);
                var hashUrl = '/_hashes/files/' + hash;
                
                progressBar.show();
                progressBarInner.html('Loading...');
                
                if (fileType === 'video') {
                    previewContainer.html('<div class="jp-video" data-hash="' + hash + '"></div>');
                    $.getScriptOnce('/static/jwplayer/6.10/jwplayer.js', function () {
                        $.getScriptOnce('/static/jwplayer/jwplayer.html5.js', function () {
                            jwplayer.key = 'cXefLoB9RQlBo/XvVncatU90OaeJMXMOY/lamKrzOi0=';
                            buildJWPlayer(previewContainer.find('div.jp-video'), 100, hashUrl, hashUrl + '/alt-640-360.png');
                            
                            if (typeof options.onPreviewFile === 'function') {
                                options.onPreviewFile.call(container, fileType, selectedUrl, hash);
                            }
                        });
                    });
                    progressBar.hide();
                } else if (fileType === 'audio') {
                    previewContainer.html('<div class="jp-audio" data-hash="' + hash + '" style="padding: 15px"><div id="kaudio-player-100" /></div>');
                    $.getScriptOnce('/static/jwplayer/6.10/jwplayer.js', function () {
                        $.getScriptOnce('/static/jwplayer/jwplayer.html5.js', function () {
                            jwplayer.key = 'cXefLoB9RQlBo/XvVncatU90OaeJMXMOY/lamKrzOi0=';
                            buildJWAudioPlayer(100, hashUrl, false);
                            
                            if (typeof options.onPreviewFile === 'function') {
                                options.onPreviewFile.call(container, fileType, selectedUrl, hash);
                            }
                        });
                    });
                    progressBar.hide();
                } else if (fileType === 'image') {
                    $('<img />').attr('src', hashUrl).load(function () {
                        var realWidth = this.width;
                        var realHeight = this.height;
                        var ratio = realWidth / realHeight;
                        
                        previewContainer.html('<img src="' + hashUrl + '" data-hash="' + hash + '" data-real-width="' + realWidth + '" data-real-height="' + realHeight + '" data-ratio="' + ratio + '" />');
                        
                        if (typeof options.onPreviewFile === 'function') {
                            options.onPreviewFile.call(container, fileType, selectedUrl, hash);
                        }
                        progressBar.hide();
                    });
                } else {
                    previewContainer.html('<p class="alert alert-warning">Unsupported preview file</p>');
                    
                    if (typeof options.onPreviewFile === 'function') {
                        options.onPreviewFile.call(container, fileType, selectedUrl, hash);
                    }
                    progressBar.hide();
                }
                
                previewContainer.attr('data-url', selectedUrl);
                previewContainer.attr('data-hash', hash);
            },
            ondelete: function (n, isFolder) {
                if (isFolder) {
                    flog('Deleted folder', n, isFolder);
                    
                    var newUrl = self.getCleanUrl(options.basePath + options.pagePath);
                    btnUpload.mupload('setUrl', newUrl);
                }
            }
        };
        if (!options.mselectAll) {
            mtreeOptions.includeContentTypes = options.contentTypes;
        }
        treeContainer.mtree(mtreeOptions);
        
        var muploadOptions = {
            url: options.basePath,
            buttonText: '<i class="fa fa-upload"></i>',
            oncomplete: function (data, name, href) {
                flog('[jquery.mselect] oncomplete', data);
                progressBar.hide();
                self.addFileToTree(name, href);
            },
            onBeforeUpload: function () {
                progressBar.show();
                progressBarInner.html('Uploading...');
            }
        };
        if (!options.mselectAll) {
            muploadOptions.acceptedFiles = self.getAcceptedFiles(options.contentTypes);
        }
        btnUpload.mupload(muploadOptions);
        
        container.find('.btn-ok').click(function () {
            var url = previewContainer.attr('data-url');
            var hash = previewContainer.attr('data-hash');
            
            if (url) {
                if (typeof options.onSelectFile === 'function') {
                    var relUrl = url.substring(options.basePath.length, url.length);
                    flog('[jquery.mselect] Selected', url, relUrl);
                    var fileType = self.getFileType(url);
                    
                    options.onSelectFile.call(container, url, relUrl, fileType, hash);
                }
                
                if (typeof options.onSelectFolder === 'function') {
                    options.onSelectFolder.call(container, url, hash);
                }
                
                if (typeof onOk === 'function') {
                    onOk.call(this);
                }
            } else {
                flog('[jquery.mselect] No selected file!');
            }
        });
        
        if (typeof options.onReady === 'function') {
            options.onReady.call(options);
        }
    };
    
    MSelect.prototype.addFileToTree = function (name, href) {
        href += '/_DAV/PROPFIND?fields=milton:hash';
        flog('[jquery.mselect] addFileToTree', href);
        
        var self = this;
        var treeContainer = self.treeContainer;
        
        $.ajax({
            url: href,
            cache: false
        }).done(function (data) {
            flog('addFileToTree', data);
            treeContainer.mtree('addFile', name, href, data[0].hash);
        });
    }
    
    MSelect.prototype.getSelectContainer = function () {
        var self = this;
        var options = self.options;
        var extraElement = '';
        
        if (!options.useModal) {
            extraElement += '<button type="button" class="btn btn-primary btn-ok"><i class="fa fa-check"></i></button>';
        }
        
        return (
            '<div class="milton-file-select-container">' +
            '    <div class="row">' +
            '        <div class="col-xs-3"><div class="milton-tree-wrapper"></div></div>' +
            '        <div class="col-xs-9">' +
            '            <div class="milton-file-preview-wrapper">' +
            '                <div class="milton-btn-upload-file"></div>' + extraElement +
            '                <div class="milton-file-progress progress" style="display: none;">' +
            '                    <div class="progress-bar progress-bar-info progress-bar-striped active" style="width: 100%"></div>' +
            '                </div>' +
            '                <div class="milton-file-preview"></div>' +
            '            </div>' +
            '        </div>' +
            '    </div>' +
            '</div>'
        );
    };
    
    MSelect.DEFAULTS = DEFAULTS;
    
    $.fn.mselect = $.fn.mselectAll = function (options) {
        var element = $(this)
        var data = element.data('mselect');
        
        if (!data) {
            element.data('mselect', (data = new MSelect(element, options)));
        }
        
        if (typeof options == 'string') {
            return data[options].apply(data, Array.prototype.slice.call(arguments, 1));
        } else {
            return data;
        }
    };
    
    $.fn.mselect.constructor = MSelect;
    
})(jQuery);