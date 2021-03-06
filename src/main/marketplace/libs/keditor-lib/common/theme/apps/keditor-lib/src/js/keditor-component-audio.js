(function ($) {
    var KEditor = $.keditor;
    var flog = KEditor.log;
    
    KEditor.components['audio'] = {
        init: function (contentArea, container, component, keditor) {
            flog('init "audio" component', component);
            
            this.component = component;
            var img = component.find('img[data-src]');
            var componentId = '';
            if (!img.attr('id')) {
                componentId = keditor.generateId('component-audio');
                img.attr('id', componentId);
            } else {
                componentId = img.attr('id');
            }
            if (!img.parent().hasClass('audio-wrapper')) {
                img.wrap('<div class="audio-wrapper"></div>');
            }
            this.src = img.attr('data-src');
            this.width = img.attr('data-width');
            this.autostart = img.attr('data-autostart') === 'true';
            this.buildJWAudioPlayerPreview(componentId);
        },
        
        getContent: function (component, keditor) {
            flog('getContent "audio" component', component);
            
            var img = component.find('img[data-src]');
            var componentId = img.attr('id');
            
            var html = '<img data-componentId="' + componentId + '" src="/theme/apps/content/preview/audio.png" data-autostart="' + this.autostart + '" data-width="' + this.width + '" data-src="' + this.src + '" data-kaudio="' + this.src + '" />';
            return html;
        },
        
        settingEnabled: true,
        
        settingTitle: 'Audio settings',
        
        initSettingForm: function (form, keditor) {
            flog('init "audio" settings', form);
            
            return $.ajax({
                url: '/theme/apps/keditor-lib/componentAudioSettings.html',
                type: 'get',
                dataType: 'HTML',
                success: function (resp) {
                    form.html(resp);
                }
            });
        },
        
        showSettingForm: function (form, component, keditor) {
            flog('showSettingForm "audio" component', form, component);
            
            var instance = this;
            var btnAudioFileInput = form.find('.btn-audioFileInput');
            btnAudioFileInput.mselect({
                contentType: 'audio',
                bs3Modal: true,
                pagePath: keditor.options.pagePath,
                basePath: keditor.options.basePath,
                onSelectFile: function (url) {
                    instance.src = url;
                    var component = keditor.getSettingComponent();
                    var img = component.find('object');
                    var componentId = img.attr('id');
                    instance.componentId = componentId;
                    instance.refreshAudioPlayerPreview();
                }
            });
            

            var autoplayToggle = form.find('#audio-autoplay');
            if (this.autostart) {
                autoplayToggle.prop('checked', true);
            }
            autoplayToggle.on('click', function (e) {
                var component = keditor.getSettingComponent();
                var img = component.find('object');
                var componentId = img.attr('id');
                instance.autostart = this.checked;
                instance.buildJWAudioPlayerPreview(componentId);
            });
            
            var audioWidth = form.find('#audio-width');
            audioWidth.val(this.width);
            audioWidth.on('change', function () {
                var component = keditor.getSettingComponent();
                var img = component.find('object');
                var componentId = img.attr('id');
                instance.componentId = componentId;
                instance.width = this.value;
                instance.resizeAudioPlayerPreview();
            });
        },
        
        buildJWAudioPlayerPreview: function (componentId) {
            var width = this.width;
            var src = this.src;
            var autostart = this.autostart;
            var playerInstance = jwplayer(componentId);
            playerInstance.setup({
                file: src,
                width: width,
                height: 30,
                autostart: autostart,
                flashplayer: window.JWPLAYER_LIB_PATH_FLASH,
                html5player: window.JWPLAYER_LIB_PATH_HTML5,
                primary: "flash"
            });
            playerInstance.onReady(function () {
                log('jwplayer preview init done');
            });
        },
        
        refreshAudioPlayerPreview: function () {
            var instance = this;
            var playerInstance = jwplayer(instance.componentId);
            var src = instance.src;
            playerInstance.load([{
                file: src
            }]);
            playerInstance.play();
        },
        
        resizeAudioPlayerPreview: function () {
            var instance = this;
            var playerInstance = jwplayer(instance.componentId);
            var width = instance.width;
            
            playerInstance.resize(width, 30);
        }
    };
    
})(jQuery);
