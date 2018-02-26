/*
 Created by Wesley on 23/02/2018.
 */

(function ($) {
    var KEditor = $.keditor;
    var flog = KEditor.log;

    KEditor.components['linkedinShareButton'] = {
        settingEnabled: true,

        settingTitle: 'LinkedIn Share Settings',

        initSettingForm: function (form, keditor) {
            flog('initSettingForm "linkedinShareButton" component', form, keditor);

            return $.ajax({
                url: '_components/linkedinShareButton?settings',
                type: 'GET',
                dataType: 'html',
                success: function (resp) {
                    form.html(resp);

                    form.find('.shareUrl').on('change', function () {
                        var component = keditor.getSettingComponent();
                        var dynamicElement = component.find('[data-dynamic-href]');
                        component.attr('data-share-url', this.value);
                        keditor.initDynamicContent(dynamicElement);
                    });

                    form.find('.useCurrent').on('change', function () {
                        var component = keditor.getSettingComponent();
                        var dynamicElement = component.find('[data-dynamic-href]');
                        component.attr('data-use-current', this.value);

                        if (this.value == 'true') {
                            form.find('.shareUrlWrapper').hide();
                        } else {
                            form.find('.shareUrlWrapper').show();
                        }

                        keditor.initDynamicContent(dynamicElement);
                    });
                }
            });
        },

        showSettingForm: function (form, component, keditor) {
            flog('showSettingForm "linkedinShareButton" component', form, component, keditor);

            var dataAttributes = keditor.getDataAttributes(component, ['data-type'], false);

            form.find('.shareUrl').val(dataAttributes['data-share-url']);
            form.find('.useCurrent').val(dataAttributes['data-use-current'] || 'true');
        }
    };

})(jQuery);