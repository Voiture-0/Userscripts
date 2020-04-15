// ==UserScript==
// @name         D.GG Extra Features
// @namespace    http://tampermonkey.net/
// @version      1.9.3
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
    };

    const WIDTHS = {
        _: 6.32,
        '.': 3.69,
        nathanTiny2_OG: 28,
        space: 4,
        '👢👢': 33,
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
            convertedLink: 'https://www.twitch.tv/',
            unconvertedLink: 'https://www.destiny.gg/embed/chat#twitch/',
        },
        '#youtube': {
            convertedLink: 'https://www.youtube.com/watch?v=',
            unconvertedLink: 'https://www.destiny.gg/embed/chat#youtube/',
        },
    };

    const LEFT_CLICK = 1,
        MIDDLE_CLICK = 2;

    let mentionsWindow = null;
    let chatHidden = false;

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
        return str
            .split('')
            .sort(() => 0.5 - Math.random())
            .join('');
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
    }

    function emoteBack(user, emote) {
        clearEmoteBackButton();

        // send emote back at emoter
        if (emote && user && user !== config.username) {
            const emoteMessage = user + ' ' + emote;
            sendChatMessage(emoteMessage);
        }
    }

    /******************************************/
    /* Chat Observer **************************/
    /******************************************/

    // Look for messages where we have been emoted at
    function observeChat() {
        var emotedAtObserveFunction = function (mutations) {
            for (let i = mutations.length - 1; i >= 0; --i) {
                for (let j = mutations[i].addedNodes.length - 1; j >= 0; --j) {
                    // Get new message
                    const message = $(mutations[i].addedNodes[j]);

                    // Skip own messages
                    if (message.hasClass('msg-own')) continue;
                    // Skip non-mentions
                    if (!messageMentionsUsername(message, config.username))
                        continue;

                    // Check if emoted at
                    const emote = message.find(
                        `.text .chat-user:contains('${config.username}') + .emote`,
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
                        // Activate emote-back button
                        $('#chat-emote-back-btn')
                            .attr('title', `${mentionedBy} ${emoteName}`)
                            .off('click')
                            .click((e) => emoteBack(mentionedBy, emoteName))
                            .find('.voiture-btn-icon')
                            .removeClass()
                            .addClass(`voiture-btn-icon emote ${emoteName}`);

                        // Break out of loops
                        return;
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
        let exampleMessage = $(
            `div.msg-chat.msg-user.msg-own:not(.msg-continue)[data-username='${username.toLowerCase()}'] > span.text`,
        );
        if (exampleMessage.length === 0) {
            // If there is no message to measure, send a message to measure
            // Send message
            if (['Voiture', 'AFrenchCar'].includes(config.username)) {
                sendChatMessage('YEE Wowee', true);
            } else {
                sendChatMessage(
                    'Voiture you are a really cool chatter btw :)',
                    true,
                ); // PepeLaugh
            }

            // Get example message
            exampleMessage = $(
                `div.msg-chat.msg-user.msg-own:not(.msg-continue)[data-username='${username.toLowerCase()}'] > span.text`,
            );

            if (exampleMessage.length === 0) {
                const error =
                    'Unable to measure, please tell Voiture about this';
                alert(error);
                throw error;
            }
        }
        const left = exampleMessage.position().left;
        return left;
    }

    function getRecentMessageStartingLeft(emote) {
        const lastMessageEmotes = $(
            'div#chat-win-main > div.chat-lines.nano-content',
        )
            .children(':last')
            .find('span.text > div.emote');
        if (lastMessageEmotes.length === 0) {
            console.warn('No Emote in last message.');
            return false;
        }
        const emoteElem = $(lastMessageEmotes[0]);
        const emoteName = emoteElem.attr('title');
        const width =
            emoteElem.position().left + // Get emote left
            (emoteElem.width() / 2 - WIDTHS[emote] / 2) + // Center emotes
            (emoteCenterOffsets[emoteName] || 0); // Emote specific adjustment
        return width;
    }

    function findDifferenceInRecentMessage(emote) {
        const continuingMessage =
            $('div#chat-win-main .msg-chat:last').data('username') ===
            config.username.toLowerCase();
        const startingLeft = continuingMessage
            ? config.messageStartingLeftNewLine
            : config.messageStartingLeft;
        const diff = getRecentMessageStartingLeft(emote) - startingLeft;
        return diff;
    }

    function getNumberOfCharactersToAlign(character, halfCharacter, emote) {
        let diff = findDifferenceInRecentMessage(emote);
        console.log('diff = ' + diff);
        if (diff >= 0) {
            if (diff >= 0.4 * WIDTHS[character]) {
                diff -= WIDTHS.space; // Subtract space between _ and emote
            }
            let numOfChars = diff / WIDTHS[character];
            let adjustment = '';
            if (numOfChars % 1 >= 0.85) {
                adjustment = character;
            } else if (numOfChars % 1 >= 0.4) {
                adjustment = halfCharacter;
            }
            console.log('numOfChars = ' + numOfChars);
            numOfChars = Math.floor(Math.max(0, numOfChars));
            return adjustment + character.repeat(Math.floor(numOfChars));
        }
    }

    function getEmoteAlignedMessage(emote) {
        const spacerCharacter = '_';
        const halfSpacer = '.';

        let message = getNumberOfCharactersToAlign(
            spacerCharacter,
            halfSpacer,
            emote,
        );
        if (message === undefined) return '';
        message += ' ' + emote;

        return message;
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
            const emote = classes.toString().replace('emote', '').trim();
            const autoSendMessage = whichMouseButton === MIDDLE_CLICK;
            addToChatBox(emote, autoSendMessage);
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
            const newUrl = embedLinks[linkKey].unconvertedLink;
            link.target = '_top';
            link.href = newUrl + linkParts[1];
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
        let message = '🦃 gobl' + shuffleString('gobl');
        if (Math.random() > 0.5) {
            message += shuffleString('gobl');
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
			#chat-tools-wrap .chat-tool-btn {
				width: unset;
				min-width: 2.25em;
            }
            #chat-tools-wrap .voiture-btn-icon {
                float: left;
                opacity: 0.25;
                transition: opacity 150ms;
                font-style: normal;
                white-space: nowrap;
                text-align: center;
                color: white;
                font-weight: bold;
            }
            #chat-tools-wrap .chat-tools-group:first-child .voiture-btn-icon {
                margin-top: 2px;
            }
            #chat-tools-wrap .voiture-btn-icon:hover {
                opacity: 1;
            }`;

        // nathanTiny2
        htmlLeft += `
		<a id="chat-nathanTiny2-btn" class="chat-tool-btn" title="___ nathanTiny2">
			<div class="emote-scaling-wrapper">	
				<i class="voiture-btn-icon emote nathanTiny2_OG"></i>
			</div>
		</a>`;

        // 👢👢
        htmlLeft += `
		<a id="chat-👢👢-btn" class="chat-tool-btn" title="___ 👢👢">
            <i class="voiture-btn-icon">👢👢</i>
		</a>`;

        // 🦃 goblgobl
        htmlLeft += `
		<a id="chat-gobl-btn" class="chat-tool-btn" title="🦃 goblgobl">
            <i class="voiture-btn-icon">🦃</i>
		</a>`;

        // Emote Back
        htmlLeft += `
		<a id="chat-emote-back-btn" class="chat-tool-btn">
			<div class="emote-scaling-wrapper">
				<i class="voiture-btn-icon emote"></i>
			</div>
		</a>`;

        // Mentions
        htmlRight += `
        <a id="chat-mentions-btn" class="chat-tool-btn" title="Open mentions window" target="_blank" rel="noreferrer noopener" href="https://polecat.me/mentions">
            <span class="voiture-btn-icon">@</span>
        </a>`;

        // Hide Chat
        htmlRight += `
        <a id="chat-hide-btn" class="chat-tool-btn" title="Hide chat">
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
        $('#chat-nathanTiny2-btn').click((e) =>
            sendChatMessage(getEmoteAlignedMessage('nathanTiny2_OG')),
        );
        $('#chat-👢👢-btn').click((e) =>
            sendChatMessage(getEmoteAlignedMessage('👢👢')),
        );
        $('#chat-gobl-btn').click((e) =>
            addToChatBox(generateGoblMessage(), false),
        );
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
        $('#voiture-options-auto-message').change((e) =>
            toggleAutoSendMessages(e.target.checked),
        );
        $('#voiture-options-emote-click').change((e) =>
            toggleEmoteClicks(e.target.checked),
        );
        $('#voiture-options-convert-embed-links').change((e) =>
            toggleConvertEmbedLinks(e.target.checked),
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

        // Disable autofocus of user list search (otherwise chat goes off screen when user list is open)
        fixUserListSearchAutofocus();
    }

    main();
})();
