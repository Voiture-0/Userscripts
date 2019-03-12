// ==UserScript==
// @name         D.GG Extra Features
// @namespace    http://tampermonkey.net/
// @version      0.0.1
// @description  Adds features to the destiny.gg chat
// @author       Voiture
// @include      /https:\/\/www\.destiny\.gg\/embed\/chat.*/
// @include      /https:\/\/www\.destiny\.gg\/bigscreen.*/
// @grant        none
// @require      https://code.jquery.com/jquery-3.3.1.min.js
// @update       https://raw.githubusercontent.com/Voiture-0/Userscripts/master/Dgg-Extra-Features.js
// ==/UserScript==


(function() {
    'use strict';

		
	////////////////////////

	var defaultEmote = 'Wowee';	// default emote
	var user = 'Voiture';		// YOUR username
	var chatPollingDelay = 2000;	// milliseconds

	var currentEmote = null;
	var currentUser = null;
	var lastMessageTime = new Date('1/1/2000');

	function emoteBack(emote) {
		const { mentionedBy, emoted } = getLastEmotedMessage();
		document.querySelector('#chat-emote-back-btn > .emote.voiture-btn-icon').className = 'emote voiture-btn-icon';
		if(emoted && mentionedBy && mentionedBy !== user) {	
			const emoteMessage = buildResponse(mentionedBy, emoted);
			sendChatMessage(emoteMessage);
		}
	}
	function getLastEmotedMessage() {
		var mentions = document.querySelectorAll('div.msg-chat.msg-user.msg-highlight > span.text > span.chat-user');//selectorContainsText('div.msg-chat.msg-user.msg-highlight > span.text > span.chat-user', user);
		let emoted = null;
		let mentionedBy = null;
		let messageTime = null;
		if(mentions.length > 0) {
			for(let i = mentions.length-1; i >= 0 && !emoted; --i) {
				let nextSibling = mentions[i].nextElementSibling;
				while(nextSibling && !emoted) {
					if(nextSibling.classList.contains('emote')) {
						mentionedBy = nextSibling.parentElement.parentElement.querySelector('a.user').innerText;
						if(mentionedBy !== user) {
							emoted = nextSibling.className.replace('emote', '').trim();
							messageTime = new Date(nextSibling.parentElement.parentElement.querySelector('time.time').title.replace(/([0-9]{1,2})(st|rd|th)/, '$1'));
							break;
						}
					}
					nextSibling = nextSibling.nextElementSibling;
				}
			}
		}
		return { mentionedBy, emoted, messageTime };
	}

	function selectorContainsText(selector, text) {
	var elements = document.querySelectorAll(selector);
	return Array.prototype.filter.call(elements, function(element){
		return RegExp(text).test(element.textContent);
	});
	}

	function buildResponse(mentionedBy, emoted) {
		return mentionedBy + ' ' + emoted;
	}
	function sendChatMessage(message) {
		const chatBox = document.getElementById('chat-input-control');
		chatBox.value = message;
		simulateEnterKeyPress(chatBox);
	}
	function simulateEnterKeyPress(elem) {
		elem.dispatchEvent(new KeyboardEvent('keypress', {'key': 'Enter', keyCode: 13}));
	}


	function observeChatMentions() {
		const {mentionedBy, emoted, messageTime} = getLastEmotedMessage();
		if (emoted && (currentUser !== mentionedBy || currentEmote !== emoted) && (lastMessageTime <= messageTime)) {
			currentEmote = emoted;
			currentUser = mentionedBy;
			lastMessageTime = messageTime;
			
			document.getElementById('chat-emote-back-btn').title = mentionedBy + ' ' + emoted;
			document.getElementById('chat-emote-back-btn').setAttribute('onclick', `emoteBack('${emoted}')`);
			document.getElementById('chat-emote-back-btn').children[0].className = `voiture-btn-icon emote ${emoted}`;
		}
	}


	///////////////////

	var initialLeft = 83.72917175292969;
	const WIDTHS = {
		"_": (19/3),
		'.': 3,
		nathanTiny2: 28,
		space: 4,
	};

	function getOwnStartingWidth(username) {
		var message = document.querySelector('div[data-username="' + username + '"]');
		var features = message.querySelector('span.features');
		var user = message.querySelector('a.user');
		var colon = message.querySelector('span.ctrl');
		var width = features.getBoundingClientRect().width + user.getBoundingClientRect().width + colon.getBoundingClientRect().width;
		return width;
	}

	function getRecentMessageStartingLeft() {
		var chat = document.querySelector('div#chat-win-main > div.chat-lines.nano-content');
		var lastMessage = chat.children[chat.children.length-1];
		var emote = lastMessage.querySelector('span.text > div.emote');
		console.log(emote);
		if(!emote) {
			console.warn('No Emote in last message.');
			return false;
		}
		var width = emote.getBoundingClientRect().left - WIDTHS.space + (emote.getBoundingClientRect().width/2-WIDTHS.nathanTiny2/2);
		return width;
	}

	function findDifferenceInRecentMessage() {
		var diff = getRecentMessageStartingLeft() - initialLeft;
		return diff;
	}

	function getNumberOfCharactersToAlign(character, halfCharacter) {
		var diff = findDifferenceInRecentMessage();
		console.log('diff = ' + diff);
		if(diff >= 0) {
			var numOfChars = diff / WIDTHS[character];
			var adjustment = '';
			if(numOfChars % 1 > 0.9) {
				adjustment = character;
			} else if (numOfChars % 1 > 0.6) {
				adjustment = halfCharacter.repeat(2);
			} else if (numOfChars % 1 > 0.3) {
				adjustment = halfCharacter;
			}
			return adjustment + character.repeat(Math.floor(numOfChars));
		}
	}

	function getEmoteBodyComboString(emote) {
		var spacerCharacter = '_';
		var halfSpacer = '.';
		
		var message = getNumberOfCharactersToAlign(spacerCharacter, halfSpacer);
		if(message === undefined) return '';
		message += ' ' + emote;
		
		return message;
	}

	///////////////////

	function injectEmoteBackButton(emote) {
		let html = '';
		let css = '<style>';
		
		// nathanTiny2
		html += `
		<a id="chat-nathanTiny2-btn" class="chat-tool-btn" title="___ nathanTiny2" onclick="sendChatMessage(getEmoteBodyComboString('nathanTiny2'))">
			<i class="voiture-btn-icon emote nathanTiny2"></i>
		</a>`;

		css += `
		#chat-nathanTiny2-btn {
			transform: scale(0.8, 0.8);
			margin-left: 4px;
		}
		#chat-tools-wrap #chat-nathanTiny2-btn .voiture-btn-icon {
			float: left;
			opacity: 0.25;
			transition: opacity 150ms;
		}
		#chat-tools-wrap #chat-nathanTiny2-btn:hover .voiture-btn-icon {
			opacity: 1;
		}`;
		
		// Emote Back
		html += `
		<a id="chat-emote-back-btn" class="chat-tool-btn">
			<i class="voiture-btn-icon emote"></i>
		</a>`;

		css += `
		#chat-emote-back-btn {
			transform: scale(0.8, 0.8) translateY(-4px);
			margin-left: 4px;
		}
		#chat-tools-wrap #chat-emote-back-btn .voiture-btn-icon {
			float: left;
			opacity: 0.25;
			transition: opacity 150ms;
		}
		#chat-tools-wrap #chat-emote-back-btn:hover .voiture-btn-icon {
			opacity: 1;
		}`;
		
		css += '</style>';
		
		document.querySelector('#chat-tools-wrap > .chat-tools-group:first-child').insertAdjacentHTML('beforeend', html);
		document.head.insertAdjacentHTML('beforeend', css);
	}

	function main() {
	injectEmoteBackButton(defaultEmote);
	setInterval(observeChatMentions, chatPollingDelay)
	}

	main();

})();