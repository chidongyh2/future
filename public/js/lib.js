const numberFormat = (number, decimals, decPoint, thousandsSep) => {
    number = (number + '').replace(/[^0-9+\-Ee.]/g, '')
    const n = !isFinite(+number) ? 0 : +number
    const prec = !isFinite(+decimals) ? 0 : Math.abs(decimals)
    const sep = (typeof thousandsSep === 'undefined') ? ',' : thousandsSep
    const dec = (typeof decPoint === 'undefined') ? '.' : decPoint
    let s = ''
    const toFixedFix = function (n, prec) {
    if (('' + n).indexOf('e') === -1) {
        return +(Math.round(n + 'e+' + prec) + 'e-' + prec)
    } else {
        const arr = ('' + n).split('e')
        let sig = ''
        if (+arr[1] + prec > 0) {
            sig = '+'
        }
        return (+(Math.round(+arr[0] + 'e' + sig + (+arr[1] + prec)) + 'e-' + prec)).toFixed(prec)
    }
    }
    // @todo: for IE parseFloat(0.55).toFixed(0) = 0;
    s = (prec ? toFixedFix(n, prec).toString() : '' + Math.round(n)).split('.')
    if (s[0].length > 3) {
        s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep)
    }
    if ((s[1] || '').length < prec) {
        s[1] = s[1] || ''
        s[1] += new Array(prec - s[1].length + 1).join('0')
    }
    return s.join(dec)
}
const calculatePercent = (first, later) => {
    return Number(((later - first) / first * 100).toFixed(2));
}
const getBalance = () => {
    const timeout = 5000;
    $.ajax({
        type: "GET",
        url: `/${dashboard}/binance/balance/`,
        success: (data) => {
            if(data.status == 1) {
                let list = data.data;
                for(const item of list) {
                    if(Number(item.crossUnPnl) >= 0) {
                        $(`#pnl-${item.id}`).removeClass("badge-danger");
                        $(`#pnl-${item.id}`).addClass("badge-success");
                        $(`#pnl-${item.id}`).html(`<span class="svg-icon svg-icon-5 svg-icon-white ms-n1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <rect opacity="0.5" x="13" y="6" width="13" height="2" rx="1" transform="rotate(90 13 6)" fill="currentColor"></rect>
                                <path d="M12.5657 8.56569L16.75 12.75C17.1642 13.1642 17.8358 13.1642 18.25 12.75C18.6642 12.3358 18.6642 11.6642 18.25 11.25L12.7071 5.70711C12.3166 5.31658 11.6834 5.31658 11.2929 5.70711L5.75 11.25C5.33579 11.6642 5.33579 12.3358 5.75 12.75C6.16421 13.1642 6.83579 13.1642 7.25 12.75L11.4343 8.56569C11.7467 8.25327 12.2533 8.25327 12.5657 8.56569Z" fill="currentColor"></path>
                            </svg>
                        </span>`);
                    } else {
                        $(`#pnl-${item.id}`).removeClass("badge-success");
                        $(`#pnl-${item.id}`).addClass("badge-danger");
                        $(`#pnl-${item.id}`).html(`<span class="svg-icon svg-icon-5 svg-icon-white ms-n1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <rect opacity="0.5" x="11" y="18" width="13" height="2" rx="1" transform="rotate(-90 11 18)" fill="currentColor"></rect>
                                <path d="M11.4343 15.4343L7.25 11.25C6.83579 10.8358 6.16421 10.8358 5.75 11.25C5.33579 11.6642 5.33579 12.3358 5.75 12.75L11.2929 18.2929C11.6834 18.6834 12.3166 18.6834 12.7071 18.2929L18.25 12.75C18.6642 12.3358 18.6642 11.6642 18.25 11.25C17.8358 10.8358 17.1642 10.8358 16.75 11.25L12.5657 15.4343C12.2533 15.7467 11.7467 15.7467 11.4343 15.4343Z" fill="currentColor"></path>
                            </svg>
                        </span>`);
                    }
                    $(`#balance-${item.id}`).text(`$${item.balance}`);
                    $(`#pnl-${item.id}`).append(`$${item.crossUnPnl}`);
                    // $(`#pnl-long-${item.id}`).text(`${item.pnl.long} USDT`);
                    // $(`#pnl-short-${item.id}`).text(`${item.pnl.short} USDT`);
                }
                setTimeout(() => {
                    getBalance();
                }, timeout);
            } else {
                toastr.error(data.msg);
                setTimeout(() => {
                    getBalance();
                }, timeout);
            }
        },
        error: (err) => {
            toastr.error(err.responseJSON.msg);
            setTimeout(() => {
                getBalance();
            }, timeout);
        }
    });
}
const AjaxAuth = (e) => {
    let url = $(e).attr("action");
    $.ajax({
        type: "POST",
        url: url,
        data: $(e).serialize(),
        success: (data) => {
            if(data.status == 1) {
                toastr.success(data.msg);
                setTimeout(() => {
                    location.reload();
                }, 500)
            } else {
                toastr.error(data.msg);
            }
        },
        error: (err) => {
            toastr.error(err.responseJSON.msg);
        }
    });
}
const deleteItem = (url, id) => {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: "POST",
            url,
            data: `id=${id}`,
            success: (data) => {
                if (data.status == 1) {
                    resolve("OK");
                } else {
                    reject();
                }
            },
            error: () => {
                reject();
            }
        });
    })
}
$(document).on("submit", "#kt_modal_edit_form, #kt_modal_add_form, #kt_modal_close_order_form, #kt_modal_add_multi_form", function(e) {
    e.preventDefault();
    let url = $(this).attr("action");
    $.ajax({
        type: "POST",
        url: url,
        data: $(this).serialize(),
        success: (data) => {
            if(data.status == 1) {
                if(data.redirect) {
                    location.assign(data.redirect);
                } else {
                    toastr.success(data.msg);
                    $("#kt_modal_add").modal("hide");
                    $("#kt_modal_edit").modal("hide");
                    $("#kt_modal_clear").modal("hide");
                    $("#kt_modal_add_multi").modal("hide");
                    $(e).trigger("reset");
                    setTimeout(function(){
                        refreshDatatable();
                    }, 100);
                }
            } else if(data.status == 2) {
                location.assign(data.url);
            } else {
                Swal.fire({
                    title: "Oops...",
                    text: data.msg,
                    icon: "error"
                })
            }
        },
        error: (err) => {
            if(err.responseJSON) {
                Swal.fire({
                    title: "Oops...",
                    text: err.responseJSON.msg,
                    icon: "error"
                })
            } else {
                Swal.fire({
                    title: "Oops...",
                    text: "Something went wrong!",
                    icon: "error"
                })
            }
        }
    });
});
$(document).on("click", ".btn-clear-cache", function() {
    Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: !0,
        buttonsStyling: !1,
        confirmButtonText: "Delete",
        cancelButtonText: "Cancel",
        customClass: {
            confirmButton: "btn fw-bold btn-danger",
            cancelButton: "btn fw-bold btn-active-light-primary"
        }
    }).then((function(n) {
        if(n.value) {
            $.ajax({
                type: "GET",
                url: `/${dashboard}/setting/clearCache/`,
                success: (data) => {
                    if(data.status == 1) {
                        Swal.fire({
                            title: "Oops...",
                            text: data.msg,
                            icon: "success"
                        })
                    } else {
                        Swal.fire({
                            title: "Oops...",
                            text: data.msg,
                            icon: "error"
                        })
                    }
                },
                error: () => {
                    Swal.fire({
                        title: "Oops...",
                        text: "Something went wrong!",
                        icon: "error"
                    })
                }
            });
        }
    }))
});
$(document).on("click", ".btn-live", function() {
    let id = $(this).attr("data-id");
    let url = $(this).attr("data-url");
    let ajax = `/${dashboard}/${url}/check/${id}/`;
    $(`#status-${id}`).text("Checking");
    $(`#status-${id}`).removeClass("badge-danger");
    $(`#status-${id}`).removeClass("badge-success");
    $(`#status-${id}`).addClass("badge-light");
    $.ajax({
        type: "GET",
        url: ajax,
        success: (data) => {
            if(data.isLive) {
                toastr.success(`${data.email} live`);
                $(`#status-${id}`).text("Active");
                $(`#status-${id}`).removeClass("badge-light");
                $(`#status-${id}`).addClass("badge-success");
            } else {
                toastr.success(`${data.email} die`);
                $(`#status-${id}`).text("Deactive");
                $(`#status-${id}`).removeClass("badge-light");
                $(`#status-${id}`).addClass("badge-danger");
            }
        },
        error: (err) => {
            $(`#status-${id}`).text("Error");
            toastr.error(err.responseJSON.msg);
        }
    });
})
$(document).on("click", ".btn-edit", function() {
    var id = $(this).attr("data-id");
    var url = $(this).attr("data-url");
    var ajax = `/${dashboard}/${url}/info/${id}/`;
    $.ajax({
        type: "GET",
        url: ajax,
        success: (data) => {
            if (data.status == 1) {
                let result = Object.keys(data.data).map(function(key) {
                    return [key, data.data[key]];
                });
                for (var i = 0; i < result.length; i++) { 
                    let item = result[i];
                    if (item[0] == "status" || item[0] == "active" || item[0] == "type" || item[0] == "UserId" || item[0] == "ugroup" || item[0] == "symbol" || item[0] == "isTakeProfit" || item[0] == "isAuto" || item[0] == "isDca" || item[0] == "method") {
                        $(`#kt_modal_edit #${item[0]}`).val(String(item[1])).trigger('change');
                    } else if(item[0] === "Coins") {
                        let dataSelect = [];
                        for(const coin of item[1]) {
                            dataSelect.push(String(coin.id));
                        }
                        $('#kt_modal_edit #coins').val(dataSelect).trigger('change');
                    } else {
                        $(`#kt_modal_edit #${item[0]}`).val(item[1]);
                    }
                }
                $("#kt_modal_edit").modal("show");
            } else toastr.error(data.msg);
        },
        error: (err) => {
            toastr.error(err.responseJSON.msg);
        }
    });
})
$(document).on("click", ".btn-close-order", function() {
    var id = $(this).attr("data-id");
    $("#kt_modal_close_order_form #id").val(id);
    $("#kt_modal_close_order").modal("show");
})
$(document).on("click", ".btn-close-all", function() {
    var id = $(this).attr("data-id");
    let url = $(this).attr("data-url");
    let ajax = `/${dashboard}/${url}/close-all/`;
    Swal.fire({
        title: "Are you sure?",
        text: "Bạn sẽ đóng tất cả vị thế và lệnh đang mở!",
        icon: "warning",
        showCancelButton: !0,
        buttonsStyling: !1,
        confirmButtonText: "Delete",
        cancelButtonText: "Cancel",
        customClass: {
            confirmButton: "btn fw-bold btn-danger",
            cancelButton: "btn fw-bold btn-active-light-primary"
        }
    }).then((function(n) {
        if(n.value) {
            $.ajax({
                type: "POST",
                url: ajax,
                data: `id=${id}`,
                success: (data) => {
                    refreshDatatable();
                    if (data.status == 1) {
                        Swal.fire({
                            title: "Deleted!",
                            text: "Đã đóng tất cả vị thế và lệnh mở.", 
                            icon: "success"
                        })
                    } else {
                        Swal.fire({
                            title: "Oops...",
                            text: data.msg,
                            icon: "error"
                        })
                    }
                },
                error: (err) => {
                    if(err.responseJSON) {
                        Swal.fire({
                            title: "Oops...",
                            text: err.responseJSON.msg,
                            icon: "error"
                        })
                    } else {
                        Swal.fire({
                            title: "Oops...",
                            text: "Something went wrong!",
                            icon: "error"
                        })
                    }
                }
            });
        }
    }))
})
$(document).on("click", ".btn-delete", function() {
    let id = $(this).attr("data-id");
    let url = $(this).attr("data-url");
    let ajax = `/${dashboard}/${url}/delete/`;
    Swal.fire({
        title: "Are you sure?",
        text: "Bạn sẽ xóa đối tượng này?",
        icon: "warning",
        showCancelButton: !0,
        buttonsStyling: !1,
        confirmButtonText: "Delete",
        cancelButtonText: "Cancel",
        customClass: {
            confirmButton: "btn fw-bold btn-danger",
            cancelButton: "btn fw-bold btn-active-light-primary"
        }
    }).then((function(n) {
        if(n.value) {
            $.ajax({
                type: "POST",
                url: ajax,
                data: `id=${id}`,
                success: (data) => {
                    refreshDatatable();
                    if (data.status == 1) {
                        Swal.fire({
                            title: "Deleted!",
                            text: "Your file has been deleted.", 
                            icon: "success"
                        })
                    } else {
                        Swal.fire({
                            title: "Oops...",
                            text: "Something went wrong!",
                            icon: "error"
                        })
                    }
                },
                error: (err) => {
                    if(err.responseJSON) {
                        Swal.fire({
                            title: "Oops...",
                            text: err.responseJSON.msg,
                            icon: "error"
                        })
                    } else {
                        Swal.fire({
                            title: "Oops...",
                            text: "Something went wrong!",
                            icon: "error"
                        })
                    }
                }
            });
        }
    }))
})
$(document).on("click", "#btn-delete-multi", function() {
    let url = site.datatable.url;
    let ajax = `/${dashboard}/${url}/delete/`;
    Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: !0,
        buttonsStyling: !1,
        confirmButtonText: "Delete",
        cancelButtonText: "Cancel",
        customClass: {
            confirmButton: "btn fw-bold btn-danger",
            cancelButton: "btn fw-bold btn-active-light-primary"
        }
    }).then((async function(n) {
        if(n.value) {
            let rowsSelected = datatable.column(0).checkboxes.selected();
            for(let i=0;i<rowsSelected.length;i++) {
                let item = rowsSelected[i];
                await deleteItem(ajax, item).then(() => {
                    toastr.success("Your file has been deleted.");
                }).catch((err) => {
                    toastr.error("Something went wrong!");
                });
            }
            refreshDatatable();
            Swal.fire({
                title: "Deleted!",
                text: "Your file has been deleted.", 
                icon: "success"
            })
        }
    }))
})