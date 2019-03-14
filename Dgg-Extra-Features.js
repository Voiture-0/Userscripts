// ==UserScript==
// @name         D.GG Extra Features
// @namespace    http://tampermonkey.net/
// @version      1.4.0
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
	};

	const WIDTHS = {
		'_': 6.32,
		'.': 3.69,
		nathanTiny2: 28,
		space: 4,
		'👢👢': 33,
	};

	const emoteCenterOffsets = {
		'gachiGASM': 5,
		'Wowee': 3,
		'BASEDWATM8': 10,
		'SLEEPSTINY': -16,
		'LeRuse': -1,
		'UWOTM8': -8,
		'SoDoge': -14,
		'OhKrappa': 3,
		'AngelThump': 2,
		'BibleThump': 2,
		'Klappa': -7,
		'Kappa': 1,
		'DuckerZ': 10,
		'OverRustle': 4,
		'SURPRISE': -3,
		'LUL': -3,
		'SOY': -8,
		'CUX': -1,
		'ResidentSleeper': 7,
	};


	/******************************************/
	/* Utility Functions **********************/
	/******************************************/
	
	// Get N-th parent element
	jQuery.fn.getParent = function(num) {
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

	// Triggers an enter key press on an element
	function simulateEnterKeyPress(elem) {
		elem[0].dispatchEvent(new KeyboardEvent('keypress', {'key': 'Enter', keyCode: 13}));
	}
	
	// Checks if a user is mentioned in a message
	function messageMentionsUsername(message, username) {
		const mentions = message
			.data('mentioned');
		return mentions !== undefined 
			&& mentions
				.split(' ')
				.includes(username.toLowerCase());
	}

	function sleep(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
	
	
	/******************************************/
	/* Emote Back *****************************/
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
			const emoteMessage = user + ' ' + emote;
			sendChatMessage(emoteMessage);
		}
	}

	function observeChatForEmoteBack() {
		var observeFunction = function(mutations) {
			for (let i = mutations.length-1; i >= 0; --i) {
				for(let j = mutations[i].addedNodes.length-1; j >= 0; --j) {
					// Get new message
					const message = $(mutations[i].addedNodes[j]);
					
					// Skip own messages
					if (message.hasClass('msg-own')) continue;
					// Skip non-mentions
					if (!messageMentionsUsername(message, config.username)) continue; 

					// Check if emoted at
					const emote = message
						.find(`.text .chat-user:contains('${config.username}') + .emote`);	// Only if the message us Username Emote (+), if want to get any emote after Username use '~' instead of '+'
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
							.attr('title', `${mentionedBy} ${emoteName}`)
							.off('click')
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

		// Create observer
		const observer = new MutationObserver(observeFunction);
		const chat = $('#chat-win-main .chat-lines')[0];
		// Observe chat
		observer.observe(chat, { attributes: true, childList: true, characterData: true });
	}


	/******************************************/
	/* nathanTiny2 Align Combo ****************/
	/******************************************/


	function getOwnStartingLeft(username) {
		let exampleMessage = $(`div.msg-chat.msg-user.msg-own:not(.msg-continue)[data-username='${username.toLowerCase()}'] > span.text`);
		if (exampleMessage.length === 0) {
			// If there is no message to measure, send a message to measure
			// Send message
			if (['Voiture', 'AFrenchCar'].includes(config.username)) {
				sendChatMessage('YEE Wowee', true);
			} else {
				sendChatMessage('Voiture you are a really cool chatter btw :)', true);	// PepeLaugh
			}

			// Get example message
			exampleMessage = $(`div.msg-chat.msg-user.msg-own:not(.msg-continue)[data-username='${username.toLowerCase()}'] > span.text`);

			if (exampleMessage.length === 0) {
				const error = 'Unable to measure, please tell Voiture about this';
				alert(error);
				throw error;
			}
		}
		const left = exampleMessage
			.position()
			.left;
		return left;
	}

	function getRecentMessageStartingLeft(emote) {
		const lastMessageEmotes = $('div#chat-win-main > div.chat-lines.nano-content')
			.children(':last')
			.find('span.text > div.emote');
		if(lastMessageEmotes.length === 0) {
			console.warn('No Emote in last message.');
			return false;
		}
		const emoteElem = $(lastMessageEmotes[0]);
		const emoteName = emoteElem.attr('title');
		const width = emoteElem.position().left 		// Get emote left
			+ (emoteElem.width()/2 - WIDTHS[emote]/2)	// Center emotes
			+ (emoteCenterOffsets[emoteName] || 0);		// Emote specific adjustment
		return width;
	}

	function findDifferenceInRecentMessage(emote) {
		const continuingMessage = ($('div#chat-win-main .msg-chat:last').data('username') === config.username.toLowerCase());
		const startingLeft = (continuingMessage ? config.messageStartingLeftNewLine : config.messageStartingLeft);
		const diff = getRecentMessageStartingLeft(emote) - startingLeft;
		return diff;
	}

	function getNumberOfCharactersToAlign(character, halfCharacter, emote) {
		let diff = findDifferenceInRecentMessage(emote);
		console.log('diff = ' + diff);
		if (diff >= 0) {
			if (diff >= 0.4*WIDTHS[character]) {
				diff -= WIDTHS.space;	// Subtract space between _ and emote
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
		
		let message = getNumberOfCharactersToAlign(spacerCharacter, halfSpacer, emote);
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
	/* GUI ************************************/
	/******************************************/


	function injectToolbarButtons(emote) {
		let html = '';
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

		// 👢👢
		html += `
		<a id="chat-👢👢-btn" class="chat-tool-btn" title="___ 👢👢">
			
				<i class="voiture-btn-icon">👢👢</i>
			
		</a>`;

		css += `
		#chat-tools-wrap #chat-👢👢-btn .voiture-btn-icon {
			float: left;
			opacity: 0.25;
			transition: opacity 150ms;
			margin-top: 2px;
			font-style: unset;
			white-space: nowrap;
		}
		#chat-tools-wrap #chat-👢👢-btn:hover .voiture-btn-icon {
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
		$('#chat-nathanTiny2-btn').click(e => sendChatMessage(getEmoteAlignedMessage('nathanTiny2')));
		$('#chat-👢👢-btn').click(e => sendChatMessage(getEmoteAlignedMessage('👢👢')));
		$('#chat-emote-back-btn').on('mouseup', e => { if (e.which === 2) clearEmoteBackButton(); });
	}

	function injectOptions() {
		let html = '<h4>D.GG Extra Features</h4>';
		let css = '<style>';

		// Auto-message
		html += `
		<div class="form-group checkbox">
			<label title="Automatically send messages or preview message in textbox">
				<input id="voiture-options-auto-message" type="checkbox" ${config.autoSendMessages ? 'checked' : ''}>
				Auto-message
			</label>
		</div>`;

		// Measure message starting left
		html += `
		<div class="form-group row">
			<label title="Automatically send messages or preview message in textbox">Message starting left</label>
				<div class="row">
				<button id="voiture-options-starting-left-calculate" class="btn btn-dark">Calculate</button>
					<input id="voiture-options-starting-left" class="form-control" value="${config.messageStartingLeft}" readonly>
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

		$('#chat-settings-form')
			.append(html);
		$('head').append(css);

		// add event listeners
		$('#voiture-options-auto-message').change(e => toggleAutoSendMessages(e.target.checked));
		$('#voiture-options-starting-left-calculate').click(saveMessageStartingLeft);
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
		$('#chat-user-list-search > input')
			.prop('disabled', true);
		// Re-enable and focus search on click
		$('#chat-user-list-search')
			.on('click', function(e) { 
				$(this)
					.find('input')
						.prop('disabled', false)
						.focus(); 
			});
		// Re-disable user search on blur
		$('#chat-user-list-search > input')
			.on('blur', function(e) { 
				$(this).prop('disabled', true); 
			});
	}

	function main() {
		loadConfig();

		injectToolbarButtons();
		injectOptions();
		observeChatForEmoteBack();

		// Disable autofocus of user list search (otherwise chat goes off screen when user list is open)
		fixUserListSearchAutofocus();

	}

	main();


})();