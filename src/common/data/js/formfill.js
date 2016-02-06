/*
 * The content script loaded in every page
 */

(function(browserClient, jQuery) {
    jQuery(function($) {
        var website_passwords = [];
        var last_request_element = null;
        var bc = browserClient();

        var background_image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAQCAYAAAAFzx/vAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA2ZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo4QzIwMjZFQjVDNkNFNTExOTUzRUE1NjM5RUE4NzhDNCIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDoyRjFBRjI4RDk1QTExMUU1QTczNjg1NjUzQ0Q2QTQ5RCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDoyRjFBRjI4Qzk1QTExMUU1QTczNjg1NjUzQ0Q2QTQ5RCIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M2IChXaW5kb3dzKSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjYzQTVFMTc0OUY5NUU1MTFBRjM0RUQ2RDg4RTJGMThCIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjhDMjAyNkVCNUM2Q0U1MTE5NTNFQTU2MzlFQTg3OEM0Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+WBRiIgAABDtJREFUeNq0VVtIY1cU9eat0WjG+IwvJDOmLcYXyohQcSxaqxUEsSqIIGIV0eKn/dC/fuqn9ssHVjNYpFgr+AAdzbQ1PvDxoVHBR6MGTW00GvO+XTtNhglT/Sj0wuHcu/c+Z++91jrnMizLBjzyMBiPOv/rw/O9nJ2dRfb09JSenJxIb29vhSiEExYWZs3MzPyjpqbm16SkJH1/f/+Xi4uLL4KCglzd3d0/JiYm6mmtyWSSdnV11dpsNh6Xy2U6OzvH4+Pjz8i3tbX1UV9f3xcMw7DZ2dlHAdQhjcHBwc/gH8cYxBjFUHvnEZlM9v3y8nJGa2vr1/h+jcWja2trH/vWDg8Pfw7b65CQkKHQ0NAftre3lT5fe3v7NyhQHR4ePjo9Pf3puw53dnbkmB6w0NnQ0KBF9UatVps8OzurMBqNgo6Ojq+ysrIM6MAiFotZDofjg5urVqtfSiQSCzZ2wO/EcJPj6uoqamFhQYlCrHl5eSfFxcW/vZ8wljhDhY7e3l41gq5ps6Kiom/n5+eTj4+Pw6RSKSMQCJxk963b3NxMWVlZSUQyJ4r4h3zARzM6yrm4uAgme21trQazwxNhtVrF+/v7MnoHV38FBwebvfu54uLiTMQndYTObF4xBfjENjY2lndzc8NH99fEradlLpdmZmJiIodCFQqFsaSk5HfyeRKenp7KIBoJBUEkelToIDuKSJ6ZmUnBtys6OtqclpZ27HA4PKjweDzXw8ODeHJyUoXOrUBiBz6GukNi2+7urmJjYyOOiq2qqtLCZn6nUp1OF4NgIfF3eXkpGRoaKjw6OoocGBh4aTAYgrBI1NLSsgyerC6Xi+B0E1/gN+vg4EBWUFBwiEIPLBbLK5FI5AbsLLrLvbu748fGxt4j4Ru/YwFVxXmxd0xNTSkxVF6/GzZ3W1vbm+bm5l9GRkZeeWABvE6nUzA+Pp6DAjjl5eWb4P6GiuHz+XaI5Rl4/wSFMqWlpVsxMTHnfgm9CmUBE3FoJBudQZVKdV5dXa0tLCxcI5tQKHSRAAIDA+2ALEmj0SRHRUXdVVZWvoU4nlEM8Ywjk3J4eChDEfa6uroFv4OPqoR7e3uR9JGQkGBeX1//DlVasbkdJuf7wZSIOAJsLigwU6/XS6A+6sCA9wj4ArCWmZubSzObzYKysrK91NRUnV9CBMogmlBCVKlUXkKh149dS0hkBwosxMLHpknEV319/ZIPZvjcuHWEq6ur0cQjfItEi19CQCNHUCAlJAifugfRIR1s1m63M+iAl5GRcZ6fn7/pUy0lxfXGkJLT09PPIab1D+5SXFnPQa6YikT7Z08lBFxOKFGIhBxsKgKcPyORzXfY7+/vSek8nGvy/QSf9YOEEMl1Y2MjwcLm5ubqnkool8v/hGKXUCALyNyQ+5LPFxERYWpqatKQjziuqKhY+tdf0BO/p//l+VuAAQCD2QqhJmJIywAAAABJRU5ErkJggg==";
        var background_image_hover = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAQCAYAAAAFzx/vAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA2ZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo4QzIwMjZFQjVDNkNFNTExOTUzRUE1NjM5RUE4NzhDNCIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpDNjMxREE2MDk1QTAxMUU1ODFDNEU0N0IwNTk0MjczRiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpDNjMxREE1Rjk1QTAxMUU1ODFDNEU0N0IwNTk0MjczRiIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M2IChXaW5kb3dzKSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjYzQTVFMTc0OUY5NUU1MTFBRjM0RUQ2RDg4RTJGMThCIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjhDMjAyNkVCNUM2Q0U1MTE5NTNFQTU2MzlFQTg3OEM0Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+T0nCIwAABCVJREFUeNq0VVtIY1cUvYma+IivUVHjs5IZpDQ+ayU4YK1UK4pgcUTTWsFaq1gt9qfNj/aj30opg84U6mOkChlsEZHxQZXqj88xSYuvUB81RBKhmphEc423a6e5MsHqR6EXDjnn7H3O2nvttU8EHMcxt3wCjFuN//Xz5ScGg0HW1dWl2t/fT7JYLCEIRBgWFnaSlZX1sqamZig5OVnT29v79dzcXG5gYCDX2dn5VVJSkpbOnpycxHd0dDy+uLgQ+fj4cCqV6suEhAQd2TQazbs9PT3tAnw5OTkahjKk0d/f/4UnoxsjMjLSMT8//35LS4ua1jjLraysFPFnBwcHVbQXHBzMhYaGclqttpC3tbW1TVKAERER3MTExKfXGep0ujfcPAoETH19/Rii/2NpaUkxNTWVe3x87N/e3v5tdnb2JjJggoKCGKFQeOU56jcyMvJRSEgIg4sZsmOwZDCbzQ9mZ2ffRiBMXl7eVnFx8eANQETIdnd3fwanP+myoqKipZmZmYy9vT1peHi4QCQSvVpjZn19vWBxcTGVwBAE4wnaXXtkpDQajSLaVyqV3+PX4fY4Pz+/t729nUJz1MogkUjMnkvZ+Ph4I1FDGSEzG4/Gi214ePjj09NTBtkbAHpJe54MhaOjo0pay2Syv0pKSp7R3A14cHCQAtFE0Bwi0SDCc5ojCMXk5ORDojkmJsacnp6+zLLsP2rz9WUdDse9sbGxUmTOgIkJ2ITkC2DbxsbGw7W1tfsUWFVV1Y/YM12rdGtr63W6iJxNJlPMwMDA57u7u/f7+vo+PDo6CqZDzc3NT1Enq8vl+oDO4AI76vtoZ2cnqKCgQI9Af7Xb7Z/4+/szoP0K2dWdnZ0xUqmUBWCPV1tAVWm8YMbHx3NpXBcKe62treqmpqZvhoaGWt20oCaXl5eBarVaiQCY8vLyn1B7I839/PyuIJZE1P09CrS0tPRFbGzs716AEIzcQxPVkFLn0IOWtLQ0XXV19UhhYSG1AyMWi1kCCwgIcIGytxYWFnKjo6O5ysrKPogjgXyozmiZd/R6vRRBMLW1td95NT6ikmxubspokZiYaFpdXc1BlBZcbseW81VnANkpY9DGQoGVh4eHYqhvARlsYJ5CNpwVTE9Pl1utVqasrGxNLpf/4gUIx9cgmjhapKam6qHQg9ueJQA5iAWIRYxL36R61dXVPfHQfEU2vDqS5eXlB9Q+sD2GyeUFCGrkcBLTAhT+dtc7iAwd1NhOp1NAGWRmZh7m5+f/zKuW6MbzxpAAMzIyDBCT+sZbiicrn+8ppK+9CxB0OaFEAnRfCjqfAeiMb3abzeYWGfqabD/AZr0BCJHsNzQ0PKeFQqGYuwswLi5uF4p9TgGCMhfk/pS3RUVFGRobG902qnFFRcWTf/0LuuPv6X/5/hZgAGIV75kctS+XAAAAAElFTkSuQmCC";

        /**
         * called within an event in a input field. Used to measure the distance from the right border of the input
         * element and the mouse at the moment of the click
         *
         * @param evt event
         * @returns {number} Distance
         */
        var getDistance = function(evt) {

            return $(evt.target).width()
                - evt.pageX
                + evt.target.getBoundingClientRect().left
                + (document.documentElement.scrollLeft ? document.documentElement.scrollLeft : document.body.scrollLeft);

        };

        /**
         * triggered once the mouse is over the input field. Used to set the background to the hover image
         *
         * @param evt Mouse over event
         */
        var mouseOver = function(evt) {
            evt.target.style.backgroundImage = 'url("' + background_image_hover + '")';
        };

        /**
         * triggered once the mouse leaves the input field. Used to set the background to the normal image
         *
         * @param evt Mouse out event
         */
        var mouseOut = function(evt) {
            evt.target.style.backgroundImage = 'url("' + background_image + '")';
        };

        /**
         * triggered when the mouse moves in the input field. Used to adjust the mouse cursor according to the distance
         * to the right border
         *
         * @param evt Mouse move event
         */
        var mouseMove = function (evt) {
            if (getDistance(evt) < 30) {
                evt.target.style.cursor = 'pointer';
            } else {
                evt.target.style.cursor = 'auto';
            }
        };

        /**
         * Requests the password from the backend
         *
         * @param secret_id
         */
        var requestSecret = function(secret_id) {
            bc.emit('request-secret', {
                url: document.location.toString(),
                secret_id: secret_id
            });
        };

        /**
         * closes dropinstances if a click outside of a dropinstance happens.
         *
         * @param event
         */
        var close = function (event) {
            for (var i = 0; i < dropInstances.length; i++) {
                if(dropInstances[i].drop.contains(event.target)) {
                    continue;
                }
                dropInstances[i].close();
                dropInstances.splice(i, 1);
            }
            if (dropInstances.length > 0) {
                $(window).one("click", close);
            }
        };

        /**
         * triggered when a click happens in an input field. Used to open the drop down menu and handle the closing
         * once a click happens outside of the dropdown menu
         *
         * @param evt Click event
         */
        var dropInstances = [];
        function click(evt) {

            if (getDistance(evt) < 30) {

                var dropcontent = '';
                dropcontent += '<div class="sanso-pw-drop-content-inner">';
                dropcontent += '<ul class="navigations">';
                dropcontent += '<li><a href="#">Open Datastore</a></li>';
                for (var i = 0; i < website_passwords.length; i++) {
                    dropcontent += '<li><a class="request-secret" href="#" data-secret-id="'+website_passwords[i].secret_id+'" onclick="return false;">'+website_passwords[i].name+'</a></li>';
                }
                dropcontent += '</ul>';
                dropcontent += '</div>';

                last_request_element = evt.target;

                var dropInstance = new Drop({
                    target: evt.target,
                    content: dropcontent,
                    classes: 'sanso-pw-drop-theme-arrows yui3-cssreset',
                    position: 'bottom left',
                    openOn: null
                });
                dropInstance.open();

                dropInstances.push(dropInstance);

                setTimeout(function(){

                    $( ".sanso-pw-drop-content-inner .request-secret" ).on( "click", function() {
                        requestSecret($(this).attr('data-secret-id'));
                    });
                    $(window).one("click", close);

                }, 0);
            }
        }

        /**
         * Main function
         */
        var main = function () {

            // Lets start with searching all input fields and forms
            // if we find a password field, we remember that and take the field before as username field
            var myForms = [];

            var inputs = document.querySelectorAll("input:not(:disabled):not([readonly]):not([type=hidden])");

            for (var i = 0; i < inputs.length; ++i) {

                if (inputs[i].type !== 'password') {
                    continue;
                }

                // found a password field, lets start the magic

                var newForm = {
                    username: null,
                    password: null,
                    form: null
                };

                for (var r = i - 1; r > -1; r--) {
                    if (inputs[r].type == 'password')
                        continue;
                    if (inputs[r].style.display == 'none')
                        continue;

                    // username field is inputs[r]
                    //inputs[r].style.backgroundColor = "blue";
                    inputs[r].style.backgroundImage = 'url("'+background_image+'")';
                    inputs[r].style.backgroundPosition = 'center right';
                    inputs[r].style.backgroundRepeat = 'no-repeat';

                    inputs[r].addEventListener('mouseover', mouseOver);
                    inputs[r].addEventListener('mouseout', mouseOut);
                    inputs[r].addEventListener('mousemove', mouseMove);
                    inputs[r].addEventListener('click', click);

                    newForm.username = inputs[r];
                    break;
                }

                // Password field is inputs[i]
                //inputs[i].style.backgroundColor = "yellow";
                inputs[i].style.backgroundImage = 'url("'+background_image+'")';
                inputs[i].style.backgroundPosition = 'center right';
                inputs[i].style.backgroundRepeat = 'no-repeat';

                inputs[i].addEventListener('mouseover', mouseOver);
                inputs[i].addEventListener('mouseout', mouseOut);
                inputs[i].addEventListener('mousemove', mouseMove);
                inputs[i].addEventListener('click', click);

                newForm.password = inputs[i];

                var parent = inputs[i].parentElement;

                while (parent.nodeName !== "FORM" && parent.parentNode) {
                    parent = parent.parentNode;
                }

                if (parent.nodeName == "FORM") {
                    //parent is surrounding form
                    //parent.style.backgroundColor = "green";
                    newForm.form = parent;
                    //parent.submit();
                }
                if (newForm.username !== null || newForm.password !== null) {
                    myForms.push(newForm);
                }

            }

            // Messaging functions below

            /**
             * Handler for a fillpassword event
             *
             * @param data
             */
            var on_fillpassword = function (data) {

                for (var i = 0; i < myForms.length; i++) {
                    if(data.hasOwnProperty('username') && data.username !== '') {
                        jQuery(myForms[i].username).focus();
                        myForms[i].username.value = data.username;
                        jQuery(myForms[i].username).blur();
                        jQuery(myForms[i].username).keydown();
                        jQuery(myForms[i].username).keyup();
                        jQuery(myForms[i].username).change();
                    }
                    if(data.hasOwnProperty('password') && data.password !== '') {
                        jQuery(myForms[i].password).focus();
                        myForms[i].password.value = data.password;
                        jQuery(myForms[i].password).blur();
                        jQuery(myForms[i].password).keydown();
                        jQuery(myForms[i].password).keyup();
                        jQuery(myForms[i].password).change();
                    }
                    if (myForms.length == 1 //only 1 form
                        && myForms[i].form !== null //we found the form
                        && data.hasOwnProperty('submit')
                        && data.submit //https website
                        && data.hasOwnProperty('auto_submit')
                        && data.auto_submit //auto submit checked in settings
                    ) {
                        myForms[i].form.submit();
                    }
                }
            };
            bc.on('fillpassword', on_fillpassword);

            /**
             * handles password update events
             *
             * @param data
             */
            var on_website_password_update = function (data) {
                website_passwords = data;
            };
            bc.on('website-password-update', on_website_password_update);

            /**
             * handles password request answer
             *
             * @param data
             */
            var on_return_secret = function (data) {
                for (var i = 0; i < myForms.length; i++) {
                    if (myForms[i].username.isEqualNode(last_request_element) || myForms[i].password.isEqualNode(last_request_element)) {
                        myForms[i].username.value = data.website_password_username;
                        myForms[i].password.value = data.website_password_password;

                        for (var ii = 0; ii < dropInstances.length; ii++) {
                            dropInstances[ii].close();
                        }
                        dropInstances = [];
                        $(window).off("click", close);
                        break;
                    }
                }
            };
            bc.on('return-secret', on_return_secret);

            // Tell our backend, that we are ready and waiting for instructions
            bc.emit('ready', document.location.toString());
            bc.emit('website-password-refresh', document.location.toString());
        };

        main();
    });
})(browserClient, jQuery);