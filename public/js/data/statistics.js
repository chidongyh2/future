var datatable  = null;
$(document).ready(function() {
    var elements = [].slice.call(document.querySelectorAll('[data-kt-daterangepicker="true"]'));
    // var start = moment().subtract(29, 'days');
    var start = moment();
    var end = moment();

    elements.map(function (element) {
        var display = element.querySelector('div');
        var attrOpens  = element.hasAttribute('data-kt-daterangepicker-opens') ? element.getAttribute('data-kt-daterangepicker-opens') : 'left';

        var cb = function(start, end) {
            if (display) {
                display.innerHTML = start.format('YYYY-MM-DD') + ' - ' + end.format('YYYY-MM-DD');
            }
        }

        $(element).daterangepicker({
            startDate: start,
            endDate: end,
            opens: attrOpens,
            ranges: {
            'Today': [moment(), moment()],
            'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
            'Last 7 Days': [moment().subtract(6, 'days'), moment()],
            'Last 30 Days': [moment().subtract(29, 'days'), moment()],
            'This Month': [moment().startOf('month'), moment().endOf('month')],
            'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
            }
        }, cb);

        cb(start, end);
    });
});
$(document).ready(function() {
    let clipboard = null;
    let table = new DataTable();
    datatable = $(`#kt_datatable`).DataTable({
        processing: true,
        serverSide: true,
        ajax: {
            url: `/${dashboard}/${site.datatable.url}/ajax/`,
            type: "POST"
        },
        stateSave: true,
        order: [0, "desc"],
        columns: table.generateColumn(),
        columnDefs: table.generateColumnDefs(),
        bPaginate: (site.type === "statistics" && site.action === "positions") ? false : true
    });

    datatable.on('draw', function() {
        try {
            clipboard.destroy();
        } catch(ex) {}
        clipboard = new ClipboardJS('[data-clipboard=true]').on('success', function(e) {
            e.clearSelection();
            toastr.success("Copied!");
        });
        if(site.datatable.isGetBalance) {
            getBalance()
        }
        if(site.action === "positions") {
            setTimeout(() => {
                refreshDatatable();
            }, 2000);
        }
    });
});


const filterDatatable = () => {
    var $itemFilters = $("#frm_filter .item-filter");
    var search = $("#kt_search").val();
    var filterDate = $("#filterDate").text();
    datatable.search(search);
    $.each($itemFilters, function(i, $item) {
        let index = $($item).attr("data-index");
        let valueSearch = $($item).val().trim();
        if(filterDate) datatable.columns(7).search(filterDate);
        if(index) datatable.columns(index).search(valueSearch);
    });
    datatable.draw();
}
const refreshDatatable = () => {
    datatable.ajax.reload(null, false);
}

$(document).on("submit", "#frm_filter", function(e) {
    e.preventDefault();
    filterDatatable();
});
$(document).on("keypress", "#kt_search", function() {
    setTimeout(function() {
        filterDatatable();
    }, 500);
})