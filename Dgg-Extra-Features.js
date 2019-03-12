// ==UserScript==
// @name         D.GG Extra Features
// @namespace    http://tampermonkey.net/
// @version      0.0.2
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

	/******************************************/
	
	jQuery.fn.getParent = function(num) {
		var last = this[0];
		for (var i = 0; i < num; i++) {
			last = last.parentNode;
		}
		return jQuery(last);
	};

	/******************************************/

	// Load Config Settings
	const config = {
		username: null,
		defaultEmote: 'Wowee',
		messageStartingLeft: 83.72917175292969,
		messageStartingLeftNewLine: 19,
	};

	const WIDTHS = {
		"_": (19/3),
		'.': 3,
		nathanTiny2: 28,
		space: 4,
	};

	
	
	/******************************************/


	var chatPollingDelay = 2000;	// milliseconds

	var currentEmote = null;
	var currentUser = null;
	var lastMessageTime = new Date('1/1/2000');

	function emoteBack(emote) {
		const { mentionedBy, emoted } = getLastEmotedMessage();
		$('#chat-emote-back-btn > .emote.voiture-btn-icon')
			.removeClass()
			.addClass('emote voiture-btn-icon');

		if(emoted && mentionedBy && mentionedBy !== config.username) {	
			const emoteMessage = buildResponse(mentionedBy, emoted);
			sendChatMessage(emoteMessage);
		}
	}
	function getLastEmotedMessage() {
		const mention = $('.msg-chat.msg-user.msg-highlight .text .chat-user:contains("Voiture") + .emote')
			.filter(':last')
			.getParent(2);
		const mentionedBy = mention
			.find('a.user')
			.text();
		const emote = mention
			.find('.text .chat-user:contains("Voiture") + .emote')
			.filter(':last')
			.attr('class')
			.replace('emote', '')
			.trim();
		const messageTime = new Date(
			mention
				.find('time.time')
				.attr('title')
				.replace(/([0-9]{1,2})(st|rd|th)/, '$1')
			);

		return { mentionedBy, emote, messageTime };
	}

	function buildResponse(mentionedBy, emoted) {
		return mentionedBy + ' ' + emoted;
	}
	function sendChatMessage(message) {
		const chatBox = $('#chat-input-control');
		chatBox.text(message);
		simulateEnterKeyPress(chatBox[0]);
	}
	function simulateEnterKeyPress(elem) {
		elem.dispatchEvent(new KeyboardEvent('keypress', {'key': 'Enter', keyCode: 13}));
	}


	function observeChatMentions() {
		const { mentionedBy, emote, messageTime } = getLastEmotedMessage();
		if (emote && (currentUser !== mentionedBy || currentEmote !== emote) && (lastMessageTime <= messageTime)) {
			currentEmote = emote;
			currentUser = mentionedBy;
			lastMessageTime = messageTime;
			
			$('#chat-emote-back-btn')
				.attr('title', mentionedBy + ' ' + emote)
				.click(e => emoteBack(emote))
				.children(':first')
					.removeClass()
					.addClass(`voiture-btn-icon emote ${emote}`);
		}
	}


	/******************************************/


	function getOwnStartingLeft(username) {
		const left = $(`div.msg-chat.msg-user.msg-own[data-username="${username}"] > span.text`)
			.position()
			.left;
		return left;
	}

	function getRecentMessageStartingLeft() {
		const lastMessageEmotes = $('div#chat-win-main > div.chat-lines.nano-content')
			.children(':last')
			.find('span.text > div.emote');
		if(lastMessageEmotes.length === 0) {
			console.warn('No Emote in last message.');
			return false;
		}
		const emote = $(lastMessageEmotes[0]);
		var width = emote.position().left 				// Get emote left
			- WIDTHS.space 								// Subtract space between _ and emote	// TODO: This should be moved to aligning function, if no underscores then no space is required
			+ (emote.width()/2 - WIDTHS.nathanTiny2/2);	// Center emotes						// TODO: Add emote specific adjustment lookup table
		return width;
	}

	function findDifferenceInRecentMessage() {
		var diff = getRecentMessageStartingLeft() - config.initialLeft;							// TODO: Check if continuing message, and use alternative shorter left
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


	/******************************************/


	function injectToolbarButtons(emote) {
		let html = '';
		let css = '<style>';
		
		// nathanTiny2
		html += `
		<a id="chat-nathanTiny2-btn" class="chat-tool-btn" title="___ nathanTiny2">
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
		
		$('#chat-tools-wrap > .chat-tools-group:first-child').append(html);
		$('head').append(css);

		// add event listeners
		$('#chat-nathanTiny2-btn').click(e => getEmoteBodyComboString('nathanTiny2'));
		
	}


	/******************************************/


	function main() {
		injectToolbarButtons(config.defaultEmote);
		setInterval(observeChatMentions, chatPollingDelay)
	}

	main();

})();