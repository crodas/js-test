if (jstter === undefined) {
    var jstter = {}
}

jstter.twitter = function()
{
    var url    = "http://search.twitter.com/search.json?callback=";
    var json   = [];
    var events = [];
    /* to call $this in closures */
    var $this  = this;
    /* */
    var users = [];
    var dquery = undefined;


    /**
     *  Return (sort of) unique name to create
     *  a callback on the fly
     *
     *  @scope private
     *  
     *  @return string
     */
    var getFuncId = function()
    {
        var newDate = new Date;
        return "__" + newDate.getTime();
    };

    var queueEvent = function(eventname, callback)
    {
        if (events[eventname] === undefined) {
            events[eventname] = [];
        }
        events[eventname].push(callback);
    };

    var triggerEvent = function (eventname, args) 
    {
        if (events[eventname] === undefined) {
            return;
        }
        for (var e in events[eventname]) {
            var item = events[eventname][e];
            item.apply(item, args);
        }
    };

    var getQuery = function()
    {
        if (users.length == 0) {
            return false;
        }

        query = "";
        for (var i in users) {
            query += "from:" + users[i] + " OR "; 
        }

        if (dquery != undefined) {
            query += dquery + " OR";
        }

        query = query.substr(0, query.length - 3);
        return query;
    };


    /**
     *  Change username and reconstruct the object
     */
    this.users = function(u)
    {
        if (typeof u != "object") {
            u = [u];
        }
        users = u;
    };

    this.query = function (direct_query)
    {
        dquery = direct_query;
    };

    /**
     *  ready callback
     */
    this.ready = function(callback)
    {
        queueEvent("ready", callback);
    };

    /**
     *  ready callback
     */
    this.each = function(callback)
    {
        queueEvent("each", callback);
    };

    this.getTweets = function()
    {
        return json;
    };

    this.fetch = function()
    {
        var callback = getFuncId();
        var script   = document.createElement("script");
        var head     = document.getElementsByTagName('head')[0];
        var query    = getQuery();

        script.src = url + callback + "&q=" + query;

        // tweets callback {{{
        window[callback] = function (response) {
            var njson   = response.results;
            var ntweets = [];

            /* perform object diff {{{ */
            if (json.length > 0) {
                for (var i in njson) {
                    var item = njson[i];
                    if (item.id == json[json.length-1].id) {
                        break;
                    }
                    ntweets.push(item);
                }
            } else {
               ntweets = njson;
            }
            /* }}} */

            /* each callback (order by time asc) {{{ */
            var revert = ntweets.reverse();
            for (e in revert) {
                triggerEvent("each", [revert[e]]);
            }
            /* }}} */

            json = json.concat(ntweets);

            triggerEvent("ready", [njson]);

            head.removeChild(script);

        };
        // }}}

        head.appendChild(script);
    };

    /**
     *  Really simple helper method to perform 
     *  rendering of tweets.
     *
     *  @param string|Node target 
     *  @param string|Node model
     *
     */
    this.render = function(target, model)
    {
        var a = setInterval(function() {
            if ( document.getElementsByTagName("body").length == 0) {
                return;
            }
            window.clearInterval(a);

            if (typeof target == "string") {
                target = document.getElementById(target);
            }
            if (typeof model == "string") {
                model = document.getElementById(model);
            }
            $this.each(function(ztweet) {
                var ntweet = model.parentNode.innerHTML;
                for(var i in ztweet) {
                    ntweet = ntweet.replace("#" + i, ztweet[i]);
                }
                target.innerHTML = ntweet + target.innerHTML;
            });
        }, 500);
    };
}

/**
 *  Extend Twitter class, add toString method
 */
jstter.twitter.prototype.toString = function()
{
    tweet = this.getTweets()[0];
    return '@' + tweet.from_user + ": " + tweet.text;
};