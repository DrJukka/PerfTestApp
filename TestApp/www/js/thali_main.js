//
//  The MIT License (MIT)
//
//  Copyright (c) 2015 Microsoft
//
//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to deal
//  in the Software without restriction, including without limitation the rights
//  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//  copies of the Software, and to permit persons to whom the Software is
//  furnished to do so, subject to the following conditions:
//
//  The above copyright notice and this permission notice shall be included in
//  all copies or substantial portions of the Software.
//
//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.
//
//

(function () {

    // Find out when JXcore is loaded.
    var jxcoreLoadedInterval = setInterval(function () {
        // HACK Repeat until jxcore is defined. When it is, it's loaded.
        if (typeof jxcore == 'undefined') {
            return;
        }

        // JXcore is loaded. Stop interval.
        clearInterval(jxcoreLoadedInterval);

        // Set the ready function.
        jxcore.isReady(function () {
            // Log that JXcore is ready.
            //logInCordova('JXcore ready');
            // Load app.js.
            jxcore('app.js').loadMainFile(function (ret, err) {
                if (err) {
                    alert('Error loading ThaliMobile app.js');
                    alert(err);
                } else {
                   // logInCordova('Loaded');
                    jxcore_ready();
                }
            });
        });
    }, 10);


    function jxcore_ready() {
        jxcore('getMyName').call(setNameToUI);
        jxcore('setLogCallback').call(logCallback);
        document.getElementById("ClearLogButton").addEventListener("click", ClearLog);

        console.log("UIApp is all set and ready!");
    }

    function setNameToUI(name) {
        document.getElementById("nameTag").innerHTML = name;
    }

    function ClearLog() {
        document.getElementById('LogBox').value = "";
    }

    function logCallback(data) {
        console.log("logCallback " + data);
        document.getElementById('LogBox').value = data + "\n" + document.getElementById('LogBox').value;
    }
})();
