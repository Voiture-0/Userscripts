// ==UserScript==
// @name         D.GG Extra Features
// @namespace    http://tampermonkey.net/
// @version      1.13.2
// @description  Adds features to the destiny.gg chat
// @author       Voiture
// @include      /https:\/\/www\.destiny\.gg\/embed\/chat.*/
// @include      /https:\/\/www\.destiny\.gg\/bigscreen.*/
// @grant        none
// @require      https://code.jquery.com/jquery-3.3.1.min.js
// @update       https://raw.githubusercontent.com/Voiture-0/Userscripts/master/Dgg-Extra-Features.js
// ==/UserScript==

(() => {
    'use strict';

    /******************************************/
    /* Constants & Global Variables ***********/
    /******************************************/

    // Load Config Settings
    const config = {
        username: null,
        messageStartingLeft: 83.72917175292969,
        messageStartingLeftNewLine: 19,
        autoSendMessages: false,
        clickableEmotes: true,
        convertEmbedLinks: true,
        showVerticalComboButtons: false,
        theme: null,
        hideDndFlairs: false
    };

    const WIDTHS = {
        _: 6.32,
        '.': 3.69,
        nathanTiny2_OG: 28,
        space: 4,
        '👞👞': 40, // '👢👢': 33,
    };

    const emoteCenterOffsets = {
        gachiGASM: 5,
        Wowee: 3,
        BASEDWATM8: 10,
        SLEEPSTINY: -16,
        LeRuse: -1,
        UWOTM8: -8,
        SoDoge: -14,
        OhKrappa: 3,
        AngelThump: 2,
        BibleThump: 2,
        Klappa: -7,
        Kappa: 1,
        DuckerZ: 10,
        OverRustle: 4,
        SURPRISE: -3,
        LUL: -3,
        SOY: -8,
        CUX: -1,
        ResidentSleeper: 7,
    };

    const embedLinks = {
        '#twitch': {
            convertedLink: 'https://www.twitch.tv/'
        },
        '#youtube': {
            convertedLink: 'https://www.youtube.com/watch?v='
        },
        '#twitch-vod': {
            convertedLink: 'https://www.twitch.tv/videos/'
        },
        '#twitch-clip': {
            convertedLink: 'https://clips.twitch.tv/'
        }
    };

    const emoteBackLog = {
        history: [],
        current: 0,
    };

    const LEFT_CLICK = 1,
        MIDDLE_CLICK = 2;

    let mentionsWindow = null;
    let chatHidden = false;
    let goblIcon = (testIfEmoteExists('PepoTurkey') ? 'PepoTurkey' : '🦃');

    /******************************************/
    /* Utility Functions **********************/
    /******************************************/

    // Get N-th parent element
    jQuery.fn.getParent = function (num) {
        let last = this[0];
        for (let i = 0; i < num; i++) {
            last = last.parentNode;
        }
        return jQuery(last);
    };

    // Send chat message
    function sendChatMessage(message, forceSend = false) {
        const chatBox = $('#chat-input-control');
        chatBox.val(message);
        if (config.autoSendMessages || forceSend) {
            simulateEnterKeyPress(chatBox);
        }
    }

    // Append chat message
    function setChatMessage(message, forceSend = false) {
        const chatBox = $('#chat-input-control');
        chatBox.val(message);
        if (forceSend) {
            simulateEnterKeyPress(chatBox);
        }
    }

    // Triggers an enter key press on an element
    function simulateEnterKeyPress(elem) {
        elem[0].dispatchEvent(
            new KeyboardEvent('keypress', { key: 'Enter', keyCode: 13 }),
        );
    }

    // Checks if a user is mentioned in a message
    function messageMentionsUsername(message, username) {
        const mentions = message.data('mentioned');
        return (
            mentions !== undefined &&
            mentions.split(' ').includes(username.toLowerCase())
        );
    }

    function sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    // shuffles the characters in a string
    function shuffleString(str) {
        if (!str) return str;
        // Fisher Yates shuffle algorithm
        var a = str.split(''),
            n = a.length;
    
        for(var i = n - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = a[i];
            a[i] = a[j];
            a[j] = tmp;
        }
        return a.join('');
        
    }

    // paste a string at the cursor's position in the chat box
    function addToChatBox(str, autoSendMessage) {
        const selectionStart = $('#chat-input-control')[0].selectionStart;
        const selectionEnd = $('#chat-input-control')[0].selectionEnd;
        const messageStart = $('#chat-input-control')
            .val()
            .substr(0, selectionStart);
        const messageEnd = $('#chat-input-control').val().substr(selectionEnd);
        const message = `${messageStart} ${str} ${messageEnd}`;
        setChatMessage(message, autoSendMessage);
        if (!autoSendMessage) {
            // Reset cursor position
            $('#chat-input-control')[0].focus();
            const cursorPosition = `${messageStart} ${str} `.length;
            $('#chat-input-control')[0].selectionStart = cursorPosition;
            $('#chat-input-control')[0].selectionEnd = cursorPosition;
        }
    }

    // Case Insensitive contains jQuery selector
    jQuery.expr[':'].icontains = function(a, i, m) {
        return jQuery(a).text().toUpperCase()
            .indexOf(m[3].toUpperCase()) >= 0;
    };

    function testIfEmoteExists(emote) {
        // if(emote === undefined || emote === null || typeof emote !== 'string') return false; 
        // const emoteElement = document.createElement('div');
        // emoteElement.className = 'hidden emote ' + emote;
        // document.getElementById('chat-emote-list').append(emoteElement);
        // await sleep(200);
        // const emoteExists = (getComputedStyle(emoteElement).backgroundImage !== 'none');
        // emoteElement.remove();
        // return emoteExists;
        return true;
    }
    
    /******************************************/
    /* Utility Functions **********************/
    /******************************************/

    function addLightThemeStyle() {
        const css = `
        #chat.voiture-light-theme {
            background: #f7f7f7;
            color: #666;
        }
        
        #chat.voiture-light-theme .msg-chat {
            color: #464646;
        }
        
        #chat.voiture-light-theme .msg-chat .user {
            color: #232323;
        }
        
        #chat.voiture-light-theme .msg-chat .green-text {
            color: #588c1a;
        }
        
        #chat.voiture-light-theme hr {
            border-top: 1px solid #ddd;
            border-bottom: 1px solid #fff;
        }
        
        #chat.voiture-light-theme.pref-taggedvisibility div.msg-tagged {
            background-color: #dcdcdc;
        }

        #chat.voiture-light-theme #chat-input-control {
            background: #eee;
            border: 1px solid #ddd;
            color: #464646;
        }
        #chat.voiture-light-theme #chat-input-control::placeholder {
            color: #ddd;
        }
        
        #chat.voiture-light-theme #chat-tools-wrap .btn-icon {
            filter: brightness(.01);
        }
        
        #chat.voiture-light-theme .msg-chat .externallink {
            color: #2e75d0;
        }
        
        #chat.voiture-light-theme .user.flair8 {
            color: #c825be;
        }
        
        #chat.voiture-light-theme .user.flair13,
        #chat.voiture-light-theme .user.flair9 {
            color: #5477ca;
        }
        
        #chat.voiture-light-theme .user.flair11 {
            color: #6d6d6d;
        }
        
        #chat.voiture-light-theme .msg-own {
            background-color: #eaeaea;
        }
        
        #chat.voiture-light-theme .msg-highlight {
            background-color: #cfe9ff!important;
        }
        
        #chat.voiture-light-theme .user.flair3 {
            color: #57aa36;
        }
        
        #chat.voiture-light-theme #chat-auto-complete li {
            color: #717171;
            background: rgba(238, 238, 238, .85);
        }
        
        #chat.voiture-light-theme .user.admin {
            color: #bf4f4f;
        }
        
        #chat.voiture-light-theme .chat-scroll-notify {
            color: #7c7c7c;
            background: #eee;
        }
        
        #chat.voiture-light-theme .chat-combo .combo,
        #chat.voiture-light-theme .chat-combo .count,
        #chat.voiture-light-theme .chat-combo .hit,
        #chat.voiture-light-theme .chat-combo .x {
            text-shadow: -1px -1px 0 #444, 1px -1px 0 #444, -1px 1px 0 #444, 1px 1px 0 #444;
        }
        
        #chat.voiture-light-theme .chat-combe .hit,
        #chat.voiture-light-theme .chat-combo .combo {
            color: #eee;
        }
        
        #chat.voiture-light-theme .chat-combo .count,
        #chat.voiture-light-theme .chat-combo .x {
            color: #ddd;
        }
        
        #chat.voiture-light-theme .msg-whisper {
            background-color: #eaeaea;
        }
        
        #chat.voiture-light-theme #chat-whisper-unread-indicator {
            color: #423f40;
        }
        
        #chat.voiture-light-theme .chat-menu .chat-menu-inner {
            background-color: #ddd;
        }
        
        #chat.voiture-light-theme #chat-whisper-users .unread-0 .user,
        #chat.voiture-light-theme #chat-whisper-users .unread-0 .user:hover {
            color: #666;
        }
        
        #chat.voiture-light-theme .chat-menu .toolbar h5 {
            color: #666;
        }
        
        #chat.voiture-light-theme #chat-whisper-users .conversation .remove {
            filter: invert(1);
        }
        
        #chat.voiture-light-theme .chat-menu .toolbar {
            border-bottom: 1px solid #ccc;
        }
        
        #chat.voiture-light-theme .chat-menu .toolbar .chat-menu-close {
            filter: invert(1);
        }
        
        #chat.voiture-light-theme .chat-output:not(.chat-win-main) .msg-historical {
            background-color: #eaeaea;
            color: #212121;
        }
        
        #chat.voiture-light-theme #chat-windows-select {
            background: #ccc;
        }
        
        #chat.voiture-light-theme #chat-windows-select .tab.active {
            color: #212121;
            background: #9d9d9d;
        }
        
        #chat.voiture-light-theme #chat-windows-select .tab-close {
            filter: invert(1);
        }
        
        #chat.voiture-light-theme .user.flair17 {
            color: #c4af00;
        }
        
        #chat.voiture-light-theme #chat-auto-complete li.active {
            color: #000;
        }
        
        #chat.voiture-light-theme .emote.RaveDoge {
            animation: RaveDoge-anim .5s infinite;
        }
        
        @keyframes RaveDoge-anim {
            0% {
                filter: hue-rotate(0) invert(1) brightness(1.1);
            }
            100% {
                filter: hue-rotate(360deg) invert(1) brightness(1.1);
            }
        }
        
        #chat.voiture-light-theme .nano>.nano-pane>.nano-slider {
            background: #717171;
        }
        
        #chat.voiture-light-theme .form-control {
            color: #464646!important;
            background: #fcfcfc!important;
            border: 1px solid #b5b5b5!important;
        }
        
        #chat.voiture-light-theme .emote.GameOfThrows {
            filter: drop-shadow(1px 1px 0 #000);
        }
        
        @keyframes DANKMEMES-anim {
            0%,
            100% {
                -webkit-filter: hue-rotate(0);
                filter: hue-rotate(0);
            }
            50% {
                -webkit-filter: hue-rotate(360deg);
                filter: hue-rotate(360deg);
            }
        }
        
        @keyframes DANKMEMES-anim-hover {
            0%,
            100% {
                -webkit-filter: hue-rotate(0);
                filter: hue-rotate(0);
            }
            50% {
                -webkit-filter: hue-rotate(360deg);
                filter: hue-rotate(360deg);
            }
        }
        
        #chat.voiture-light-theme .emote.CuckCrab {
            filter: brightness(2.2) contrast(.9);
        }
        
        #chat.voiture-light-theme .msg-broadcast {
            text-shadow: 1px 1px 3px #404040;
            background-color: #d9d9d9;
            color: #fffd79!important;
        }
        
        #chat.voiture-light-theme .user.flair12 {
            color: #e38602;
        }
        
        #chat.voiture-light-theme .user.flair1 {
            color: #30bbab;
        }
        
        #chat.voiture-light-theme .user.flair8 {
            color: #d532cb;
        }
        #chat.voiture-light-theme button.btn-dark {
            color: unset;
            background: #fcfcfc;
        }
        #chat.voiture-light-theme #chat-tools-wrap .voiture-btn-icon {
            color: black;
        }
        `;
        const style = document.createElement("style");
        style.type = "text/css";
        style.appendChild(document.createTextNode(css));
        document.head.appendChild(style);
        changeTheme();
    }

    function changeTheme(theme) {
        if (theme !== undefined) {
            // Update config
            config.theme = theme;
            saveConfig();
        }

        // Remove all themes
        $('#chat').removeClass('voiture-light-theme');

        // Add selected theme class
        switch(config.theme) {
            case 'light':
                $('#chat').addClass('voiture-light-theme');
                break;
        }
    }

    /******************************************/
    /* Emote Back *****************************/
    /******************************************/

    function clearEmoteBackButton() {
        // Remove click event
        $('#chat-emote-back-btn').off('click').attr('title', '');
        // Remove classes to hide it
        $('#chat-emote-back-btn .emote.voiture-btn-icon')
            .removeClass()
            .addClass('emote voiture-btn-icon');
        
        // reset emote back log index
        emoteBackLog.current = -1;
    }

    function emoteBack(user, emote) {
        clearEmoteBackButton();

        // send emote back at emoter
        if (emote && user && user !== config.username) {
            let emoteMessage = user + ' ';
            if(emote === 'PepoTurkey') {
                emoteMessage += generateGoblMessage();
            } else {
                emoteMessage += emote;
            }
            sendChatMessage(emoteMessage);
        }
    }

    function setEmoteBackButton(emoteMention) {
        $('#chat-emote-back-btn')
            .attr('title', `${emoteMention.mentionedBy} ${emoteMention.emoteName}`)
            .off('click')
            .click((e) => emoteBack(emoteMention.mentionedBy, emoteMention.emoteName))
            .find('.emote-scaling-wrapper')
            .html(`<i class="voiture-btn-icon emote ${emoteMention.emoteName}"></i>`);
    }

    function saveEmoteMention(mentionedBy, emoteName) {
        const emoteMention = { mentionedBy, emoteName };
        emoteBackLog.history.unshift(emoteMention);
        if(emoteBackLog.current > 0) {
            emoteBackLog.current++;
        } else {
            setEmoteBackButton(emoteMention);
        }
    }

    function scrollEmoteMentions(direction) {
        if(emoteBackLog.history.length === 0) return;

        var newCurrent = emoteBackLog.current + direction;
        if(newCurrent < 0) newCurrent = 0;
        if(newCurrent > emoteBackLog.history.length - 1) newCurrent = emoteBackLog.history.length - 1;
        
        // console.log(emoteBackLog.current + ' --> ' + newCurrent, emoteBackLog.history);

        if(emoteBackLog.current !== newCurrent) {
            emoteBackLog.current = newCurrent;
            setEmoteBackButton(emoteBackLog.history[emoteBackLog.current]);
        }
    }

    /******************************************/
    /* Chat Observer **************************/
    /******************************************/

    // Look for messages where we have been emoted at
    function observeChat() {
        var emotedAtObserveFunction = function (mutations) {
            for (let i = 0; i < mutations.length; i++) {
                for (let j = 0; j < mutations[i].addedNodes.length; j++) {
                    // Get new message
                    const message = $(mutations[i].addedNodes[j]);

                    // Skip own messages
                    if (message.hasClass('msg-own')) continue;
                    // Skip non-mentions
                    if (!messageMentionsUsername(message, config.username))
                        continue;

                    // Check if emoted at
                    const emote = message.find(
                        `.text .chat-user:icontains('${config.username}') + .emote`,    // This is supposed to be case insensitive, but seems to not work sometimes hmmm TODO: this
                    ); // Only if the message us Username Emote (+), if want to get any emote after Username use '~' instead of '+'
                    // If we were emoted at
                    if (emote.length !== 0) {
                        // Get emoter
                        const mentionedBy = message.find('a.user').text();
                        // Get emote
                        const emoteName = emote
                            .filter(':last') // Maybe want to get first instead?
                            .attr('class')
                            .replace('emote', '')
                            .trim();
                            
                        // save mention
                        saveEmoteMention(mentionedBy, emoteName);
                    }
                }
            }
        };

        // Look at chat for any embed links (ex: #twitch/destiny)
        var convertLinksObserveFunction = function (mutations) {
            if (config.convertEmbedLinks) {
                for (let mutation of mutations) {
                    for (let message of mutation.addedNodes) {
                        let links = $(message).find(
                            'a.externallink.bookmarklink',
                        );
                        for (let link of links) {
                            convertEmbedLinkToExternalLink(link);
                        }
                    }
                }
            }
        };

        // Create observers
        const emotedAtObserver = new MutationObserver(emotedAtObserveFunction);
        const linkObserver = new MutationObserver(convertLinksObserveFunction);

        const chat = $('#chat-win-main .chat-lines')[0];

        // Observe chat
        emotedAtObserver.observe(chat, {
            attributes: true,
            childList: true,
            characterData: true,
        });
        linkObserver.observe(chat, {
            attributes: true,
            childList: true,
            characterData: true,
        });
    }

    /******************************************/
    /* nathanTiny2 Align Combo ****************/
    /******************************************/

    function getOwnStartingLeft(username) {
        const exampleMessageSelector = `div.msg-chat.msg-user.msg-own:not(.msg-continue)[data-username='${username.toLowerCase()}'] > span.text`;
        let exampleMessage = $(exampleMessageSelector);
        if (exampleMessage.length === 0) {
            // If there is no message to measure, send a message to measure
            // Send message
            if (['Voiture', 'AFrenchCar'].includes(config.username)) {
                sendChatMessage('YEE Wowee', true);
            } else {
                sendChatMessage('Voiture you are a really cool chatter btw :)', true); // PepeLaugh
            }

            // Get example message
            exampleMessage = $(exampleMessageSelector);

            if (exampleMessage.length === 0) {
                const error = 'Unable to measure, please tell Voiture about this';
                alert(error);
                throw error;
            }
        }
        const left = exampleMessage.position().left;
        return left;
    }

    function measureRecentMessageDiffLeft(emote) {
        // Find own message's starting left position
        const isContinuingMessage = ($('div#chat-win-main .msg-chat:last').data('username') === config.username.toLowerCase());
        const ownMessageStartingLeft = isContinuingMessage
            ? config.messageStartingLeftNewLine
            : config.messageStartingLeft;
            
        // Find most recent message's emote starting left position
        const lastMessageEmotes = $('div#chat-win-main > div.chat-lines.nano-content')
            .children(':last')
            .find('span.text > div.emote');
        if (lastMessageEmotes.length === 0) return false;   // No emote to align to

        const emoteElem = $(lastMessageEmotes[0]);
        const emoteName = emoteElem.attr('title');
        const recentMessageEmoteLeft = emoteElem.position().left    // Get emote left
            + (emoteElem.width() / 2 - WIDTHS[emote] / 2)           // Center emotes
            + (emoteCenterOffsets[emoteName] || 0);                 // Emote specific adjustment

        // Return difference in positions
        return recentMessageEmoteLeft - ownMessageStartingLeft;
    }

    function getNumberOfCharactersToAlign(recentMessageEmoteDiff) {
        const underscore = '_', period = '.';   // Spacer characters
        if (recentMessageEmoteDiff >= 0) {
            if (recentMessageEmoteDiff >= 0.4 * WIDTHS[underscore]) {
                recentMessageEmoteDiff -= WIDTHS.space; // Subtract space between _ and emote
            }
            let numOfChars = recentMessageEmoteDiff / WIDTHS[underscore];
            let adjustment = '';
            if (numOfChars % 1 >= 0.85) {
                adjustment = underscore;
            } else if (numOfChars % 1 >= 0.4) {
                adjustment = period;
            }
            numOfChars = Math.floor(Math.max(0, numOfChars));
            return adjustment + underscore.repeat(Math.floor(numOfChars));
        }
    }

    function getEmoteAlignedMessage(emote) {
        const recentMessageEmoteDiff = measureRecentMessageDiffLeft(emote);
        const message = getNumberOfCharactersToAlign(recentMessageEmoteDiff);
        if (message === undefined || recentMessageEmoteDiff > 300) return '';
        return message + ' ' + emote;
    }

    function showVerticalComboButtons(value) {
        if(value !== undefined) {
            config.showVerticalComboButtons = value;
            saveConfig();
        }
        if (config.showVerticalComboButtons) {
            $('#chat-nathanTiny2-btn').removeClass('hidden');
            $('#chat-👞👞-btn').removeClass('hidden');
        } else {
            $('#chat-nathanTiny2-btn').addClass('hidden');
            $('#chat-👞👞-btn').addClass('hidden');
        }
    }

    /******************************************/
    /* Auto-Message Toggle ********************/
    /******************************************/

    function toggleAutoSendMessages(value) {
        config.autoSendMessages = value;
        saveConfig();
    }

    /******************************************/
    /* Click Emotes ***************************/
    /******************************************/

    function emoteClick(event) {
        const classes = event.target.classList;
        if (config.clickableEmotes && classes.contains('emote')) {
            event.preventDefault();
            const whichMouseButton = event.which; // 1=left click, 2=middle click
            if(whichMouseButton === LEFT_CLICK || whichMouseButton === MIDDLE_CLICK) {
                const emote = classes.toString().replace('emote', '').trim();
                const autoSendMessage = whichMouseButton === MIDDLE_CLICK;
                addToChatBox(emote, autoSendMessage);
            }
        }
    }

    function toggleEmoteClicks(value) {
        config.clickableEmotes = value;
        saveConfig();
    }

    /******************************************/
    /* Convert Embed Links ********************/
    /******************************************/

    function convertEmbedLinkToExternalLink(link) {
        const linkText = link.innerText;
        const linkParts = linkText.split('/');
        const linkKey = linkParts[0].toLowerCase();
        if (embedLinks[linkKey] !== undefined) {
            // Save original href
            console.info(link);
            if (link.getAttribute('data-voiture-original-href') === null) {
                link.setAttribute('data-voiture-original-href', link.href);
            }
            const newUrl = embedLinks[linkKey].convertedLink;
            link.target = '_blank';
            link.href = newUrl + linkParts[1];
        }
    }

    function unconvertEmbedLinkToExternalLink(link) {
        const linkText = link.innerText;
        const linkParts = linkText.split('/');
        const linkKey = linkParts[0].toLowerCase();
        if (embedLinks[linkKey] !== undefined) {
            link.target = '_top';
            console.info(link);
            link.href = link.getAttribute('data-voiture-original-href');
        }
    }

    function toggleConvertEmbedLinks(value) {
        const valueChanged = config.convertEmbedLinks !== value;
        config.convertEmbedLinks = value;

        if (valueChanged) {
            $('#chat-win-main .chat-lines')
                .find('a.externallink.bookmarklink')
                .each(function (i, link) {
                    if (config.convertEmbedLinks) {
                        convertEmbedLinkToExternalLink(link);
                    } else {
                        unconvertEmbedLinkToExternalLink(link);
                    }
                });
        }

        saveConfig();
    }

    function toggleHideDndFlairs(value) {
        const valueChanged = config.hideDndFlairs !== value;
        config.hideDndFlairs = value;

        if (valueChanged) {
            $('#chat-win-main').toggleClass('voiture-hide-dnd-flairs', config.hideDndFlairs);
			saveConfig();
        }
    }

    /******************************************/
    /* Hide Chat ******************************/
    /******************************************/

    function toggleHideChat(value) {
        if (value !== undefined) {
            chatHidden = value;
        } else {
            chatHidden = !chatHidden;
        }

        if (chatHidden) {
            $('#chat-output-frame').css('visibility', 'hidden');
            $('#chat-hide-btn > span').text('o');
            $('#chat-hide-btn').attr('title', 'Show chat');
        } else {
            $('#chat-output-frame').css('visibility', 'unset');
            $('#chat-hide-btn > span').text('ø');
            $('#chat-hide-btn').attr('title', 'Hide chat');
        }
    }

    /******************************************/
    /* 🦃 goblgobl ****************************/
    /******************************************/

    function generateGoblMessage() {
        let message = goblIcon + ' gobl' + shuffleString('gobl');
        if (Math.random() < 0.5) {
            message += shuffleString('gobl');
            if (Math.random() < 0.25) {
                message += shuffleString('gobl');
            }
        }
        message = ' ' + message + ' '; // Add extra whitespace just in case
        return message;
    }

    /******************************************/
    /* GUI ************************************/
    /******************************************/

    function baseInjections() {
        $('#chat-output-frame').on('mousedown', emoteClick);
    }

    function injectToolbarButtons() {
        let htmlLeft = '';
        let htmlRight = '';
        let css = '<style>';

        // Adjust some styles
        css += `
			.msg-highlight {
				position: sticky;
				top: 0px;
				z-index: 121;
			}
			#chat {
				overflow-x: hidden;
			}
			#chat-tools-wrap {
				overflow: hidden;
			}
			#chat-whisper-btn {
				margin-right: 0.6em;
			}
			.emote-scaling-wrapper {
				transform: scale(0.8, 0.8);
				white-space: nowrap;
			}
			.chat-menu {
				display: block;
				opacity: 0;
				transition-duration: 200ms; 
				transition-property: transform, opacity;
				pointer-events: none;
			}
			.chat-menu.right {
				transform: translateX(200px);
			}
			.chat-menu.left {
				transform: translateX(-200px);
			}
			.chat-menu.active {
				transform: translateX(0);
				opacity: 1;
				transition-duration: 100ms; 
				transition-property: transform, opacity;
				pointer-events: unset;
            }
            .hidden {
                display: none !important;
            }
			#chat-tools-wrap .chat-tool-btn {
				width: unset;
				min-width: 2.25em;
            }
            #chat-tools-wrap .voiture-btn-icon {
                float: left;
                font-style: normal;
                white-space: nowrap;
                text-align: center;
                color: white;
                font-weight: bold;
            }
            #chat-tools-wrap .chat-tools-group:first-child .voiture-btn-icon {
                margin-top: 2px;
            }
            #chat-tools-wrap .voiture-chat-tool-btn {
                opacity: 0.25;
                transition: opacity 150ms;
                color: white;
            }
            #chat-tools-wrap .voiture-chat-tool-btn:hover {
                opacity: 1;
            }
            #chat-win-main.voiture-hide-dnd-flairs .flair.flair22,
            #chat-win-main.voiture-hide-dnd-flairs .flair.flair23,
            #chat-win-main.voiture-hide-dnd-flairs .flair.flair24,
            #chat-win-main.voiture-hide-dnd-flairs .flair.flair26 {
                display: none;
            }
            `;

        // nathanTiny2
        htmlLeft += `
		<a id="chat-nathanTiny2-btn" class="chat-tool-btn voiture-chat-tool-btn ${config.showVerticalComboButtons ? '' : 'hidden'}" title="___ nathanTiny2">
			<div class="emote-scaling-wrapper">	
				<i class="voiture-btn-icon emote nathanTiny2_OG"></i>
			</div>
		</a>`;

        // 👞👞
        htmlLeft += `
		<a id="chat-👞👞-btn" class="chat-tool-btn voiture-chat-tool-btn ${config.showVerticalComboButtons ? '' : 'hidden'}" title="___ 👞👞">
            <i class="voiture-btn-icon">👞👞</i>
		</a>`;

        // 🦃 goblgobl
        if(goblIcon === '🦃') {
            htmlLeft += `
            <a id="chat-gobl-btn" class="chat-tool-btn voiture-chat-tool-btn" title="🦃 goblgobl">
                <i class="voiture-btn-icon">🦃</i>
            </a>`;
        } else {
            htmlLeft += `
            <a id="chat-gobl-btn" class="chat-tool-btn voiture-chat-tool-btn" title="🦃 goblgobl">
                <div class="emote-scaling-wrapper">
                    <i class="voiture-btn-icon emote PepoTurkey"></i>
                </div>
            </a>`;
        }

        // Emote Back
        htmlLeft += `
		<a id="chat-emote-back-btn" class="chat-tool-btn voiture-chat-tool-btn">
			<div class="emote-scaling-wrapper">
				<i class="voiture-btn-icon emote"></i>
			</div>
		</a>`;

        // Mentions
        htmlRight += `
        <a id="chat-mentions-btn" class="chat-tool-btn voiture-chat-tool-btn" title="Open mentions window" target="_blank" rel="noreferrer noopener" href="https://polecat.me/mentions">
            <span class="voiture-btn-icon">@</span>
        </a>`;

        // Hide Chat
        htmlRight += `
        <a id="chat-hide-btn" class="chat-tool-btn voiture-chat-tool-btn" title="Hide chat">
            <span class="voiture-btn-icon">ø</span>
        </a>`;
        css += `
        #chat-tools-wrap #chat-hide-btn .voiture-btn-icon {
            font-size: 22px;
            line-height: 20px;
            font-weight: normal;
        }`;

        css += '</style>';

        $('#chat-tools-wrap > .chat-tools-group:first-child').append(htmlLeft);
        $('#chat-tools-wrap > .chat-tools-group:last-child').prepend(htmlRight);
        $('head').append(css);

        // add event listeners
        $('#chat-nathanTiny2-btn').click((e) => sendChatMessage(getEmoteAlignedMessage('nathanTiny2_OG')));
        $('#chat-👞👞-btn').click((e) => sendChatMessage(getEmoteAlignedMessage('👞👞')));
        $('#chat-gobl-btn').on('mouseup', (e) => {
            if(e.which === LEFT_CLICK || e.which === MIDDLE_CLICK)
            {
                const autoSend = (e.which === MIDDLE_CLICK);
                addToChatBox(generateGoblMessage(), autoSend);
            }
        });
        $('#chat-emote-back-btn').on('wheel', (e) => scrollEmoteMentions(-1*Math.sign(e.originalEvent.deltaY)));
        $('#chat-emote-back-btn').on('mouseup', (e) => {
            if (e.which === MIDDLE_CLICK) clearEmoteBackButton();
        });
        $('#chat-mentions-btn').click((e) => {
            e.preventDefault();
            if (mentionsWindow === null || mentionsWindow.closed) {
                mentionsWindow = window.open(
                    e.target.href,
                    '',
                    'location,width=770,height=500',
                );
            }
            mentionsWindow.focus();
        });
        $('#chat-hide-btn').click((e) => {
            e.preventDefault();
            toggleHideChat();
        });
    }

    function injectOptions() {
        let html = '<h4>D.GG Extra Features</h4>';
        let css = '<style>';

        // Theme
        html += `
		<div class="form-group checkbox">
            <label title="Set chat theme (Credit to Igor for the light theme styles)" for="voiture-options-theme">
                Theme
            </label>
            <select id="voiture-options-theme" name="voiture-options-theme" class="form-control">
                <option value="dark" ${(config.theme !== 'light' ? 'selected' : '')}>Dark (Default)</option>
                <option value="light" ${(config.theme === 'light' ? 'selected' : '')}>Light</option>
            </select>
		</div>`;

        // Auto-message
        html += `
		<div class="form-group checkbox">
			<label title="Automatically send messages or preview message in textbox">
				<input id="voiture-options-auto-message" name="voiture-options-auto-message" type="checkbox" ${
                    config.autoSendMessages ? 'checked' : ''
                }>
				Auto-message
			</label>
		</div>`;

        // Emote click
        html += `
		<div class="form-group checkbox">
			<label title="Clicking emotes in chat puts emote in your message">
				<input id="voiture-options-emote-click" name="voiture-options-emote-click" type="checkbox" ${
                    config.clickableEmotes ? 'checked' : ''
                }>
				Emote Click
			</label>
		</div>`;

        // Convert embed links
        html += `
		<div class="form-group checkbox">
			<label title="Embed links like #twitch/destiny will be changed to open a new window for twitch.tv/destiny">
				<input id="voiture-options-convert-embed-links" name="voiture-options-convert-embed-links" type="checkbox" ${
                    config.convertEmbedLinks ? 'checked' : ''
                }>
				Convert Embed Links
			</label>
		</div>`;

        // Hide Dnd Flairs
        html += `
		<div class="form-group checkbox">
			<label title="Only the DND Flairs will be hidden">
				<input id="voiture-options-hide-dnd-flairs" name="voiture-options-hide-dnd-flairs" type="checkbox" ${
                    config.hideDndFlairs ? 'checked' : ''
                }>
				Hide DND Flairs
			</label>
		</div>`;

        // Show vertical combo buttons
        html += `
		<div class="form-group checkbox">
			<label title="show/hide the buttons for the nathanTiny2 and 👞👞 combos">
				<input id="voiture-options-show-vertical-combo-buttons" name="voiture-options-show-vertical-combo-buttons" type="checkbox" ${
                    config.showVerticalComboButtons ? 'checked' : ''
                }>
				Show Vertical Combo Buttons
			</label>
		</div>`;

        // Measure message starting left
        html += `
		<div class="form-group row">
			<label title="Automatically send messages or preview message in textbox">Message starting left</label>
				<div class="row">
				<button id="voiture-options-starting-left-calculate" class="btn btn-dark">Calculate</button>
					<input id="voiture-options-starting-left" name="voiture-options-starting-left" class="form-control" value="${config.messageStartingLeft}" readonly>
				</div>
			</label>
		</div>`;

        css += `
		button.btn-dark {
			color: #DEDEDE;
			background: #030303;
			padding: 0.3em 0.5em;
			margin-top: -2px;
			border: none;
		}`;

        css += '</style>';

        $('#chat-settings-form').append(html);
        $('head').append(css);

        // add event listeners
        $('#voiture-options-theme').change((e) =>
            changeTheme(e.target.value),
        );
        $('#voiture-options-auto-message').change((e) =>
            toggleAutoSendMessages(e.target.checked),
        );
        $('#voiture-options-emote-click').change((e) =>
            toggleEmoteClicks(e.target.checked),
        );
        $('#voiture-options-convert-embed-links').change((e) =>
            toggleConvertEmbedLinks(e.target.checked),
        );
        $('#voiture-options-hide-dnd-flairs').change((e) =>
            toggleHideDndFlairs(e.target.checked),
        );
        $('#voiture-options-show-vertical-combo-buttons').change((e) =>
            showVerticalComboButtons(e.target.checked),
        );
        $('#voiture-options-starting-left-calculate').click(
            saveMessageStartingLeft,
        );
    }

    function saveMessageStartingLeft() {
        config.startingLeft = getOwnStartingLeft(config.username);
        $('#voiture-options-starting-left').val(config.startingLeft);
        saveConfig();
    }

    /******************************************/
    /* Config Handling ************************/
    /******************************************/

    function loadConfig() {
        const json = localStorage.getItem('voiture-dgg-extra-features');
        const savedConfig = JSON.parse(json);
        Object.assign(config, savedConfig);

		if(config.hideDndFlairs) {
			$('#chat-win-main').addClass('voiture-hide-dnd-flairs');
		}

        // Verify username matches config, if it is different set correct username and save config for next time
        // Need to wait for it to load... sigh
        setTimeout(() => {
            // Get username (current gets it from chatbox placeholder, hopefully there is a better way to do this)
            const username = $('#chat-input-control')
                .attr('placeholder')
                .replace('Write something ', '')
                .replace('...', '')
                .trim();
            if (username !== config.username) {
                config.username = username;
                saveConfig();
            }
        }, 1000);
    }

    function saveConfig() {
        const json = JSON.stringify(config);
        localStorage.setItem('voiture-dgg-extra-features', json);
    }

    /******************************************/
    /* Main Code To Run ***********************/
    /******************************************/

    function fixUserListSearchAutofocus() {
        // Disable user search
        $('#chat-user-list-search > input').prop('disabled', true);
        // Re-enable and focus search on click
        $('#chat-user-list-search').on('click', function (e) {
            $(this).find('input').prop('disabled', false).focus();
        });
        // Re-disable user search on blur
        $('#chat-user-list-search > input').on('blur', function (e) {
            $(this).prop('disabled', true);
        });
    }

    function main() {
        loadConfig();

        baseInjections();
        injectToolbarButtons();
        injectOptions();
        observeChat();
        addLightThemeStyle();

        // Disable autofocus of user list search (otherwise chat goes off screen when user list is open)
        fixUserListSearchAutofocus();
    }

    main();
})();
