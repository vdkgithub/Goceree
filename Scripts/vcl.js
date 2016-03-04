/***
  * 20160302
  */
var vcl = function(){
    var _  = this;

    this.StringFormat = function (text) {
        var args = Array.prototype.slice.call(arguments, 1);
        return text.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != 'undefined'
              ? args[number]
              : match
            ;
        });
    };

    this.Post = function (o) {
        var m = { url: null, controller: null, param: {}, callback: null, othercallback: null, errorcallback: null }
        for (var v in o) { m[v] = o[v]; }
        try {
            if (!m.url) throw new Error("Action not specified");
            $.post(_.ActionUrl(m.url, m.controller), m.param, function (data) {
                data.Method = o.url;
                data.Controller = o.controller;
                data.param = o.param;
                _.ResultAdapter(data, function (result) {
                    if (m.callback) m.callback(result);
                }, m.othercallback, m.errorcallback);
            }).fail(function (data) {
                if (m.errorcallback) m.errorcallback(data.statusText);
                console.error(data);
            });
        } catch (ex) {
            console.error(m.url, ex.message, ex.stack);
        }
    };

    this.ResultAdapter = function (data, callback, other, error) {
        try {
            switch (data.Status) {
                case 0: if (callback) callback(data.ResultSet); else other(data); break;
                case 2: throw new Error(data.ErrorMsg); break;
            }
            if (other) other(data);
        } catch (ex) {
            if (error) error(ex.message);
            console.error(data.Method, data.Controller, data.param || '', ex.stack);
        }
    };

    this.Task = function (action, interval, continueWith) {
        (function (action, interval, continueWith) { // make it static to prevent data locking
            var trd = setInterval(function () {
                action();
                clearInterval(trd);
                if (continueWith) continueWith();
            }, interval || 100);
        })(action, interval, continueWith);
    };
}

//extensions

/*
  {
    page: //location of html
    success: //callback
  }
*/

vcl.GetPage = function(o){
  $.get(o.page + '?=' + new Date().getTime(), function(dataml){ o.success($.parseHTML(dataml)); });
}

vcl.GetFile = function(o){
  $.get(o.file + '?=' + new Date().getTime(), function(dataml){ o.success(dataml); });
}

vcl.Require = function (pth, script, onload) {
    var GetFileName = function (pth) {
        return pth.substr(pth.lastIndexOf('/') + 1, pth.lastIndexOf('.') - pth.lastIndexOf('/') - 1)
    }

    var Inject = function (pth, onload) {
        var body = $(document.body);
        var b = false;
        var scrpt = $('<script />');
        var url = pth + '.js?sdate=' + new Date().getTime(); //to update when necessary
        scrpt.attr('type', "text/javascript");
        scrpt.attr('src', url);
        $.each(body.children(), function (i, j) {
            if (j.nodeName.toLowerCase() == 'script') {
                var msrc = GetFileName(j.src);
                if (msrc.toLowerCase() === pth.substr(pth.lastIndexOf('/') + 1).toLowerCase()) {
                    b = true;
                    return;
                }
            }
        });
        if (!b)
            body.append(scrpt);
        if (onload) onload();
    }

    if (script instanceof Array) {
        for (v in script) Inject(pth + script[v]);
    } else Inject(pth + script, onload);
};

vcl.Combine = function () {
    var args = Array.prototype.slice.call(arguments, 0);
    var lst = [];
    for (var i in args) {
        if (i >= args.length - 1) lst.push(args[i]);
        else
            lst.push((args[i].indexOf(args[i].length - 1) !== '/') ? args[i] + '/' : args[i]);
    }
    return lst.join('');
}

vcl.Cookie = function (name, value, exdays) {
    var setCookie = function (cname, cvalue, exdays) {
        var d = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        var expires = "expires=" + d.toGMTString();
        document.cookie = cname + "=" + cvalue + "; " + expires;
    }

    var getCookie = function (cname) {
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1);
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }

    if (typeof value === typeof undefined) {
        return getCookie(name);
    } else {
        setCookie(name, value, exdays);
    }
}

vcl.RootUrl = function () {
    return window.location.toString().split("://")[0] + '://' + window.location.host.toString() + '/';
}

vcl.Load = function(elem, page, args){
  var eid = '[vcl-id=' + elem + ']';
  $(eid).load('Views/' + page + '?t=' + new Date().getTime(), function(r, s, x){
      if(s === 'error'){
        var mdg = 'Sorry but there was an error loading the page';
        console.error(elem, page, mdg);
      }else{
        var pg = document.querySelector(eid);
        var bnd = $(r).attr('vcl-bind');
        if(bnd){
            ko.cleanNode(pg);
            vcl.Require('Controllers/', bnd, function(){
              var cls = bnd.split('/')[ bnd.split('/').length - 1];
              ko.applyBindings(new window[cls](args || {}), pg);
            });
        }
      }
  });
}
