let datatable = {
    day: null,
    week: null,
    month: null,
    all: null
};
let charts = {
    profit: null,
    binance: null
}
$(document).ready(function () {
    var elements = [].slice.call(document.querySelectorAll('[data-kt-daterangepicker="true"]'));
    var start = moment().subtract(29, 'days');
    var end = moment();
    elements.map(function (element) {
        var display = element.querySelector('div');
        var attrOpens = element.hasAttribute('data-kt-daterangepicker-opens') ? element.getAttribute('data-kt-daterangepicker-opens') : 'left';
        var cb = function (start, end) {
            if (display) {
                display.innerHTML = start.format('YYYY-MM-DD') + ' - ' + end.format('YYYY-MM-DD');
            }
        }
        $(element).daterangepicker({
            startDate: start,
            endDate: end,
            opens: attrOpens,
            ranges: {
                'Last 30 Days': [moment().subtract(29, 'days'), moment()],
                'This Month': [moment().startOf('month'), moment().endOf('month')],
                'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
            }
        }, cb);
        cb(start, end);
    });
    getTable("day");
    getChartProfit();
    getChartBinance();
});
$(".nav-item a").on('shown.bs.tab', function (event) {
    let select = $(this).attr("href").replace(/\#kt\_table_overview\_/, "");
    getTable(select);
});
$(document).on("submit", "#charts_filter", function(e) {
    e.preventDefault();
    getChartProfit();
    getChartBinance();
});
const getChartProfit = () => {
    let UserId = $("#filter-UserId").val();
    let BinanceId = $("#filter-BinanceId").val();
    let dateRange = $("#date-range").text().trim();
    $.ajax({
        type: "POST",
        url: `/${dashboard}/statistics/chart/profit/`,
        data: `UserId=${UserId}&BinanceId=${BinanceId}&dateRange=${dateRange}`,
        success: (data) => {
            //
            let array = [];
            for (const item of data.data) {
                let date = new Date(item.date).getTime();
                array.push([date, Number(item.pnl.toFixed(2))]);
            }
            var options = {
                chart: {
                    type: 'area',
                    stacked: false,
                    height: 345,
                    zoom: {
                        type: 'x',
                        enabled: false
                    },
                    toolbar: {
                        show: true,
                        autoSelected: 'zoom'
                    }
                },
                colors: ["#4d79f6"],
                dataLabels: {
                    enabled: false
                },
                series: [{
                    name: 'PNL',
                    data: array
                }],
                xaxis: {
                    type: 'datetime',
                    axisBorder: {
                        show: true,
                        color: '#bec7e0',
                    },
                    axisTicks: {
                        show: true,
                        color: '#bec7e0',
                    },
                },

                tooltip: {
                    shared: false,
                    y: {
                        formatter: function (val) {
                            return val + " USDT"
                        }
                    }
                }
            }
            try {
                charts.profit.destroy();
            } catch(ex) {

            }
            charts.profit = new ApexCharts(
                document.querySelector("#kt_charts_profit"),
                options
            );
            charts.profit.render();
        },
        error: (err) => {
            toastr.error(err.responseJSON.msg);
        }
    });
}
const getChartBinance = () => {
    let dateRange = $("#date-range").text().trim();
    $.ajax({
        type: "POST",
        url: `/${dashboard}/statistics/chart/binance/`,
        data: `dateRange=${dateRange}`,
        success: (data) => {
            //
            let total = 0;
            let labels = [], pnl = [];
            for (const item of data.data) {
                labels.push(item.Binance.email);
                pnl.push(Number(item.pnl.toFixed(2)));
                total += item.pnl;
            }
            var options = {
                chart: {
                    height: 345,
                    type: 'pie',
                }, 
                series: pnl,
                labels,
                // colors: ["#4ac7ec", "#4d79f6","#1ecab8", "#f1646c", "#6c757d"],
                legend: {
                    show: true,
                    position: 'bottom',
                    horizontalAlign: 'center',
                    verticalAlign: 'middle',
                    floating: false,
                    fontSize: '14px',
                    offsetX: 0,
                    offsetY: -10
                },
                responsive: [{
                    breakpoint: 600,
                    options: {
                        chart: {
                            height: 240
                        },
                        legend: {
                            show: false
                        },
                    }
                }]
            }
            try {
                charts.binance.destroy();
            } catch(ex) {

            }
            charts.binance = new ApexCharts(
                document.querySelector("#kt_charts_binance"),
                options
            );
            charts.binance.render();
            $("#total").text(`$${numberFormat(total)}`);
        },
        error: (err) => {
            toastr.error(err.responseJSON.msg);
        }
    });
}
const getTable = (select) => {
    if (!datatable[select]) {
        datatable[select] = $(`#kt_datatable_overview_${select}`).DataTable({
            processing: true,
            serverSide: true,
            destroy: true,
            ajax: {
                url: `/${dashboard}/statistics/dashboard/${select}/`,
                type: "POST"
            },
            select: {
                style: 'multi',
                selector: 'td:first-child'
            },
            stateSave: true,
            order: [0, "desc"],
            columns: [{
                data: "UserId"
            }, {
                data: "email"
            }, {
                data: "balance"
            }, {
                data: "capital"
            }, {
                data: "pnl"
            }, {
                data: "percent"
            }],
            columnDefs: [{
                targets: 0,
                title: "User",
                orderable: false,
                render: (data, type, full, meta) => {
                    return `<span class="badge badge-light">${full.User.username}</span>`;
                }
            }, {
                targets: 1,
                title: "Email",
                orderable: false,
                render: (data, type, full, meta) => {
                    return `<span class="badge badge-success">${data}</span>`;
                }
            }, {
                targets: 2,
                title: "Balance",
                orderable: false,
                render: (data, type, full, meta) => {
                    let val = Number(data);
                    return `<span class="badge badge-primary">$${val.toFixed(2)}</span>`;
                }
            }, {
                targets: 3,
                title: "Vốn",
                orderable: false,
                render: (data, type, full, meta) => {
                    let val = Number(data);
                    return `<span class="badge badge-primary">$${val.toFixed(2)}</span>`;
                }
            }, {
                targets: 4,
                title: "PNL",
                orderable: false,
                render: (data, type, full, meta) => {
                    let val = Number(data);
                    return `<span class="badge badge-${val >= 0 ? "success" : "danger"}">$${val.toFixed(2)}</span>`;
                }
            }, {
                targets: 5,
                title: "Percent",
                orderable: false,
                render: (data, type, full, meta) => {
                    let capital = Number(full.capital); // vốn
                    // let balance = Number(full.balance); // số dư hiện tại
                    let balance = Number(full.capital) + Number(full.pnl); // số tiền đã kiếm đc
                    let percent = (balance / capital * 100) - 100;
                    return `<span class="badge badge-${percent > 0 ? "success" : "danger"}">${percent.toFixed(2)}%</span>`;
                }
            }]
        });
    }
}