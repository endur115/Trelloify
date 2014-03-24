$(document).ready(function () {
    console.log('ready');
    var token = window.location.href.split("#token=");
    console.log(token[1]);
    chrome.cookies.set({
        url: 'https://trello.com/',
        name: 'trello_token',
        value: token[1],
    }, function (cookie) {
        console.log(cookie);
    });
});