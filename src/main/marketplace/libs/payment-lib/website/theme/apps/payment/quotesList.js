(function (w) {
    var dataTable = null;

    var proposalDetailsForms = $(".proposal-details-form");
    if( proposalDetailsForms.length > 0 ) {
        proposalDetailsForms.forms({
            onSuccess : function() {
                alert("yo");
            }
        });
    };

    function initDataTable(hits) {
        if (dataTable !== null) {
            dataTable.clear(false);
        }

        $('#leadBody').empty();

        dataTable = $('#quotesTable').DataTable({
            paging: false,
            searching: false,
            destroy: true,
            info: false,
            select: true
        });
    };

    function reloadQuoteTable() {
        var href = window.location.pathname;
        
        $('#quoteTableWrapper').reloadFragment({
            url: href,
            whenComplete: function () {
                $('abbr.timeago').timeago();
            }
        });
    }

    function initDateTimePicker() {
        var date = new Date();
        date.setDate(date.getDate() - 1);
        $('body').css('position', 'relative');
        var opts = {
            widgetParent: 'body',
            format: "DD/MM/YYYY HH:mm",
            minDate: moment()
        };

        $('#quoteExpiryDate').datetimepicker(opts);

        $('#quoteExpiryDate').on('dp.show', function () {
            var datepicker = $('body').find('.bootstrap-datetimepicker-widget:last');
            if (datepicker.hasClass('bottom')) {
                var top = $(this).offset().top - $(this).outerHeight();
                var left = $(this).offset().left;
                datepicker.css({
                    'top': top + 'px',
                    'bottom': 'auto',
                    'left': left + 'px',
                    'z-index': 9999
                });
            } else if (datepicker.hasClass('top')) {
                var top = $(this).offset().top - datepicker.outerHeight() - 40;
                var left = $(this).offset().left;
                datepicker.css({
                    'top': top + 'px',
                    'bottom': 'auto',
                    'left': left + 'px',
                    'z-index': 9999
                });
            }
        });
    };

    function initModalForm() {
        var modal = $("#addQuoteModal");
        var form = modal.find("form");

        form.forms({
            onSuccess: function (resp) {
                flog("done", resp);
                modal.modal('hide');
                Msg.success('Quote is created!');
                reloadQuoteTable();
            }
        });
    };

    function initQuoteStatusSelect() {
        $('body').on('change', 'input[name=quoteStatus]', function (e) {
            var btn = $(this);
            var quoteStatus = btn.attr('id');

            window.location = window.location.pathname + "?state=" + quoteStatus;
        });
    };

    w.initQuotesListPage = function () {
        initDataTable();
        initModalForm();
        initDateTimePicker();
        initQuoteStatusSelect();
    };
    
    w.newProposal = function() {
        if ($('input[ name = "quote-for-proposal" ]:checked').length === 0) {
            alert("You Must at least pick up one quotation for a proposal!");
            
            return;
        }
        
        var proposalData = {
            "selectedQuotes[]": [],
            createProposalFolder: true
        };
        
        $('input[ name = "quote-for-proposal" ]:checked').each(function() {
            proposalData['selectedQuotes[]'].push($(this).val());
        });
        
        $.ajax({
           url: "/proposals/",
           method: "POST", 
           dataType: "json",
           data: proposalData,
           success: function(data) {
               if (data.status) {
                    Msg.success('Proposal Added Successfully');
               } else {
                   if (data.messages.length > 0) {
                       Msg.error(data.messages[0]);
                   } else {
                       Msg.error('Could not create proposal');
                   }
               }
           }
        });
    };

    $(document).ready(function(){

        if($('.quotes-list-component').length > 0) {
            initQuotesListPage();
        }
    });

})(this);