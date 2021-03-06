(function ($) {
    var timer;
    
    $(function () {
        var modal = $('#modal-translate');
        if (modal.length > 0) {
            initMultiLingual(modal);
        }
    });
    
    function initMultiLingual(modal) {
        flog('initMultiLingual', modal);
        
        initModalTranslate(modal);
        
        $('.select-lang').on('click', function (e) {
            e.preventDefault();
            
            var langCode = $(this).attr('href');
            flog('Selected lang: ' + langCode);
            
            $.cookie('selectedLangCode', langCode, {
                expires: 360, path: '/'
            });
            window.location.reload();
        });
        
        $(document.body).on({
            'focus mouseenter': function () {
                showTranslateButton($(this));
            },
            'blur mouseleave': function () {
                hideTranslateButton();
            }
        }, '.translatable');
        
        $(document.body).on({
            'focus mouseenter': function () {
                clearTimeout(timer);
            },
            'blur mouseleave': function () {
                hideTranslateButton();
            }
        }, '#btn-translate');
    }
    
    function showTranslateButton(target) {
        flog('showTranslateButton', target);
        
        clearTimeout(timer);
        
        var btn = $('#btn-translate');
        btn.off('click').on('click', function (e) {
            e.preventDefault();
            
            showModalTranslate(target);
            hideTranslateButton(true);
        });
        
        var position;
        if (target.is('.htmleditor')) {
            position = $('#cke_' + target.attr('id')).offset();
        } else {
            position = target.offset();
        }
        
        position.top = position.top - btn.innerHeight();
        if (position.top < 0) {
            position.top += (btn.innerHeight() * 2);
        }
        
        btn.css(position).show();
    }
    
    function initModalTranslate(modal) {
        flog('initModalTranslate', modal);
        
        modal.find('form').forms({
            onSuccess: function (resp) {
                if (resp.status) {
                    Msg.info("Translated text is saved");
                    modal.modal('hide');
                } else {
                    Msg.error("There was a problem saving the translation " + resp.messages);
                }
            }
        });
        
        modal.on('hidden.bs.modal', function () {
            modal.find('[name=translated]').prop('disabled', true).removeClass('required').hide();
            modal.find('.htmleditor-wrapper').hide();
            modal.find('.form-message').html('').hide();
            
            try {
                var ckeditor = CKEDITOR.instances[modal.find('.htmleditor').attr('id')];
                ckeditor.setReadOnly(true);
            } catch (e) {
            }
        });
        
        return modal;
    }
    
    function showModalTranslate(target) {
        flog('showTranslateButton', target);
        
        var modal = $('#modal-translate');
        if (modal.length === 0) {
            modal = initModalTranslate();
        }
        
        var sourceType = target.data("source-type");
        if (sourceType == null) {
            sourceType = target.closest("form").data("source-type");
        }
        var sourceId = target.data("source-id");
        if (sourceId == null) {
            sourceId = target.closest("form").data("source-id");
        }
        var sourceText = target.data("source-text");
        if (sourceText == null) {
            sourceText = target.closest("form").data("source-text");
        }
        var sourceField = target.data("source-field");
        var langCode = $.cookie('selectedLangCode');
        
        modal.find('[name=sourceType]').val(sourceType);
        modal.find('[name=sourceId]').val(sourceId);
        modal.find('[name=sourceText]').val(sourceText);
        modal.find('[name=sourceField]').val(sourceField);
        modal.find('[name=langCode]').val(langCode);
        
        $.ajax({
            url: '/translations',
            dataType: 'json',
            type: 'get',
            headers: {
                'Content-Type': 'application/json'
            },
            data: {
                sourceType: sourceType,
                sourceId: sourceId,
                sourceText: sourceText,
                sourceField: sourceField,
                langCode: langCode,
                asJson: true
            },
            success: function (resp) {
                var translatedText = '';
                if (resp && resp.status && resp.data.length > 0) {
                    translatedText = resp.data[0].translated || '';
                }
                
                var modalSize = 'modal-md';
                var translatedTextboxes = modal.find('[name=translated]');
                var destinationTextbox;
                if (target.is('textarea.htmleditor')) {
                    modalSize = 'modal-lg';
                    destinationTextbox = translatedTextboxes.filter('textarea.htmleditor');
                    modal.find('.htmleditor-wrapper').show();
                    
                    
                    var ckeditor = CKEDITOR.instances[destinationTextbox.attr('id')];
                    if (ckeditor) {
                        ckeditor.setReadOnly(false);
                        ckeditor.setData(translatedText);
                    } else {
                        initHtmlEditors(modal.find('.htmleditor'), function (editor) {
                            editor.setData(translatedText);
                        });
                    }
                } else if (target.is('input')) {
                    destinationTextbox = translatedTextboxes.filter('input');
                } else {
                    destinationTextbox = translatedTextboxes.filter('textarea').not('.htmleditor');
                }
                
                destinationTextbox.prop('disabled', false).addClass('required').not('.htmleditor').show();
                destinationTextbox.val(translatedText);
                
                modal.find('.modal-dialog').attr('class', 'modal-dialog ' + modalSize);
                modal.modal('show');
            }
        });
    }
    
    function hideTranslateButton(immediate) {
        timer = setTimeout(function () {
            $('#btn-translate').hide();
        }, immediate ? 0 : 400);
    }
    
})(jQuery);