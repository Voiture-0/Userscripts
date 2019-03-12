// ==UserScript==
// @name         D.GG Extra Features
// @namespace    http://tampermonkey.net/
// @version      1.0.0
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
		autoSendMessages: true,
	};

	const WIDTHS = {
		"_": (19/3),
		'.': 3,
		nathanTiny2: 28,
		space: 4,
	};

	const emoteCenterOffsets = {
		"gachiGASM": 5,
		"Wowee": 3,
		"BASEDWATM8": 10,
		"SLEEPSTINY": -16,
		"LeRuse": -1,
		"UWOTM8": -8,
		"SoDoge": -14,
		"OhKrappa": 3,
		"AngelThump": 2,
		"BibleThump": 2,
		"Klappa": -7,
		"Kappa": 1,
		"DuckerZ": 10,
		"OverRustle": 4,
		"SURPRISE": -3,
		"LUL": -3,
		"SOY": -8,
		"CUX": -1,
		"ResidentSleeper": 7,
	};
	
	
	/******************************************/

	function clearEmoteBackButton() {
		// Remove click event
		$('#chat-emote-back-btn')
			.off('click')
			.attr('title', '');
		// Remove classes to hide it
		$('#chat-emote-back-btn .emote.voiture-btn-icon')
			.removeClass()
			.addClass('emote voiture-btn-icon');
	}

	function emoteBack(user, emote) {
		clearEmoteBackButton();

		// send emote back at emoter
		if(emote && user && user !== config.username) {	
			const emoteMessage = buildResponse(user, emote);
			sendChatMessage(emoteMessage);
		}
	}

	function buildResponse(mentionedBy, emoted) {
		return mentionedBy + ' ' + emoted;
	}

	function sendChatMessage(message) {
		const chatBox = $('#chat-input-control');
		chatBox.val(message);
		if (config.autoSendMessages) {
			simulateEnterKeyPress(chatBox[0]);
		}
	}
	function simulateEnterKeyPress(elem) {
		elem.dispatchEvent(new KeyboardEvent('keypress', {'key': 'Enter', keyCode: 13}));
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
		const emoteName = emote.attr('title');
		var width = emote.position().left 				// Get emote left
			- WIDTHS.space 								// Subtract space between _ and emote	// TODO: This should be moved to aligning function, if no underscores then no space is required
			+ (emote.width()/2 - WIDTHS.nathanTiny2/2)	// Center emotes
			+ (emoteCenterOffsets[emoteName] || 0);	// Emote specific adjustment
		return width;
	}

	function findDifferenceInRecentMessage() {
		var diff = getRecentMessageStartingLeft() - config.messageStartingLeft;							// TODO: Check if continuing message, and use alternative shorter left
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

		// Adjust some styles
		css += `
			#chat-tools-wrap {
				overflow: hidden;
			}
			#chat-whisper-btn {
				margin-right: 0.6em;
			}
			.emote-scaling-wrapper {
				transform: scale(0.8, 0.8);
			}
		`;
		
		// Auto-message toggle checkbox
		html += `
		<a id="chat-auto-message-btn" class="chat-tool-btn" title="Auto-message">
			<input id="voiture-auto-send-message-toggle" type="checkbox" ${(config.autoSendMessages ? 'checked' : '')} />
		</a>`;

		css += `
		#chat-auto-message-btn {
			margin-right: -3px;
		}
		#voiture-auto-send-message-toggle {
			width: 90%;
			height: 100%;
			margin-top: 3px;
			opacity: 0.25;
			transition: opacity 150ms;
			cursor: pointer;
			float: right;
		}
		#voiture-auto-send-message-toggle:hover {
			opacity: 1;
		}`;

		// nathanTiny2
		html += `
		<a id="chat-nathanTiny2-btn" class="chat-tool-btn" title="___ nathanTiny2">
			<div class="emote-scaling-wrapper">	
				<i class="voiture-btn-icon emote nathanTiny2"></i>
			</div>
		</a>`;

		css += `
		#chat-tools-wrap #chat-nathanTiny2-btn .voiture-btn-icon {
			float: left;
			opacity: 0.25;
			transition: opacity 150ms;
			margin-top: 2px;
		}
		#chat-tools-wrap #chat-nathanTiny2-btn:hover .voiture-btn-icon {
			opacity: 1;
		}`;
		
		// Emote Back
		html += `
		<a id="chat-emote-back-btn" class="chat-tool-btn">
			<div class="emote-scaling-wrapper">
				<i class="voiture-btn-icon emote"></i>
			</div>
		</a>`;

		css += `
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
		$('#voiture-auto-send-message-toggle').change(e => toggleAutoSendMessages(e.target.checked));
		$('#chat-nathanTiny2-btn').click(e => sendChatMessage(getEmoteBodyComboString('nathanTiny2')));
		$('#chat-emote-back-btn').contextmenu(clearEmoteBackButton);
		
	}

	function toggleAutoSendMessages(value) {
		config.autoSendMessages = value;
		saveConfig();
	}


	/******************************************/


	function loadConfig() {
		const json = localStorage.getItem('voiture-dgg-extra-features');
		let savedConfig = JSON.parse(json);
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
			if(username !== config.username) {
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


	function main() {
		
		loadConfig();

		injectToolbarButtons(config.defaultEmote);
		
		var observeFunction = function(mutations) {
			for (let i = mutations.length-1; i >= 0; --i) {
				for(let j = mutations[i].addedNodes.length-1; j >= 0; --j) {
					// Get new message
					const message = $(mutations[i].addedNodes[j]);
					// Check if emoted at
					const emote = message
						.find(`.text .chat-user:contains("${config.username}") + .emote`);	// Only if the message us Username Emote (+), if want to get any emote after Username use '~' instead of '+'
					// If we were emoted at
					if(emote.length !== 0) {
						// Get emoter
						const mentionedBy = message
							.find('a.user')
							.text();
						// Get emote
						const emoteName = emote
							.filter(':last')		// Maybe want to get first instead?
							.attr('class')
							.replace('emote', '')
							.trim();
						// Activate emote-back button
						$('#chat-emote-back-btn')
							.attr('title', mentionedBy + ' ' + emoteName)
							.click(e => emoteBack(mentionedBy, emoteName))
							.find('.voiture-btn-icon')
								.removeClass()
								.addClass(`voiture-btn-icon emote ${emoteName}`);
						
						// Break out of loops
						return;
					}
				}
			}
		};

		const observer = new MutationObserver(observeFunction);
		observer.observe($('#chat-win-main .chat-lines')[0], { attributes: true, childList: true, characterData: true });

	}

	main();

})();