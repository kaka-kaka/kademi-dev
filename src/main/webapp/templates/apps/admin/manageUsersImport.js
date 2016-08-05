/**
 * Created by Anh on 4/8/2016.
 */

var usersImportUrl = '/manageUsers/userFile';
var importWizardStarted = false;
function initManageUsersImport() {
    initUploads();
}


function initUploads() {
    var form = $("#importerWizard form");

    $('#myWizard').wizard();
    $('#importerWizard').on('show.bs.collapse', function () {
        var curStep = $('#myWizard').wizard('selectedItem');
        if (!form.find('input[name=fileHash]').val()) {
            curStep = {step: 1};
        }
        $('#myWizard').wizard('selectedItem', curStep);
    });
    $('#myWizard').on('finished.fu.wizard', function (evt, data) {
        $('.btn-upload-users-csv').trigger('click');
        $('#myWizard').wizard('selectedItem', {step: 1});
        $('#myWizard').find('form').trigger('reset');
        form.find("input[name=fileHash]").val('')
    });

    $('#myWizard').on('changed.fu.wizard', function (evt, data) {
        if (data.step === 1) {
            // IE 11 fix
            var ul = $('#myWizard').find('ul.steps');
            if (ul.css('margin-left') !== '0') {
                ul.css('margin-left', '0');
            }
        }

        if (data.step === 3) {
            var fileHash = form.find('[name=fileHash]').val();
            var startRow = form.find('[name=startRow]').val();
            var formData = {beforeImport: 'beforeImport', fileHash: fileHash, startRow: startRow};
            form.find('select').each(function () {
                if (this.value) {
                    formData[this.name] = this.value;
                }
            });
            form.find('[type=submit]').addClass('hide');
            $.ajax({
                url: usersImportUrl,
                data: formData,
                type: 'post',
                dataType: 'json',
                success: function (resp) {
                    if (resp.status && resp.data) {
                        form.find('[type=submit]').removeClass('hide');
                        form.find(".beforeImportInfo").text('New profiles found: ' + resp.data.newProfilesCount + ', existing profiles found: ' + resp.data.existingProfilesCount);
                    } else {
                        form.find(".beforeImportInfo").text('Cannot verify data to import');
                    }
                },
                error: function (err) {
                    form.find(".beforeImportInfo").text('Cannot verify data to import');
                }
            });
        }
    });

    $('#myWizard').on('actionclicked.fu.wizard', function (evt, data) {
        if (data.step === 1 && $('#importerWizard').attr('aria-expanded') == 'true') {
            if (form.find("input[name=fileHash]").val() == "") {
                if ($('#btn-upload').length) {
                    Msg.error("Please select a file to upload");
                } else {
                    Msg.error("Sale Group hasn't been set. Please contact administrator for assistant.");
                }
                evt.preventDefault();
            }
        }

        if (data.step === 2) {
            var startRow = $('#startRow').val();
            if (!startRow) {
                Msg.error('Please enter start row value');
                $('#startRow').trigger('focus').parents('.form-group').addClass('has-error');
                evt.preventDefault();
                return false;
            } else {
                $('#startRow').parents('.form-group').removeClass('has-error');
            }

            var importerHead = $('#importerHead');
            var selectedCols = [];
            var requiredField = 'groupName';
            importerHead.find('select').each(function () {
                if (this.value) {
                    selectedCols.push(this.value);
                }
            });

            var defaultGroup = $('#defaultGroup').val();
            var removalMode = $('#removalMode').val();

            if (!selectedCols.length){
                Msg.error('Please select at least 1 destination field to continue.');
                importerHead.find('select').first().trigger('focus');
                evt.preventDefault();
                return false;
            }

            if (!defaultGroup && selectedCols.indexOf(requiredField) === -1) {
                if (!removalMode){
                    Msg.error('Please select default group or indicate group field in data table');
                    importerHead.find('select').first().trigger('focus');
                    evt.preventDefault();
                    return false;
                }
            }

            var uniqueFields = ['email', 'userId', 'phone'];
            if (removalMode) {
                // remove/unsubscribe mode enable
                var canRemove = false;
                for(var i = 0; i < uniqueFields.length; i++){
                    if (selectedCols.indexOf(uniqueFields[i]) !== -1){
                        canRemove = true;
                        break;
                    }
                }
                if (!canRemove){
                    Msg.error('Please select either Email, UserId or Phone field to identify the profiles to unsubscribe/remove');
                    evt.preventDefault();
                    return false;
                }
            }
        }

        if (data.step === 3) {
            if (!importWizardStarted) {
                Msg.error("Importing process hasn't been started yet");
                evt.preventDefault();
                return false;
            }
        }
    });

    flog("Init importer form", form);
    form.forms({
        postUrl: usersImportUrl,
        beforePostForm: function(form, config, data){
            importWizardStarted = true;
            return data;
        },
        onSuccess: function (resp, form, config) {
            $('#myWizard').wizard("next");
            doCheckProcessStatus(usersImportUrl);
        }
    });

    $('#btn-upload').mupload({
        url: usersImportUrl,
        useJsonPut: false,
        buttonText: '<i class="clip-folder"></i> Upload CSV, XLS, XLSX',
        acceptedFiles: '.csv,.xlsx,.xls,.txt',
        oncomplete: function (resp, name, href) {
            flog("oncomplete", resp, name, href);

            var data = resp.result.data;
            flog("got data", data);
            var table = data.table;
            form.find("input[name=fileHash]").val(table.hash);
            var fields = data.destFields;
            fields = sortObjectByValue(fields);
            var thead = $("#importerHead");
            thead.html("");
            flog("headers:", data.numCols);
            $('#importerTable').css({width: (data.numCols * 200) + 'px', maxWidth: 'none', minWidth: '100%'});
            thead.append("<th>#</th>");
            for (var col = 0; col < data.numCols; col++) {
                var td = $('<th style="min-width: 200px">');
                thead.append(td);
                var select = $("<select class='form-control' name='col" + col + "'>");
                select.append("<option value=''>[Do not import]</option>");

                for (var field in fields) {
                    select.append("<option value='" + field + "'>" + fields[field] + "</option>");
                }

                td.append(select);
            }
            flog("done head", thead);

            var tbody = $("#importerBody");
            tbody.html("");
            var numRows = 0;
            $.each(table.rows, function (i, row) {
                if (numRows < 50) {
                    numRows++;
                    var tr = $("<tr>");
                    tbody.append(tr);
                    var td = $("<td>" + i + "</td>");
                    tr.append(td);
                    $.each(row, function (i, cell) {
                        var td = $("<td>");
                        td.html(cell);
                        tr.append(td);
                    });
                }
            });

            $('#myWizard').wizard("next");
        }
    });

    $('#btn-cancel-import').on('click', function (e) {
        e.preventDefault();

        $.ajax({
            type: 'post',
            url: usersImportUrl,
            data: {cancel: 'cancel'},
            success: function (data) {
                Msg.success('Import task cancelled');
            },
            error: function () {

            }
        });
    });
}

