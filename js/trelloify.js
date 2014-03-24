// Copyright (c) 2014 Terry Brown. All rights reserved.

var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};

var apiKey = '6a3b3f9c85a9a4d03668639420a921f2';
var trelloUrl = 'https://trello.com/1';

var bitlyApi = 'R_54b7c57e5c8745f5a16cb1950db3b4b2';
var bitlyLogin = 'trelloify';

var token = '';

var trelloify = (function () {

    function trelloify() {
    }

    /**
    * Initializes Trelloify
    */
    trelloify.prototype.initialize = function () {
        var trello = this;
        $('body').on('click', '.logInButton', function (e) {
            trello.logIn(trello);
        });

        $('body').on('click', '.trelloifyButton', function (e) {
            trello.postToTrello(trello);
        });

        $('body').on('change', '#boards', function (e) {
            var storage = window.localStorage;
            storage.setItem('selectedBoardId', $('#boards').val());
            trello.loadLists();
        });
        
        $('body').on('change', '#lists', function (e) {
            var storage = window.localStorage;
            storage.setItem('selectedListId', $('#lists').val());
        });
        
        $('.success').toggle();
        this.checkLogIn(trello);
    };
    
    /**
    * Checks if the user is logged in.
    * Updates the html if the user is or is not logged in.
    */
    trelloify.prototype.checkLogIn = function(trello) {
        chrome.cookies.get({
            url: 'https://trello.com/',
            name: 'trello_token',
        }, function(cookie) {
            if (cookie != null) {
                console.log(cookie);
                token = cookie.value;
                console.log(token);
                if (token == null || token == '') {
                    //Logged out
                    $('.loggedIn').toggle();
                } else {
                    //Logged in
                    $('.loggedOut').toggle();
                    trello.loadBoards();
                }
            } else {
                //Logged out
                $('.loggedIn').toggle();
            }
        });
    };
    
    /**
    * Authorizes the user if they are unauthorized.
    * Authorization key is stored in local storage.
    * Posts current page to trello if authroization is successful
    * Displays error otherwise
    */
    trelloify.prototype.logIn = function (trello) {
        chrome.cookies.get({
            url: 'https://trello.com/',
            name: 'trello_token',
        }, function (cookie) {
            if (cookie != null) {
                console.log(cookie);
                token = cookie.value;

                if (token == null || token == '') {
                    trello.authenticate();
                }
                else
                {
                    console.log('logged in');
                    trello.boards.fetch();
                    var selectedBoard = trello.state.getSelectedBoard();
                }
            }
            else {
                trello.authenticate();
            }
        });
    };

    /**
    * Opens the authentication window
    */
    trelloify.prototype.authenticate = function () {
        $('body').html('<h1>LOADING</h1>');

        var returnUrl = chrome.extension.getURL("token.html");
        chrome.windows.create({
            url: 'https://trello.com/1/authorize?' + 'response_type=token&key=' + apiKey + '&response_type=token&return_url=' + encodeURI(returnUrl) + '&scope=read,write,account&expiration=never&name=Trelloify',
            width: 520,
            height: 620,
            type: 'panel',
            focused: true
        });
        window.close();
    };

    trelloify.prototype.postToTrello = function (trello) {
        var listId = $('#lists').val();

        if (listId == 0)
            return;
        
        var tabUrl;
        var tabTitle;
        //Get the url of the current tab;
        chrome.tabs.getSelected(null, function (tab) {
            tabUrl = tab.url;
            tabTitle = tab.title;

            //Minify the url
            $.ajax({
                url: 'http://api.bitly.com/v3/shorten',
                dataType: 'jasonp',
                data: {
                    longUrl: tabUrl,
                    apiKey: bitlyApi,
                    login: bitlyLogin
                },
                success: function (result) {
                    //Create the trello card
                    $.ajax({
                        url: trelloUrl + '/cards?key=' + apiKey + '&token=' + token + '&name=' + tabTitle + '&desc=' + result.data.url + '&idList=' + listId,
                        type: 'POST',
                        dataType: 'application/json',
                        success: function (result) {
                            console.log(result);
                            $('.loggedIn').toggle();
                            $('.success').toggle();
                            setTimeout(function () {
                                $('.success').toggle();
                                $('.loggedIn').toggle();
                            }, 1000);
                        },
                        error: function (result) {
                            console.log(result);
                            if (result.status == 200) {
                                $('.loggedIn').toggle();
                                $('.success').toggle();
                                setTimeout(function () {
                                    $('.success').toggle();
                                    $('.loggedIn').toggle();
                                }, 1000);
                            }
                        }
                    });
                },
                error: function (result) {
                    var data = JSON.parse(result.responseText).data;
                    $.ajax({
                        url: trelloUrl + '/cards?key=' + apiKey + '&token=' + token + '&name=' + tabTitle + '&desc=' + data.url + '&idList=' + listId,
                        type: 'POST',
                        dataType: 'application/json',
                        success: function (result) {
                            console.log(result);
                            $('.loggedIn').toggle();
                            $('.success').toggle();
                            setTimeout(function () {
                                $('.success').toggle();
                                $('.loggedIn').toggle();
                            }, 1000);
                        },
                        error: function (result) {
                            console.log(result);
                            if (result.status == 200) {
                                $('.loggedIn').toggle();
                                $('.success').toggle();
                                setTimeout(function () {
                                    $('.success').toggle();
                                    $('.loggedIn').toggle();
                                }, 1000);
                            }
                        }
                    });
                }
            });

            
        });
    };

    /**
    * Loads and fills in the select box with boards for the user
    */
    trelloify.prototype.loadBoards = function () {
        var trello = this;
        
        var storage = window.localStorage;
        var selectedBoard = new Object();
        selectedBoard.id = storage.getItem('selectedBoardId');
        
        $.ajax({
            url: trelloUrl + '/members/me/boards/?filter=open&fields=id,name,url&key=' + apiKey + '&token=' + token,
            type: "GET",
            dataType: "JSON",
            success: function (result) {
                console.log(result);
                $("#boards").html('');
                var html = '<option value="0"' + (selectedBoard.id == 0 ? 'selected' : '') +  '>-- Please Select a Board --</option>';
                for (var i = 0; i < result.length; ++i) {
                    var selected = result[i].id == selectedBoard.id;
                    html += '<option value=' + result[i].id + ' ' + (selected ? 'selected' : '') + '>' + result[i].name + '</option>';
                }
                $("#boards").html(html);

                trello.loadLists();
            },
            error: function(result) {
                alert(result);
            }
        });
    };
    
    /**
    * Loads and fills in the select box with lists from the selected trello board
    */
    trelloify.prototype.loadLists = function () {
        var storage = window.localStorage;
        var selectedList = new Object();
        selectedList.id = storage.getItem('selectedListId');

        $.ajax({
            url: trelloUrl + '/boards/' + storage.getItem('selectedBoardId') + '?filter=open&lists=all&key=' + apiKey + '&token=' + token,
            type: "GET",
            dataType: "JSON",
            success: function (result) {
                $("#lists").html('');
                var html = '<option value="0"' + (selectedList.id == 0 ? 'selected' : '') + '>-- Please Select a List --</option>';
                for (var i = 0; i < result.lists.length; ++i) {
                    var selected = result.lists[i].id == selectedList.id;
                    html += '<option value=' + result.lists[i].id + ' ' + (selected ? 'selected' : '') + '>' + result.lists[i].name + '</option>';
                }
                $("#lists").html(html);
            },
            error: function (result) {
                console.log(result);
            }
        });
    };
    
    return trelloify;
})();


$(function () {
    var trello = new trelloify();
    trello.initialize();
});