function checkProcessStatus() {
    flog("checkProcessStatus");
    var jobTitle = $(".job-title");
    var resultStatus = $('#job-status');
    $.ajax({
        type: 'GET',
        dataType: "json",
        url: usersImportUrl + "?importStatus",
        success: function (result) {
            flog("success", result);
            if (result.status) {
                resultStatus.text(result.messages[0]);
                if (result.data) {
                    var state = result.data.state;
                    flog("state", state);

                    if (result.data.statusInfo.complete) {
                        var dt = result.data.statusInfo.completedDate;
                        flog("Process Completed", dt);
                        jobTitle.text("Process finished at " + pad2(dt.hours) + ":" + pad2(dt.minutes));

                        if (typeof state.updatedProfiles !== 'undefined') {
                            $('#myWizard').find('.updatedProfiles').text(state.updatedProfiles)
                        }
                        if (typeof state.createdProfiles !== 'undefined') {
                            $('#myWizard').find('.createdProfiles').text(state.createdProfiles)
                        }

                        if (typeof state.removedProfiles !== 'undefined') {
                            $('#myWizard').find('.removedProfiles').text(state.removedProfiles)
                        }
                        if (typeof state.unsubbedProfiles !== 'undefined') {
                            $('#myWizard').find('.unsubbedProfiles').text(state.unsubbedProfiles)
                        }
                        if (typeof state.errorProfiles !== 'undefined') {
                            $('#myWizard').find('.errorProfiles').text(state.errorProfiles)
                        }

                        $('#myWizard').wizard("next");
                        $('#table-users-body').reloadFragment({url: '/manageUsers/'});
                        $('#aggregationsContainer').reloadFragment({url: '/manageUsers/'});
                        importWizardStarted = false;
                        return; // dont poll again
                    } else {
                        // running
                        flog("Message", result.messages[0]);
                        resultStatus.text(result.messages[0]);
                        jobTitle.text("Process running...");
                    }

                } else {
                    // waiting to start
                    jobTitle.text("Waiting for process job to start ...");
                }
                window.setTimeout(doCheckProcessStatus, 2500);

            } else {
                flog("No task");
            }
        },
        error: function (resp) {
            flog("weird..", resp);
        }
    });
}

function doCheckProcessStatus() {
    checkProcessStatus();
}

function sortObjectByValue(obj) {
    var sorted = {};
    var prop;
    var arr = [];

    for (prop in obj) {
        if (obj.hasOwnProperty(prop)) {
            var o = {key: prop, value: obj[prop]};
            arr.push(o);
        }
    }

    arr.sort(function(a,b){
        if (a.value > b.value) return 1;
        if (a.value < b.value) return -1;
        return 0;
    });

    for (i = 0; i < arr.length; i++) {
        sorted[arr[i].key] = arr[i].value;
    }

    return sorted;
}